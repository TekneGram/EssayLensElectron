from __future__ import annotations

from dataclasses import dataclass

from config.llm_request_config import LlmRequestConfig
from config.llm_server_config import LlmServerConfig
from config.llm_config import LlmConfig

@dataclass(frozen=True, slots=True)
class AppConfig:
    llm_config: LlmConfig
    llm_server: LlmServerConfig
    llm_request: LlmRequestConfig

def build_settings() -> AppConfig:

    llm_config = LlmConfig.from_string(
        llm_gguf_path="",
        llm_mmproj_path=""
    )
    llm_config.validate()

    llm_server = LlmServerConfig.from_strings(
        llm_backend="server",
        llm_server_path="?",
        llm_server_url="http://127.0.0.1:8080/v1/chat/completions",
        llm_n_ctx=4096,
        llm_host="127.0.0.1",
        llm_port=8080,
        llm_n_threads=None,
        llm_n_gpu_layers=99,
        llm_n_batch=None,
        llm_n_parallel=4,
        llm_seed=None,
        llm_rope_freq_base=None,
        llm_rope_freq_scale=None,
        llm_use_jinja=True,
        llm_cache_prompt=True,
        llm_flash_attn=True,
    )
    llm_server.validate()

    llm_request = LlmRequestConfig.from_values(
        max_tokens=1024,
        temperature=0.2,
        top_p=0.95,
        top_k=40,
        repeat_penalty=1.1,
        seed=None,
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