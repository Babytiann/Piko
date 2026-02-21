import { useState } from 'react';
import * as Haptics from 'expo-haptics';

import type { ScanPhase, RecognizeResult, ExpenseRecord } from '../types';
import { useScanCamera } from './useScanCamera';
import { useScanRecognize } from './useScanRecognize';

interface UseScanFlowReturn {
  /** 当前流程阶段 */
  phase: ScanPhase;
  /** 相机相关能力 */
  camera: ReturnType<typeof useScanCamera>;
  /** AI 识别相关状态 */
  recognizer: ReturnType<typeof useScanRecognize>;
  /** 拍照后的图片 URI（预览用） */
  capturedUri: string | null;
  /** 拍照后的 base64（识别用） */
  capturedBase64: string | null;
  /** 已保存的消费记录列表（本地 state） */
  expenses: ExpenseRecord[];
  /** 拍照 */
  handleCapture: () => Promise<void>;
  /** 从相册选图 */
  handlePickLibrary: () => Promise<void>;
  /** 确认使用拍的照片 → 发起识别 */
  handleConfirmPhoto: () => Promise<void>;
  /** 重拍 */
  handleRetake: () => void;
  /** 切到手动输入 */
  handleManualInput: () => void;
  /** 保存消费记录 */
  handleSaveExpense: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  /** 返回相机 */
  handleBackToCamera: () => void;
}

let nextExpenseId = 0;

export function useScanFlow(): UseScanFlowReturn {
  const [phase, setPhase] = useState<ScanPhase>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedMimeType, setCapturedMimeType] =
    useState<string>('image/jpeg');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  const camera = useScanCamera();
  const recognizer = useScanRecognize();

  const handleCapture = async (): Promise<void> => {
    const photo = await camera.takePicture();
    if (!photo) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturedUri(photo.uri);
    setCapturedBase64(photo.base64 ?? null);
    setCapturedMimeType('image/jpeg');
    setPhase('preview');
  };

  const handlePickLibrary = async (): Promise<void> => {
    const base64 = await camera.pickFromLibrary();
    if (!base64) return;

    setCapturedUri(null);
    setCapturedBase64(base64);
    setCapturedMimeType('image/jpeg');
    setPhase('recognizing');
    await recognizer.recognize(base64, 'image/jpeg');
    setPhase('result');
  };

  const handleConfirmPhoto = async (): Promise<void> => {
    if (!capturedBase64) return;

    setPhase('recognizing');
    await recognizer.recognize(capturedBase64, capturedMimeType);
    setPhase('result');
  };

  const handleRetake = (): void => {
    setCapturedUri(null);
    setCapturedBase64(null);
    recognizer.clearResult();
    setPhase('camera');
  };

  const handleManualInput = (): void => {
    setPhase('manual');
  };

  const handleSaveExpense = (
    record: Omit<ExpenseRecord, 'id' | 'createdAt'>,
  ): void => {
    nextExpenseId += 1;
    const expense: ExpenseRecord = {
      ...record,
      id: `expense_${Date.now()}_${nextExpenseId}`,
      createdAt: Date.now(),
    };
    setExpenses((prev) => [expense, ...prev]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 保存后回到相机
    setCapturedUri(null);
    setCapturedBase64(null);
    recognizer.clearResult();
    setPhase('camera');
  };

  const handleBackToCamera = (): void => {
    recognizer.clearResult();
    setCapturedUri(null);
    setCapturedBase64(null);
    setPhase('camera');
  };

  return {
    phase,
    camera,
    recognizer,
    capturedUri,
    capturedBase64,
    expenses,
    handleCapture,
    handlePickLibrary,
    handleConfirmPhoto,
    handleRetake,
    handleManualInput,
    handleSaveExpense,
    handleBackToCamera,
  };
}
