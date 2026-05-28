# 0.2.4 Training Data Model

> 本文档是 0.2.4 新增数据模型的前置设计文档。
> 只有本文档确认后，才允许进入 `core/storage/db.ts` 和 `core/storage/migration.ts` 的 schema 开发。

## Status

- 状态：讨论中。
- 所属版本：0.2.4。
- 关联计划：[plan-0.2.4.md](./plan-0.2.4.md)。
- 目标：用最小数据模型支撑“训练建议 + 进度反馈 + 轻目标”。

## Model Principle

0.2.4 的数据模型只服务长期自我管理，不服务游戏化刺激。

允许建模：

- 用户正在关注的健康 / 表现 / 关系目标。
- 用户对目标的周期回顾。
- 目标与既有成人行为、硬度、恢复、睡眠、疲劳、满意度数据的轻关联。

不允许建模：

- 伴侣评分或排名。
- 性次数、射精次数、伴侣数量挑战。
- 色情使用时长挑战。
- 色情刺激等级追逐。
- 成瘾判定。
- 医学诊断结论。
- 社交分享或公开传播。

Safety Rails：

- 数据模型不能支持被禁止的目标类型。
- `category` 不能包含性次数、射精次数、伴侣数量、色情使用时长、色情刺激强度等挑战类型。
- 模型不能产生伴侣评分、伴侣排名或伴侣优劣判断。
- 高负荷 / 低恢复状态下，目标推荐只能落到恢复或记录质量。

## Candidate Entities

### TrainingGoal

`TrainingGoal` 表示用户当前选择的轻目标。

候选字段：

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | string | yes | stable id |
| `createdAt` | ISO datetime | yes | 创建时间 |
| `updatedAt` | ISO datetime | yes | 更新时间 |
| `status` | enum | yes | `active` / `paused` / `completed` / `archived` |
| `category` | enum | yes | 目标类型 |
| `title` | string | yes | 展示标题 |
| `description` | string | no | 用户可编辑说明 |
| `startDate` | `YYYY-MM-DD` | yes | 使用项目统一生理日规则，03:00 前归前一天 |
| `targetWindowDays` | number | yes | 0.2.4 默认只支持 7 / 14 |
| `source` | enum | yes | `manual` / `suggested` |
| `linkedInsightId` | string | no | 如果来自 0.2.3 复盘建议；0.2.4 只关联一个来源 insight |

候选 `category`：

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

### GoalCheckin

`GoalCheckin` 表示用户对某个轻目标的周期回顾。

候选字段：

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | string | yes | stable id |
| `goalId` | string | yes | linked `TrainingGoal.id` |
| `createdAt` | ISO datetime | yes | 创建时间 |
| `targetDate` | `YYYY-MM-DD` | yes | 用于日历和生理日归属 |
| `windowStartDate` | `YYYY-MM-DD` | no | 回顾窗口开始 |
| `windowEndDate` | `YYYY-MM-DD` | no | 回顾窗口结束 |
| `cycleFeeling` | number | no | 1-5，本周期感受，不命名为评分 |
| `status` | enum | yes | `continue` / `pause` / `complete` / `adjust` |
| `note` | string | no | 用户备注 |

## Confirmed Model Details

### Date Rule

`TrainingGoal.startDate` 和 `GoalCheckin.targetDate` 使用项目统一生理日规则：

> 03:00 前发生的记录归属于前一天。

原因：

- 与既有事件、复盘和趋势统计保持一致。
- 性行为、自慰、色情使用和事后恢复经常跨过自然日零点。
- 训练目标和 check-in 如果使用自然日，会和成人行为复盘产生日期错位。

### Goal Title

`TrainingGoal.title` 使用模板生成默认标题，但允许用户编辑。

默认标题示例：

- “7 天恢复观察”
- “14 天硬度稳定观察”
- “7 天记录质量补全”
- “14 天关系沟通观察”

规则：

