import type { Dispatch } from 'react';
import type { ChatStreamChunkEvent } from '../../../../../electron/shared/chatContracts';
import { addChatMessage, setChatError, setChatStatus, updateChatMessageContent } from '../../chat-interface/state';
import type { PendingSelection } from '../../chat-interface/domain';
import type { AppAction } from '../../../state/actions';
import type { ChatPort } from '../../../ports';
import {
  isContentStreamChunk,
  isNewerStreamSeq,
  makeLocalId,
  toChatErrorMessage
} from '../domain/assessmentTab.logic';

interface SubmitChatMessageWorkflowParams {
  chatApi: ChatPort;
  dispatch: Dispatch<AppAction>;
  message: string;
  selectedFileId: string | null;
  activeSessionId?: string;
  pendingSelection: PendingSelection | null;
  streamMessageByClientRequestId: Map<string, string>;
  streamSeqByClientRequestId: Map<string, number>;
}

export async function submitChatMessageWorkflow({
  chatApi,
  dispatch,
  message,
  selectedFileId,
  activeSessionId,
  pendingSelection,
  streamMessageByClientRequestId,
  streamSeqByClientRequestId
}: SubmitChatMessageWorkflowParams): Promise<void> {
  const clientRequestId = makeLocalId('chatreq');
  const teacherMessageId = makeLocalId('teacher');
  const assistantMessageId = makeLocalId('assistant');
  const createdAt = new Date().toISOString();

  streamMessageByClientRequestId.set(clientRequestId, assistantMessageId);
  streamSeqByClientRequestId.set(clientRequestId, -1);

  dispatch(
    addChatMessage({
      id: teacherMessageId,
      role: 'teacher',
      content: message,
      relatedFileId: selectedFileId ?? undefined,
      sessionId: activeSessionId,
      createdAt
    })
  );
  dispatch(
    addChatMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      relatedFileId: selectedFileId ?? undefined,
      sessionId: activeSessionId,
      createdAt
    })
  );
  dispatch(setChatStatus('sending'));
  dispatch(setChatError(undefined));

  try {
    const result = await chatApi.sendMessage({
      fileId: selectedFileId ?? undefined,
      sessionId: activeSessionId,
      message,
      contextText: pendingSelection?.exactQuote,
      clientRequestId
    });
    if (!result.ok) {
      throw new Error(result.error.message || 'Unable to send chat message.');
    }

    dispatch(
      updateChatMessageContent({
        messageId: assistantMessageId,
        content: result.data.reply,
        mode: 'replace'
      })
    );

    streamMessageByClientRequestId.delete(clientRequestId);
    streamSeqByClientRequestId.delete(clientRequestId);
    if (streamMessageByClientRequestId.size === 0) {
      dispatch(setChatStatus('idle'));
    }
  } catch (error) {
    streamMessageByClientRequestId.delete(clientRequestId);
    streamSeqByClientRequestId.delete(clientRequestId);
    const errorMessage = toChatErrorMessage(error, 'Unable to send chat message.');
    dispatch(setChatStatus('error'));
    dispatch(setChatError(errorMessage));
    throw error;
  }
}

interface HandleChatStreamChunkWorkflowParams {
  event: ChatStreamChunkEvent;
  dispatch: Dispatch<AppAction>;
  streamMessageByClientRequestId: Map<string, string>;
  streamSeqByClientRequestId: Map<string, number>;
}

export function handleChatStreamChunkWorkflow({
  event,
  dispatch,
  streamMessageByClientRequestId,
  streamSeqByClientRequestId
}: HandleChatStreamChunkWorkflowParams): void {
  const clientRequestId = event.clientRequestId;
  const assistantMessageId = streamMessageByClientRequestId.get(clientRequestId);
  if (!assistantMessageId) {
    return;
  }

  const lastSeq = streamSeqByClientRequestId.get(clientRequestId) ?? -1;
  if (!isNewerStreamSeq(lastSeq, event.seq)) {
    return;
  }
  streamSeqByClientRequestId.set(clientRequestId, event.seq);

  if (isContentStreamChunk(event)) {
    dispatch(
      updateChatMessageContent({
        messageId: assistantMessageId,
        content: event.text ?? '',
        mode: 'append'
      })
    );
    return;
  }

  if (event.type === 'done') {
    streamMessageByClientRequestId.delete(clientRequestId);
    streamSeqByClientRequestId.delete(clientRequestId);
    if (streamMessageByClientRequestId.size === 0) {
      dispatch(setChatStatus('idle'));
    }
    return;
  }

  if (event.type === 'error') {
    streamMessageByClientRequestId.delete(clientRequestId);
    streamSeqByClientRequestId.delete(clientRequestId);
    const message = event.error?.message || 'Streaming chat request failed.';
    dispatch(setChatStatus('error'));
    dispatch(setChatError(message));
  }
}
