import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack, Text, Spacer } from "tamagui";
import { useAuth } from "@/hooks/use-auth";
import * as telegramApi from "@/services/telegram";

type Step = "phone" | "code" | "2fa" | "signup";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [password, setPassword] = useState("");
  const [tempSession, setTempSession] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("请输入手机号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await telegramApi.sendCode(phoneNumber);
      setPhoneCodeHash(result.phoneCodeHash);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!phoneCode.trim()) {
      setError("请输入验证码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await telegramApi.signIn(
        phoneNumber,
        phoneCode,
        phoneCodeHash
      );

      if (result.require2FA) {
        setTempSession(result.session ?? "");
        setStep("2fa");
        return;
      }

      if (result.requireSignUp) {
        setStep("signup");
        return;
      }

      if (result.success && result.session && result.user) {
        await login(result.session, result.user);
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPassword = async () => {
    if (!password.trim()) {
      setError("请输入两步验证密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await telegramApi.checkPassword(tempSession, password);
      if (result.success) {
        await login(result.session, result.user);
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!firstName.trim()) {
      setError("请输入名字");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await telegramApi.signUp(
        phoneNumber,
        phoneCodeHash,
        firstName,
        lastName
      );
      if (result.success) {
        await login(result.session, result.user);
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <YStack
        flex={1}
        pt={insets.top + 40}
        pb={insets.bottom + 20}
        px="$6"
        bg="$background"
      >
        {/* Header */}
        <View style={styles.headerCenter}>
          <Text fontSize={32} fontWeight="800" color="$color" letterSpacing={-1}>
            Piko
          </Text>
          <Text fontSize="$3" color="$gray11" mt="$2">
            {step === "phone" && "输入你的手机号以连接 Telegram"}
            {step === "code" && "输入你收到的验证码"}
            {step === "2fa" && "输入你的两步验证密码"}
            {step === "signup" && "创建你的 Telegram 账号"}
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text color="$red11" fontSize="$2">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Step: Phone Number */}
        {step === "phone" && (
          <YStack gap="$3">
            <TextInput
              style={styles.input}
              placeholder="+86 13800138000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text color="white" fontWeight="600" fontSize="$4">
                  发送验证码
                </Text>
              )}
            </TouchableOpacity>
          </YStack>
        )}

        {/* Step: Verification Code */}
        {step === "code" && (
          <YStack gap="$3">
            <Text fontSize="$2" color="$gray11">
              验证码已发送至 {phoneNumber}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="输入验证码"
              value={phoneCode}
              onChangeText={setPhoneCode}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text color="white" fontWeight="600" fontSize="$4">
                  验证登录
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStep("phone");
                setError("");
              }}
              style={styles.linkButton}
            >
              <Text color="$gray11" fontSize="$2">
                返回修改手机号
              </Text>
            </TouchableOpacity>
          </YStack>
        )}

        {/* Step: 2FA Password */}
        {step === "2fa" && (
          <YStack gap="$3">
            <TextInput
              style={styles.input}
              placeholder="两步验证密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCheckPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text color="white" fontWeight="600" fontSize="$4">
                  确认密码
                </Text>
              )}
            </TouchableOpacity>
          </YStack>
        )}

        {/* Step: Sign Up */}
        {step === "signup" && (
          <YStack gap="$3">
            <Text fontSize="$2" color="$gray11">
              此手机号尚未注册，请填写基本信息：
            </Text>
            <TextInput
              style={styles.input}
              placeholder="名字（必填）"
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="姓氏（选填）"
              value={lastName}
              onChangeText={setLastName}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text color="white" fontWeight="600" fontSize="$4">
                  注册
                </Text>
              )}
            </TouchableOpacity>
          </YStack>
        )}

        <Spacer flex={1} />
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: "center",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
