# 硬度日记架构设计

本文是硬度日记后续重构的主架构依据。目标不是一次性重写项目，而是在保持现有功能、交互和 IndexedDB 数据结构不变的前提下，逐步建立清晰的模块边界，让后续开发更容易定位、扩展和测试。

## 当前状态(0.0.9 — 2026-05-19)

**0.0.9 已发布。** 主题:**A 数据洞察 + 推迟项消化 + RecordCard refactor**。6 刀按 audit + 0.0.8 推迟项合并去重落地。

### 0.0.9 完成清单(刀 1 → 刀 6)

- **刀 1 Insight 补渲染**:`generateInsights()` 返回 4 类(correlations/anomalies/loops/xp)合并按 score 排序,StatsView 之前 `.slice(0,3)` 会把 score=8 的 anomalies 经常挤出榜外。新增 `category` 字段到 `Insight` 接口,StatsView 按类分组渲染(相关性/异常事件/行为模式/偏好趋势),每类最多 3 条,空类不显示。
- **刀 2 Dashboard 趋势化**:新增 `features/dashboard/TrendsPanel.tsx`,挂在 DashboardDayView 三列网格的第一格。读 `StatsEngine.getSMA(metric, 7)`,对硬度/睡眠/屏幕/自慰频次/运动 5 项分别显示当前 7 日均线 + 与上一个 7 日窗口的 delta(箭头 + 数值,绿涨红跌灰平)。`StatsEngine.getSMA()` 之前只有 StatsView 在用。
- **刀 3 Impact + XP 维度可视化**:新增 `features/dashboard/ImpactFindings.tsx`,跑 5 个因子(睡眠/饮酒/压力/运动/性活动负荷)对硬度的 `analyzeImpact`,按 |diff| 取前 2 显示;StatsView 性维度 tab 雷达图下面加"维度详情"卡,6 个维度水平 bar + 记录数/标签出现次数/独立标签数三元组(之前 `xpStats.dimensionStats` 只有 `recordCount` 进了雷达)。
- **刀 4 smart defaults 接线**:ExerciseRecordModal 接受 `logs` prop,fresh-open 时按今日 dow 调 `analyzeUserPatterns('exerciseType')`,confidence > 0.5 时预填 type 并展开对应分类;SexRecordModal 首段 interaction 的 partner 用 `lastSexPartner` 预填(还得 partners 列表里有对应人才生效)。两个 modal 都加"智能默认 · {value} · 可换"徽章 + 一键清除。两个分析器在 0.0.8 已存在,这刀只补接线。
- **刀 5 RecordCard 抽取 + 性活动 hoist**:新增 `shared/ui/RecordCard.tsx`(slot API,6 个 tone),LogForm 自慰/性爱卡片用它替换原生 div;`MidTabType` 加 `'sex'`,默认 tab 从 'life' 改为 'sex',顺序变成 性活动 / 生活 / 环境 / 健康,性活动块从 'life' tab 末尾抽出来变成独立 tab。
- **刀 6 Toast 堆叠 + docs**:Toast.tsx 去掉自身定位(`fixed top-6 left-1/2`),改成 relative 渲染;新增 `ToastStack` 容器,ToastContext 内部维护 `toasts: Array<{id, msg, type}>`,多 toast 在 stack 内 AnimatePresence + framer-motion layout 自然纵向堆叠,各自 timer 独立。`showToast` API 不变。

### 0.0.9 推迟到 0.1.0+ 的

- C-002 `MasturbationRecordModal` 字段折叠 Accordion(583 LOC + 9 hooks,state-hook 拆解超出"保守拆"边界,留到 MasturbationRecordModal 真正需要再做时一次性做)
- SleepFieldsBlock 共享 / LogItemCard 进一步统一(LogHistory / Dashboard 还有未迁移到 RecordCard 的卡片)/ touchedPaths 集中 / Modal vs BottomSheet ruleset
- 0.1.0 = D 隐私 + F PWA(应用锁、Service Worker 缓存策略、安装/更新提示)

