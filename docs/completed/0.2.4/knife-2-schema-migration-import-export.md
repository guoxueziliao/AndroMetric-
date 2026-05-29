# 0.2.4 刀 2 Schema / Migration / Import-Export

> 本文只规划刀 2：为 `TrainingGoal` / `GoalCheckin` 增加最小持久化闭环。它承接刀 1 定稿，不新增产品范围。

## 状态

- 所属版本：0.2.4。
- 当前阶段：待实现。
- 前置：[`knife-1-data-model-final-audit.md`](./knife-1-data-model-final-audit.md) 已定稿。
- 实现边界：schema、migration、JSON import / export、snapshot integrity 和测试。

## 目标

刀 2 完成后，0.2.4 的训练目标和 check-in 数据应能被本地持久化，并随备份 / 导入 / 快照完整性一起工作。

必须完成：

- 新增 `training_goals` store。
- 新增 `goal_checkins` store。
- migration 新增空表，不从旧数据生成伪目标。
- JSON export / import 支持 `trainingGoals` 和 `goalCheckins`。
- import preview / normalize 执行刀 1 定稿的 allowlist 和 warning 规则。
- snapshot integrity 统计目标和 check-in 数量。
- 测试覆盖旧数据、非法枚举、非法周期、orphan check-in 和导入导出往返。

## Schema 契约

### training_goals

建议 store 名称：

- `training_goals`

建议 indexes：

- `id`
- `status`
- `category`
- `startDate`
- `updatedAt`

字段以 [`training-data-model.md`](./training-data-model.md) 为准。

实现时必须保留：

- `status` allowlist：`active` / `paused` / `completed` / `archived`。
- `category` allowlist：`record_quality` / `recovery` / `hardness_stability` / `sex_performance_stability` / `ejaculation_control_observation` / `relationship_communication`。
- `targetWindowDays` allowlist：7 / 14。
- `source` allowlist：`manual` / `suggested`。

### goal_checkins

建议 store 名称：

- `goal_checkins`

建议 indexes：

- `id`
- `goalId`
- `targetDate`
- `createdAt`

字段以 [`training-data-model.md`](./training-data-model.md) 为准。

实现时必须保留：

- `status` allowlist：`continue` / `pause` / `complete` / `adjust`。
- `cycleFeeling` 可选，只允许 1 - 5。
- orphan `goalId` 不在导入层静默删除。

## Migration

迁移规则：

- 新 store 默认空表。
- 不从历史成人行为、硬度、复盘或日志数据自动生成目标。
- 不生成默认 active goal。
- 不生成伪 check-in。
- 旧数据升级后，训练区域应能显示空状态，不报错。

如果实现时发现需要从旧数据生成目标，应停止刀 2，回到规划讨论。

## JSON Export / Import

JSON 字段：

- `trainingGoals`
- `goalCheckins`

规则：

- JSON export 必须完整保留目标和 check-in 数据。
- JSON import 必须经过 normalize，不直接信任外部数据。
- JSON import preview 应展示训练目标和 check-in 的数量、跳过数量和 warning。
- 选择性导出若已有数据类型选择机制，训练数据应作为独立可选项或归入本地状态数据；具体归类按现有导出结构决定，但不能默默丢失。

Markdown / CSV：

- 0.2.4 默认不把训练目标和 check-in 作为可迁移数据导出到 Markdown / CSV。
- 若报告层需要展示目标摘要，另走报告文案，不替代 JSON backup。

## Import Normalize 规则

必须执行：

- 未知或禁用 `TrainingGoal.category`：跳过整条 goal，产生 integrity warning。
- `targetWindowDays` 不是 7 / 14：跳过整条 goal，产生 integrity warning。
- 未知 `TrainingGoal.status`：跳过整条 goal，产生 integrity warning。
- 未知 `TrainingGoal.source`：跳过整条 goal，产生 integrity warning。
- 未知 `GoalCheckin.status`：跳过整条 check-in，产生 integrity warning。
- orphan `GoalCheckin.goalId`：保留 check-in，产生 orphan warning。
- `cycleFeeling` 非 1 - 5：置空，产生 integrity warning。
- `windowStartDate` 晚于 `windowEndDate`：两个窗口字段置空，产生 integrity warning。

不得执行：

- 不把非法 category 改成合法 category。
- 不把 30 / 60 / 90 天周期自动降级成 14 天。
- 不把 unknown status 自动改成 active。
- 不根据历史数据自动创建 goal。
- 不因 orphan check-in 删除历史信息。

## Snapshot Integrity

snapshot integrity 应至少包含：

- training goal 数量。
- active / paused / completed / archived goal 数量。
- goal check-in 数量。
- orphan check-in 数量。
- import normalize warning 数量。

如果现有 snapshot integrity 只支持总数，也至少要新增：

- `trainingGoals`
- `goalCheckins`

完整分项可以作为实现时的轻量增强，但不能少于总数。

## 测试样本

必须覆盖：

- 旧数据升级，新表为空。
- 空训练数据 export / import。
- 一个 active goal，无 check-in。
- 一个 completed goal，多个 check-in。
- 一个 archived goal，保留历史 check-in。
- 禁用 category 被跳过并 warning。
- 非 7 / 14 周期被跳过并 warning。
- unknown goal status 被跳过并 warning。
- orphan check-in 被保留并 warning。
- `cycleFeeling` 越界被置空并 warning。
- window range 反向时窗口字段置空并 warning。
- JSON export -> import 往返后合法数据完整保留。

## 验证命令

刀 2 完成时至少跑：

```bash
npm run test
npm run typecheck
git diff --check
```

如果 migration 或导入导出触达 build 入口，也应跑：

```bash
npm run build
```

## 非目标

- 不实现训练建议规则。
- 不实现轻目标 UI。
- 不实现 check-in UI。
- 不持久化 `TrainingSuggestion`。
- 不新增 Training 页面。
- 不新增完整训练计划、徽章、等级或连续挑战。
- 不新增云端 AI / 外部 API。

## 交接给刀 3

刀 2 结束后，刀 3 才能实现规则型建议系统。

刀 3 可依赖：

- `TrainingGoal` / `GoalCheckin` store 已存在。
- JSON backup 可保留训练数据。
- import normalize 已阻止禁用目标进入 active 数据。
- snapshot integrity 能发现训练数据数量和 orphan check-in。
