# 硬度日记 (Hardness Diary)

**硬度日记** 是一款专为男性设计的隐私优先、数据驱动的健康追踪应用。

## 📚 文档指南

*   **[📖 用户使用手册 (User Manual)](USER_MANUAL.md)**: 面向用户的功能介绍、隐私说明及常见问题解答。
*   **[🛠️ 开发者手册 (Developer Manual)](DEVELOPER_MANUAL.md)**: 面向开发者的架构说明、数据模型及迁移指南。

## 主要功能

*   **核心追踪**: 记录晨勃硬度、维持时间、睡眠质量。
*   **性爱日记**: 详细记录性生活（多伴侣、多阶段、角色扮演）和自慰数据。
*   **数据分析**: 可视化热力图、趋势图表、因子实验室。
*   **隐私安全**: 数据完全本地存储 (LocalStorage)，支持导出/导入备份。
*   **伴侣档案**: 建立详细的伴侣偏好与身体密码数据库。

## 开发指南

本项目使用 React + TypeScript + Tailwind CSS 构建。

⚠️ **重要提示**: 在进行任何代码修改前，请务必阅读 **`DEVELOPER_MANUAL.md`**。该文档详细记载了项目的核心架构、日期判定逻辑（Physiological Day）、数据迁移规则以及组件规范。

### 快速开始

```bash
npm install
npm run dev
```

### 项目结构

*   `components/`: UI 组件
*   `hooks/`: 自定义 Hooks (useLogs, useLocalStorage)
*   `types.ts`: TypeScript 类型定义
*   `utils/`: 工具函数与迁移脚本