### Floor stats at v0.0.9

- typecheck: 0 errors
- lint: 0 errors
- vitest: 20/20
- LATEST_VERSION: 46 (unchanged from 0.0.8)
- IndexedDB version: 6 (unchanged)

下面的 Phase 1 / Phase 2 步骤、迁移映射、禁止事项保持原样作为历史参考,不再是 TODO。

## 设计目标

- 降低 `App.tsx`、`useLogs.ts`、`DataContext`、大型页面组件之间的耦合。
- 让 UI、业务用例、数据访问、领域规则各自有明确位置。
- 让新增功能优先落在业务域模块中，而不是继续堆到全局组件和全局 hook。
- 支持渐进迁移：旧目录短期保留，新目录通过 adapter 或 re-export 承接迁移。
- 第一阶段不改变用户可见行为，不修改数据库 schema，不触发数据迁移。

## 目标目录结构

```text
./
├── app/
│   ├── AppProviders.tsx
│   ├── MainViewRouter.tsx
│   ├── useLogEditor.ts
│   └── useQuickRecordData.ts
├── features/
│   ├── dashboard/
│   ├── analysis/
│   ├── daily-log/
│   ├── quick-actions/
│   │   ├── QuickRecordController.tsx
│   │   └── model/
│   ├── sex-life/
│   ├── stats/
│   ├── tags/
│   ├── backup/
│   ├── settings/
│   └── pwa/
├── shared/
│   ├── ui/
│   └── lib/
├── core/
│   └── storage/
├── domain/
│   ├── types/
│   ├── constants/
│   └── rules/
└── docs/
```

### `app/`

`app/` 负责应用装配，不承载业务细节。

应放入：

- Provider 组合，例如 Toast、Data、Theme、PWA 初始化。
- 主视图路由状态，例如 calendar、stats、sexlife、my。
- 顶层布局壳，例如移动端容器、底部导航挂载点。
- 兼容 adapter，例如把现有 `useLogs()` facade 映射成 feature 需要的窄接口。

不应放入：

- Dexie 查询。
- 日志写入逻辑。
- 统计、推荐、标签规则。
- 快捷记录、标签、备份等具体业务流程。
- 大段页面 JSX。

### `features/`

`features/` 按业务域组织页面、组件、hooks、use cases 和 view model。每个 feature 对外只暴露稳定入口，内部文件不被其他 feature 深度引用。

建议结构：

```text
features/dashboard/
├── components/
├── hooks/
├── model/
└── index.ts
```

业务域建议：

- `dashboard`：首页、日历、摘要弹窗、ongoing banners、全局时间轴入口。
- `analysis`：已禁用的 AI/分析占位入口，后续恢复时再接入真实用例。
- `daily-log`：完整日记编辑、晨间、睡眠、健康、生活方式记录。
- `quick-actions`：FAB、快速记录 controller、ongoing 状态 selector、快速记录默认值 factory。
- `sex-life`：性生活视图、伴侣管理、性记录和自慰记录的业务入口。
- `stats`：统计视图、洞察、XP 统计展示。
- `tags`：标签管理、标签体检、标签校验 UI。
- `backup`：手动导出、快照、自动备份设置。
- `settings`：主题、隐私、PWA、应用设置。
- `pwa`：安装提示、更新提示、离线提示、安装按钮。

### `shared/ui`

`shared/ui` 放无业务状态的通用 UI。组件可以有局部交互状态，但不能知道 LogEntry、Dexie、StorageService 或具体业务流程。

适合迁入：

- `Modal`
- `Toast`
- `DateTimePicker`
- `FormControls`
- `HardnessSelector`
- `SafeDeleteModal`
- `ErrorBoundary`
- `NoticeSystem`
- `AnimatedButton`
- `AnimatedPage`

规则：

