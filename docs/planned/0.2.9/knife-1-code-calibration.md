# 0.2.9 刀 1 代码校准清单

> 本文定义 0.2.9 实现前的第一刀。目标是确认解释层能读取哪些真实数据。

## 必查入口

0.2.8 个人常态：

- personal normal 派生模型真实位置。
- `PersonalNormalResult` 是否存在。
- changed metrics 是否可得。

统计与事件：

- `features/stats/model/StatsEngine.ts`
- `features/stats/model/eventAdapter.ts`
- adult behavior events。

0.2.3 复盘：

- `adultBehaviorReviewFacts.ts`
- `adultBehaviorReviewConfidence.ts`
- `adultBehaviorReviewInsights.ts`

条件依赖：

- 0.2.5 training goal / check-in。
- 0.2.7 relationship / cycle context。

## 校准输出

刀 1 必须输出：

- 可读取的上下文来源。
- 不可读取或未落地的数据源。
- 每个来源的缺失语义。
- 是否需要新字段，默认应为否。
- 第一版解释卡片来源清单。

如果 0.2.8 未落地，0.2.9 不进入实现。

## 第一层上下文

优先校准：

- 睡眠。
- 压力。
- 性负荷。
- 恢复 / 疲劳。
- 色情使用。
- 运动。

这些上下文必须来自现有数据，不新增用户输入。

## 隐藏规则

- 0.2.5 未落地：隐藏目标历史上下文。
- 0.2.7 未落地：隐藏关系 / 周期上下文。
- 样本不足：只展示事实。
- 旧字段含义不清：加入 limitations。

## 停下来重谈

- 需要新增 schema。
- 需要读取 notes 全文。
- 需要外部数据。
- 需要把 0.2.5 / 0.2.7 未落地能力当作已存在。
