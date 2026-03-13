import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  InteractionManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
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
import { LoginStatus } from '@/pages/ai-chat/types';
import AiChatLoginPrompt from '@/pages/ai-chat/components/ai-chat-login-prompt';
import AiChatMessageList from '@/pages/ai-chat/components/ai-chat-message-list';
import AiChatInput from '@/pages/ai-chat/components/ai-chat-input';
import AiChatTooltip from '@/pages/ai-chat/components/ai-chat-tooltip';
import AiConversationDrawer from '@/pages/ai-chat/components/ai-conversation-drawer';
import { DRAWER_OPEN_MS, DRAWER_CLOSE_MS } from '@/pages/ai-chat/consts';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.7;
const DRAWER_EASE = Easing.inOut(Easing.cubic);

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
  const { data, isPageLoading, errorType, handleRetry } = useFetchAiPageData(
    appSession?.user?.id ?? null,
  );

  const pageData = data ?? {};
  const {
    login_status,
    header_title,
    empty_title,
    empty_subtitle,
    input_placeholder,
    drawer_title,
    new_chat_label,
    login_prompt_title,
    login_prompt_desc,
    login_prompt_btn,
  } = pageData;
  const convList = useConversationList(appSession?.user?.id ?? null);

  const contentTranslateX = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentTranslateX.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tooltipTarget, setTooltipTarget] = useState<TooltipTarget | null>(
    null,
  );

  const animateClose = (): void => {
    setDrawerVisible(false);
    contentTranslateX.value = withTiming(0, {
      duration: DRAWER_CLOSE_MS,
      easing: DRAWER_EASE,
    });
    backdropOpacity.value = withTiming(0, {
      duration: DRAWER_CLOSE_MS,
      easing: DRAWER_EASE,
    });
  };

  const handleOpenDrawer = (): void => {
    Keyboard.dismiss();
    void convList.refresh();
    setDrawerVisible(true);
    contentTranslateX.value = withTiming(DRAWER_WIDTH, {
      duration: DRAWER_OPEN_MS,
      easing: DRAWER_EASE,
    });
    backdropOpacity.value = withTiming(1, {
      duration: DRAWER_OPEN_MS,
      easing: DRAWER_EASE,
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

  if (errorType) {
    return (
      <YStack flex={1} bg="$background">
        <PageStatusView errorType={errorType} onRetry={handleRetry} />
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

  const isLoggedOut =
    login_status === LoginStatus.LOGGED_OUT ||
    (login_status === undefined && !appSession?.user);
  if (isLoggedOut) {
    return (
      <AiChatLoginPrompt
        title={login_prompt_title ?? ''}
        description={login_prompt_desc ?? ''}
        buttonText={login_prompt_btn ?? ''}
        onLoginPress={() => router.push('/(tabs)/profile')}
        paddingTop={insets.top}
        paddingBottom={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
        paddingHorizontal={16}
      />
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
        drawerTitle={drawer_title ?? ''}
        newChatLabel={new_chat_label ?? ''}
        pageData={pageData}
      />

      <Animated.View
        pointerEvents="box-none"
        style={[{ flex: 1 }, contentAnimatedStyle]}
      >
        <YStack flex={1} pt={insets.top} bg="$background">
          <Animated.View
            pointerEvents={drawerVisible ? 'auto' : 'none'}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 },
              backdropAnimatedStyle,
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
            borderBottomWidth={0.5}
            borderBottomColor="$gray4"
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
                {header_title ?? ''}
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
              emptyTitle={empty_title ?? ''}
              emptySubtitle={empty_subtitle ?? ''}
              tooltipMessageId={tooltipTarget?.message.id}
              onMessageLongPress={handleMessageLongPress}
              onRequestLocationPermission={requestLocationPermission}
              pageData={pageData}
            />
            <AiChatInput
              onSend={sendMessage}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              placeholder={input_placeholder ?? ''}
            />
          </YStack>

          <AiChatTooltip
            target={tooltipTarget}
            onClose={handleTooltipClose}
            copyLabel={pageData.tooltip_copy ?? ''}
          />
        </YStack>
      </Animated.View>
    </YStack>
  );
}