- 只通过 props 接收数据和回调。
- 不调用 `useData()`。
- 不调用 `StorageService`。
- 不导入 feature 内部模块。

### `shared/lib`

`shared/lib` 放纯函数和可复用工具。这里不允许 React、Dexie、DOM 依赖。

适合迁入：

- 日期和生理日函数。
- 时间格式化、睡眠时长计算。
- 通用校验辅助。
- 通用数值计算。

如果函数开始依赖 `LogEntry` 的业务语义，应优先考虑放入 `domain/rules` 或对应 feature 的 `model`。

### `core/storage`

`core/storage` 放基础设施和持久化实现。

适合迁入：

- Dexie 实例和 schema。
- `StorageService` 的 repository 层。
- migration。
- backup/file system/logger 服务。
- plugin manager 的基础设施部分。

规则：

- 可以依赖 `domain` 类型。
- 不依赖 React 组件。
- 不承载 UI 文案和 toast 行为。
- 不直接决定页面跳转。

### `domain/`

`domain/` 放长期稳定的业务语言、核心类型和领域规则。

适合迁入：

- `LogEntry`、`MorningRecord`、`SleepRecord` 等核心类型。
- 标签类型、XP 维度、历史记录类型。
- 生理日规则。
- 不依赖浏览器环境的业务判定。

规则：

- 禁止依赖 React。
- 禁止依赖 Dexie。
- 禁止依赖 DOM、window、localStorage。
- 禁止包含 UI 文案和 Tailwind class。

## 依赖方向

依赖只能从上层流向下层：

```text
app
  ↓
features
  ↓
shared/ui      core/storage
  ↓              ↓
shared/lib     domain
  ↓
domain
```

允许：

- `app` 依赖 `features`、`shared`、`core`、`domain`。
- `features` 依赖 `shared`、`core`、`domain`。
- `shared/ui` 依赖 `shared/lib` 和通用第三方 UI 依赖。
- `core/storage` 依赖 `domain`。
- `domain` 被所有层依赖。

禁止：

- `domain` 依赖 `app`、`features`、`shared/ui`、`core/storage`。
- `shared` 依赖任何 feature。
- feature 深度引用另一个 feature 的内部文件。
- 组件直接调用 IndexedDB、Dexie table 或 `db`。
- 页面组件直接拼装复杂数据写入规则。

跨 feature 协作必须通过公开入口完成：

```ts
// 允许
import { useDashboardViewModel } from '@/features/dashboard';

// 禁止
import { buildSomeInternalState } from '@/features/dashboard/model/internal/buildSomeInternalState';
```

## 数据流

### 写入流

用户操作必须按以下路径流动：

```text
UI event
→ feature hook/controller
→ use case
→ repository/storage
→ Dexie
```

例子：

```text
点击“开始午休”
→ quick-actions controller
→ startOrFinishNap use case
→ log repository
→ db.logs.put()
```

要求：

- UI 只表达用户意图，不拼装完整持久化细节。
- use case 负责业务规则、目标日期、changeHistory、默认值。
- repository 负责读写、事务和存储错误封装。
- Dexie 只在 `core/storage` 内部直接出现。

### 读取流

数据读取必须按以下路径流动：

```text
Dexie live query
→ query hook
→ selector/view model
→ UI
```

例子：

```text
db.logs live query
→ useLogQueries()
→ useDashboardViewModel()
→ DashboardPage
```

要求：

- 查询 hook 返回原始或 hydrate 后数据。
- selector/view model 负责页面展示所需的派生数据。
- UI 不重复计算复杂业务派生值。
- 同一派生逻辑只能有一个权威实现。

### Provider 责任

Provider 只负责装配，不承载业务流程。

允许：

- 初始化全局服务。
- 提供 context。
- 组合多个 narrow hooks。

禁止：

- 在 Provider 里写具体记录保存流程。
- 在 Provider 里写数据迁移规则。
- 在 Provider 里拼装页面专用 view model。

