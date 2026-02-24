from __future__ import annotations

import json
import sys
import traceback
from datetime import datetime, timezone
from typing import Any

from app.settings import build_settings_from_payload
from app.container import build_container
from app.runtime_lifecycle import RuntimeLifecycle


class WorkerActionError(Exception):
    def __init__(self, message: str, *, code: str = "PY_ACTION_FAILED", details: Any = None):
        super().__init__(message)
        self.code = code
        self.details = details


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_response(resp: dict[str, Any]) -> None:
    # IMPORTANT: stdout must be JSON lines only
    sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _failure(request_id: str, code: str, message: str, details: Any = None) -> dict[str, Any]:
    return {
        "requestId": request_id,
        "ok": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "timestamp": _now_iso(),
    }


def _success(request_id: str, data: dict[str, Any]) -> dict[str, Any]:
    return {
        "requestId": request_id,
        "ok": True,
        "data": data,
        "timestamp": _now_iso(),
    }


def _stream_event(
    request_id: str,
    event_type: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    return {
        "requestId": request_id,
        "type": event_type,
        "data": data,
        "timestamp": _now_iso(),
    }


def _extract_message(payload: dict[str, Any]) -> str:
    message = payload.get("message")
    if not isinstance(message, str):
        message = payload.get("content")
    if not isinstance(message, str) or not message.strip():
        raise ValueError("payload.message must be a non-empty string")
    return message.strip()


def _extract_fake_reply(payload: dict[str, Any]) -> str | None:
    settings = payload.get("settings")
    if not isinstance(settings, dict):
        return None
    if settings.get("use_fake_reply") is not True:
        return None

    fake_reply = settings.get("fake_reply_text")
    if isinstance(fake_reply, str) and fake_reply.strip():
        return fake_reply.strip()
    return "LLM is not configured yet."


def _extract_client_request_id(payload: dict[str, Any]) -> str | None:
    value = payload.get("clientRequestId")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _build_runtime(payload: dict[str, Any], lifecycle: RuntimeLifecycle) -> tuple[Any, Any]:
    try:
        app_cfg = build_settings_from_payload(payload)
    except ValueError as exc:
        raise WorkerActionError(f"Invalid LLM settings: {exc}") from exc

    if app_cfg.use_fake_reply:
        raise WorkerActionError("Invalid configuration: use_fake_reply should be handled before runtime setup.")

    deps = lifecycle.get_or_create_llm_runtime(app_cfg, build_container)
    server_proc = deps.get("server_proc")
    llm_task_service = deps.get("llm_task_service")

    if server_proc is None or llm_task_service is None:
        raise WorkerActionError("LLM dependencies are not available in container.")

    try:
        server_proc.ensure_running()
    except FileNotFoundError as exc:
        raise WorkerActionError(str(exc)) from exc
    except TimeoutError as exc:
        raise WorkerActionError(str(exc)) from exc
    except RuntimeError as exc:
        raise WorkerActionError(f"Failed to start llama-server: {exc}") from exc

    return app_cfg, llm_task_service


def _run_chat(payload: dict[str, Any], lifecycle: RuntimeLifecycle) -> str:
    fake_reply = _extract_fake_reply(payload)
    if fake_reply is not None:
        return fake_reply

    message = _extract_message(payload)
    app_cfg, llm_task_service = _build_runtime(payload, lifecycle)

    try:
        result = llm_task_service.prompt_tester_parallel(
            app_cfg=app_cfg,
            text_tasks=[message],
            max_concurrency=1,
        )
    except Exception as exc:
        raise WorkerActionError(f"LLM request failed: {exc}") from exc

    outputs = result.get("outputs", [])
    if not outputs:
        raise WorkerActionError("LLM request failed: no outputs were returned.")
    
    first = outputs[0]
    if isinstance(first, Exception):
        raise WorkerActionError(f"LLM request failed: {first}") from first

    reply: str | None = None
    if hasattr(first, "content"):
        reply = getattr(first, "content", None)
    elif isinstance(first, dict):
        candidate = first.get("content")
        reply = candidate if isinstance(candidate, str) else None

    if not reply or not reply.strip():
        raise WorkerActionError("LLM request failed: task did not return textual content.")

    return reply.strip()


def _run_chat_stream(payload: dict[str, Any], request_id: str, lifecycle: RuntimeLifecycle) -> dict[str, Any]:
    client_request_id = _extract_client_request_id(payload)
    message = _extract_message(payload)
    seq = 1

    _write_response(
        _stream_event(
            request_id,
            "stream_start",
            {
                "clientRequestId": client_request_id,
                "channel": "meta",
                "text": "",
                "done": False,
                "seq": seq,
            },
        )
    )

    fake_reply = _extract_fake_reply(payload)
    if fake_reply is not None:
        seq += 1
        _write_response(
            _stream_event(
                request_id,
                "stream_chunk",
                {
                    "clientRequestId": client_request_id,
                    "channel": "content",
                    "text": fake_reply,
                    "done": False,
                    "seq": seq,
                },
            )
        )
        seq += 1
        _write_response(
            _stream_event(
                request_id,
                "stream_done",
                {
                    "clientRequestId": client_request_id,
                    "channel": "meta",
                    "text": "",
                    "done": True,
                    "seq": seq,
                },
            )
        )
        return _success(request_id, {"reply": fake_reply})

    app_cfg, llm_task_service = _build_runtime(payload, lifecycle)
    stream = llm_task_service.prompt_tester_stream(app_cfg=app_cfg, text=message)

    while True:
        try:
            stream_event = next(stream)
        except StopIteration as stop:
            reply = stop.value
            break
        except Exception as exc:
            seq += 1
            _write_response(
                _stream_event(
                    request_id,
                    "stream_error",
                    {
                        "clientRequestId": client_request_id,
                        "channel": "meta",
                        "text": "",
                        "done": True,
                        "seq": seq,
                        "error": {
                            "code": "PY_ACTION_FAILED",
                            "message": f"LLM request failed: {exc}",
                        },
                    },
                )
            )
            raise WorkerActionError(f"LLM request failed: {exc}") from exc

        seq += 1
        _write_response(
            _stream_event(
                request_id,
                "stream_chunk",
                {
                    "clientRequestId": client_request_id,
                    "channel": stream_event.channel,
                    "text": stream_event.text,
                    "done": stream_event.done,
                    "seq": seq,
                    "finishReason": stream_event.finish_reason,
                    "model": stream_event.model,
                    "usage": stream_event.usage,
                },
            )
        )

    seq += 1
    _write_response(
        _stream_event(
            request_id,
            "stream_done",
            {
                "clientRequestId": client_request_id,
                "channel": "meta",
                "text": "",
                "done": True,
                "seq": seq,
            },
        )
    )

    return _success(request_id, {"reply": reply})


def _handle_request(req: dict[str, Any], lifecycle: RuntimeLifecycle) -> dict[str, Any]:
    request_id = req.get("requestId")
    action = req.get("action")
    payload = req.get("payload")

    if not isinstance(request_id, str) or not request_id:
        return _failure("invalid-request-id", "PY_ACTION_FAILED", "requestId must be a non-empty string.")

    if not isinstance(action, str) or not action:
        return _failure(request_id, "PY_ACTION_FAILED", "action must be a non-empty string.")

    if not isinstance(payload, dict):
        return _failure(request_id, "PY_ACTION_FAILED", "payload must be an object.")

    try:
        if action == "llm.chat":
            reply = _run_chat(payload, lifecycle)
            return _success(request_id, {"reply": reply})
        if action == "llm.chatStream":
            return _run_chat_stream(payload, request_id, lifecycle)

        # Keep contract with electron orchestrator supported actions
        if action in {"llm.assessEssay", "llm.generateFeedbackSummary"}:
            return _failure(request_id, "PY_ACTION_FAILED", f"Action not implemented yet: {action}")

        return _failure(request_id, "PY_ACTION_FAILED", f"Unsupported action: {action}")
    except WorkerActionError as exc:
        return _failure(request_id, exc.code, str(exc), exc.details)


def main() -> None:
    runtime_lifecycle = RuntimeLifecycle()

    try:
        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue

            request_id = "unknown-request"
            try:
                parsed = json.loads(line)
                if not isinstance(parsed, dict):
                    raise ValueError("Request must be a JSON object.")

                if isinstance(parsed.get("requestId"), str):
                    request_id = parsed["requestId"]

                response = _handle_request(parsed, runtime_lifecycle)
                _write_response(response)
            except WorkerActionError as exc:
                _write_response(
                    _failure(
                        request_id,
                        exc.code,
                        str(exc),
                        exc.details,
                    )
                )
            except Exception as exc:
                _write_response(
                    _failure(
                        request_id,
                        "PY_ACTION_FAILED",
                        str(exc),
                        {
                            "type": exc.__class__.__name__,
                            "traceback": traceback.format_exc(),
                        },
                    )
                )
    finally:
        runtime_lifecycle.shutdown()


if __name__ == "__main__":
    main()
