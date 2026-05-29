# 0.2.9 解释层产品契约

> 本文定义解释层的输入、输出和卡片边界。0.2.9 的输出只用于观察，不用于诊断或自动干预。

## 输入

优先输入：

- 0.2.8 `PersonalNormalResult`。
- 0.2.3 review facts。
- `StatsEngine` metric series。
- adult behavior events。
- logs 中的睡眠、压力、运动、酒精、屏幕、天气 / 地点等字段。

条件输入：

- 0.2.5 training goal / check-in。
- 0.2.7 relationship context。
- 0.2.7 cycle / reproductive context。

## 输出

建议输出解释卡片：

```ts
interface ContextExplanationCard {
  id: string;
  metricId: string;
  contextType: string;
  windowDays: 14 | 30;
  message: string;
  sampleSize: number;
  confidence: 'none' | 'low' | 'medium';
  limitations: string[];
}
```

不输出 high confidence。

## 卡片语气

允许：

- “这段时间睡眠记录偏少，暂不判断趋势。”
- “变化窗口内压力记录较多，建议结合恢复记录一起看。”
- “性负荷变化和恢复反馈可以放在一起观察。”

禁止：

- “睡眠导致了硬度下降。”
- “色情使用造成了问题。”
- “某个伴侣让你状态变差。”
- “你应该停止某行为。”

## Confidence

沿用 0.2.8：

- `none`：只展示事实。
- `low`：样本有限。
- `medium`：样本较稳定，但仍不下因果结论。

## 与训练建议边界

0.2.9 不自动创建目标。

如果需要行动，只能提示：

- “可以在训练中心查看相关目标。”
- “可以继续观察 14 天。”

不直接生成训练计划。
