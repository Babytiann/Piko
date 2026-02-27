---
name: expo-skills
description: Enables and references Expo official AI skills in Cursor. Use when developing Expo or React Native apps, when the user asks about Expo Router, EAS, deployment, upgrading SDK, or when recommending Expo best practices. Guides adding expo/skills as a Cursor Remote Rule and lists available skills.
---

# Expo Skills（Cursor 集成）

本技能说明如何在 Cursor 中启用 [Expo 官方 AI Skills](https://github.com/expo/skills)，并在开发 Expo/React Native 时让 Agent 自动使用这些能力。

## 在 Cursor 中启用 Expo Skills

Expo skills 通过 **Remote Rule (GitHub)** 接入，接入后由 Cursor 自动发现并按场景使用。

**步骤：**

1. 打开 Cursor 设置：`Cmd+Shift+J`（macOS）或 `Ctrl+Shift+J`（Windows/Linux）
2. 进入 **Rules & Command** → **Project Rules** → **Add Rule** → **Remote Rule (GitHub)**
3. 填写：`https://github.com/expo/skills.git`

**说明：**

- Skills 不会出现在 `/` 斜杠命令菜单里；斜杠菜单对应的是 `.cursor/commands/` 下的自定义命令。
- Skills 通过描述与对话上下文自动匹配，当用户问 Expo 相关问题时，Agent 会自动加载对应 skill（如 building-ui、data-fetching、deployment）。

**验证：** 添加后可在对话中问例如：“How do I build a UI with Expo Router?”、“How do I make API calls in my Expo app?”、“How do I deploy my Expo app to the App Store?”。若回答明显引用 Expo 文档/最佳实践，说明 skills 已生效。

## 官方技能一览

| 插件                | 说明                                | 所含技能（部分）                                                                                                                                    |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **expo-app-design** | 用 Expo 构建稳健、高效的应用        | building-native-ui, native-data-fetching, expo-api-routes, expo-dev-client, expo-tailwind-setup, use-dom, expo-ui-swift-ui, expo-ui-jetpack-compose |
| **upgrading-expo**  | 升级 Expo SDK、处理依赖与破坏性变更 | 升级与迁移指南                                                                                                                                      |
| **expo-deployment** | 上架与发布                          | iOS App Store、Android Play Store、Web 托管、EAS、CI/CD 等                                                                                          |

当用户问题涉及 UI 搭建、数据请求、API 路由、开发客户端、Tailwind、部署、SDK 升级等时，若已添加上述 Remote Rule，Agent 应优先结合对应 Expo skill 作答。

## 与本项目

本项目（Piko）为 Expo/React Native 应用。若尚未在 Cursor 中添加 `https://github.com/expo/skills.git` 作为 Remote Rule，可提示用户按上文步骤添加，以便在编写/重构前端、配置 EAS、升级 Expo 时获得官方技能支持。

## 参考

- 仓库：<https://github.com/expo/skills>
- Cursor 安装说明：仓库 README 的 “Cursor” 小节
