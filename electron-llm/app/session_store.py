from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class SessionStore:
    max_turns: int = 12
    _sessions: dict[str, list[dict[str, str]]] = field(default_factory=dict)

    def create_session(self, session_id: str) -> str:
        normalized = session_id.strip()
        if not normalized:
            raise ValueError("session_id must be a non-empty string")
        self._sessions.setdefault(normalized, [])
        return normalized

    def clear_session(self, session_id: str) -> bool:
        normalized = session_id.strip()
        if not normalized:
            raise ValueError("session_id must be a non-empty string")
        return self._sessions.pop(normalized, None) is not None

    def append_turn_pair(self, session_id: str, teacher_message: str, assistant_reply: str) -> None:
        normalized = self.create_session(session_id)
        turns = self._sessions.setdefault(normalized, [])
        turns.append({"role": "teacher", "content": teacher_message})
        turns.append({"role": "assistant", "content": assistant_reply})
        self._trim(turns)

    def get_turns(self, session_id: str) -> list[dict[str, str]]:
        normalized = session_id.strip()
        if not normalized:
            raise ValueError("session_id must be a non-empty string")
        existing = self._sessions.get(normalized, [])
        return [dict(turn) for turn in existing]

    def _trim(self, turns: list[dict[str, str]]) -> None:
        max_entries = max(self.max_turns, 1) * 2
        if len(turns) <= max_entries:
            return
        del turns[: len(turns) - max_entries]
