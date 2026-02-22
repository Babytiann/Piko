import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ConversationItem } from '../../types';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;

interface AiConversationDrawerProps {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
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
}: AiConversationDrawerProps): ReactNode {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, translateX]);

  if (!shouldRender) return null;

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const isActive = item.id === activeId;

    return (
      <Pressable onPress={() => onSelect(item.id)}>
        <XStack
          px="$3"
          py="$2.5"
          mx="$2"
          bg={isActive ? '$blue3' : 'transparent'}
          style={{ alignItems: 'center', borderRadius: 8 }}
        >
          <YStack flex={1} mr="$2">
            <Text
              fontSize="$3"
              fontWeight={isActive ? '600' : '400'}
              color="$color"
              numberOfLines={1}
            >
              {item.title || '新对话'}
            </Text>
            <Text fontSize="$1" color="$gray9" mt="$0.5">
              {item.messageCount} 条消息
            </Text>
          </YStack>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color={theme.gray9.val} />
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
          {
            backgroundColor: theme.background.val,
            transform: [{ translateX }],
          },
        ]}
      >
        <XStack
          px="$4"
          pt={insets.top}
          pb="$3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text fontSize="$5" fontWeight="700" color="$color">
            历史对话
          </Text>
          <Pressable onPress={onNewChat} hitSlop={8}>
            <XStack gap="$1.5" style={{ alignItems: 'center' }}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.blue10.val}
              />
              <Text fontSize="$2" color="$blue10" fontWeight="500">
                新对话
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
