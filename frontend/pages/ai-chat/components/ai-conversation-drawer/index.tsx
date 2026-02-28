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

import type { AiPageData, ConversationItem } from '../../types';
import { DRAWER_OPEN_MS, DRAWER_CLOSE_MS } from '../../consts';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;
const EASE = Easing.inOut(Easing.cubic);

function formatRelativeTime(dateStr: string, pd?: AiPageData): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return pd?.time_just_now ?? '刚刚';
  if (mins < 60)
    return (pd?.time_minutes_ago ?? '{n} 分钟前').replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return (pd?.time_hours_ago ?? '{n} 小时前').replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7)
    return (pd?.time_days_ago ?? '{n} 天前').replace('{n}', String(days));
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

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
  pageData?: AiPageData;
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
  pageData,
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
  }, [visible]);

  const renderItem = ({
    item,
    index,
  }: {
    item: ConversationItem;
    index: number;
  }) => {
    const isActive = item.id === activeId;
    const isLast = index === conversations.length - 1;

    return (
      <Pressable onPress={() => onSelect(item.id)}>
        <XStack
          px="$4"
          py="$3"
          mx="$3"
          bg={isActive ? '$gray4' : 'transparent'}
          style={{
            alignItems: 'center',
            borderRadius: 10,
            borderBottomWidth: isLast ? 0 : 0.5,
            borderBottomColor: theme.gray4.val,
            marginBottom: isLast ? 0 : 2,
          }}
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
            <XStack mt="$1" gap="$2" style={{ alignItems: 'center' }}>
              <Text fontSize="$2" color="$gray9">
                {(pageData?.drawer_message_count ?? '{n} 条消息').replace(
                  '{n}',
                  String(item.message_count),
                )}
              </Text>
              {'updated_at' in item && item.updated_at ? (
                <>
                  <Text fontSize="$1" color="$gray7">
                    ·
                  </Text>
                  <Text fontSize="$2" color="$gray8">
                    {formatRelativeTime(item.updated_at as string, pageData)}
                  </Text>
                </>
              ) : null}
            </XStack>
          </YStack>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(
                pageData?.drawer_delete_title ?? '确认删除',
                pageData?.drawer_delete_desc ?? '删除后将无法恢复，是否继续？',
                [
                  {
                    text: pageData?.drawer_delete_cancel ?? '取消',
                    style: 'cancel',
                  },
                  {
                    text: pageData?.drawer_delete_confirm ?? '删除',
                    style: 'destructive',
                    onPress: () => onDelete(item.id),
                  },
                ],
              );
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
                color={theme.primary.val}
              />
              <Text fontSize="$3" color="$primary" fontWeight="600">
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
              {pageData?.drawer_loading ?? ''}
            </Text>
          </YStack>
        ) : conversations.length === 0 ? (
          <YStack
            flex={1}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <Text color="$gray9" fontSize="$3">
              {pageData?.drawer_empty ?? ''}
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
