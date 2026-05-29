# 0.2.8 派生数据契约

> 本文定义个人常态系统 v1 输出给 UI 的只读数据结构。它不新增 schema，也不改变 JSON backup / CSV export 契约。

## 存储边界

- 不新增 IndexedDB store。
- 不持久化 baseline cache。
- 不把个人常态结果写入日志或 adult behavior event。
- 不把派生状态写入 JSON backup。
- 不把派生状态默认写入 CSV 导出。

如果实现需要 cache、导出或跨会话持久化，必须回到规划重谈。

## 顶层结构

```ts
interface PersonalNormalResult {
  generatedAt: string;
  currentWindowDays: 14 | 30;
  baselineWindowDays: 90;
  extendedContextDays?: 180;
  summary: PersonalNormalSummary;
  metrics: PersonalNormalMetric[];
  recordGaps: PersonalNormalGap[];
  limitations: string[];
}
```

`generatedAt` 只表示本次派生时间，不是医学评估时间。

## Summary

```ts
interface PersonalNormalSummary {
  withinCount: number;
  shiftedCount: number;
  insufficientCount: number;
  confidence: 'none' | 'low' | 'medium';
}
```

不得新增总分、健康分、风险等级或“正常 / 异常”字段。

## Metric

```ts
interface PersonalNormalMetric {
  id: string;
  label: string;
  layer: 'primary' | 'secondary';
  state: 'within_personal_normal' | 'shift_with_limited_confidence' | 'insufficient_data';
  direction: 'above_baseline' | 'below_baseline' | 'within_baseline' | 'mixed' | 'unknown';
  currentValue: number | null;
  baselineMedian: number | null;
  baselineRange: [number, number] | null;
  sampleSize: number;
  missingDays: number;
  confidence: 'none' | 'low' | 'medium';
  limitations: string[];
}
```

`direction` 是内部解释字段，不直接展示给用户。

## 缺失语义

- `null`：没有足够记录，不能计算。
- `0`：有可信记录，且该次数 / 负荷类事件确实为 0。

当前 `StatsEngine.getSeries` 对 sum / count 类指标会补 0，对硬度等 scalar 指标会过滤缺失。0.2.8 必须保留这个差异，不得把硬度、压力、满意度缺失填成 0。

## Record Gaps

```ts
interface PersonalNormalGap {
  metricId: string;
  window: 'current' | 'baseline';
  missingDays: number;
  reason: 'missing_log' | 'missing_field' | 'legacy_value' | 'insufficient_event_detail';
}
```

UI 可以展示缺什么，但不应把缺口写成“影响诊断准确率”。

## 停下来重谈

出现以下字段需求，应停止实现：

- `score` / `healthScore` / `riskLevel`。
- `diagnosis` / `abnormal`。
- `populationPercentile`。
- `partnerAttribution`。
- `predictedPerformance`。
