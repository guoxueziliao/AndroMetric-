# 0.2.21 体检覆盖扩展

## 现状

`runHealthCheck()` 只读 `db.logs` + `db.partners`，传入 `checkDataHealth`。`DataHealthReport` 已有：

- 三维评分 structure / completeness / analytics（0-100）。
- `HealthIssue` 列表（`type`: schema / missing_field / logic / relation / content）。
- `stats`：missingSleep / missingHealth / nullArrays / brokenRelations / missingIds / completeness / analyticsAvailability / contentIssues。
- `brokenRelations`：仅 `logs` 内 `sex[].partner` 引用不存在伴侣。

## 需纳入体检的表

| 表 | 结构检查 | 关系检查（外键） |
|---|---|---|
| `sex_events` | id / 必填字段 | `partnerId` → `partners` |
| `masturbation_events` | id / 必填字段 | tag 引用（如有） |
| `porn_use_events` | id / 必填字段 | type / platform 完整性 |
| `training_goals` | id / 必填字段 | — |
| `goal_checkins` | id / 必填字段 | `goalId` → `training_goals` |
| `cycle_events` | id / 日期合法 | `partnerId` → `partners`（如有） |
| `pregnancy_events` | id / 日期合法 | `partnerId` → `partners`（如有） |
| `health_projects` | id / 必填字段 | — |
| `health_project_plans` | id / 必填字段 | `projectId` → `health_projects` |
| `health_project_logs` | id / 必填字段 | `projectId` / `planId` → 上级 |

> 实际外键字段名以 `domain/types/*` 为准；开发前校准时核对，不臆造字段。

## 报告扩展原则

- 扩展 `DataHealthReport.stats`，按表增加结构 / 缺字段 / 孤立引用计数。
- 复用现有 `HealthIssue` 形态，`path` 标注 `表名[索引].字段`。
- **不改三维评分公式**：新统计可展示、可计 issue 数，但 structure / completeness / analytics 的算法保持不变。若希望新表参与评分，必须停下来单独讨论口径，本版不默认纳入评分。

## 验收

- `runHealthCheck` 读取全部事件表。
- 报告能按表展示问题数。
- 相同输入下三维评分与扩展前一致（算法未变）。
