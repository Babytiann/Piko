import { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { YStack, XStack, Text, View } from "tamagui";
import { useAuth } from "@/hooks/use-auth";
import * as telegramApi from "@/services/telegram";
import type { Message } from "@/services/telegram";

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ message }: { message: Message }) {
  const isMe = message.isMe || message.isOutgoing;

  return (
    <YStack
      alignItems={isMe ? "flex-end" : "flex-start"}
      px="$3"
      py="$1"
    >
      <YStack
        maxWidth="80%"
        bg={isMe ? "$blue9" : "$gray4"}
        borderRadius="$4"
        px="$3"
        py="$2"
        borderBottomRightRadius={isMe ? "$1" : "$4"}
        borderBottomLeftRadius={isMe ? "$4" : "$1"}
      >
        {/* Sender name for group chats (non-self messages) */}
        {!isMe && message.senderName ? (
          <Text fontSize="$1" fontWeight="600" color={isMe ? "$blue3" : "$blue10"} mb="$1">
            {message.senderName}
          </Text>
        ) : null}

        {/* Message text */}
        {message.text ? (
          <Text
            fontSize="$3"
            color={isMe ? "white" : "$color"}
            lineHeight={20}
          >
            {message.text}
          </Text>
        ) : message.hasMedia ? (
          <Text fontSize="$2" color={isMe ? "$blue3" : "$gray10"} fontStyle="italic">
            [{message.mediaType ?? "Media"}]
          </Text>
        ) : null}

        {/* Time */}
        <Text
          fontSize={10}
          color={isMe ? "$blue4" : "$gray10"}
          textAlign="right"
          mt="$1"
        >
          {formatMessageTime(message.date)}
        </Text>
      </YStack>
    </YStack>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id, title, chatType, accessHash } = useLocalSearchParams<{
    id: string;
    title?: string;
    chatType?: string;
    accessHash?: string;
  }>();
  const navigation = useNavigation();
  const { session } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: title ?? "Chat",
    });
  }, [navigation, title]);

  const fetchMessages = useCallback(async () => {
    if (!session || !id) return;
    try {
      setError("");
      const result = await telegramApi.getMessages(session, id, chatType ?? "user", accessHash ?? "", 50);
      if (result.success) {
        // Messages come newest-first from the API, reverse for display
        setMessages(result.messages.reverse());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载消息失败");
    }
  }, [session, id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMessages();
      setLoading(false);
    })();
  }, [fetchMessages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !session || !id) return;

    setSending(true);
    setInputText("");
    try {
      const result = await telegramApi.sendMessage(session, id, chatType ?? "user", accessHash ?? "", text);
      if (result.success) {
        // Add the sent message to the list optimistically
        const newMsg: Message = {
          id: result.messageId,
          text,
          date: result.date,
          senderId: "",
          senderName: "",
          isOutgoing: true,
          isMe: true,
          replyToMsgId: null,
          hasMedia: false,
          mediaType: null,
        };
        setMessages((prev) => [...prev, newMsg]);
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
      // Restore input text on failure
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" bg="$background">
        <ActivityIndicator size="large" />
        <Text color="$gray11" mt="$3" fontSize="$2">
          加载消息...
        </Text>
      </YStack>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <YStack flex={1} bg="$background">
        {/* Error */}
        {error ? (
          <XStack bg="$red3" mx="$3" borderRadius="$3" px="$3" py="$2" mt="$2">
            <Text color="$red11" fontSize="$2">
              {error}
            </Text>
          </XStack>
        ) : null}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 8,
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <YStack flex={1} justifyContent="center" alignItems="center" py="$10">
              <Text color="$gray11" fontSize="$3">
                暂无消息
              </Text>
            </YStack>
          }
        />

        {/* Input Bar */}
        <View
          borderTopWidth={1}
          borderColor="$gray5"
          bg="$background"
          pb={insets.bottom}
        >
          <XStack px="$3" py="$2" gap="$2" alignItems="flex-end">
            <TextInput
              style={{
                flex: 1,
                minHeight: 36,
                maxHeight: 100,
                borderRadius: 18,
                backgroundColor: "rgba(128,128,128,0.1)",
                paddingHorizontal: 16,
                paddingVertical: 8,
                fontSize: 15,
              }}
              placeholder="输入消息..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="default"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || !inputText.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor:
                  inputText.trim() ? "#007AFF" : "rgba(128,128,128,0.2)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 0,
              }}
            >
              {sending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  color={inputText.trim() ? "white" : "$gray10"}
                  fontSize={18}
                  fontWeight="600"
                >
                  ↑
                </Text>
              )}
            </TouchableOpacity>
          </XStack>
        </View>
      </YStack>
    </KeyboardAvoidingView>
  );
}
