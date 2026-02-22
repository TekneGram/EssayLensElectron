
from app.settings import build_settings
from app.container import build_container
from app.runtime_lifecycle import RuntimeLifecycle

def main():
    app_cfg = build_settings()
    deps = build_container(app_cfg)
    runtime_lifecycle = RuntimeLifecycle()

    