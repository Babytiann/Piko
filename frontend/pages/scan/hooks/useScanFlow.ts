import { useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import type { ScanPhase, ExpenseRecord } from '../types';
import { useScanCamera } from './useScanCamera';
import { useScanRecognize } from './useScanRecognize';
import { uploadExpense } from '@/services/ai';
import { compressImage } from '@/common/utils/compress-image';
import { RecognitionContext } from '@/contexts/recognition-context';

interface UseScanFlowReturn {
  phase: ScanPhase;
  camera: ReturnType<typeof useScanCamera>;
  recognizer: ReturnType<typeof useScanRecognize>;
  capturedUri: string | null;
  capturedBase64: string | null;
  expenses: ExpenseRecord[];
  handleCapture: () => Promise<void>;
  handlePickLibrary: () => Promise<void>;
  handleConfirmPhoto: () => Promise<void>;
  handleRetake: () => void;
  handleManualInput: () => void;
  handleSaveExpense: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
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
  const router = useRouter();
  const recognition = useContext(RecognitionContext);

  const navigateHomeWithRecognition = async (
    imageUri: string,
    base64: string,
    source: string,
  ): Promise<void> => {
    try {
      const compressed = await compressImage(imageUri);
      recognition.startRecognition(
        compressed.base64,
        'image/jpeg',
        compressed.uri,
        source,
      );
    } catch {
      recognition.startRecognition(base64, 'image/jpeg', imageUri, source);
    }
    router.replace('/');
  };

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

    const tempUri = `data:image/jpeg;base64,${base64.slice(0, 100)}`;
    await navigateHomeWithRecognition(tempUri, base64, 'album');
  };

  const handleConfirmPhoto = async (): Promise<void> => {
    if (!capturedBase64 || !capturedUri) return;
    await navigateHomeWithRecognition(capturedUri, capturedBase64, 'camera');
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

    void uploadExpense({
      amount: record.amount,
      merchant: record.merchant,
      category: record.category,
      date: record.date,
      items: record.items,
      source: record.source,
      image: capturedBase64 ?? undefined,
      mime_type: capturedMimeType,
    }).catch((err) => console.error('[Expense] upload error:', err));

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
