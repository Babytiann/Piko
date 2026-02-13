# Piko 开发手册

欢迎来到 Piko 项目！这是一份面向新手的完整开发指南，按照步骤一步步来就能跑起来。

---

## 项目简介

Piko 是一个前后端分离的项目：

| 目录        | 说明         | 技术栈              |
| ----------- | ------------ | ------------------- |
| `frontend/` | 前端移动应用 | Expo / React Native |
| `backend/`  | 后端服务     | Next.js             |

---

## 在开始之前

请确保你的电脑上已经安装了以下工具。如果没有，请点击链接按照官方教程安装。

### 1. Node.js（必须 >= 18）

去官网下载安装即可：https://nodejs.org/

安装完成后，打开终端（Mac 上叫"终端"，Windows 上叫"命令提示符"或"PowerShell"）验证：

```bash
node -v
# 应该输出类似 v18.x.x 或 v20.x.x 的版本号
```

### 2. pnpm（后端用）

在终端执行以下命令安装：

```bash
npm install -g pnpm
```

验证安装：

```bash
pnpm -v
# 应该输出版本号，比如 9.15.0
```

### 3. Yarn（前端用）

在终端执行以下命令启用 Yarn：

```bash
corepack enable
```

> **什么是 corepack？**  
> 它是 Node.js 自带的工具，可以帮你自动管理 yarn / pnpm 的版本，不需要单独安装 Yarn。

验证安装：

```bash
yarn -v
# 应该输出版本号
```

### 4. Xcode（如果要跑 iOS 模拟器）

- 从 Mac App Store 安装 Xcode
- 打开 Xcode，同意许可协议，等它安装完组件
- 安装 Xcode Command Line Tools：

```bash
xcode-select --install
```

### 5. 代码编辑器

推荐使用 [Cursor](https://cursor.com/) 或 [VS Code](https://code.visualstudio.com/)。

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

#### 2.2 启动开发服务器

```bash
pnpm dev
```

看到类似下面的输出就说明后端启动成功了：

```
▲ Next.js 16.x.x
- Local:   http://localhost:3000
✓ Ready in xxxms
```

> **小提示：**
>
> - 后端默认运行在 `http://localhost:3000`
> - 这个终端窗口不要关！关了后端就停了
> - 想停止的话，按 `Ctrl + C`

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

> 第一次运行可能会比较慢，耐心等待。安装完成后同样会出现 `node_modules/` 文件夹。

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

> **推荐新手先按 `i`（iOS 模拟器）** ，因为 Mac 上配置最简单。  
> 如果没有装 Xcode，可以按 `w` 先在浏览器里看看效果。

你也可以跳过 `yarn start`，直接用以下命令一步到位：

```bash
# 直接在 iOS 模拟器上运行
yarn ios

# 直接在安卓模拟器上运行
yarn android

# 直接在浏览器中运行
yarn web
```

---

## 日常开发流程

每次开始写代码前，你需要：

1. 打开一个终端 → `cd backend` → `pnpm dev` （启动后端）
2. 打开另一个终端 → `cd frontend` → `yarn start` （启动前端）
3. 打开编辑器，开始写代码
4. 改完代码保存，页面会**自动刷新**（热更新）

---

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

---

## 项目结构一览

```
Piko/
├── backend/          # 后端代码（Next.js）
├── frontend/         # 前端代码（Expo / React Native）
├── ios/              # iOS 原生配置
├── package.json      # 根目录配置
├── pnpm-lock.yaml    # 依赖锁定文件
└── README.md         # 就是你正在看的这个文件
```

---

## 速查表

| 操作           | 命令           | 在哪里执行       |
| -------------- | -------------- | ---------------- |
| 安装后端依赖   | `pnpm install` | `backend/` 目录  |
| 启动后端       | `pnpm dev`     | `backend/` 目录  |
| 构建后端       | `pnpm build`   | `backend/` 目录  |
| 安装前端依赖   | `yarn install` | `frontend/` 目录 |
| 启动前端       | `yarn start`   | `frontend/` 目录 |
| 前端跑 iOS     | `yarn ios`     | `frontend/` 目录 |
| 前端跑 Android | `yarn android` | `frontend/` 目录 |
| 前端跑浏览器   | `yarn web`     | `frontend/` 目录 |
