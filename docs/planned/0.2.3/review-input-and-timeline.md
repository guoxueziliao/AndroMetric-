# 0.2.3 Review Input 与事实时间线

> 本文负责 0.2.3 刀 51 - 刀 52 的输入契约、时间窗口、事实时间线和窗口聚合。它只定义 review engine 的纯数据输入与事实输出，不定义 UI 组件。

## 目标

0.2.3 的 review engine 先吃一份整理好的纯数据输入，再输出事实时间线、窗口摘要和后续 insight 所需的事实基础。

核心原则：

- adapter 负责整理输入，不生成判断。
- timeline 负责展示事实，不输出相关性。
- aggregation 负责窗口统计，不输出医学或行为评价。
- insight 必须在刀 53 的样本量与可信度守门之后再出现。

## Review 输入结构

建议定义：

```ts
type ReviewWindowKind = 'rolling_7d' | 'rolling_14d' | 'rolling_30d' | 'week' | 'month';

interface AdultBehaviorReviewInput {
  generatedAt: string;
  window: ReviewWindow;
  physiologicalDayBoundaryHour: 3;
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
  dailyLogs: AdultBehaviorDailyLogInput[];
}

interface ReviewWindow {
  kind: ReviewWindowKind;
  startDate: string;
  endDate: string;
  label: string;
}
```

规则：

- `startDate` / `endDate` 使用生理日日期，格式为 `YYYY-MM-DD`。
- `endDate` 包含在窗口内。
- 滚动窗口按当前目标生理日向前包含 7 / 14 / 30 天。
- 自然周 / 自然月按本地日期计算，但事件归属仍看 `targetDate`。
- `generatedAt` 只表示复盘生成时间，不参与业务排序。

## Daily log 输入

0.2.3 不要求新增 schema。旧日志和健康指标通过 adapter 转成 review input。

```ts
interface AdultBehaviorDailyLogInput {
  targetDate: string;
  morningHardness?: number | null;
  erectionQuality?: number | null;
  sleepDurationMinutes?: number | null;
  sleepQuality?: number | null;
  alcohol?: boolean | null;
  exerciseMinutes?: number | null;
  stressLevel?: number | null;
  moodLevel?: number | null;
  fatigueLevel?: number | null;
  notesPresent?: boolean;
}
```

字段原则：

- 只放复盘需要的结构化指标。
- 不把原始 notes 全文传入 review engine，除非后续明确做本地文本复盘。
- 字段缺失用 `null` / `undefined` 表达，不用假默认值填满。
- 单位必须在字段名里明确，例如 `sleepDurationMinutes`。

## Timeline event

事实时间线统一输出 `ReviewTimelineEvent`。

```ts
type ReviewTimelineEventKind =
  | 'porn_use'
  | 'masturbation'
  | 'sex'
  | 'morning_hardness'
  | 'sleep'
  | 'alcohol'
  | 'exercise'
  | 'mood'
  | 'stress'
  | 'fatigue';

interface ReviewTimelineEvent {
  id: string;
  kind: ReviewTimelineEventKind;
  targetDate: string;
  occurredAt?: string;
  sortKey: string;
  sourceId?: string;
  summaryFacts: ReviewFact[];
  linkedEventIds: string[];
  privacyLevel: 'standard' | 'sensitive';
}

interface ReviewFact {
  key: string;
  value: string | number | boolean | null;
  unit?: string;
}
```

排序规则：

- 有 `startedAt` 的成人行为事件：`sortKey = startedAt`。
- morning hardness：放在目标生理日早间，具体实现可用稳定合成时间。
- sleep：按睡眠记录归属日放在时间线前段或 summary 区。
- daily log 指标没有具体时间时，用稳定合成 `sortKey`，避免 UI 抖动。
- 同一 `sortKey` 下按固定 kind 顺序排序：sleep → morning_hardness → porn_use → masturbation → sex → exercise → alcohol → mood → stress → fatigue。

## Timeline 分组

建议输出：

```ts
interface ReviewTimelineDay {
  targetDate: string;
  events: ReviewTimelineEvent[];
  dayFacts: ReviewFact[];
  missingData: ReviewMissingData[];
}
```

规则：

- timeline 按 `targetDate` 分组。
- 成人行为事件按 `startedAt` 排序。
- linked ids 只用于展示链路，不用于推断因果。
- orphan linked ids 不在 timeline 静默删除；可以作为 `missingData` 或 integrity warning 展示。

## 窗口聚合输出

刀 52 输出事实聚合，不输出判断。

```ts
interface AdultBehaviorWindowFacts {
  window: ReviewWindow;
  recordDays: number;
  missingData: ReviewMissingData[];
  pornUse: PornUseWindowFacts;
  masturbation: MasturbationWindowFacts;
  sex: SexWindowFacts;
  recovery: RecoveryWindowFacts;
  timeline: ReviewTimelineDay[];
}
```

聚合范围：

- Porn use：次数、总时长、平均时长、射精次数、进入自慰次数、超时次数、控制感样本数。
- Masturbation：次数、射精次数、边缘控制次数、硬度样本数、硬度均值、满意度样本数。
- Sex：次数、射精次数、色情参与次数、硬度样本数、满意度样本数、疲劳样本数。
- Recovery：晨间硬度样本数、硬度均值、睡眠样本数、睡眠均值、疲劳样本数。

聚合规则：

- 只统计窗口内 `targetDate` 落入范围的事件。
- 时长单位统一 minutes。
- 均值只在样本数大于 0 时输出。
- 缺失字段不按 0 处理。
- 多个事件 linked 到同一事件时不重复计算被 linked 事件。

## Missing data

缺失数据作为一等输出。

```ts
interface ReviewMissingData {
  key: string;
  targetDate?: string;
  severity: 'info' | 'warning';
  affectedMetrics: string[];
}
```

常见缺口：

- 缺少晨间硬度记录。
- 缺少睡眠记录。
- 成人行为事件没有 `durationMinutes`。
- 成人行为事件没有硬度样本。
- linked ids 存在 orphan。
- 同一窗口内样本不足。

## 明确不做

- 不把 notes 全文送入 review engine。
- 不用 timeline 自动推断“导致”关系。
- 不把 linked ids 当因果链。
- 不在 adapter 中生成 insight。
- 不在 aggregation 中输出诊断、成瘾判断或行为建议。
- 不新增数据库字段或持久化 review result。

## 交接

- 刀 51 负责 `AdultBehaviorReviewInput` 和 adapter。
- 刀 52 负责 `ReviewTimelineDay` 和 `AdultBehaviorWindowFacts`。
- 刀 53 才能基于 `AdultBehaviorWindowFacts` 输出 confidence 和 insight gating。
