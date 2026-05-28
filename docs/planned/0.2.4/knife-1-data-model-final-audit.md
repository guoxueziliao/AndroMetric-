# 0.2.4 刀 1 数据模型最终审计清单

> 本文只规划刀 1：训练数据模型文档定稿。刀 1 完成前，不进入 `core/storage/db.ts` 或 `core/storage/migration.ts` 的实现。

## 目标

刀 1 的目标是把 [`training-data-model.md`](./training-data-model.md) 推进为可实现的数据契约。

完成后必须明确：

- `TrainingGoal` 和 `GoalCheckin` 的最终字段。
- 哪些值允许进入数据库，哪些值必须被拒绝或降级。
- 导入、导出、快照和旧数据迁移的边界。
- Safety Rails 是否能挡住禁用目标、禁用文案和禁用指标绕过。

## 必须确认的持久化概念

0.2.4 默认只持久化：

- `TrainingGoal`
- `GoalCheckin`

默认不持久化：

- `TrainingSuggestion`
- `TrainingPlan`
- `Milestone`
- `Badge`
- `Level`

如果刀 1 发现必须持久化 `TrainingSuggestion`，必须停止推进并补充新的模型讨论，不在刀 1 中顺手扩大范围。

## TrainingGoal 定稿决策

字段必须确认：

- `id`：stable id。
- `createdAt`：ISO datetime。
- `updatedAt`：ISO datetime。
- `status`：只允许 `active` / `paused` / `completed` / `archived`。
- `category`：只允许 allowlist 内的目标类型。
- `title`：用户可编辑，但需要通过 Safety Rails 文案检查。
- `description`：可选，只在完整编辑展示，不参与自动建议。
- `startDate`：`YYYY-MM-DD`，使用 03:00 生理日规则。
- `targetWindowDays`：0.2.4 只允许 `7` / `14`。
- `source`：只允许 `manual` / `suggested`。
- `linkedInsightId`：可选，最多一个来源 insight。

允许 `category`：

- `record_quality`
- `recovery`
- `hardness_stability`
- `sex_performance_stability`
- `ejaculation_control_observation`
- `relationship_communication`

禁止 `category`：

- `sex_count_challenge`
- `ejaculation_count_challenge`
- `partner_count_challenge`
- `porn_duration_challenge`
- `porn_stimulation_challenge`
- `longest_sex_challenge`
- `partner_ranking`
- `partner_score`

已定：

- domain 层需要提供 `isTrainingGoalCategory` 或等价 allowlist helper。
- import preview / import normalize 阶段必须检查 `category`。
- 未知或禁用 `category` 不进入 active 数据；整条 `TrainingGoal` 跳过，并产生 integrity warning。
- `targetWindowDays` 只允许 7 / 14。
- `targetWindowDays` 不是 7 / 14 时，整条 `TrainingGoal` 跳过，并产生 integrity warning。
- `source = suggested` 只表示来源，不代表系统已经自动创建；创建仍必须来自用户确认。

## GoalCheckin 定稿决策

字段必须确认：

- `id`：stable id。
- `goalId`：关联 `TrainingGoal.id`。
- `createdAt`：ISO datetime。
- `targetDate`：`YYYY-MM-DD`，使用 03:00 生理日规则。
- `windowStartDate`：可选。
- `windowEndDate`：可选。
- `cycleFeeling`：可选，只允许 1 - 5。
- `status`：只允许 `continue` / `pause` / `complete` / `adjust`。
- `note`：可选，只在完整编辑展示，不参与自动诊断。

已定：

- `goalId` 指向不存在目标时，保留 `GoalCheckin`，标记 orphan integrity warning；UI 可在实现时选择隐藏或展示为缺口，但导入层不静默删除。
- `cycleFeeling` 超出 1 - 5 时，将 `cycleFeeling` 置空，并产生 integrity warning；不因单个感受字段丢弃整条 check-in。
- `windowStartDate` / `windowEndDate` 缺失时，可以由目标 `startDate` 和 `targetWindowDays` 推导展示窗口；如果无法推导，保留为空。
- `windowStartDate` 晚于 `windowEndDate` 时，两个字段都置空，并产生 integrity warning。

