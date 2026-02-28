import type { ReactNode } from 'react';
import { useContext, useState, useEffect, useCallback } from 'react';
import { Image, Pressable, Modal, Dimensions, Alert } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { RecognitionContext } from '@/contexts/recognition-context';
import {
  CATEGORY_ICON_CONFIG,
  PRIMARY,
  MUTED,
  SUCCESS,
  DESTRUCTIVE,
} from '@/common/consts/theme';
import { deleteExpenseApi } from '@/services/expense';
import type { RecognizeResult } from '@/pages/scan/types/index';
import type { HomeLabels } from '@/common/typings/home';

const SCREEN_H = Dimensions.get('window').height;

function ProgressBar({ progress }: { progress: number }): ReactNode {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 300 });
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
  labels,
  onClose,
}: {
  visible: boolean;
  result: RecognizeResult;
  labels: HomeLabels;
  onClose: () => void;
}): ReactNode {
  const rl = labels.recognition;
  const cs = labels.common.currency_symbol;
  const config =
    CATEGORY_ICON_CONFIG[result.category] ?? CATEGORY_ICON_CONFIG['其他'];
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
          <Animated.View style={sheetStyle}>
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
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text fontSize={18} fontWeight="700" color="$color">
                  {rl.result_title}
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={MUTED} />
                </Pressable>
              </XStack>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize={12} color="$muted" mb="$1">
                    {rl.amount_label}
                  </Text>
                  <Text
                    fontSize={28}
                    fontWeight="800"
                    color="$color"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {cs}
                    {result.amount}
                  </Text>
                </YStack>

                <XStack gap="$4">
                  <YStack flex={1}>
                    <Text fontSize={12} color="$muted" mb="$1">
                      {rl.merchant_label}
                    </Text>
                    <Text fontSize={15} fontWeight="600" color="$color">
                      {result.merchant}
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize={12} color="$muted" mb="$1">
                      {rl.category_label}
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
                      {rl.date_label}
                    </Text>
                    <Text fontSize={15} fontWeight="600" color="$color">
                      {result.date}
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize={12} color="$muted" mb="$1">
                      {rl.confidence_label}
                    </Text>
                    <Text fontSize={15} fontWeight="600" color="$color">
                      {Math.round((result.confidence ?? 0) * 100)}%
                    </Text>
                  </YStack>
                </XStack>

                {result.items && result.items.length > 0 ? (
                  <YStack>
                    <Text fontSize={12} color="$muted" mb="$1">
                      {rl.items_label}
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
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const DELETE_BTN_WIDTH = 56;

interface Props {
  labels: HomeLabels;
}

export default function HomeRecognitionProgress({ labels }: Props): ReactNode {
  const recognition = useContext(RecognitionContext);
  const router = useRouter();
  const [showResultSheet, setShowResultSheet] = useState(false);

  const rl = labels.recognition;
  const cl = labels.common;
  const cs = cl.currency_symbol;

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const confirmDelete = useCallback(() => {
    const expenseId = recognition.expenseId;
    Alert.alert(rl.delete_title, rl.delete_confirm, [
      {
        text: cl.cancel,
        style: 'cancel',
        onPress: () => {
          translateX.value = withTiming(0, { duration: 200 });
        },
      },
      {
        text: rl.delete_button,
        style: 'destructive',
        onPress: async () => {
          if (expenseId) {
            await deleteExpenseApi(expenseId);
          }
          recognition.dismiss();
        },
      },
    ]);
  }, [recognition, translateX, rl, cl]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = contextX.value + e.translationX;
      translateX.value = Math.max(-DELETE_BTN_WIDTH, Math.min(0, next));
    })
    .onEnd((e) => {
      if (e.translationX < -30 || e.velocityX < -500) {
        translateX.value = withTiming(-DELETE_BTN_WIDTH, { duration: 200 });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const cardSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBtnStyle = useAnimatedStyle(() => ({
    width: -translateX.value > 0 ? -translateX.value : 0,
    opacity: -translateX.value > 10 ? 1 : 0,
  }));

  if (recognition.status === 'idle') return null;

  const isComplete = recognition.status === 'complete';
  const isError = recognition.status === 'error';
  const isStreaming =
    recognition.status === 'streaming' || recognition.status === 'compressing';

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <View
        style={{
          overflow: 'hidden',
          borderRadius: 20,
          borderCurve: 'continuous',
        }}
      >
        <Animated.View
          style={[
            deleteBtnStyle,
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Pressable
            onPress={confirmDelete}
            hitSlop={4}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: DESTRUCTIVE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </Pressable>
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={cardSlideStyle}>
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
                    <Animated.View
                      entering={FadeInUp.duration(200)}
                      key="streaming"
                    >
                      <XStack
                        style={{
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                        }}
                        mb="$2"
                      >
                        <Text fontSize={13} fontWeight="600" color="$color">
                          {rl.recognizing}
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
                    <Animated.View
                      entering={ZoomIn.duration(300)}
                      key="complete"
                    >
                      <XStack style={{ alignItems: 'center', gap: 6 }} mb="$1">
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={SUCCESS}
                        />
                        <Text fontSize={13} fontWeight="600" color="$success">
                          {rl.complete}
                        </Text>
                      </XStack>
                      <Text
                        fontSize={20}
                        fontWeight="800"
                        color="$color"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {cs}
                        {recognition.result.amount}
                      </Text>
                      <Text fontSize={12} color="$muted" mt={2}>
                        {recognition.result.merchant} ·{' '}
                        {recognition.result.category}
                      </Text>
                      <XStack mt="$2" gap="$2" style={{ flexWrap: 'wrap' }}>
                        {recognition.expenseId ? (
                          <Pressable
                            onPress={() => {
                              router.push({
                                pathname: '/expense-detail',
                                params: { id: recognition.expenseId! },
                              });
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: '#F5F5F5',
                            }}
                          >
                            <Text fontSize={12} fontWeight="600" color="$color">
                              {rl.view_detail}
                            </Text>
                          </Pressable>
                        ) : null}
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
                            {rl.result_title}
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
                            {rl.confirm}
                          </Text>
                        </Pressable>
                      </XStack>
                    </Animated.View>
                  ) : null}

                  {isError ? (
                    <Animated.View
                      entering={FadeInUp.duration(200)}
                      key="error"
                    >
                      <XStack style={{ alignItems: 'center', gap: 6 }} mb="$1">
                        <Ionicons
                          name="alert-circle"
                          size={18}
                          color="#DC2626"
                        />
                        <Text
                          fontSize={13}
                          fontWeight="600"
                          color="$destructive"
                        >
                          {rl.failed}
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
                          {rl.close}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ) : null}
                </YStack>
              </XStack>
            </PikoCard>
          </Animated.View>
        </GestureDetector>
      </View>

      {isComplete && recognition.result ? (
        <ResultEditSheet
          visible={showResultSheet}
          result={recognition.result}
          labels={labels}
          onClose={() => setShowResultSheet(false)}
        />
      ) : null}
    </Animated.View>
  );
}
