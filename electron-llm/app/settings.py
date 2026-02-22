from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from config.llm_request_config import LlmRequestConfig
from config.llm_server_config import LlmServerConfig
from config.llm_config import LlmConfig

@dataclass(frozen=True, slots=True)
class AppConfig:
    llm_config: LlmConfig
    llm_server: LlmServerConfig
    llm_request: LlmRequestConfig

def _as_dict(value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{name} must be an object")
    return value


def _required_str(container: dict[str, Any], key: str) -> str:
    value = container.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be a non-empty string")
    return value


def _required_int(container: dict[str, Any], key: str) -> int:
    value = container.get(key)
    if not isinstance(value, int):
        raise ValueError(f"{key} must be an integer")
    return value


def _required_float(container: dict[str, Any], key: str) -> float:
    value = container.get(key)
    if not isinstance(value, (int, float)):
        raise ValueError(f"{key} must be a number")
    return float(value)


def _optional_int(container: dict[str, Any], key: str) -> int | None:
    value = container.get(key)
    if value is None:
        return None
    if not isinstance(value, int):
        raise ValueError(f"{key} must be an integer when provided")
    return value


def _optional_float(container: dict[str, Any], key: str) -> float | None:
    value = container.get(key)
    if value is None:
        return None
    if not isinstance(value, (int, float)):
        raise ValueError(f"{key} must be a number when provided")
    return float(value)


def _optional_str(container: dict[str, Any], key: str) -> str | None:
    value = container.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string when provided")
    return value


def _required_bool(container: dict[str, Any], key: str) -> bool:
    value = container.get(key)
    if not isinstance(value, bool):
        raise ValueError(f"{key} must be a boolean")
    return value


def build_settings_from_payload(payload: dict[str, Any]) -> AppConfig:
    payload_obj = _as_dict(payload, "payload")
    settings = _as_dict(payload_obj.get("settings"), "payload.settings")

    llm_config = LlmConfig.from_string(
        llm_gguf_path=_optional_str(settings, "llm_gguf_path"),
        llm_mmproj_path=_optional_str(settings, "llm_mmproj_path")
    )
    llm_config.validate()

    llm_server = LlmServerConfig.from_strings(
        llm_backend="server",
        llm_server_path=_required_str(settings, "llm_server_path"),
        llm_server_url=_required_str(settings, "llm_server_url"),
        llm_n_ctx=_required_int(settings, "llm_n_ctx"),
        llm_host=_required_str(settings, "llm_host"),
        llm_port=_required_int(settings, "llm_port"),
        llm_n_threads=_optional_int(settings, "llm_n_threads"),
        llm_n_gpu_layers=_optional_int(settings, "llm_n_gpu_layers"),
        llm_n_batch=_optional_int(settings, "llm_n_batch"),
        llm_n_parallel=_optional_int(settings, "llm_n_parallel"),
        llm_seed=_optional_int(settings, "llm_seed"),
        llm_rope_freq_base=_optional_float(settings, "llm_rope_freq_base"),
        llm_rope_freq_scale=_optional_float(settings, "llm_rope_freq_scale"),
        llm_use_jinja=_required_bool(settings, "llm_use_jinja"),
        llm_cache_prompt=_required_bool(settings, "llm_cache_prompt"),
        llm_flash_attn=_required_bool(settings, "llm_flash_attn"),
    )
    llm_server.validate()

    llm_request = LlmRequestConfig.from_values(
        max_tokens=_required_int(settings, "max_tokens"),
        temperature=_required_float(settings, "temperature"),
        top_p=_optional_float(settings, "top_p"),
        top_k=_optional_int(settings, "top_k"),
        repeat_penalty=_optional_float(settings, "repeat_penalty"),
        seed=_optional_int(settings, "request_seed"),
        stop=None,
        response_format=None,
        stream=False,
    )
    llm_request.validate()

    return AppConfig(
        llm_config=llm_config,
        llm_server=llm_server,
        llm_request=llm_request
    )
