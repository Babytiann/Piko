import { useState, type ReactNode } from 'react';
import { ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { PikoCard } from '@/common/components/piko-card';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Piko 是什么？',
    answer:
      'Piko 是一款集 AI 对话、消费记录、预算管理于一体的个人助手应用。你可以通过拍照识别账单、与 AI 聊天、绑定 Telegram 接收提醒。',
  },
  {
    question: '如何绑定 Telegram？',
    answer:
      '在「个人主页」中点击「关联账号」下的 Telegram 区域，按提示完成登录与绑定。绑定后可在「Telegram 绑定」页管理或解绑。',
  },
  {
    question: '消费记录从哪里来？',
    answer:
      '支持拍照识别、相册选图、手动录入，以及从 Telegram 对话中导入。在首页可查看汇总，在「消费详情」中可编辑或删除单条记录。',
  },
  {
    question: '如何设置预算？',
    answer:
      '在首页预算卡片中可设置月预算，系统会按周均分。若尚未设置，会引导你进入「预算设置」页填写。',
  },
  {
    question: '数据会同步吗？',
    answer:
      '消费、预算、AI 对话等数据保存在云端，与你的账号绑定。更换设备后登录同一账号即可看到数据。',
  },
  {
    question: '如何删除账号？',
    answer:
      '在「个人主页」进入「隐私与安全」，底部有「删除账号」。删除后账号及全部数据将永久清除且无法恢复。',
  },
];

export default function HelpCenterScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={padding}
        showsVerticalScrollIndicator={false}
      >
        <XStack px="$4" py="$3" gap="$2" style={{ alignItems: 'center' }}>
          <XStack
            style={{ paddingVertical: 8, paddingRight: 8 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.color.val} />
          </XStack>
          <Text fontSize="$6" fontWeight="700" color="$color">
            帮助中心
          </Text>
        </XStack>

        <YStack px="$4" gap="$2" pt="$2">
          <PikoCard noPadding>
            {FAQ_ITEMS.map((item, i) => (
              <XStack
                key={i}
                flexDirection="column"
                borderBottomWidth={i < FAQ_ITEMS.length - 1 ? 0.5 : 0}
                borderBottomColor="$gray4"
              >
                <XStack
                  py="$3"
                  px="$4"
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => toggle(i)}
                >
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$color"
                    flex={1}
                    numberOfLines={openIndex === i ? undefined : 2}
                  >
                    {item.question}
                  </Text>
                  <Ionicons
                    name={openIndex === i ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.muted.val}
                  />
                </XStack>
                {openIndex === i ? (
                  <XStack px="$4" pb="$3">
                    <Text fontSize="$3" color="$gray12" lineHeight={22}>
                      {item.answer}
                    </Text>
                  </XStack>
                ) : null}
              </XStack>
            ))}
          </PikoCard>

          <XStack
            py="$4"
            style={{ alignItems: 'center', justifyContent: 'center' }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => router.push('/contact-us')}
          >
            <Text fontSize="$4" fontWeight="600" color="$color">
              未找到答案？联系我们
            </Text>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