## Context 拆分策略

当前 `DataContext` 是兼容 facade，第一阶段保留，但内部逐步拆成窄接口。

目标 context：

- `LogQueryContext`：日志、加载状态、按日期查询。
- `LogCommandContext`：保存、删除、导入日志。
- `QuickActionContext`：睡眠、午休、运动、饮酒、自慰、性生活快捷操作。
- `PartnerContext`：伴侣列表和 CRUD。
- `TagContext`：用户标签和标签 CRUD。
- `SettingsContext`：主题、隐私、通知等设置。

迁移原则：

- 新代码优先使用窄 context 或 feature hook。
- 旧组件可继续使用 `useData()`。
- 每迁移一个 feature，移除该 feature 对 `useData()` 的依赖。
- `useData()` 最终只作为过渡层，迁移完成后删除。

## 第一阶段迁移顺序

第一阶段只建立架构骨架和质量基线，不拆大型表单内部细节。

1. 建立质量基线
   - 统一测试链路为 npm + Vitest。
   - 新增 `typecheck` 脚本。
   - 修复 `tsc --noEmit` 中的真实类型问题。
   - 清理未使用 import 和变量，避免噪声掩盖真实错误。

2. 建立目录骨架
   - 新增 `app/`、`features/`、`shared/`、`core/`、`domain/`。
   - 先通过 `index.ts` re-export 旧实现，避免一次性大迁移。
   - 新增模块边界说明和迁移 TODO。

3. 拆顶层应用装配
   - 从 `App.tsx` 抽出 `AppProviders`。
   - 抽出 `AppShell` 管布局和导航。
   - 抽出 `MainViewRouter` 管主视图切换。
   - 第一阶段可临时抽出 `QuickRecordController`，第二阶段迁入 `features/quick-actions`。

4. 拆数据层 facade
   - 从 `useLogs.ts` 抽出 query hooks。
   - 从 `useLogs.ts` 抽出 quick action use cases。
   - 从 `useLogs.ts` 抽出 import/export/partner/tag 命令。
   - 保持 `useData()` 对外形状不变，保证旧组件不需要一次性改动。

5. 首批 feature 迁移
   - 先迁移 `tags`、`backup`、`settings`，这些模块相对独立。
   - 再迁移 `dashboard` 的外层结构。
   - 暂缓深拆 `LogForm`、`SexRecordModal`、`MasturbationRecordModal`、`PartnerManager`。

## 第二阶段迁移顺序

第二阶段开始把 re-export 骨架推进为真实 feature 边界。仍然不改变用户行为，不修改 IndexedDB schema，不触发 migration。

1. 选择一个垂直业务域落地真实边界
   - 优先选择 `quick-actions`，因为它跨 FAB、弹窗、ongoing 状态和快捷写入命令。
   - 将 controller 放到 `features/quick-actions/QuickRecordController.tsx`。
   - 将 ongoing 状态派生放到 `features/quick-actions/model/selectors.ts`。
   - 将快速记录默认值构造放到 `features/quick-actions/model/*`。

2. 建立 app 到 feature 的窄接口 adapter
   - `app` 不再把整个 `AppData` 作为业务依赖传入 feature。
   - 通过 `useQuickRecordData()` 把 `useLogs()` 的兼容 facade 映射成 `QuickRecordData`。
   - feature 只能依赖 `QuickRecordData` 中声明的字段和命令。

3. 每次迁移一个 feature
   - 先迁移 controller 和 selector，再迁移 use case。
   - 旧组件允许继续由 feature 内部 adapter 引用。
   - 其它模块只能从 feature 的 `index.ts` 公开入口导入。

4. 验证边界
   - `app` 可以导入 `features/quick-actions` 的公开入口。
   - `features/quick-actions` 不允许导入 `app`。
   - `features/quick-actions/model` 不允许依赖 React、Toast、DOM 或 Dexie。
   - 构建通过后再提交，不混入 `dist` 产物。

