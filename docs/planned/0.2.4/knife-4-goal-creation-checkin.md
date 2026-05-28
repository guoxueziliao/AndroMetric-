# 0.2.4 刀 4 轻目标创建与 Check-in

> 本文只规划刀 4：把刀 3 的候选轻目标接入用户确认、创建和周期回顾流程。它不新增建议规则，也不做完整训练中心。

## 状态

- 所属版本：0.2.4。
- 当前阶段：待刀 3 完成后执行。
- 前置：[`knife-3-rule-based-suggestions.md`](./knife-3-rule-based-suggestions.md)。
- 实现边界：候选目标展示、用户确认、`TrainingGoal` 创建、到期 check-in。

## 目标

刀 4 完成后，用户可以从复盘后的候选建议中手动开始一个轻目标，并在周期结束后完成 check-in。

必须满足：

- 系统不自动创建目标。
- 用户必须点击“开始”才创建 `TrainingGoal`。
- 忽略 / 稍后不保存候选目标。
- 目标周期只允许 7 / 14 天。
- check-in 支持继续、暂停、完成、调整。
- `cycleFeeling` 非必填，不叫评分。

## 创建流程

从刀 3 输入：

- 1 - 3 条 `TrainingSuggestion`。
- 0 - 3 个 `TrainingGoalDraft`。
- 每个 draft 已通过 Safety Rails。

用户操作：

- `开始`：进入快速创建。
- `忽略`：不保存候选。
- `稍后`：不保存候选，后续可重新由规则生成。

快速创建展示：

- 默认标题。
- 目标类型。
- 周期：7 / 14。
- 触发原因。
- 样本量 / 可信度提示。

完整编辑才展示：

- `description`。
- 更完整的备注说明。

## TrainingGoal 创建规则

创建时必须写入：

- `id`
- `createdAt`
- `updatedAt`
- `status = active`
- `category`
- `title`
- `startDate`
- `targetWindowDays`
- `source`
- `linkedInsightId` 可选

规则：

- `category` 必须来自 allowlist。
- `targetWindowDays` 只能是 7 / 14。
- `title` 可编辑，但系统默认标题必须通过 Safety Rails。
- `description` 可选。
- `source = suggested` 仍代表用户确认后的建议来源，不代表系统自动创建。

## Check-in 流程

到期后进入 check-in。

快速 check-in 展示：

- 目标标题。
- 目标周期。
- 本周期摘要。
- 状态选择：继续、暂停、完成、调整。
- 可选 `cycleFeeling`：1 - 5，本周期感受。

完整编辑才展示：

- `note`。

状态效果：

- `continue`：目标保持或回到 `active`。
- `pause`：目标置为 `paused`。
- `complete`：目标置为 `completed`。
- `adjust`：进入编辑流程，不自动创建新目标。

归档：

- 用户可归档目标。
- 归档目标保留历史 check-in。
- 归档不删除成人行为事件、硬度记录或复盘数据。

## UI 边界

必须避免：

- 失败惩罚。
- 能力扣分。
- 连续打卡压力。
- 羞辱式提醒。
- 自动推送焦虑文案。
- 把目标当成任务列表。

允许：

- 温和提醒 check-in。
- 显示当前 active 目标。
- 显示即将到期目标。
- Dashboard 轻提示。

## 测试边界

必须覆盖：

- 开始候选目标后创建 `TrainingGoal`。
- 忽略候选目标不保存。
- 稍后候选目标不保存。
- 7 / 14 周期可创建。
- 30 天周期不能创建。
- check-in `continue` 保持 active。
- check-in `pause` 设置 paused。
- check-in `complete` 设置 completed。
- check-in `adjust` 不自动创建新目标。
- 归档目标保留历史 check-in。
- `cycleFeeling` 可为空。
- `note` 不参与自动诊断或评分。

## 非目标

- 不新增建议规则。
- 不实现完整目标历史中心。
- 不新增独立 Training 页面。
- 不做打卡 streak。
- 不做失败判定。
- 不做成就、徽章或等级。

## 交接给刀 5

刀 5 可以依赖：

- 用户可以创建 active goal。
- 用户可以完成 check-in。
- Dashboard / 复盘入口可以读取 active goal 和到期 check-in 摘要。
