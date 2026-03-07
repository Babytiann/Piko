# Piko

---

## 项目简介

Piko 是一个前后端分离的项目：

| 目录        | 说明         | 技术栈              |
| ----------- | ------------ | ------------------- |
| `frontend/` | 前端移动应用 | Expo / React Native |
| `backend/`  | 后端服务     | Hono（Vercel 部署） |

---

## 快速开始

### 第一步：克隆项目

```bash
git clone <仓库地址>
cd Piko
```

> 如果你已经有了项目代码，直接 `cd` 到项目根目录即可。

---

### 第二步：启动后端 (backend)

打开一个**新的终端窗口**，进入 `backend` 目录：

```bash
cd backend
```

#### 2.1 安装依赖

```bash
pnpm install
```

> **什么是"安装依赖"？**  
> 项目运行需要很多第三方库（别人写好的代码），这条命令会把它们全部下载到本地。  
> 安装完成后你会看到 `backend/node_modules/` 文件夹出现，那就是下载好的依赖。

#### 2.2 配置环境变量

将 `backend/.env.example` 复制为 `backend/.env`，按注释填写必填项（如 `DATABASE_URL`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`）。其他变量按需填写，不用的可以留空或注释掉。

```bash
# 在 backend 目录下（Windows 可用 copy，Mac/Linux 用 cp）
copy .env.example .env   # Windows
# cp .env.example .env   # Mac / Linux
```

#### 2.3 启动开发服务器

确保已安装并登录 Vercel CLI（见上文「在开始之前」），在 `backend/` 目录下执行：

```bash
vercel dev
```

---

### 第三步：启动前端 (frontend)

打开**另一个新的终端窗口**（不要关后端那个），进入 `frontend` 目录：

```bash
cd frontend
```

#### 3.1 安装依赖

```bash
yarn install
```

#### 3.2 启动开发服务器

```bash
yarn start
```

启动后你会看到一个二维码和一些选项：

```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web
```

#### 3.3 选择运行平台

根据你的需要，按对应的键：

- **按 `i`** — 在 iOS 模拟器上运行（需要 Mac + Xcode）
- **按 `a`** — 在安卓模拟器上运行（需要 Android Studio）
- **按 `w`** — 在浏览器中运行

你也可以跳过 `yarn start`，直接用以下命令一步到位：

```bash
# 直接在 iOS 模拟器上运行
yarn ios

# 直接在安卓模拟器上运行
yarn android

# 直接在浏览器中运行
yarn web
```

## 常见问题

### Q: 安装依赖报错了怎么办？

试试删掉 `node_modules` 重新安装：

```bash
# 在对应目录下执行
rm -rf node_modules
pnpm install   # 后端
# 或
yarn install   # 前端
```

### Q: 端口被占用怎么办？

如果看到 "Port 3000 is already in use" 之类的错误，说明有别的程序占了这个端口。可以找到并关掉它：

```bash
# 查看哪个进程占用了 3000 端口
lsof -i :3000
# 关掉它（把 <PID> 换成上面查到的进程号）
kill -9 <PID>
```

### Q: 前端改了代码没反应？

试试按 `r` 重新加载，或者关掉重新 `yarn start`。

### Q: git 提交代码时格式自动变了？

这是正常的！项目配置了 Prettier 自动格式化，提交时会自动帮你美化代码风格，不用担心。

### Q: 环境变量从哪里看？

复制 `backend/.env.example` 为 `backend/.env` 并按注释填写。必填项通常包括 `DATABASE_URL`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`，其余按需配置。

---

## 项目结构一览

```
Piko/
├── backend/          # 后端代码（Hono，部署于 Vercel）
│   └── .env.example  # 环境变量示例，复制为 .env 后填写（.env 不提交）
├── frontend/         # 前端代码（Expo / React Native）
├── ios/              # iOS 原生配置
├── package.json      # 根目录配置
├── pnpm-lock.yaml    # 依赖锁定文件
└── README.md         # 就是你正在看的这个文件
```

---

## 速查表

| 操作             | 命令                                | 在哪里执行       |
| ---------------- | ----------------------------------- | ---------------- |
| 配置后端环境变量 | 复制 `.env.example` → `.env` 并填写 | `backend/` 目录  |
| 安装后端依赖     | `pnpm install`                      | `backend/` 目录  |
| 启动后端         | `vercel dev`                        | `backend/` 目录  |
| 构建后端         | `pnpm build`                        | `backend/` 目录  |
| 安装前端依赖     | `yarn install`                      | `frontend/` 目录 |
| 启动前端         | `yarn start`                        | `frontend/` 目录 |
| 前端跑 iOS       | `yarn ios`                          | `frontend/` 目录 |
| 前端跑 Android   | `yarn android`                      | `frontend/` 目录 |
| 前端跑浏览器     | `yarn web`                          | `frontend/` 目录 |
