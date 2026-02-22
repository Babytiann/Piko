import type { NextRequest } from 'next/server';

/**
 * 默认 Mock 用户 ID。
 * 数据库 seed 时需要预先创建这个用户记录。
 */
const MOCK_USER_ID = 'mock-user-001';

/**
 * 从请求中提取用户 ID。
 *
 * **Mock 阶段**（当前）：
 *   从 `X-Mock-User-Id` header 读取，无则返回默认 `mock-user-001`。
 *
 * **Apple Sign In 接入后**（TODO）：
 *   从 `Authorization: Bearer <jwt>` 解析真实 userId。
 *   切换时只需修改此函数，所有路由自动生效。
 */
export function getUserId(request: NextRequest): string {
  // TODO: Apple Sign In 接入后替换为 JWT 解析
  // const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  // if (!token) throw new AuthError('Missing authorization token');
  // const payload = await verifyJwt(token);
  // return payload.userId;

  return request.headers.get('X-Mock-User-Id') ?? MOCK_USER_ID;
}
