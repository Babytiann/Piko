import type { ReactNode } from 'react';
import { createContext, useState, useRef, useCallback } from 'react';

import { createSSEClient } from '@/services/sse-client';
import type { RecognizeResult } from '@/pages/scan/types/index';

export type RecognitionStatus =
  | 'idle'
  | 'compressing'
  | 'streaming'
  | 'complete'
  | 'error';

export interface RecognitionState {
  status: RecognitionStatus;
  progress: number;
  stepMessage: string;
  thumbnailUri: string | null;
  result: RecognizeResult | null;
  expenseId: string | null;
  imageUrl: string | null;
  errorMessage: string | null;
}

export interface RecognitionContextValue extends RecognitionState {
  startRecognition: (
    base64: string,
    mimeType: string,
    thumbnailUri: string,
    source: string,
  ) => void;
  dismiss: () => void;
}

const INITIAL_STATE: RecognitionState = {
  status: 'idle',
  progress: 0,
  stepMessage: '',
  thumbnailUri: null,
  result: null,
  expenseId: null,
  imageUrl: null,
  errorMessage: null,
};

export const RecognitionContext = createContext<RecognitionContextValue>({
  ...INITIAL_STATE,
  startRecognition: () => {},
  dismiss: () => {},
});

interface Props {
  children: ReactNode;
}

export function RecognitionProvider({ children }: Props): ReactNode {
  const [state, setState] = useState<RecognitionState>(INITIAL_STATE);
  const abortRef = useRef<(() => void) | null>(null);

  const dismiss = useCallback((): void => {
    abortRef.current?.();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startRecognition = useCallback(
    (
      base64: string,
      mimeType: string,
      thumbnailUri: string,
      source: string,
    ): void => {
      abortRef.current?.();

      setState({
        ...INITIAL_STATE,
        status: 'streaming',
        progress: 5,
        stepMessage: '正在准备识别...',
        thumbnailUri,
      });

      const abort = createSSEClient({
        path: 'expense/recognize-stream/v1',
        body: { image: base64, mime_type: mimeType, source },
        onEvent: (event) => {
          try {
            const data = JSON.parse(event.data) as Record<string, unknown>;

            if (event.event === 'progress') {
              setState((prev) => ({
                ...prev,
                progress: (data.progress as number) ?? prev.progress,
                stepMessage: (data.message as string) ?? prev.stepMessage,
              }));
            } else if (event.event === 'complete') {
              setState((prev) => ({
                ...prev,
                status: 'complete',
                progress: 100,
                stepMessage: '识别完成',
                result: data.result as RecognizeResult,
                expenseId: (data.expense_id as string) ?? null,
                imageUrl: (data.image_url as string) ?? null,
              }));
              abortRef.current = null;
            } else if (event.event === 'error') {
              setState((prev) => ({
                ...prev,
                status: 'error',
                errorMessage: (data.message as string) ?? '识别失败',
              }));
              abortRef.current = null;
            }
          } catch {
            // ignore parse errors
          }
        },
        onError: (error) => {
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: error,
          }));
          abortRef.current = null;
        },
      });

      abortRef.current = abort;
    },
    [],
  );

  return (
    <RecognitionContext.Provider
      value={{ ...state, startRecognition, dismiss }}
    >
      {children}
    </RecognitionContext.Provider>
  );
}
