from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Sequence

from nlp.llm.tasks.prompt_tester import run_parallel_prompt_tester


if TYPE_CHECKING:
    from services.llm_service import LlmService
    from app.settings import AppConfig


@dataclass
class LlmTaskService:
    """
    Application-facing LLM task orchestration.

    This service groups domain tasks while delegating transport concerns to
    LlmService and prompt/schema composition to nlp.llm.tasks.* modules.
    """

    llm_service: "LlmService"


    def prompt_tester_parallel(
        self,
        *,
        app_cfg: "AppConfig",
        text_tasks: Sequence[str],
        max_concurrency: int | None = None,
    ) -> dict[str, Any]:
        llm_no_think = self.llm_service.with_mode("no_think")
        return asyncio.run(
            run_parallel_prompt_tester(
                llm_service=llm_no_think,
                app_cfg=app_cfg,
                text_tasks=text_tasks,
                max_concurrency=max_concurrency,
            )
        )