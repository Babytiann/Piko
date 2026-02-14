import type { ApiResponse } from '@/common/typings/api';

export enum PageErrorType {
  /** 通用错误 */
  DEFAULT = 1,
  /** 网络连接异常 */
  NETWORK,
  /** 空数据 */
  EMPTY,
  /** 服务不可用 */
  UNAVAILABLE,
  /** 鉴权失效（如 Telegram session 过期） */
  AUTH,
}

export const getPageErrorType = <T>(
  response: ApiResponse<T>,
): PageErrorType | undefined => {
  if (!response.success) {
    if (response.errorCode === 'AUTH_EXPIRED') return PageErrorType.AUTH;
    return PageErrorType.NETWORK;
  }
  return undefined;
};
