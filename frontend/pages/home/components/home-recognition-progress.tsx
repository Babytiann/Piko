import type { ReactNode } from 'react';
import { useContext, useState } from 'react';
import { Image, Pressable, Modal } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { PikoCard } from '@/common/components/piko-card';
import { RecognitionContext } from '@/contexts/recognition-context';
import {
  CATEGORY_ICON_CONFIG,
  PRIMARY,
  MUTED,
  SUCCESS,
} from '@/common/consts/theme';
import type { RecognizeResult } from '@/pages/scan/types/index';

function ProgressBar({ progress }: { progress: number }): ReactNode {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(progress, { damping: 15, stiffness: 150 });
  }, [progress, animatedWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
    height: 6,
    backgroundColor: PRIMARY,
    borderRadius: 3,
  }));

  return (
    <View
      style={{
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={barStyle} />
    </View>
  );
}

function ProgressNumber({ progress }: { progress: number }): ReactNode {
  const animatedNum = useSharedValue(0);

  useEffect(() => {
    animatedNum.value = withTiming(progress, { duration: 400 });
  }, [progress, animatedNum]);

  return (
    <Text
      fontSize={24}
      fontWeight="800"
      color="$color"
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {Math.round(progress)}%
    </Text>
  );
}

function ResultEditSheet({
  visible,
  result,
  onClose,
}: {
  visible: boolean;
  result: RecognizeResult;
  onClose: () => void;
}): ReactNode {
  const config =
    CATEGORY_ICON_CONFIG[result.category] ?? CATEGORY_ICON_CONFIG['其他'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <YStack
            bg="$card"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderCurve: 'continuous',
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <XStack
              mb="$4"
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text fontSize={18} fontWeight="700" color="$color">
                识别结果
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={MUTED} />
              </Pressable>
            </XStack>

            <YStack gap="$4">
              <YStack>
                <Text fontSize={12} color="$muted" mb="$1">
                  金额
                </Text>
                <Text
                  fontSize={28}
                  fontWeight="800"
                  color="$color"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ¥{result.amount}
                </Text>
              </YStack>

              <XStack gap="$4">
                <YStack flex={1}>
                  <Text fontSize={12} color="$muted" mb="$1">
                    商户
                  </Text>
                  <Text fontSize={15} fontWeight="600" color="$color">
                    {result.merchant}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={12} color="$muted" mb="$1">
                    分类
                  </Text>
                  <XStack style={{ alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={config.iconColor}
                    />
                    <Text fontSize={15} fontWeight="600" color="$color">
                      {result.category}
                    </Text>
                  </XStack>
                </YStack>
              </XStack>

              <XStack gap="$4">
                <YStack flex={1}>
                  <Text fontSize={12} color="$muted" mb="$1">
                    日期
                  </Text>
                  <Text fontSize={15} fontWeight="600" color="$color">
                    {result.date}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={12} color="$muted" mb="$1">
                    置信度
                  </Text>
                  <Text fontSize={15} fontWeight="600" color="$color">
                    {Math.round((result.confidence ?? 0) * 100)}%
                  </Text>
                </YStack>
              </XStack>

              {result.items && result.items.length > 0 ? (
                <YStack>
                  <Text fontSize={12} color="$muted" mb="$1">
                    明细
                  </Text>
                  {result.items.map((item, i) => (
                    <Text key={i} fontSize={14} color="$color" mt={2}>
                      · {item}
                    </Text>
                  ))}
                </YStack>
              ) : null}
            </YStack>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HomeRecognitionProgress(): ReactNode {
  const recognition = useContext(RecognitionContext);
  const [showResultSheet, setShowResultSheet] = useState(false);

  if (recognition.status === 'idle') return null;

  const isComplete = recognition.status === 'complete';
  const isError = recognition.status === 'error';
  const isStreaming =
    recognition.status === 'streaming' || recognition.status === 'compressing';

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <PikoCard>
        <XStack gap="$3" style={{ alignItems: 'center' }}>
          {recognition.thumbnailUri ? (
            <Image
              source={{ uri: recognition.thumbnailUri }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                backgroundColor: '#F5F5F5',
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                borderCurve: 'continuous',
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="image-outline" size={28} color={MUTED} />
            </View>
          )}

          <YStack flex={1}>
            {isStreaming ? (
              <Animated.View entering={FadeInUp.duration(200)} key="streaming">
                <XStack
                  style={{
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                  }}
                  mb="$2"
                >
                  <Text fontSize={13} fontWeight="600" color="$color">
                    AI 识别中
                  </Text>
                  <ProgressNumber progress={recognition.progress} />
                </XStack>
                <ProgressBar progress={recognition.progress} />
                <Text fontSize={11} color="$muted" mt="$1">
                  {recognition.stepMessage}
                </Text>
              </Animated.View>
            ) : null}

            {isComplete && recognition.result ? (
              <Animated.View entering={ZoomIn.duration(300)} key="complete">
                <XStack style={{ alignItems: 'center', gap: 6 }} mb="$1">
                  <Ionicons name="checkmark-circle" size={18} color={SUCCESS} />
                  <Text fontSize={13} fontWeight="600" color="$success">
                    识别完成
                  </Text>
                </XStack>
                <Text
                  fontSize={20}
                  fontWeight="800"
                  color="$color"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ¥{recognition.result.amount}
                </Text>
                <Text fontSize={12} color="$muted" mt={2}>
                  {recognition.result.merchant} · {recognition.result.category}
                </Text>
                <XStack mt="$2" gap="$2">
                  <Pressable
                    onPress={() => setShowResultSheet(true)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                    <Text fontSize={12} fontWeight="600" color="$color">
                      查看详情
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={recognition.dismiss}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: PRIMARY,
                    }}
                  >
                    <Text fontSize={12} fontWeight="600" color="white">
                      确认
                    </Text>
                  </Pressable>
                </XStack>
              </Animated.View>
            ) : null}

            {isError ? (
              <Animated.View entering={FadeInUp.duration(200)} key="error">
                <XStack style={{ alignItems: 'center', gap: 6 }} mb="$1">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text fontSize={13} fontWeight="600" color="$destructive">
                    识别失败
                  </Text>
                </XStack>
                <Text fontSize={12} color="$muted" mt={2}>
                  {recognition.errorMessage}
                </Text>
                <Pressable
                  onPress={recognition.dismiss}
                  style={{
                    marginTop: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#F5F5F5',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text fontSize={12} fontWeight="600" color="$color">
                    关闭
                  </Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </YStack>
        </XStack>
      </PikoCard>

      {isComplete && recognition.result ? (
        <ResultEditSheet
          visible={showResultSheet}
          result={recognition.result}
          onClose={() => setShowResultSheet(false)}
        />
      ) : null}
    </Animated.View>
  );
}