## 现有文件迁移映射

| 当前文件 | 第一阶段目标 |
|---|---|
| `App.tsx` | 拆到 `app/`，原文件只保留入口装配 |
| `contexts/DataContext.tsx` | 保留兼容 facade，新增窄 context |
| `hooks/useLogs.ts` | 拆成 query hooks、use cases、facade |
| `services/StorageService.ts` | 迁入 `core/storage`，保留 re-export |
| `db.ts` | 迁入 `core/storage`，保留 re-export |
| `utils/migration.ts` | 迁入 `core/storage/migrations`，保留 re-export |
| `types.ts` | 逐步拆到 `domain/types`，保留 re-export |
| `utils/helpers.ts` | 拆到 `shared/lib` 和 `domain/rules` |
| `components/Modal.tsx` | 已迁入 `shared/ui/Modal.tsx` |
| `components/Toast.tsx` | 已迁入 `shared/ui/Toast.tsx` |
| `components/DateTimePicker.tsx` | 已迁入 `shared/ui/DateTimePicker.tsx` |
| `components/FormControls.tsx` | 已迁入 `shared/ui/FormControls.tsx` |
| `components/HardnessSelector.tsx` | 已迁入 `shared/ui/HardnessSelector.tsx` |
| `components/SafeDeleteModal.tsx` | 已迁入 `shared/ui/SafeDeleteModal.tsx` |
| `components/ErrorBoundary.tsx` | 已迁入 `shared/ui/ErrorBoundary.tsx` |
| `components/ui/AnimatedButton.tsx` | 已迁入 `shared/ui/AnimatedButton.tsx` |
| `components/ui/AnimatedPage.tsx` | 已迁入 `shared/ui/AnimatedPage.tsx` |
| `components/NoticeSystem.tsx` | 已迁入 `shared/ui/NoticeSystem.tsx` |
| `components/TagManager.tsx` | 已迁入 `features/tags/TagManager.tsx` |
| `components/TagHealthCheck.tsx` | 已迁入 `features/tags/TagHealthCheck.tsx` |
| `components/BackupSettings.tsx` | 已迁入 `features/backup/BackupSettings.tsx` |
| `components/VersionHistoryModal.tsx` | 已迁入 `features/backup/VersionHistoryModal.tsx` |
| `components/settings/ThemeSettings.tsx` | 已迁入 `features/settings/ThemeSettings.tsx` |
| `hooks/useTheme.ts` | 已迁入 `features/settings/useTheme.ts` |
| `components/Dashboard.tsx` | 已迁入 `features/dashboard/Dashboard.tsx`，后续再拆分 |
| `components/CalendarHeatmap.tsx` | 已迁入 `features/dashboard/CalendarHeatmap.tsx` |
| `components/GlobalTimeline.tsx` | 已迁入 `features/dashboard/GlobalTimeline.tsx` |
| `components/LogForm.tsx` | 已迁入 `features/daily-log/LogForm.tsx`，后续再拆分 |
| `components/MorningSection.tsx` | 已迁入 `features/daily-log/MorningSection.tsx` |
| `components/SleepSection.tsx` | 已迁入 `features/daily-log/SleepSection.tsx` |
| `components/HealthSection.tsx` | 已迁入 `features/daily-log/HealthSection.tsx` |
| `hooks/useSmartDefaults.ts` | 已迁入 `features/daily-log/model/useSmartDefaults.ts` |
| `utils/smartDefaults.ts` | 已迁入 `features/daily-log/model/smartDefaults.ts` |
| `components/StatsView.tsx` | 已迁入 `features/stats/StatsView.tsx` |
| `components/HardnessChart.tsx` | 已迁入 `features/stats/HardnessChart.tsx` |
| `utils/StatsEngine.ts` | 已迁入 `features/stats/model/StatsEngine.ts` |
| `utils/xpStats.ts` | 已迁入 `features/stats/model/xpStats.ts` |
| `utils/insights.ts` | 已迁入 `features/stats/model/insights.ts` |
| `utils/eventAdapter.ts` | 已迁入 `features/stats/model/eventAdapter.ts` |
| `app/QuickRecordController.tsx` | 第二阶段迁入 `features/quick-actions/QuickRecordController.tsx` |
| `components/SexLifeView.tsx` | 已迁入 `features/sex-life/SexLifeView.tsx` |
| `components/PartnerManager.tsx` | 已迁入 `features/sex-life/PartnerManager.tsx`，后续再拆分 |
| `components/SexRecordModal.tsx` | 已迁入 `features/sex-life/SexRecordModal.tsx`，后续再拆分 |
| `components/MasturbationRecordModal.tsx` | 已迁入 `features/sex-life/MasturbationRecordModal.tsx`，后续再拆分 |
| `components/FAB.tsx` | 已迁入 `features/quick-actions/FAB.tsx` |
| `components/BeverageModal.tsx` | 已迁入 `features/daily-log/BeverageModal.tsx` |
| `components/ExerciseSelectorModal.tsx` | 已迁入 `features/daily-log/ExerciseRecordModal.tsx` |
| `components/AlcoholRecordModal.tsx` | 已迁入 `features/daily-log/AlcoholRecordModal.tsx` |
| `components/NapRecordModal.tsx` | 已迁入 `features/daily-log/NapRecordModal.tsx` |
| `components/BottomNav.tsx` | 已迁入 `app/BottomNav.tsx` |
| `components/Welcome.tsx` | 已迁入 `app/Welcome.tsx` |
| `components/LogHistory.tsx` | 已迁入 `features/dashboard/LogHistory.tsx` |
| `components/DiffRow.tsx` | 已迁入 `features/dashboard/DiffRow.tsx` |
| `components/PWAInstallPrompt.tsx` | 已迁入 `features/pwa/PWAInstallPrompt.tsx` |
| `components/AIAnalyst.tsx` | 已迁入 `features/analysis/AIAnalyst.tsx` |
| `components/AnalysisView.tsx` | 已迁入 `features/analysis/AnalysisView.tsx` |
| `components/SidebarNav.tsx` | 已迁入 `app/SidebarNav.tsx` |

