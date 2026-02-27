import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { CameraView, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { View, XStack, Text } from 'tamagui';

import { MUTED } from '@/common/consts/theme';
import type { useScanCamera } from '../hooks/useScanCamera';

interface Props {
  camera: ReturnType<typeof useScanCamera>;
  onCapture: () => void;
  onPickLibrary: () => void;
  onManualInput: () => void;
}

export default function ScanCameraView({
  camera,
  onCapture,
  onPickLibrary,
  onManualInput,
}: Props): ReactNode {
  if (camera.isPermissionLoading) {
    return (
      <View flex={1} bg="$background" style={styles.center}>
        <Text color="$gray11" fontSize="$4">
          正在检查相机权限...
        </Text>
      </View>
    );
  }

  if (!camera.hasPermission) {
    return (
      <View flex={1} bg="$background" style={styles.center} gap="$4">
        <Ionicons name="camera-outline" size={64} color={MUTED} />
        <Text
          color="$gray11"
          fontSize="$4"
          style={{ textAlign: 'center' }}
          px="$6"
        >
          需要相机权限才能拍照记账
        </Text>
        <View
          bg="$primary"
          px="$5"
          py="$2.5"
          style={{ borderRadius: 12 }}
          pressStyle={{ opacity: 0.8 }}
          onPress={() => void camera.requestPermission()}
        >
          <Text color="$primaryForeground" fontWeight="600" fontSize="$4">
            授权相机
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View flex={1} bg="black">
      <CameraView
        ref={camera.cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
      />

      {/* 底部操作栏 */}
      <XStack
        position="absolute"
        pb="$8"
        pt="$4"
        px="$6"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 相册 */}
        <View
          width={48}
          height={48}
          bg="rgba(255,255,255,0.2)"
          style={{ borderRadius: 24, ...styles.center }}
          pressStyle={{ opacity: 0.7 }}
          onPress={onPickLibrary}
        >
          <Ionicons name="images-outline" size={22} color="white" />
        </View>

        {/* 快门按钮 */}
        <View
          width={72}
          height={72}
          bg="white"
          style={{ borderRadius: 36, ...styles.center }}
          pressStyle={{ scale: 0.9, opacity: 0.9 }}
          onPress={onCapture}
        >
          <View
            width={62}
            height={62}
            style={{ borderRadius: 31, borderWidth: 3, borderColor: '#000' }}
          />
        </View>

        {/* 手动输入 */}
        <View
          width={48}
          height={48}
          bg="rgba(255,255,255,0.2)"
          style={{ borderRadius: 24, ...styles.center }}
          pressStyle={{ opacity: 0.7 }}
          onPress={onManualInput}
        >
          <Ionicons name="keypad-outline" size={22} color="white" />
        </View>
      </XStack>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
