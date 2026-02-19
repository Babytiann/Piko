import type { ReactNode } from 'react';
import { ActionSheetIOS, Platform, Alert, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import type { MessageItem } from '@/common/typings/chat';

interface ChatDetailContextMenuProps {
  message: MessageItem;
  onReply: (message: MessageItem) => void;
  children: ReactNode;
}

export default function ChatDetailContextMenu({
  message,
  onReply,
  children,
}: ChatDetailContextMenuProps): ReactNode {
  const handleLongPress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const hasText = !!message.text;
    const options = [...(hasText ? ['复制'] : []), '回复', '取消'];
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (buttonIndex) => {
          if (hasText && buttonIndex === 0) {
            void Clipboard.setStringAsync(message.text);
          } else if (buttonIndex === (hasText ? 1 : 0)) {
            onReply(message);
          }
        },
      );
    } else {
      const buttons = [
        ...(hasText
          ? [
              {
                text: '复制',
                onPress: () => void Clipboard.setStringAsync(message.text),
              },
            ]
          : []),
        { text: '回复', onPress: () => onReply(message) },
        { text: '取消', style: 'cancel' as const },
      ];
      Alert.alert('消息操作', undefined, buttons);
    }
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
    >
      {children}
    </Pressable>
  );
}
