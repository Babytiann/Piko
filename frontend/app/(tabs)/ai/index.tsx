import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';
import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import { authClient } from '@/services/auth-client';
import useAiChat from '@/pages/ai-chat/hooks/useAiChat';
import useConversationList from '@/pages/ai-chat/hooks/useConversationList';
import useFetchAiPageData from '@/pages/ai-chat/hooks/useFetchAiPageData';
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
    stopStreaming,
    requestLocationPermission,
    loadConversation,
  } = useAiChat();
  const { data: appSession } = authClient.useSession();
  const {
    data,
    isPageLoading,
    errorType: copyErrorType,
    handleRetry: handleCopyRetry,
  } = useFetchAiPageData();

  const convList = useConversationList(appSession?.user?.id ?? null);

  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tooltipTarget, setTooltipTarget] = useState<TooltipTarget | null>(
    null,
  );

  const animateClose = (): void => {
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
  };

  const handleOpenDrawer = (): void => {
    Keyboard.dismiss();
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
    InteractionManager.runAfterInteractions(() => {
      void convList.refresh();
    });
  };

  const handleCloseDrawer = (): void => {
    animateClose();
  };

  const handleSelectConversation = async (id: string): Promise<void> => {
    animateClose();
    try {
      const detail = await fetchConversationDetail(id);
      let nextSeq = 0;
      const msgs: AiMessage[] = detail.messages.map((m) => {
        nextSeq += 1;
        return {
          id: `hist_${nextSeq}`,
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
        };
      });
      loadConversation(msgs, id);
    } catch (err) {
      console.error('[AI] load conversation error:', err);
    }
  };

  const handleDeleteConversation = (id: string): void => {
    const list = convList.conversations;
    const index = list.findIndex((c) => c.id === id);

    let nextId: string | null = null;
    if (id === conversationId && list.length > 1) {
      nextId = index === 0 ? list[1].id : list[0].id;
    }

    convList.remove(id);

    if (id === conversationId) {
      if (nextId) {
        void handleSelectConversation(nextId);
      } else {
        clearMessages();
      }
    }
  };

  const handleNewChat = (): void => {
    animateClose();
    clearMessages();
  };

  const handleMessageLongPress = (
    message: AiMessage,
    layout: BubbleLayout,
  ): void => {
    setTooltipTarget({ message, layout });
  };

  const handleTooltipClose = (): void => {
    setTooltipTarget(null);
  };

  if (isPageLoading) {
    return (
      <YStack flex={1} bg="$background">
        <PageLoading />
      </YStack>
    );
  }

  if (copyErrorType) {
    return (
      <YStack flex={1} bg="$background">
        <PageStatusView errorType={copyErrorType} onRetry={handleCopyRetry} />
      </YStack>
    );
  }

  if (appSession === undefined) {
    return (
      <YStack flex={1} bg="$background">
        <PageLoading />
      </YStack>
    );
  }

  if (!appSession?.user) {
    return (
      <YStack
        flex={1}
        bg="$background"
        pt={insets.top}
        pb={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
        px="$4"
        gap="$4"
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <Text
          fontSize="$5"
          fontWeight="600"
          color="$color"
          style={{ textAlign: 'center' }}
        >
          请使用 Apple 登录
        </Text>
        <Text fontSize="$3" color="$gray11" style={{ textAlign: 'center' }}>
          登录后即可使用 AI 聊天、对话历史等功能。
        </Text>
        <YStack
          height={48}
          bg="$color"
          pressStyle={{ opacity: 0.8 }}
          onPress={() => router.push('/(tabs)/profile')}
          style={{
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 160,
          }}
        >
          <Text color="$background" fontWeight="600" fontSize="$3">
            去登录
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <AiConversationDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        conversations={convList.visibleConversations}
        isLoading={convList.isLoading}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        onLoadMore={convList.loadMore}
        drawerTitle={data?.drawer_title ?? ''}
        newChatLabel={data?.new_chat_label ?? ''}
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
                {data?.header_title ?? ''}
              </Text>
            </XStack>

            <XStack gap="$3" style={{ alignItems: 'center' }}>
              <YStack
                pressStyle={{ opacity: 0.6 }}
                onPress={clearMessages}
                hitSlop={8}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.gray10.val}
                />
              </YStack>
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

          <YStack flex={1}>
            <AiChatMessageList
              messages={messages}
              contentPaddingBottom={16}
              emptyTitle={data?.empty_title ?? ''}
              emptySubtitle={data?.empty_subtitle ?? ''}
              tooltipMessageId={tooltipTarget?.message.id}
              onMessageLongPress={handleMessageLongPress}
              onRequestLocationPermission={requestLocationPermission}
            />
            <AiChatInput
              onSend={sendMessage}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              placeholder={data?.input_placeholder ?? ''}
            />
          </YStack>

          <AiChatTooltip target={tooltipTarget} onClose={handleTooltipClose} />
        </YStack>
      </Animated.View>
    </YStack>
  );
}
