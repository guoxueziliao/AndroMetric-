# 0.2.8 刀 1 代码校准清单

> 本文定义 0.2.8 实现前的第一刀。目标是先校准真实代码能力，再决定哪些指标能进入个人常态 v1。

## 必查入口

统计与事件：

- `features/stats/model/StatsEngine.ts`
- `features/stats/model/eventAdapter.ts`
- `features/stats/model/p3Fatigue.ts`
- `features/stats/model/p3Windows.ts`
- `features/stats/model/p3Scoring.ts`

0.2.3 复盘：

- `features/stats/model/adultBehaviorReviewInput.ts`
- `features/stats/model/adultBehaviorReviewFacts.ts`
- `features/stats/model/adultBehaviorReviewConfidence.ts`
- `features/stats/model/adultBehaviorReviewInsights.ts`
- `features/stats/ui/ReviewSection.tsx`

入口与展示：

- `features/stats/StatsView.tsx`
- `features/dashboard/Dashboard.tsx`
- `features/dashboard/TrendsPanel.tsx`
- `features/dashboard/ImpactFindings.tsx`

类型依赖：

- `domain/types/log.ts`
- `domain/types/adultBehavior.ts`
- `domain/types/training.ts`
- `domain/types/reproductive.ts`

## 校准输出

刀 1 必须输出一份实现记录，至少包含：

- 每个第一层指标的真实 dataSource。
- 当前窗口和 baseline 窗口是否能从现有数据派生。
- 缺失值是 `null`、跳过还是可信 `0`。
- 是否需要新增 schema，默认答案应为否。
- 是否依赖 0.2.5 / 0.2.7 的真实代码落地。
- 哪些第二层指标暂时隐藏。

如果输出结果和规划文档不同，以真实代码为准，并回改 0.2.8 文档。

## 第一层指标核对

硬度 / 晨勃：

- 确认 `morning_wood` event 是否只在用户真实记录后生成。
- 缺失硬度不能按 0 计入。

恢复 / 疲劳：

- 确认可复用 `fatigueAfter`、`recoveryFeeling`、p3 fatigue 或 review facts。
- 若只有间接 fatigueCost，UI 必须显示 limitation。

睡眠 / 压力：

- 确认睡眠 start/end 缺失时不估算时长。
- 压力缺失不默认 0。

性负荷：

- 确认 sex / masturbation event 的计数和 ejaculation 加权口径。
- 有可信日记但无事件的日期可为 0；无日记日期仍为缺失。

## 依赖版本

0.2.5 目标历史未真实落地时：

- 不显示目标历史指标。
- 不读取 training goal / check-in。

0.2.7 关系上下文未真实落地时：

- 不显示关系上下文指标。
- 不把伴侣、周期或沟通内容纳入个人常态判断。

## 停下来重谈

出现以下情况应停止实现：

- 第一层指标需要新字段才能计算。
- 需要把 scalar 缺失值填成 0。
- 需要新增 baseline cache store。
- 需要改变 JSON backup 或 CSV 契约。
- 需要把 0.2.5 / 0.2.7 的未落地能力当作已存在。
