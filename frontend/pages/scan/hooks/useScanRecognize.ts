import { useState } from 'react';

import { recognizeExpense } from '@/services/ai';
import type { RecognizeResult } from '../types';

interface UseScanRecognizeReturn {
  /** 识别结果 */
  result: RecognizeResult | null;
  /** 是否正在识别 */
  isRecognizing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 发起识别 */
  recognize: (imageBase64: string, mimeType: string) => Promise<void>;
  /** 清除结果 */
  clearResult: () => void;
}

export function useScanRecognize(): UseScanRecognizeReturn {
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (
    imageBase64: string,
    mimeType: string,
  ): Promise<void> => {
    setIsRecognizing(true);
    setError(null);
    setResult(null);

    try {
      const data = await recognizeExpense(imageBase64, mimeType);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '识别失败，请重试';
      setError(message);
    } finally {
      setIsRecognizing(false);
    }
  };

  const clearResult = (): void => {
    setResult(null);
    setError(null);
  };

  return {
    result,
    isRecognizing,
    error,
    recognize,
    clearResult,
  };
}
