# 0.2.8 个人基线模型

> 本文规划 0.2.8 的个人基线派生模型。模型只做本地统计，不做医学判断。

## Baseline Window

已定默认窗口：

- current window：14 / 30 天。
- baseline window：90 天。
- 180 天：长期背景，只在数据足够时展示。

0.2.8 默认不做超过 180 天的复杂季节性分析；30 / 60 天只作为辅助观察窗口。

## 指标候选

第一层基线指标：

- 晨勃硬度。
- 睡眠时长和质量。
- 性负荷。
- 压力水平。
- 疲劳 / 事后恢复。

第二层基线指标：

- 射精频率。
- 色情使用频率 / 时长。
- 运动频率 / 时长。
- 满意度。
- 目标历史。

每个指标都必须包含 dataSource、aggregation、窗口、sampleSize、missingDays、confidence、direction 和 limitations。

## 输出结构

实现侧的完整只读输出见 [派生数据契约](./derived-data-contract.md)。本文保留核心 metric 结构：

```ts
interface PersonalBaselineMetric {
  metric: string;
  dataSource: string;
  aggregation: 'median' | 'mean' | 'sum' | 'count' | 'max' | 'derived';
  currentWindowDays: number;
  baselineWindowDays: number;
  currentValue: number | null;
  baselineMedian: number | null;
  baselineRange: [number, number] | null;
  sampleSize: number;
  missingDays: number;
  confidence: 'none' | 'low' | 'medium';
  direction: 'above_baseline' | 'below_baseline' | 'within_baseline' | 'mixed' | 'unknown';
  limitations: string[];
}
```

`baselineRange` 是个人历史范围，不是医学正常范围。

第一版 `baselineRange` 推荐使用 P25 - P75。若实现工具不足，可先用 median +/- MAD，但必须在 limitations 中说明。

`direction` 不应直接展示给用户。用户可见输出必须映射到 [状态判定规则](./state-decision-rules.md) 中的三类状态。

## 样本门槛

0.2.8 v1 采用保守门槛，具体阈值见 [状态判定规则](./state-decision-rules.md)：

- 当前样本过少：只展示事实。
- baseline 样本过少：不建立个人范围。
- 覆盖不足：降级 confidence。
- 用户可见 confidence 最高为 medium。

## 缺失数据

必须显式处理：

- 日记缺失。
- 指标未记录。
- 快速记录缺少细节。
- 导入数据缺少字段。
- schema 迁移默认值。

缺失数据多时，输出优先级应从“偏离提示”降级为“记录缺口提示”。

## 非目标

- 不输出“异常”。
- 不输出“风险等级”。
- 不输出“你应该达到某个值”。
- 不持久化 baseline 结果。
- 不用外部人群数据。
