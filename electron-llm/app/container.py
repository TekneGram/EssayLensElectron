# Import services and processes
import shutil
from nlp.llm.llm_server_process import LlmServerProcess
from nlp.llm.llm_client import OpenAICompatChatClient
from services.llm_service import LlmService
from services.llm_task_service import LlmTaskService

# Standard utilities
from pathlib import Path
from app.settings import AppConfig

def _resolve_path(p: str | Path, project_root: Path) -> Path:
    """
    Resolve a path string to an absolute path
    - Expands ~
    - If relative, resolve it against the project root.
    """
    pp = Path(p).expanduser()
    return pp if pp.is_absolute() else (project_root / pp).resolve()

def build_container(app_cfg: AppConfig):
    """
    Dependency container builder
    Responsibility:
    - Takes a fully loaded config object
    - Constructs all the shared services exactly once
    - Wires dependencies together
    - Returns a dictionay of ready-to-use services
    """

    project_root = Path(__file__).resolve().parents[1]

    # ----- LLM Wiring (server model) -----
    server_proc = None
    server_bin: Path | None = None
    client: OpenAICompatChatClient | None = None
    llm_service: LlmService | None = None
    llm_task_service: LlmTaskService | None = None
    if app_cfg.llm_server.llm_backend == "server":

        # Resolve llm-server binary path
        server_bin = _resolve_path(
            app_cfg.llm_server.llm_server_path,
            project_root
        )

        # Resolve llm gguf path
        model_path = None
        if app_cfg.llm_config.llm_gguf_path is not None:
            model_path = Path(
                app_cfg.llm_config.llm_gguf_path
            ).expanduser().resolve()

        # Resolve optional multimodal projection file
        mmproj_path = None
        if app_cfg.llm_config.llm_mmproj_path:
            mmproj_path = Path(
                app_cfg.llm_config.llm_mmproj_path
            ).expanduser().resolve()

        # Create the llm-server process wrapper
        server_proc = LlmServerProcess(
            server_cfg=app_cfg.llm_server,
            llm_cfg=app_cfg.llm_config,
        )

        # ----- LLM Client -----
        client = OpenAICompatChatClient(
            server_url = app_cfg.llm_server.llm_server_url,
            model_name = "",
            model_family = "",
            request=app_cfg.llm_request
        )

        llm_service = LlmService(
            client=client,
            max_parallel=4
        )
        llm_task_service = LlmTaskService(llm_service=llm_service)

    return {
        "project_root": project_root,
        "server_bin": server_bin,
        "server_proc": server_proc,
        "llm_client": client,
        "llm_service": llm_service,
        "llm_task_service": llm_task_service
    }