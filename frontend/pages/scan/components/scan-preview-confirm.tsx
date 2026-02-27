import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, XStack, Text } from 'tamagui';

interface Props {
  /** 照片本地 URI */
  imageUri: string | null;
  /** 照片 base64（当 URI 不可用时作为 fallback） */
  imageBase64: string | null;
  onConfirm: () => void;
  onRetake: () => void;
}

export default function ScanPreviewConfirm({
  imageUri,
  imageBase64,
  onConfirm,
  onRetake,
}: Props): ReactNode {
  const source = imageUri
    ? { uri: imageUri }
    : imageBase64
      ? { uri: `data:image/jpeg;base64,${imageBase64}` }
      : null;

  return (
    <View flex={1} bg="black">
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      ) : null}

      {/* 底部操作栏 */}
      <XStack
        position="absolute"
        pb="$8"
        pt="$4"
        px="$8"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 重拍 */}
        <View
          px="$4"
          py="$2.5"
          bg="rgba(255,255,255,0.15)"
          style={{ borderRadius: 20 }}
          pressStyle={{ opacity: 0.7 }}
          onPress={onRetake}
        >
          <XStack gap="$2" style={{ alignItems: 'center' }}>
            <Ionicons name="refresh-outline" size={18} color="white" />
            <Text color="white" fontWeight="500" fontSize="$3">
              重拍
            </Text>
          </XStack>
        </View>

        {/* 使用此照片 */}
        <View
          px="$4"
          py="$2.5"
          bg="$primary"
          style={{ borderRadius: 20 }}
          pressStyle={{ opacity: 0.8 }}
          onPress={onConfirm}
        >
          <XStack gap="$2" style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
            <Text color="$primaryForeground" fontWeight="600" fontSize="$3">
              使用此照片
            </Text>
          </XStack>
        </View>
      </XStack>
    </View>
  );
}