## 状态转换定稿

`TrainingGoal.status` 至少需要明确：

- `active` 可以变为 `paused` / `completed` / `archived`。
- `paused` 可以变为 `active` / `archived`。
- `completed` 可以变为 `archived`。
- `archived` 默认不自动恢复为 active。

`GoalCheckin.status` 只表达本次回顾选择，不等同于目标最终状态。

已定：

- check-in 选择 `pause` 后，同步把目标置为 `paused`。
- check-in 选择 `complete` 后，同步把目标置为 `completed`。
- check-in 选择 `continue` 后，目标保持或回到 `active`。
- check-in 选择 `adjust` 只进入编辑流程，不自动创建新目标。
- 归档目标时保留历史 check-in。

## Safety Rails 绕过点

刀 1 必须检查以下绕过点：

- 用户编辑 `title` 写入禁用挑战文案。
- 用户编辑 `description` 写入伴侣评分、排名或羞辱文案。
- 用户在 `note` 中写入强因果、成瘾判定或伴侣优劣判断。
- 导入文件包含未知或禁用 `category`。
- 导入文件包含 30 / 60 / 90 天目标周期。
- 导入文件包含自动创建的 suggested 目标，但缺少用户确认来源。

0.2.4 不要求自动审查用户自由备注全文，但系统生成的 title、description、suggestion、empty state、toast、confirm 必须通过 Safety Rails。

## 导入 / 导出 / 快照定稿

已定：

- JSON export 包含 `TrainingGoal` 和 `GoalCheckin`。
- JSON import 能保留 `TrainingGoal` 和 `GoalCheckin`。
- Markdown / CSV export 默认不包含训练目标和 check-in 数据；原因是 0.2.4 的训练数据属于长期自我管理状态，优先通过 JSON backup 完整保留。若后续要导出报告摘要，另走报告层，不作为数据可迁移格式。
- Snapshot integrity 包含目标和 check-in 数量。
- 旧数据导入时，新表为空，不生成伪目标。
- 导入缺字段数据时，不用假默认值制造目标状态。

建议测试样本：

- 空训练数据。
- 一个 active 目标，无 check-in。
- 一个 completed 目标，多个 check-in。
- 一个 archived 目标，保留历史 check-in。
- 一个导入文件包含禁用 category。
- 一个 check-in 指向缺失 goal。

## Schema 前置结论

已定候选：

- store 名称候选：`training_goals`、`goal_checkins`。
- `training_goals` index 候选：`id`、`status`、`category`、`startDate`、`updatedAt`。
- `goal_checkins` index 候选：`id`、`goalId`、`targetDate`、`createdAt`。
- migration 默认值：新 store 为空，不从旧数据生成目标。
- import/export 字段映射：JSON 使用 `trainingGoals`、`goalCheckins`。
- integrity warning 规则：未知 enum、禁用 category、非法周期、orphan check-in、非法 cycleFeeling、非法 window range 都必须产生 warning。

若这些结论未明确，不进入刀 2。

## 刀 1 不做

- 不改 `core/storage/db.ts`。
- 不改 `core/storage/migration.ts`。
- 不实现 UI。
- 不实现建议系统。
- 不持久化 `TrainingSuggestion`。
- 不新增完整训练计划、徽章、等级或连续挑战。

## 交接给刀 2

刀 1 完成后，刀 2 才能进入 schema / migration / import-export。

刀 2 的输入必须包括：

- 定稿后的 `TrainingGoal` / `GoalCheckin` 字段表。
- 允许 enum 与禁止 enum。
- 状态转换规则。
- 导入 normalize / reject 策略。
- snapshot integrity 策略。
