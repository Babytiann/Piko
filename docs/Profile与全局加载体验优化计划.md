# Profile 页与全局加载体验优化计划

---

## 问题 1：为什么用户没登录，其他组件就不显示？

### 原因（当前逻辑）

- 在 `frontend/app/(tabs)/profile/index.tsx` 里，是否展示「有数据的内容」由 `hasAppSession`（Better Auth 的 Apple 登录态）和 `data`（Profile 接口返回）共同决定：
  - `showProfileData = hasAppSession && data && !errorType`
  - `ProfileSettingsSection` 仅在 `hasAppSession && data` 时渲染
  - 退出登录按钮仅在 `hasAppSession` 时渲染
- **Telegram 关联卡片**：未登录时 `telegramSectionData` 为 null，因此渲染的是写死的「登录后可在此绑定 Telegram」占位块，而不是接口返回的 Telegram 区块。
- 未登录时 Profile 接口仍会请求（`useProfileData(session)` 的 session 来自 useAuth 的 Telegram session，且后端会因无 Apple 登录返回 401），但页面有意不展示「个人化」内容，只展示 Apple 登录区 + 关联账号占位，所以看起来「其他组件都不显示」是**按当前产品逻辑实现的**，不是 bug。

### 可选方向（若需调整）

- 若希望未登录时也展示更多内容（例如仍展示设置入口、但点击时引导登录），需要在计划中明确：未登录时哪些区块要显示、哪些要隐藏或替换为引导登录。

---

## 问题 2：Profile 页的 loading 为什么不显示？

### 原因

- 全屏的「Profile 页 loading」**当前没有实现**。现有逻辑是：
  - **仅**在「已登录 + Profile 接口在请求中」时，在**中间 Telegram 区块**的位置显示 `PageLoading`（见 profile index 第 128–131 行）。
  - 未登录时：条件 `hasAppSession && isLoading` 不成立，因此**从不**显示这段 loading。
  - 整页没有「首屏 loading」：标题和 Apple 区块会直接渲染，Apple 区块内部用 `authClient.useSession()` 的 `isPending` 只显示文案「加载中…」，没有全页骨架或转圈。
- 因此会出现：进入 Profile 时要么直接看到静态内容，要么只看到 Apple 卡片里的一行「加载中…」，而**没有**整页的 loading 状态。

### 建议

- 在 Profile 页增加**整页 loading** 的明确时机与 UI（例如：`authClient.useSession()` 的 `isPending === true` 时，或「已登录且 useProfileData 的 `isLoading === true` 且尚无 data」时），使用现有的 `PageLoading` 或与首页一致的骨架，避免「看起来没在加载」的体验。

---

## 问题 3：为什么 Apple 登录组件和下面组件不是同一个接口？上面加载完了下面还在加载？

### 原因：两套独立数据源，请求时机不同

| 区块                                | 数据来源                                                                             | 说明                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple 登录区                        | `authClient.useSession()`（Better Auth，通常来自 Cookie/本地）                       | ProfileAppleSection 内部用 `authClient.useSession()`，有 isPending 时显示「加载中…」。Session 常来自缓存，所以会较快。                          |
| 下方（Telegram 关联、设置、退出等） | `useProfileData(session)` → `fetchProfilePage` → 后端 `POST /piko/profile/detail/v1` | useProfileData 依赖 useAuth() 的 session，请求后端聚合 copy + Telegram 绑定信息等。后端可能查 DB、调 Telegram getMe/getProfilePhoto，耗时更长。 |

因此会出现：Apple 区块很快显示，而下方的 Telegram/设置等要等 Profile 接口返回后才出现，看起来就像「上面好了下面还在加载」。

### 采用方案：合并为一套接口（方案 A）

- **后端**在 `profile/detail/v1` 中同时返回「当前用户是否已 Apple 登录」及基础用户信息（或约定用现有 user 字段表达）。
- **前端**用这一份数据驱动 Apple 区块 + 下方区块，loading 状态统一为「等 Profile 接口」，不再用 `authClient.useSession()` 单独驱动 Apple 区块。
- 符合 PRD「首屏单接口」原则。

---

## 问题 5：删除底部的版本、UID、DID

- **位置**：`frontend/app/(tabs)/profile/index.tsx` 第 171–183 行的 `YStack`（`copy.footer.versionLabel`、`uidLabel`、`didLabel`）。
- **操作**：删除该整块 `YStack`；若仅用于该处，可在 consts 中一并精简 footer copy。
- 若后端 `backend/lib/services/profile.ts` 的 `PROFILE_COPY.footer` 仅用于此处，可同时在 copy 类型与默认 copy 里移除 `footer` 相关字段，保持类型与实现一致。

---

## 问题 6：为什么整个 App 接口慢？与参考仓库的请求方式

### 6.1 可能慢的原因（本仓库）

- 后端耗时：Profile 接口会做 DB 查询 + 可能调用 Telegram getMe/getProfilePhoto，若未命中缓存或网络慢，耗时会明显。
- 前端串行/依赖：Profile 依赖 useAuth() 的 session 稳定后才用「正确」的 session 调 fetchProfilePage；AI 页的 useAiCopywriting() 在挂载时才请求。
- 无缓存：每次进入 Tab 或重新 focus 都会重新请求。
- Expo Router Tabs 下 Home、AI、Profile 的 useEffect 会同时跑，但用户先感知「首页在加载」，切到其他 Tab 时若没有缓存会再次等待。

### 6.2 参考仓库 poi-reactlynx-next-rs 的请求方式

- 单页单 hook、一次请求：`useFetchData` 在页面内用 `useState` + `useEffect`，在 `useEffect(() => { void fetcher(); }, []);` 里发一次请求，用 `isPageLoading` 控制整页 loading（PageLoading 全屏展示），没有做跨页预取。
- **结论**：参考仓库是「进页即请求、整页 loading」。与参考仓库保持一致，**不做**跨 Tab 预取、**不引入**前端预取/缓存（方案 1/2/3 均不实施）。

### 6.3 缓存

- **暂不实施**。后续若做后端缓存（如首页/AI 文案、Profile copy），可参考 `docs/PRD-first-screen-and-cache.md`；部署到 Vercel 时建议用 Upstash Redis。

---

## 实施顺序

1. **删除底部版本、UID、DID**（改动小、立刻生效）。
2. **Profile 页增加整页 loading**（明确「加载中」状态）。
3. **统一 Apple 与下方区块**：按方案 A 合并为一套接口，后端 `profile/detail/v1` 返回 Apple 登录态 + 用户信息 + copy，前端仅用该接口驱动首屏。

如你确认「未登录时是否要展示更多组件」，可再细化对应展示规则。
