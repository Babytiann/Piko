import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import { useAiChat, useAiCopywriting } from '@/pages/ai-chat/hooks';
import AiChatMessageList from '@/pages/ai-chat/components/ai-chat-message-list';
import AiChatInput from '@/pages/ai-chat/components/ai-chat-input';

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
  const { messages, isStreaming, sendMessage, clearMessages } = useAiChat();
  const { copy } = useAiCopywriting();
  const bottomInset = useKeyboardBottomInset();

  return (
    <YStack flex={1} pt={insets.top} bg="$background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <XStack
        px="$4"
        py="$3"
        style={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          letterSpacing={-0.5}
        >
          {copy.headerTitle}
        </Text>

        <XStack gap="$3" style={{ alignItems: 'center' }}>
          {messages.length > 0 ? (
            <YStack
              pressStyle={{ opacity: 0.6 }}
              onPress={clearMessages}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color="#9BA1A6" />
            </YStack>
          ) : null}
          <YStack
            pressStyle={{ opacity: 0.6 }}
            onPress={() => router.push('/telegram-dialog')}
            hitSlop={8}
          >
            <Ionicons name="chatbubbles-outline" size={22} color="#9BA1A6" />
          </YStack>
        </XStack>
      </XStack>

      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <YStack flex={1} pb={bottomInset}>
          <AiChatMessageList
            messages={messages}
            contentPaddingBottom={16}
            emptyTitle={copy.emptyTitle}
            emptySubtitle={copy.emptySubtitle}
          />
          <AiChatInput
            onSend={sendMessage}
            disabled={isStreaming}
            placeholder={copy.inputPlaceholder}
          />
        </YStack>
      </Pressable>
    </YStack>
  );
}
