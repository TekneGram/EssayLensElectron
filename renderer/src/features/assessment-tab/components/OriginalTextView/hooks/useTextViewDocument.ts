import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { renderAsync } from 'docx-preview';
import { extractDocument } from '../../../hooks/feedbackApi';
import { buildTextMapFromDocx } from '../services/docxTextMap';
import { buildRenderBridge, type RenderBridge } from '../services/renderBridge';
import type { WordTextMap } from '../services/textMapTypes';

export interface LoadedTextViewDocument {
  fileId: string;
  fileName: string;
  buffer: ArrayBuffer;
  textMap: WordTextMap;
}

export type TextViewStatusKind = 'idle' | 'loading' | 'loaded' | 'unsupported' | 'error';

interface UseTextViewDocumentArgs {
  selectedFileId: string | null;
  containerRef: RefObject<HTMLDivElement>;
  onSelectionCleared: () => void;
}

interface UseTextViewDocumentResult {
  document: LoadedTextViewDocument | null;
  bridgeRef: MutableRefObject<RenderBridge | null>;
  statusMessage: string;
  statusKind: TextViewStatusKind;
  isLoading: boolean;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useTextViewDocument({
  selectedFileId,
  containerRef,
  onSelectionCleared
}: UseTextViewDocumentArgs): UseTextViewDocumentResult {
  const [document, setDocument] = useState<LoadedTextViewDocument | null>(null);
  const [statusMessage, setStatusMessage] = useState('Select a .docx file to begin.');
  const [statusKind, setStatusKind] = useState<TextViewStatusKind>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const bridgeRef = useRef<RenderBridge | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onSelectionCleared();
    // Selection should reset only when file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileId]);

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!selectedFileId) {
      setDocument(null);
      bridgeRef.current = null;
      setStatusMessage('Select a .docx file to begin.');
      setStatusKind('idle');
      setIsLoading(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setStatusMessage('Loading document...');
      setStatusKind('loading');

      try {
        const response = await extractDocument(selectedFileId);
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (response.format !== 'docx' || !response.dataBase64) {
          setDocument(null);
          bridgeRef.current = null;
          setStatusMessage('This view currently supports .docx files only.');
          setStatusKind('unsupported');
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
          return;
        }

        const buffer = base64ToArrayBuffer(response.dataBase64);
        const textMap = await buildTextMapFromDocx(buffer);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const nextDocument: LoadedTextViewDocument = {
          fileId: selectedFileId,
          fileName: response.fileName ?? selectedFileId.split(/[\\/]/).pop() ?? selectedFileId,
          buffer,
          textMap
        };

        setDocument(nextDocument);
        setStatusMessage(`Loaded ${nextDocument.fileName}. Select text to add comments.`);
        setStatusKind('loaded');
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setDocument(null);
        bridgeRef.current = null;
        setStatusMessage('Unable to load document.');
        setStatusKind('error');
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void load();
  }, [containerRef, selectedFileId]);

  useEffect(() => {
    if (!document || !containerRef.current) {
      bridgeRef.current = null;
      return;
    }

    const render = async () => {
      if (!containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = '';
      await renderAsync(document.buffer, containerRef.current, undefined, {
        className: 'docx',
        ignoreWidth: false,
        ignoreHeight: false
      });

      if (!containerRef.current) {
        return;
      }

      bridgeRef.current = buildRenderBridge(containerRef.current, document.textMap);
    };

    void render();
  }, [containerRef, document]);

  return {
    document,
    bridgeRef,
    statusMessage,
    statusKind,
    isLoading
  };
}
