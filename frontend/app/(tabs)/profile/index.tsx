import { TouchableOpacity, StyleSheet, Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Spacer } from "tamagui";
import { useAuth } from "@/hooks/use-auth";

const TAB_BAR_OFFSET = 56 + 16 + 16;

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  const handleBindTelegram = () => {
    router.push("/telegram_login");
  };

  const handleUnbind = () => {
    Alert.alert("解除绑定", "确定要解除 Telegram 账号绑定吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <YStack
      flex={1}
      pt={insets.top}
      pb={insets.bottom + TAB_BAR_OFFSET}
      bg="$background"
    >
      {/* Header */}
      <XStack px="$4" py="$3">
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          letterSpacing={-0.5}
        >
          个人中心
        </Text>
        <Spacer flex={1} />
      </XStack>

      <YStack px="$4" gap="$4" flex={1}>
        {/* Telegram Binding Section */}
        <YStack
          bg="$gray2"
          borderRadius="$4"
          p="$4"
          gap="$3"
        >
          <Text fontSize="$4" fontWeight="600" color="$color">
            Telegram 账号
          </Text>

          {isLoggedIn && user ? (
            <>
              {/* User Info */}
              <XStack gap="$3" items="center">
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: getAvatarColor(user.id) },
                  ]}
                >
                  <Text color="white" fontSize={20} fontWeight="600">
                    {(user.firstName || user.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <YStack flex={1} gap="$1">
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      "未知用户"}
                  </Text>
                  {user.username ? (
                    <Text fontSize="$2" color="$gray11">
                      @{user.username}
                    </Text>
                  ) : null}
                  {user.phone ? (
                    <Text fontSize="$2" color="$gray11">
                      {user.phone}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>

              {/* Unbind Button */}
              <TouchableOpacity
                style={styles.unbindButton}
                onPress={handleUnbind}
                activeOpacity={0.8}
              >
                <Text color="#FF3B30" fontWeight="600" fontSize="$3">
                  解除绑定
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text fontSize="$2" color="$gray11">
                绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。
              </Text>
              <TouchableOpacity
                style={styles.bindButton}
                onPress={handleBindTelegram}
                activeOpacity={0.8}
              >
                <Text color="white" fontWeight="600" fontSize="$3">
                  绑定 Telegram 账号
                </Text>
              </TouchableOpacity>
            </>
          )}
        </YStack>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  bindButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  unbindButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,59,48,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
