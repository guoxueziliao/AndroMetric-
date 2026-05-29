# 0.2.9 刀 3 解释卡片引擎

> 本文定义解释卡片的生成、排序、confidence 和文案边界。

## 输入

- 0.2.8 changed metric。
- context window facts。
- record gaps。
- safety limitations。

## 输出

输出 `ContextExplanationCard`，结构见 [解释层产品契约](./explanation-layer-contract.md)。

## 生成规则

- 每个 changed metric 最多 3 张解释卡片。
- 优先展示样本较完整的上下文。
- 记录缺口卡片优先于弱解释卡片。
- 0.2.5 / 0.2.7 条件上下文不抢占首屏。

## 排序建议

第一版排序：

1. 睡眠 / 压力。
2. 性负荷 / 恢复。
3. 色情使用。
4. 运动。
5. 目标历史。
6. 关系 / 周期上下文。

排序不表示因果强弱。

## 文案模板

允许：

- “变化窗口内 {context} 记录较多，建议结合 {metric} 一起观察。”
- “{context} 记录缺口较多，暂不解释 {metric} 的变化。”
- “{context} 与 {metric} 可以放在同一窗口回看。”

禁止：

- “{context} 导致 {metric} 变化。”
- “主要原因是 {context}。”
- “你应该停止 / 增加 {behavior}。”

## Confidence

- `none`：只展示事实或缺口。
- `low`：样本有限。
- `medium`：样本较稳定，但仍不下因果结论。

不输出 high。

## 验收

- 每张卡片都有窗口、样本和 limitations。
- 没有原因排序。
- 没有诊断、预测或强行动建议。
- 没有伴侣归因。
