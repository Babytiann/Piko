/**
 * 绑定成功后，在后台预热用户头像和信息缓存。
 * 调用方以 fire-and-forget 方式调用，不阻塞响应。
 */
import { getUserInfo } from './user-info';
import { getProfilePhoto } from './photo';

/**
 * 并行预取 getMe() 和头像，结果写入各自的内存缓存。
 * 错误静默忽略，不影响主流程。
 */
export function prefetchUserProfile(session: string): void {
  // 必须串行：两个函数共用同一个 GramJS client 实例，并发调用会导致 libuv 崩溃
  void getUserInfo(session)
    .then((info) => (info.hasPhoto ? getProfilePhoto(session) : null))
    .catch(() => {
      // 预热失败不影响用户，静默忽略
    });
}
