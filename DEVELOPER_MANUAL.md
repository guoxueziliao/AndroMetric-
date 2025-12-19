
# 🛠️ 开发者技术文档 (Developer Documentation)

**版本**: 0.0.6
**最后更新**: 2025-12-12
**数据架构版本 (LATEST_VERSION)**: 37

## 1. 技术栈
*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **State/Storage**: Dexie.js (IndexedDB wrapper) - **Local First Architecture**
*   **Visualization**: Chart.js / React-Chartjs-2
*   **PWA**: Vite PWA Plugin

## 2. 核心数据模型

### 2.1 LogEntry (核心日志)
应用以“生理日”为单位，每天一条 `LogEntry`。
*   **日期判定 (Cutoff)**: 凌晨 03:00 前的活动归档至前一天；中午 12:00 后的睡眠计时归档至次日。
*   **状态管理**: 分为 `pending` (进行中/草稿) 与 `completed` (已完成)。

### 2.2 素材模型 (ContentItem)
v0.0.6 引入了单一语义素材单元，取代了旧版的复合 assets 结构。
*   **原子化**: 一个素材对应一个确定的类型（视频/图片等）和平台（Pornhub/Telegram等）。

## 3. 关键业务逻辑

### 3.1 日期偏移算法 (Date Logic)
*   **活动归档**: `currentHour < 3 ? date - 1 : date`
*   **睡眠归档**: `currentHour >= 12 ? date + 1 : date`

### 3.2 数据迁移系统 (Migration)
*   **最新版本 (V37)**: 强制将旧版 `assets` 结构拆分为 `ContentItem[]` 数组，实现“不猜语义”的结构化存储。
*   **自动修复**: 系统会在 `StorageService.init()` 时自动检测版本并执行迁移，并在必要时从 `changeHistory` 中恢复丢失的文本数据。

## 4. 开发规范 (Data Constitution)

### 4.1 数据主权
*   ❌ 系统**不得**自动纠正或修改用户输入的“事实数据”。
*   ✅ 系统应在 UI 层通过 `NoticeSystem` 进行风险提示。

### 4.2 标签治理
*   标签分为三类：`xp` (性癖), `event` (事件), `symptom` (症状)。
*   禁止在记录页面直接创建新标签，所有增删改查必须在「标签管理」中完成，以防止语义漂移。

## 5. UI 提示系统 (Notice System)
v0.0.6 引入了统一的 Notice 系统：
*   **Level**: `error` (结构损坏), `warn` (信息缺失), `info` (建议补充)。
*   **原则**: 提示但不中断，引导用户主动点击“一键修复”。
