# Piko Backend

Next.js 后端 API 服务。

## 运行

在仓库根目录（或 `backend` 目录下）执行：

```bash
# 在仓库根目录
pnpm --filter backend dev

# 或在 backend 目录下
cd backend && pnpm dev
```

服务默认在 **http://localhost:3000**。

- 根路径 http://localhost:3000 可查看接口列表
- **GET** http://localhost:3000/piko/homepage/summary/v1 — 首页数据

## 生产

```bash
pnpm --filter backend build
pnpm --filter backend start
```
