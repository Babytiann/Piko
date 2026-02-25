import type { ReactElement } from 'react'
import { YStack, Text } from 'tamagui'

interface Props {
  title: string
  description: string
  buttonText: string
  onLoginPress: () => void
  /** Optional safe area / padding; e.g. from useSafeAreaInsets + tab bar height */
  paddingTop?: number
  paddingBottom?: number
  paddingHorizontal?: number
}

export default function AiChatLoginPrompt({
  title,
  description,
  buttonText,
  onLoginPress,
  paddingTop = 0,
  paddingBottom = 0,
  paddingHorizontal = 16,
}: Props): ReactElement {
  return (
    <YStack
      flex={1}
      bg="$background"
      pt={paddingTop}
      pb={paddingBottom}
      px={paddingHorizontal}
      gap="$4"
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <Text
        fontSize="$5"
        fontWeight="600"
        color="$color"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>
      <Text fontSize="$3" color="$gray11" style={{ textAlign: 'center' }}>
        {description}
      </Text>
      <YStack
        height={48}
        bg="$color"
        pressStyle={{ opacity: 0.8 }}
        onPress={onLoginPress}
        style={{
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 160,
        }}
      >
        <Text color="$background" fontWeight="600" fontSize="$3">
          {buttonText}
        </Text>
      </YStack>
    </YStack>
  )
}
