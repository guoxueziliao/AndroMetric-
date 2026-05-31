# 0.2.21 孤立关系检测与清理

## 什么是孤立关系

一条记录引用了一个已不存在的目标 id。当前只检测 `logs` 内 `sex[].partner`，且只报告不修。本版扩展检测范围，并提供可选清理。

## 检测清单

| 孤儿来源 | 引用字段 | 目标表 | 判定 |
|---|---|---|---|
| `sex_events` | `partnerId` | `partners` | 目标 id 不存在 |
| `cycle_events` / `pregnancy_events` | `partnerId`（如有） | `partners` | 目标 id 不存在 |
| `goal_checkins` | `goalId` | `training_goals` | 目标 id 不存在 |
| `health_project_plans` | `projectId` | `health_projects` | 目标 id 不存在 |
| `health_project_logs` | `projectId` / `planId` | `health_projects` / `health_project_plans` | 目标 id 不存在 |
| `logs` | `sex[].partner` | `partners` | 现有检测，纳入统一口径 |

## 清理策略（每类可选，需确认）

清理动作分两种，按数据语义选择，开发前在交接里逐类确认：

- **解除引用**：保留记录，把失效外键置空 / 标记未知。适用于「记录本身有价值，只是关联丢失」（如 `sex_events.partnerId`）。
- **移除孤儿记录**：删除完全依附于已删父记录、独立无意义的子记录。适用于强从属关系（如引用已删项目的 `health_project_logs`）。

约束：

- 每类孤儿单独列出、单独确认，不一键全删。
- 清理前必须建快照（复用 `handleRepairData` 前置）。
- 清理后重新体检，反馈处理条数。
- 默认倾向「解除引用」而非删除；删除仅用于明确强从属且无独立价值的记录。

## 边界

- 不静默清理、不自动后台清理。
- 不把孤儿数量解释为健康问题或风险。
- 若某类关系无法从现有字段判定父子归属，列入停线项，不猜测删除。
