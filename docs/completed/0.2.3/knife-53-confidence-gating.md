# 0.2.3 刀 53 执行拆解

> 本文只规划刀 53：样本量与可信度守门。它承接刀 52 的窗口事实，不负责生成具体业务 insight。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 52 完成后执行。
- 实现边界：`ReviewConfidence`、样本门槛、limitations 和 gating helpers。

## 必读文档

1. [`confidence-rules.md`](./confidence-rules.md)
2. [`weak-correlation-insights.md`](./weak-correlation-insights.md)
3. [`review-input-and-timeline.md`](./review-input-and-timeline.md)

## 目标

完成后应具备：

- `ReviewConfidence = none | low | medium | high`。
- 初始样本门槛。
- limitations 生成规则。
- insight gating helper。
- UI 层无法拿到不带 sampleSize / confidence / limitations 的 insight。

## 初始规则

- `sampleSize < 3`：`none`，只展示事实。
- `3 <= sampleSize < 7`：`low`，轻提示。
- `sampleSize >= 7`：可考虑 `medium`，但必须检查波动和缺失数据。
- 0.2.3 默认不主动输出 `high`。

## Tests

必须覆盖：

- 样本不足时 confidence 为 `none`。
- `none` 不进入 insight preview。
- `low` 不被写成确定结论。
- limitations 不为空。
- missing data 会降低或限制 confidence。

## 非目标

- 不实现具体弱相关观察。
- 不写 UI 文案模板。
- 不做诊断、成瘾判定或强因果。
- 不新增 schema / migration。

## 交接给刀 54

刀 54 只能使用通过 gating 的 facts 输出第一批弱相关观察。
