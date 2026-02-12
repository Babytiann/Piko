import { TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';

export enum PageErrorType {
  /** 通用错误 */
  DEFAULT = 1,
  /** 网络连接异常 */
  NETWORK,
  /** 空数据 */
  EMPTY,
  /** 服务不可用 */
  UNAVAILABLE,
}

/** 保留以兼容旧引用 */
export enum PageStatusEnum {
  ERROR = 1,
  EMPTY,
  UNAVAILABLE,
}

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
  errorType?: PageErrorType;
}

const ERROR_TITLE: Record<PageErrorType, string> = {
  [PageErrorType.DEFAULT]: '出错了',
  [PageErrorType.NETWORK]: '网络连接异常',
  [PageErrorType.EMPTY]: '暂无数据',
  [PageErrorType.UNAVAILABLE]: '服务不可用',
};

export default function PageError({
  message,
  onRetry,
  errorType = PageErrorType.DEFAULT,
}: PageErrorProps) {
  return (
    <YStack
      flex={1}
      bg="$background"
      px="$4"
      justifyContent="center"
      alignItems="center"
    >
      <Text color="$gray11" fontSize="$5" fontWeight="600" textAlign="center">
        {ERROR_TITLE[errorType]}
      </Text>

      {message ? (
        <Text
          color="$gray10"
          fontSize="$3"
          mt="$2"
          textAlign="center"
          lineHeight={20}
        >
          {message}
        </Text>
      ) : null}

      {onRetry ? (
        <TouchableOpacity
          className="mt-6 h-11 px-8 rounded-[22px] bg-black justify-center items-center"
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text color="white" fontWeight="600" fontSize="$3">
            重试
          </Text>
        </TouchableOpacity>
      ) : null}
    </YStack>
  );
}
