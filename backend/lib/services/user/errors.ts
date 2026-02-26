/** 该 Telegram 已被其他账号绑定时抛出，便于路由返回 409 */
export class TelegramAlreadyBoundError extends Error {
  constructor() {
    super('该 Telegram 已被其他账号绑定，请先在对应账号解绑后再绑定到当前账号');
    this.name = 'TelegramAlreadyBoundError';
  }
}
