# 🛠️ 开发者技术文档 (Developer Documentation v0.0.6)

## 1. 系统架构与技术栈
本项目基于 **Local-First (本地优先)** 理念构建，确保用户私密数据绝不离端。

*   **前端框架**: React 18 + TypeScript (严格模式)
*   **存储引擎**: Dexie.js (IndexedDB 封装)，支持事务处理与大规模数据查询。
*   **样式方案**: Tailwind CSS + 响应式设计。
*   **数据可视化**: Chart.js (React-Chartjs-2)，用于趋势线与雷达图绘制。
*   **状态管理**: 原生 Context API (`DataContext`, `ToastContext`)。

---

## 2. 核心数据模型 (Data Constitution)

### 2.1 生理日判定逻辑 (Temporal Alignment)
为了符合人类心理认知，系统弃用了绝对 00:00 划分法：
*   **Activity Target (活动归档)**: 每日 `03:00` 为切割点。`03:00` 之前的活动自动向前减一天。
*   **Sleep Target (睡眠归档)**: 每日 `12:00` 为切割点。午后入睡归为次日（即醒来那天）的睡眠数据。

### 2.2 数据质量评分算法 (`calculateDataQuality`)
评分逻辑位于 `utils/helpers.ts`：
*   **晨间反馈 (20pts)**: 必须包含是否有晨勃及其硬度。
*   **睡眠维度 (30pts)**: 包含入睡/醒来时间、质量评分、环境描述。
*   **生活方式 (20pts)**: 天气、压力、心情、咖啡因摄入。
*   **活动增益 (30pts)**: 有效记录性生活、运动、饮酒等具体细节。

---

## 3. 核心算法层 (Analysis Engine)

### 3.1 StatsEngine (`utils/StatsEngine.ts`)
该引擎负责将碎片化的 `LogEntry` 拍扁为 `UnifiedEvent` 流：
1.  **Adapter 模式**: 将不同维度的记录（如 Sex, Nap, Alcohol）转换为统一的事件接口。
2.  **SMA 算法**: 计算 7 日移动平均线，平滑生理波动的随机性。
3.  **相关性分析**: 采用“高低分组法”对比因子对硬度的具体偏移量。

### 3.2 XP 统计与去噪 (`utils/xpStats.ts`)
*   **口径**: 采用 **Record-level (记录级)** 统计，单次记录内重复点击的标签被视为一次触发。
*   **去噪**: 系统会自动调用 `tagValidators`。被判定为“状态词”或“复合语义”的标签将被移入“噪声榜单”，不参与雷达图绘制。

---

## 4. 数据库演进与迁移 (Schema Migration)

### 4.1 迁移原则 (No Guessing Strategy)
由于 v0.0.6 引入了 `ContentItem` 结构重构，迁移脚本 (`utils/migration.ts`) 遵循：
*   **结构拆分**: 若旧数据包含多选平台，迁移脚本会按照索引强制拆分为多个 `ContentItem`。
*   **备注留痕**: 任何涉及自动生成的字段均会写入 `notes` 并打上 `System Migrated` 标记。
*   **不可逆操作**: 每次主版本升级（如 V32 -> V37），系统在启动时必须强制执行快照备份。

### 4.2 标签抗熵机制 (Tag Governance)
*   **Validator 级别**:
    *   `P0 (Blocking)`: 非法字符、包含时间/数值、平台名错位。
    *   `P1 (Warning)`: 语义复合（如“人妻出轨”）、维度冲突。
*   **体检工具**: 定期扫描 `IndexedDB` 全表，发现冗余和非标准化标签。

---

## 5. UI Notice 系统设计协议

为了在不打断用户的情况下保持数据整洁，v0.0.6 引入了 `NoticeSystem`：
*   **InlineNotice**: 用于卡片内部的具体字段提示。
*   **NoticeBadge**: 用于在首页或列表页显示该记录的潜在风险数。
*   **语义约束**: 提示词必须是中性的描述（例如“未选择平台”），而非指令（“必须选择平台”）。

---

## 6. 开发环境启动
```bash
npm install
npm run dev
```
⚠️ **注意**: 修改 `types.ts` 后，必须同步更新 `utils/hydrateLog.ts` 和 `utils/migration.ts`，否则会导致 IndexedDB 读写失败。