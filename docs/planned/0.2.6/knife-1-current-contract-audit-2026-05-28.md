# 0.2.6 刀 1 当前数据契约审计（2026-05-28）

> 本文记录一次只读代码审计结果。它不代表本窗口修改了产品代码，也不覆盖 Claude 后续开发变化。

## 审计范围

本轮只读查看了：

- `domain/types/snapshot.ts`
- `core/storage/StorageService.ts`
- `services/BackupService.ts`
- `core/storage/db.ts`
- `core/storage/migration.ts`
- `core/storage/importMerge.ts`
- `core/storage/snapshotIntegrity.ts`
- `features/profile/model/importPreview.ts`
- `features/profile/model/exportOptions.ts`
- `features/profile/model/useProfileMaintenance.ts`

## 当前 Snapshot 契约

`ExportSnapshot` 当前包含 `appName`、`appVersion`、`dataVersion`、`exportDate`、`settings`、`userName` 和 `data`。

`SnapshotData` 当前包含 `logs`、`partners`、`tags`、`cycleEvents`、`pregnancyEvents`、`pornUseEvents`、`masturbationEvents`、`sexEvents` 和 `snapshots?`。

当前类型和导入预览认识 `snapshots?`，但 `buildSnapshotData(...)` 不会把已有内部快照历史写进新备份。

## 当前导出路径

`StorageService.createSnapshot()` 当前写入基础数据、cycle / pregnancy events、三类成人行为事件，以及 settings / userName。

`StorageService.snapshots.create(...)` 当前写入同一组 `SnapshotData`，并保存 settings / userName，但不嵌套保存已有 snapshots。

`BackupService` 的目录备份当前写入基础数据、生殖相关数据和三类成人行为事件，但 `settings` / `userName` 为 `null`，也不包含内部 snapshots。

选择性导出弹窗的 JSON 路径当前使用 `ExportDataset`：

- 包含 logs / partners / tags / cycleEvents / pregnancyEvents / snapshots。
- 不包含 pornUseEvents / masturbationEvents / sexEvents。
- 不包含 trainingGoals / goalCheckins。
- 日期筛选为空时等价于当前已选维度的全部数据。

这意味着“完整备份”和“选择性 JSON 导出”目前不是同一份完整数据契约。

## 当前 Import Preview

`buildImportPreview(...)` 当前展示 dataVersion 状态、settings / userName 是否存在、基础数据数量、cycle / pregnancy events 数量、snapshots 数量、三类成人行为事件数量、日志冲突和 linked id 问题。

当前没有展示：

- trainingGoals 数量。
- goalCheckins 数量。
- orphan goal check-in。
- training goal 枚举或周期合法性。

## 当前 Integrity 覆盖

写入快照后的 readback 自检当前检查：快照可读回、快照 ID 一致、数据长度没有明显异常缩短、logs / partners 数量一致、三类成人行为事件数量和 ID 集合一致。

完整 integrity 当前检查：三类成人行为事件 duplicate / orphan / one-way link、缺失 `targetDate`、`targetDate` 与 03:00 生理日规则是否不一致。

当前没有检查：

- tags / cycleEvents / pregnancyEvents 数量读回一致性。
- snapshots 数量读回一致性。
- training goal 数量。
- goal check-in 数量。
- orphan goal check-in。
- archived goal 与 check-in 保留关系。

## 当前缺口判断

当前代码中没有发现 `training_goals` / `goal_checkins` store，也没有发现 `TrainingGoal` / `GoalCheckin` 作为真实数据契约进入 `SnapshotData`、导入预览或完整性检查。

因此：

- 这不是 0.2.6 当前必须立刻修的运行时 bug。
- 它说明 0.2.4 / 0.2.5 的训练数据仍应按真实实现状态处理。
- 若开发窗口仍未落地训练目标存储，0.2.6 不应为了满足文档而凭空新增 training stores。
- training goals / goal check-ins 在 0.2.6 中应保持条件项：真实存储存在时纳入 backup / preview / integrity，不存在时不虚构。

## 是否需要 Schema / Migration

刀 1 审计本身不需要新增 schema / migration。

但如果实现窗口决定让 0.2.6 直接落地 `training_goals` / `goal_checkins`，那已经超出“默认不新增 schema / migration”的 0.2.6 边界，应停下来重谈，而不是顺手塞进本版。

## 进入刀 2 的结论

可以进入刀 2，但范围应按真实代码收缩：

- 成人行为事件可以作为当前已实现数据进入 import preview 风险矩阵。
- 选择性 JSON 导出必须先解决“看起来像完整导出但缺成人行为事件”的契约问题。
- `snapshots?` 是否属于完整备份承诺，需要在实现窗口明确。
- training goals / goal check-ins 只在真实 store 和类型已经落地后纳入刀 2 / 刀 3。

一句话结论：

> 0.2.6 刀 2 应先把当前已经存在的成人行为事件、选择性导出和 snapshot integrity 补齐；训练目标和 check-in 是条件覆盖项，不能凭规划文档假设已经存在。
