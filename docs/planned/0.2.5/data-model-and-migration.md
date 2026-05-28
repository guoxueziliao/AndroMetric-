# 0.2.5 数据模型与迁移边界

> 本文负责 0.2.5 的数据模型和迁移边界。

## 默认结论

0.2.5 默认不新增 schema / migration。

原因：

- 0.2.4 已经引入 `TrainingGoal` 和 `GoalCheckin`。
- 0.2.5 的主要价值是历史视图、筛选、摘要和反馈。
- 这些能力优先从既有数据派生，不应过早扩表。

## 可复用数据

0.2.5 优先复用：

- `TrainingGoal`
- `GoalCheckin`
- 目标状态。
- 目标 category。
- check-in 状态。
- `cycleFeeling`
- 0.2.3 review facts / insights。
- 0.2.4 rule suggestions 的即时结果。

## 派生数据

以下内容默认运行时派生：

- active goal 数量。
- paused / completed / archived 目标数量。
- category 分布。
- check-in 完成情况。
- orphan check-in 提示。
- 跨周期摘要。
- 目标历史筛选结果。

## 停下来重谈的情况

如果实现时需要以下内容，必须停止推进并回到规划：

- `TrainingPlan`
- `TrainingSuggestionHistory`
- `GoalTemplate`
- `Milestone`
- `Badge`
- `Level`
- long-term aggregate cache
- 独立关系管理表

0.2.5 不允许在实现中顺手新增上述模型。

## 导入导出

0.2.5 默认不改变 0.2.4 JSON backup 契约：

- `trainingGoals`
- `goalCheckins`

如果新增 Training Center 导出摘要，默认只作为报告文本，不作为可迁移数据格式。

## Snapshot integrity

继续复用 0.2.4 的 integrity 统计：

- training goal 数量。
- goal check-in 数量。
- orphan check-in 数量。

0.2.5 可以在 UI 中展示完整性提示，但不改变底层语义。
