# 0.2.5 刀 1 代码状态与数据校准

> 本文只规划刀 1：进入 0.2.5 实现前，确认 0.2.4 的真实代码状态和可复用数据。它不新增产品能力。

## 状态

- 所属版本：0.2.5。
- 当前阶段：待实现前执行。
- 前置：0.2.4 已完成训练建议、轻目标和 check-in 闭环。
- 实现边界：代码入口、数据形态、UI 承载能力和是否仍然不需要 schema。

## 目标

刀 1 完成后，开发窗口应知道 0.2.5 能否直接复用 0.2.4 数据进入目标历史工作台。

必须确认：

- `TrainingGoal` 是否已经持久化。
- `GoalCheckin` 是否已经持久化。
- 目标 status / category / targetWindowDays 是否符合 0.2.4 allowlist。
- check-in 是否能按 goalId 和时间读取。
- import / export / snapshot integrity 是否包含训练数据。
- 成人行为复盘 / 统计区域是否能承载二级工作台。
- Dashboard 是否已有轻提示入口。

## 代码入口清单

实现前优先检查：

- `domain/types/`
- `core/storage/db.ts`
- `core/storage/migration.ts`
- `core/storage/StorageService.ts`
- JSON export / import 入口。
- snapshot integrity 入口。
- stats / insights / adult behavior review 相关 feature。
- Dashboard 相关 feature。

最终文件名以实现时真实代码为准。

## 数据校准

如果存在 `TrainingGoal`，必须确认：

- `status` 只包含 active / paused / completed / archived。
- `category` 只包含 0.2.4 allowlist。
- `targetWindowDays` 只包含 7 / 14。
- `sourceInsightId` 可缺省，但不能被当成必需字段。
- archived 目标不会丢失 check-in。

如果存在 `GoalCheckin`，必须确认：

- `goalId` 可用于关联目标。
- orphan check-in 被保留并可作为完整性提示。
- `cycleFeeling` 不被展示成评分。
- windowStartDate / windowEndDate 仍遵守 0.2.4 normalize 规则。

## 停下来重谈

出现以下情况，不进入刀 2：

- 0.2.4 训练目标尚未实现。
- 训练目标没有可稳定读取的 status。
- check-in 无法按 goalId 回看。
- 目标历史必须依赖新增 store 才能展示。
- 需要新增 TrainingPlan / GoalTemplate / Badge / Level。
- 复盘 / 统计入口完全无法承载二级工作台。

## 验收

刀 1 完成时必须输出：

- 真实代码入口清单。
- `TrainingGoal` / `GoalCheckin` 当前字段确认。
- 是否仍然默认不新增 schema / migration。
- 目标历史工作台入口位置。
- Dashboard 轻入口是否可复用。
- 进入刀 2 的明确结论。

## 非目标

- 不实现目标历史 UI。
- 不新增 schema / migration。
- 不新增 Training 顶级导航。
- 不修复 0.2.4 之外的历史问题。
- 不把研究草案中的候选能力提前实现。
