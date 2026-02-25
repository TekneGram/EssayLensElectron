import type { ChatStreamChunkEvent } from '../../../../../electron/shared/chatContracts';
import type { ActiveCommand, ChatMode, PendingSelection } from '../../chat-interface/domain';
import type { FeedbackItem } from '../../../types';

export function makeLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toChatModeAfterCommandSelection(currentMode: ChatMode, command: ActiveCommand | null): ChatMode {
  if (command) {
    return 'chat';
  }
  return currentMode;
}

export function toSendToLlmActiveCommand(commandId?: string): ActiveCommand {
  return {
    id: commandId ?? 'send-feedback-to-llm',
    label: commandId ? commandId.replace(/[-_]/g, ' ') : 'Send Feedback To LLM',
    source: 'chat-dropdown'
  };
}

export function toPendingSelectionFromComment(comment: FeedbackItem | null | undefined): PendingSelection | null {
  if (!comment || comment.kind !== 'inline') {
    return null;
  }

  if (!comment.startAnchor || !comment.endAnchor) {
    return null;
  }

  return {
    exactQuote: comment.exactQuote,
    prefixText: comment.prefixText,
    suffixText: comment.suffixText,
    startAnchor: comment.startAnchor,
    endAnchor: comment.endAnchor
  };
}

export function isNewerStreamSeq(lastSeq: number, eventSeq: number): boolean {
  return eventSeq > lastSeq;
}

export function isContentStreamChunk(event: ChatStreamChunkEvent): boolean {
  return event.type === 'chunk' && event.channel === 'content' && Boolean(event.text);
}

export function toChatErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
