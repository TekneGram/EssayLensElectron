from __future__ import annotations

import json
import sys
import traceback
from datetime import datetime, timezone
from typing import Any

from app.settings import build_settings_from_payload
from app.container import build_container
from app.runtime_lifecycle import RuntimeLifecycle


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


def _run_minimal_chat(payload: dict[str, Any], lifecycle: RuntimeLifecycle) -> str:
    fake_reply = _extract_fake_reply(payload)
    if fake_reply is not None:
        return fake_reply

    app_cfg = build_settings_from_payload(payload)
    deps = build_container(app_cfg)
    server_proc = deps.get("server_proc")
    llm_task_service = deps.get("llm_task_service")

    if server_proc is None or llm_task_service is None:
        raise RuntimeError("LLM dependencies are not available in container")

    lifecycle.register_process(server_proc)

    if not server_proc.is_running():
        server_proc.start()

    message = _extract_message(payload)

    result = llm_task_service.prompt_tester_parallel(
        app_cfg=app_cfg,
        text_tasks=[message],
        max_concurrency=1,
    )

    outputs = result.get("outputs", [])
    if not outputs:
        raise RuntimeError("LLM task returned no outputs.")
    
    first = outputs[0]
    if isinstance(first, Exception):
        raise first

    reply: str | None = None
    if hasattr(first, "content"):
        reply = getattr(first, "content", None)
    elif isinstance(first, dict):
        candidate = first.get("content")
        reply = candidate if isinstance(candidate, str) else None

    if not reply or not reply.strip():
        raise RuntimeError("LLM task did not return textual content.")

    return reply.strip()


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

    if action == "llm.chat":
        reply = _run_minimal_chat(payload, lifecycle)
        return _success(request_id, {"reply": reply})

    # Keep contract with electron orchestrator supported actions
    if action in {"llm.assessEssay", "llm.generateFeedbackSummary"}:
        return _failure(request_id, "PY_ACTION_FAILED", f"Action not implemented yet: {action}")

    return _failure(request_id, "PY_ACTION_FAILED", f"Unsupported action: {action}")


def main() -> None:
    runtime_lifecycle = RuntimeLifecycle()

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


if __name__ == "__main__":
    main()
