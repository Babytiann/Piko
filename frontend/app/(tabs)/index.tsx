import { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Spacer } from "tamagui";
import { useAuth } from "@/hooks/use-auth";
import * as telegramApi from "@/services/telegram";
import type { Dialog } from "@/services/telegram";

const TAB_BAR_OFFSET = 56 + 16 + 16;

function formatTime(timestamp: number | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "昨天";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getAvatarColor(id: string): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];
  const index = Math.abs(parseInt(id, 10) || 0) % colors.length;
  return colors[index];
}

function DialogItem({
  dialog,
  onPress,
}: {
  dialog: Dialog;
  onPress: () => void;
}) {
  const initial = dialog.title.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(dialog.id);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dialogRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text color="white" fontSize={18} fontWeight="600">
            {initial}
          </Text>
        </View>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <View style={styles.rowBetween}>
            <Text
              fontSize="$4"
              fontWeight="600"
              color="$color"
              numberOfLines={1}
              flex={1}
              mr="$2"
            >
              {dialog.title}
            </Text>
            <Text fontSize="$1" color="$gray10">
              {formatTime(dialog.lastMessageDate)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text
              fontSize="$2"
              color="$gray11"
              numberOfLines={1}
              flex={1}
              mr="$2"
            >
              {dialog.lastMessage || "..."}
            </Text>
            {dialog.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text color="white" fontSize={11} fontWeight="700">
                  {dialog.unreadCount > 99 ? "99+" : dialog.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </YStack>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();

  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDialogs = useCallback(async () => {
    if (!session) return;
    try {
      setError("");
      const result = await telegramApi.getDialogs(session, 50);
      if (result.success) {
        setDialogs(result.dialogs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载对话列表失败");
    }
  }, [session]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchDialogs();
      setLoading(false);
    })();
  }, [fetchDialogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDialogs();
    setRefreshing(false);
  }, [fetchDialogs]);

  const handleDialogPress = (dialog: Dialog) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: dialog.id,
        title: dialog.title,
        chatType: dialog.type,
        accessHash: dialog.accessHash,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text color="$gray11" mt="$3" fontSize="$2">
          加载对话列表...
        </Text>
      </View>
    );
  }

  return (
    <YStack flex={1} pt={insets.top} bg="$background">
      {/* Header */}
      <XStack px="$4" py="$3">
        <Text fontSize="$7" fontWeight="700" color="$color" letterSpacing={-0.5}>
          消息
        </Text>
        <Spacer flex={1} />
      </XStack>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text color="$red11" fontSize="$2">
            {error}
          </Text>
        </View>
      ) : null}

      {/* Dialog List */}
      <FlatList
        data={dialogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DialogItem dialog={item} onPress={() => handleDialogPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_OFFSET,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text color="$gray11" fontSize="$3">
              暂无对话
            </Text>
          </View>
        }
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  dialogRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: "rgba(255,0,0,0.1)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});
