# Piko

Monorepo，使用 pnpm workspaces 管理。

## 结构

- **backend** — Next.js 应用
- **frontend** — Expo / React Native 应用

## 开发

```bash
# 安装依赖（在仓库根目录）
pnpm install

# 同时启动 backend 和 frontend
pnpm dev

# 仅启动某一端
pnpm dev:backend
pnpm dev:frontend

# 构建 backend
pnpm build
pnpm build:backend

# 所有子项目 lint
pnpm lint
```

## Git

仓库根目录为唯一 Git 根目录，`backend/` 与 `frontend/` 为普通目录（非子模块）。根目录提交 `pnpm-lock.yaml` 以保证依赖一致。