## 禁止事项

- 禁止在第一阶段修改 `db.ts` schema。
- 禁止新增 migration，除非重构过程中发现必须修复的数据损坏问题。
- 禁止改变生理日规则。
- 禁止把业务逻辑继续新增到 `App.tsx`。
- 禁止新组件直接调用 `db`、Dexie table 或 `StorageService.logs.*`。
- 禁止在 `shared/ui` 中调用 `useData()`。
- 禁止在 `domain` 中导入 React、Dexie、DOM API、window 或 localStorage。
- 禁止为了迁移而重命名用户可见字段或导出 JSON 字段。
- 禁止在一次 PR 中同时做架构迁移和产品功能升级。

## 质量门槛

第一阶段结束必须满足：

```bash
npm run typecheck
npm run test
npm run build
```

建议脚本：

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

基础测试覆盖：

- 生理日规则：凌晨 03:00 前活动归前一日。
- `hydrateLog` 默认结构稳定。
- 快捷记录 use case 正确追加记录和 `changeHistory`。
- 标签校验核心规则不变。
- 备份数据结构保持兼容。

## 第一阶段完成标准

- `docs/architecture.md` 成为后续重构的权威说明。
- 新目录骨架存在，并有最小 re-export 或 adapter。
- `App.tsx` 不再承载快捷记录所有弹窗细节。
- `useLogs.ts` 不再同时承担查询、业务用例和导入导出所有职责。
- `useData()` 仍可用，但新代码不再依赖它。
- `npm run typecheck`、`npm run test`、`npm run build` 全部通过。
