import { useEffect, type ReactNode } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ConversationItem } from '../../types';
import { DRAWER_OPEN_MS, DRAWER_CLOSE_MS } from '../../consts';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;
const EASE = Easing.inOut(Easing.cubic);

interface AiConversationDrawerProps {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onLoadMore: () => void;
  drawerTitle: string;
  newChatLabel: string;
}

export default function AiConversationDrawer({
  visible,
  onClose,
  conversations,
  isLoading,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onLoadMore,
  drawerTitle,
  newChatLabel,
}: AiConversationDrawerProps): ReactNode {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-DRAWER_WIDTH);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, {
        duration: DRAWER_OPEN_MS,
        easing: EASE,
      });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, {
        duration: DRAWER_CLOSE_MS,
        easing: EASE,
      });
    }
  }, [visible, translateX]);

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const isActive = item.id === activeId;

    return (
      <Pressable onPress={() => onSelect(item.id)}>
        <XStack
          px="$4"
          py="$3.5"
          mx="$3"
          bg={isActive ? '$blue3' : 'transparent'}
          style={{ alignItems: 'center', borderRadius: 10 }}
        >
          <YStack flex={1} mr="$3">
            <Text
              fontSize="$4"
              fontWeight={isActive ? '600' : '400'}
              color="$color"
              numberOfLines={1}
            >
              {item.title || ''}
            </Text>
            <Text fontSize="$2" color="$gray9" mt="$1">
              {item.message_count} 条消息
            </Text>
          </YStack>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert('确认删除', '删除后将无法恢复，是否继续？', [
                { text: '取消', style: 'cancel' },
                {
                  text: '删除',
                  style: 'destructive',
                  onPress: () => onDelete(item.id),
                },
              ]);
            }}
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={18} color={theme.gray9.val} />
          </Pressable>
        </XStack>
      </Pressable>
    );
  };

  return (
    <>
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: theme.background.val },
          animatedStyle,
        ]}
      >
        <XStack
          px="$5"
          pt={insets.top + 8}
          pb="$4"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text fontSize="$7" fontWeight="700" color="$color">
            {drawerTitle}
          </Text>
          <Pressable onPress={onNewChat} hitSlop={8}>
            <XStack gap="$2" style={{ alignItems: 'center' }}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={theme.blue10.val}
              />
              <Text fontSize="$3" color="$blue10" fontWeight="600">
                {newChatLabel}
              </Text>
            </XStack>
          </Pressable>
        </XStack>

        {isLoading && conversations.length === 0 ? (
          <YStack
            flex={1}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <Text color="$gray9" fontSize="$3">
              加载中...
            </Text>
          </YStack>
        ) : conversations.length === 0 ? (
          <YStack
            flex={1}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <Text color="$gray9" fontSize="$3">
              暂无历史对话
            </Text>
          </YStack>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
          />
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 51,
  },
});
