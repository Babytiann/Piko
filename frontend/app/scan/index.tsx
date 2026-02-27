import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { View, Text } from 'tamagui';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useScanFlow } from '@/pages/scan/hooks/useScanFlow';
import ScanCameraView from '@/pages/scan/components/scan-camera-view';
import ScanPreviewConfirm from '@/pages/scan/components/scan-preview-confirm';
import ScanResultForm from '@/pages/scan/components/scan-result-form';
import ScanManualInput from '@/pages/scan/components/scan-manual-input';

export default function ScanScreen(): ReactNode {
  const flow = useScanFlow();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderContent = (): ReactNode => {
    switch (flow.phase) {
      case 'camera':
        return (
          <ScanCameraView
            camera={flow.camera}
            onCapture={() => void flow.handleCapture()}
            onPickLibrary={() => void flow.handlePickLibrary()}
            onManualInput={flow.handleManualInput}
          />
        );

      case 'preview':
        return (
          <ScanPreviewConfirm
            imageUri={flow.capturedUri}
            imageBase64={flow.capturedBase64}
            onConfirm={() => void flow.handleConfirmPhoto()}
            onRetake={flow.handleRetake}
          />
        );

      case 'recognizing':
        return (
          <View flex={1} bg="$background" style={styles.center}>
            <ActivityIndicator size="large" />
            <Text color="$gray11" fontSize="$4" mt="$4">
              正在跳转首页...
            </Text>
          </View>
        );

      case 'result':
        return flow.recognizer.result ? (
          <ScanResultForm
            result={flow.recognizer.result}
            error={flow.recognizer.error}
            source="camera"
            onSave={flow.handleSaveExpense}
            onRetake={flow.handleRetake}
          />
        ) : (
          <ScanResultForm
            result={{
              amount: 0,
              merchant: '未识别',
              category: '其他',
              date: new Date().toISOString().slice(0, 10),
              confidence: 0,
            }}
            error={flow.recognizer.error ?? '识别失败，请重试'}
            source="camera"
            onSave={flow.handleSaveExpense}
            onRetake={flow.handleRetake}
          />
        );

      case 'manual':
        return (
          <ScanManualInput
            onSave={flow.handleSaveExpense}
            onBack={flow.handleBackToCamera}
          />
        );
    }
  };

  return (
    <View flex={1}>
      {renderContent()}

      {/* 关闭按钮 — 绝对定位左上角，所有 phase 通用 */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + 12 }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="关闭"
      >
        <Ionicons name="close" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
