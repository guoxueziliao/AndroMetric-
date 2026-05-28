# 0.2.3 刀 54 执行拆解

> 本文只规划刀 54：弱相关观察。它承接刀 52 的事实聚合和刀 53 的 confidence gating。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 53 完成后执行。
- 实现边界：第一批弱相关 insight，不输出强因果。

## 必读文档

1. [`weak-correlation-insights.md`](./weak-correlation-insights.md)
2. [`confidence-rules.md`](./confidence-rules.md)
3. [`review-engine.md`](./review-engine.md)

## 第一批范围

- 睡眠与晨间硬度。
- 性活动负荷与疲劳。
- Porn use 与次日晨间硬度。
- Masturbation 与满意度 / 恢复。
- Sex 与硬度 / 满意度 / 恢复。
- 记录质量与可信度。

## 输出要求

每条 insight 必须包含：

- `sampleSize`
- `confidence`
- `supportingFacts`
- `limitations`

## Tests

必须覆盖：

- 每类 insight 的 happy path。
- 样本不足时不输出判断。
- supporting facts 存在。
- limitations 存在。
- 禁止文案不出现在 summary 或 template 中。

## 非目标

- 不做医学诊断。
- 不做成瘾判定。
- 不做强因果。
- 不评价成人偏好。
- 不评价伴侣优劣。
- 不做训练建议或目标推荐。

## 交接给刀 55

刀 55 只展示通过 gating 的 insight preview，并保留 sampleSize / confidence / limitations。