- 系统推荐候选目标时可以生成默认标题。
- 用户确认创建前可以修改标题。
- 用户创建后仍可以编辑标题。
- 标题不能用于生成被 Safety Rails 禁止的挑战目标。

### Cycle Feeling

`GoalCheckin` 支持 1-5 的周期主观感受，但不命名为评分。

推荐字段名：

- `cycleFeeling`

推荐展示文案：

- “本周期感受”
- “这段时间感觉如何”

避免命名：

- “能力评分”
- “表现评分”
- “性能力分”
- “伴侣评分”

UI 规则：

- `cycleFeeling` 非必填。
- 用户可以只选择 check-in 状态。
- `cycleFeeling` 不用于排名、惩罚或失败判断。

### Target Window

0.2.4 默认只支持：

- 7 天。
- 14 天。

30 天目标周期暂不进入默认能力，作为后续增强。

原因：

- 0.2.4 需要先验证轻目标闭环。
- 7 / 14 天更适合恢复、记录质量、硬度稳定、射精控制观察和关系沟通。
- 30 天容易让轻目标变成长期计划系统，超出本版本范围。

### Insight Link

0.2.4 一个 `TrainingGoal` 只关联一个来源 insight。

原因：

- 避免模型复杂化。
- 避免目标解释变得混乱。
- 多 insight 聚合可以后续再做。

如果目标由用户手动创建，`linkedInsightId` 可以为空。

### Description And Note UI

`TrainingGoal.description`：

- 数据模型支持。
- 快速创建不展示。
- 完整编辑展示。
- 不参与规则建议和 Safety Rails 之外的自动判断。

`GoalCheckin.note`：

- 数据模型支持。
- 快速 check-in 不展示。
- 完整编辑展示。
- 不参与自动诊断、伴侣评分、能力评分或强因果判断。

## Generated, Not Persisted By Default

### TrainingSuggestion

0.2.4 默认不把 `TrainingSuggestion` 做成持久化表。

原因：

- 建议可以从 0.2.3 复盘、近期记录、样本量和可信度规则即时生成。
- 过早保存建议历史会增加导入导出、迁移、过期建议清理和解释成本。
- 当前版本更需要稳定的目标闭环，而不是复杂建议系统。

如果后续确认必须保存，另开小节补字段，并明确为什么不能即时生成。

建议系统边界：

- 建议只能由本地规则生成。
- 不叫 AI。
- 不调用外部大模型 API。
- 不上传成人行为、色情使用、性表现、伴侣关系数据。
- 只要 AI 不能本地部署，AI 功能就不做。

轻目标创建边界：

- 规则建议可以生成轻目标候选。
- 系统不自动创建 `TrainingGoal`。
- 只有用户确认“开始”后才持久化 `TrainingGoal`。
- 被忽略或稍后的候选目标默认不保存。
- 用户可以编辑标题、周期和备注后再创建。

## Migration Requirements

如果 0.2.4 最终新增 `TrainingGoal` / `GoalCheckin`：

- `core/storage/db.ts` 必须新增对应 stores。
- `core/storage/migration.ts` 必须新增迁移步骤。
- 导出 / 导入 / 快照必须包含新数据。
- 旧数据导入时，新表默认为空，不生成伪目标。
- 删除目标不应删除历史成人行为事件或硬度记录。
- `GoalCheckin` 缺失时，目标仍应可展示和归档。

## Open Questions

1. 0.2.1 收尾后是否有 UI 组件接口变化需要同步到 0.2.4。

## Current Decision

已确认：

> 0.2.4 允许新增最小数据模型，但必须先写模型文档，再开发 schema。

> 轻目标采用系统推荐、用户手动确认；不自动创建目标。

> 模型细节已确认：日期使用生理日规则；标题模板生成但允许编辑；check-in 支持 1-5 的“本周期感受”；默认周期只做 7 / 14 天；一个目标只关联一个来源 insight。

> UI 暴露已确认：description 只在完整编辑显示；note 只在完整编辑显示；cycleFeeling 非必填。

下一步讨论：

> 如何避免养成系统诱导高风险性行为。
