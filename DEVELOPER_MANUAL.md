# 🛠️ 开发者技术手册 (Developer Manual)

**版本**: 0.0.6
**最后更新**: 2025-12-12
**核心架构**: Local-First / IndexedDB / React

---

## 1. 核心技术选型

*   **存储**: `Dexie.js` (IndexedDB 封装)，确保大数据量下的查询性能与事务安全。
*   **可视化**: `Chart.js` + `react-chartjs-2`，通过 `StatsEngine` 进行数据降噪处理。
*   **数据流**: 基于 React Context 的 `DataContext` 统一调度 `StorageService`。
*   **插件系统**: `PluginManager` 支持在数据变动时触发异步分析任务（如酒精模型计算）。

---

## 2. 关键业务逻辑 (Critical Logic)

### 2.1 生理日判定 (Physiological Day)
**重要**: 系统的“日期”不等同于日历日期。

*   **活动归档 (Activity Cutoff)**: **03:00 AM**。凌晨 3 点前的性爱/饮酒归属于前一天的 LogEntry。
*   **睡眠归档 (Sleep Cutoff)**: **12:00 PM**。中午 12 点前的醒来判定为该日期的起床，12点后的睡眠计入次日。

### 2.2 数据质量算法 (Quality Score)
位于 `utils/helpers.ts -> calculateDataQuality`。
*   权重：晨勃 (20%) + 睡眠 (30%) + 生活环境 (20%) + 活动细节 (30%)。
*   目的：通过 UI 反馈引导用户完成高价值的数据补全。

---

## 3. 标签系统规范 (Tag Governance)

v0.0.6 引入了严谨的标签反熵机制，详见 `docs/tag-system-rules.md`。

*   **六维 XP 结构**: 角色、身体、装扮、玩法、剧情、风格。
*   **即时校验**: 新建标签时通过 `tagValidators.ts` 拦截复合语义（如 `人妻出轨`）和非法格式。
*   **体检机制**: `TagHealthCheck.tsx` 动态扫描数据库，识别同义词、低频词及维度漂移。

---

## 4. 数据库演进与迁移 (Migrations)

### 4.1 数据版本 (LATEST_VERSION = 37)
由于是本地存储，每次 Schema 修改必须在 `utils/migration.ts` 编写迁移函数。

### 4.2 ContentItem 结构重构 (V37)
这是 v0.0.6 最重要的结构变动。将扁平的 `assets` 拆分为 `ContentItem[]` 数组。
*   **原则**: 系统不猜语义。
*   **策略**: 若旧数据中平台和类型都是多选，则执行“笛卡尔匹配”拆分，并标记 `notes` 由用户后续纠正。

---

## 5. 数据宪章 (Data Constitution)

**核心约束**: 
1.  **用户事实 (User Fact) 不可侵犯**: 系统绝对禁止自动修改、纠正用户填写的时间、数值或标签，即使它们逻辑上矛盾（如开始时间晚于结束时间）。
2.  **系统派生 (System Derived) 随时重算**: 评分、趋势线、分析报告均由 facts 即时计算，不回写原始记录。
3.  **修复可回滚**: 所有通过 `repairData` 执行的修复必须先创建 snapshot。

---

## 6. 开发建议

*   **新增字段**: 必须同时更新 `types.ts`、`hydrateLog.ts` 以及新增一个 `migrate` 版本。
*   **UI 开发**: 遵循 `docs/ui-copy-rules.md`，避免使用情绪化或模糊的文案污染数据语境。
*   **性能**: 重度计算任务（如回归分析）应放在 `useEffect` 或 `StatsEngine` 内部进行 Memoize。