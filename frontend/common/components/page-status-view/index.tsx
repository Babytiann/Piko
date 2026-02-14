import type { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';

import { PageErrorType } from './utils';

export { PageErrorType, getPageErrorType } from './utils';

interface Props {
  message?: string;
  onRetry?: () => void;
  errorType?: PageErrorType;
}

const ERROR_TITLE: Record<PageErrorType, string> = {
  [PageErrorType.DEFAULT]: '出错了',
  [PageErrorType.NETWORK]: '网络连接异常',
  [PageErrorType.EMPTY]: '暂无数据',
  [PageErrorType.UNAVAILABLE]: '服务不可用',
  [PageErrorType.AUTH]: '登录已失效',
};

export default function PageStatusView({
  message,
  onRetry,
  errorType = PageErrorType.DEFAULT,
}: Props): ReactNode {
  return (
    <YStack
      flex={1}
      bg="$background"
      px="$4"
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <Text
        color="$gray11"
        fontSize="$5"
        fontWeight="600"
        style={{ textAlign: 'center' }}
      >
        {ERROR_TITLE[errorType]}
      </Text>

      {message ? (
        <Text
          color="$gray10"
          fontSize="$3"
          mt="$2"
          lineHeight={20}
          style={{ textAlign: 'center' }}
        >
          {message}
        </Text>
      ) : null}

      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          style={{
            marginTop: 24,
            height: 44,
            paddingHorizontal: 32,
            borderRadius: 22,
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text color="white" fontWeight="600" fontSize="$3">
            重试
          </Text>
        </TouchableOpacity>
      ) : null}
    </YStack>
  );
}
