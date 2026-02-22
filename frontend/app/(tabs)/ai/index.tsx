import { useCallback, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import { useAuth } from '@/common/hooks';
import {
  useAiChat,
  useAiCopywriting,
  useConversationList,
} from '@/pages/ai-chat/hooks';
import { fetchConversationDetail } from '@/services/ai';
import type {
  AiMessage,
  BubbleLayout,
  TooltipTarget,
} from '@/pages/ai-chat/types';
import AiChatMessageList from '@/pages/ai-chat/components/ai-chat-message-list';
import AiChatInput from '@/pages/ai-chat/components/ai-chat-input';
import AiChatTooltip from '@/pages/ai-chat/components/ai-chat-tooltip';
import AiConversationDrawer from '@/pages/ai-chat/components/ai-conversation-drawer';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;

function useKeyboardBottomInset(): number {
  const insets = useSafeAreaInsets();
  const idleInset = insets.bottom + TAB_BAR_CONTENT_HEIGHT;
  const [bottomInset, setBottomInset] = useState(idleInset);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setBottomInset(e.endCoordinates.height);
    };
    const onHide = () => {
      setBottomInset(idleInset);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [idleInset]);

  return bottomInset;
}

export default function AiScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    clearMessages,
    requestLocationPermission,
    loadConversation,
  } = useAiChat();
  const { copy } = useAiCopywriting();
  const bottomInset = useKeyboardBottomInset();
  const { user } = useAuth();
  const convList = useConversationList(user?.id ?? null);

  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tooltipTarget, setTooltipTarget] = useState<TooltipTarget | null>(
    null,
  );

  const handleOpenDrawer = useCallback(() => {
    void convList.refresh();
    setDrawerVisible(true);
    Animated.timing(contentTranslateX, {
      toValue: DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [convList, contentTranslateX, backdropOpacity]);

  const animateClose = useCallback(() => {
    setDrawerVisible(false);
    Animated.timing(contentTranslateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [contentTranslateX, backdropOpacity]);

  const handleCloseDrawer = useCallback(() => {
    animateClose();
  }, [animateClose]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      animateClose();
      try {
        const detail = await fetchConversationDetail(id);
        let nextId = 0;
        const msgs: AiMessage[] = detail.messages.map((m) => {
          nextId += 1;
          return {
            id: `hist_${nextId}`,
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.content,
            timestamp: new Date(m.createdAt).getTime(),
          };
        });
        loadConversation(msgs, id);
      } catch (err) {
        console.error('[AI] load conversation error:', err);
      }
    },
    [loadConversation, animateClose],
  );

  const handleNewChat = useCallback(() => {
    animateClose();
    clearMessages();
  }, [clearMessages, animateClose]);

  const handleMessageLongPress = useCallback(
    (message: AiMessage, layout: BubbleLayout) => {
      setTooltipTarget({ message, layout });
    },
    [],
  );

  function handleTooltipClose(): void {
    setTooltipTarget(null);
  }

  return (
    <YStack flex={1} bg="$background">
      <AiConversationDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        conversations={convList.conversations}
        isLoading={convList.isLoading}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onDelete={convList.remove}
        onNewChat={handleNewChat}
      />

      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: contentTranslateX }],
        }}
      >
        <YStack flex={1} pt={insets.top} bg="$background">
          <Animated.View
            pointerEvents={drawerVisible ? 'auto' : 'none'}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0,0,0,0.4)',
                opacity: backdropOpacity,
                zIndex: 100,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleCloseDrawer}
            />
          </Animated.View>
          <XStack
            px="$4"
            py="$3"
            style={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <XStack gap="$3" style={{ alignItems: 'center' }}>
              <YStack
                pressStyle={{ opacity: 0.6 }}
                onPress={handleOpenDrawer}
                hitSlop={8}
              >
                <Ionicons
                  name="menu-outline"
                  size={22}
                  color={theme.gray10.val}
                />
              </YStack>
              <Text
                fontSize="$7"
                fontWeight="700"
                color="$color"
                letterSpacing={-0.5}
              >
                {copy.headerTitle}
              </Text>
            </XStack>

            <XStack gap="$3" style={{ alignItems: 'center' }}>
              {messages.length > 0 ? (
                <YStack
                  pressStyle={{ opacity: 0.6 }}
                  onPress={clearMessages}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.gray10.val}
                  />
                </YStack>
              ) : null}
              <YStack
                pressStyle={{ opacity: 0.6 }}
                onPress={() => router.push('/telegram-dialog')}
                hitSlop={8}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={22}
                  color={theme.gray10.val}
                />
              </YStack>
            </XStack>
          </XStack>

          <YStack flex={1} pb={bottomInset}>
            <AiChatMessageList
              messages={messages}
              contentPaddingBottom={16}
              emptyTitle={copy.emptyTitle}
              emptySubtitle={copy.emptySubtitle}
              tooltipMessageId={tooltipTarget?.message.id}
              onMessageLongPress={handleMessageLongPress}
              onRequestLocationPermission={requestLocationPermission}
            />
            <AiChatInput
              onSend={sendMessage}
              disabled={isStreaming}
              placeholder={copy.inputPlaceholder}
            />
          </YStack>

          <AiChatTooltip target={tooltipTarget} onClose={handleTooltipClose} />
        </YStack>
      </Animated.View>
    </YStack>
  );
}
