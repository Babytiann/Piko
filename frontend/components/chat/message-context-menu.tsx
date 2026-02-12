import { useCallback } from 'react';
import {
  ActionSheetIOS,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { MessageItem } from '@/types/chat';

interface MessageContextMenuProps {
  message: MessageItem;
  onReply: (message: MessageItem) => void;
  children: React.ReactNode;
}

/**
 * Wraps a message bubble and provides a long-press context menu with
 * "Copy" and "Reply" actions. Uses ActionSheetIOS on iOS and a fallback
 * Alert on Android.
 */
export default function MessageContextMenu({
  message,
  onReply,
  children,
}: MessageContextMenuProps) {
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const hasText = !!message.text;
    const options = [...(hasText ? ['复制'] : []), '回复', '取消'];
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (buttonIndex) => {
          if (hasText && buttonIndex === 0) {
            Clipboard.setStringAsync(message.text);
          } else if (buttonIndex === (hasText ? 1 : 0)) {
            onReply(message);
          }
        },
      );
    } else {
      // Android fallback using Alert
      const buttons = [
        ...(hasText
          ? [
              {
                text: '复制',
                onPress: () => Clipboard.setStringAsync(message.text),
              },
            ]
          : []),
        { text: '回复', onPress: () => onReply(message) },
        { text: '取消', style: 'cancel' as const },
      ];
      Alert.alert('消息操作', undefined, buttons);
    }
  }, [message, onReply]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={handleLongPress}
      delayLongPress={300}
    >
      {children}
    </TouchableOpacity>
  );
}
