# 0.2.13 执行计划

## 目标

把每日记录里写死的补剂勾选，升级为可管理的“健康项目 / 补剂周期”。开发完成后，用户应能维护长期项目，并在每日记录里按当天计划完成记录。

## 进入开发前校准

先读这些真实代码入口，确认当前实现是否已变化：

- `domain/types/log.ts`：`SupplementRecord` 和 `LogEntry.supplements` 是 legacy daily fact。
- `features/daily-log/LogForm.tsx`：当前补剂勾选、保存、`touchedPaths`。
- `features/dashboard/Dashboard.tsx`、`features/dashboard/model/p1Summary.ts`：每日摘要里的补剂展示。
- `features/reproductive/ReproductivePanel.tsx`：备孕 readiness 仍读取 `todayLog.supplements`。
- `core/storage/db.ts`、`core/storage/migration.ts`：Dexie 版本与迁移。
- `core/storage/StorageService.ts`、`core/storage/importMerge.ts`、`core/storage/snapshotIntegrity.ts`：备份、导入、完整性检查。
- `features/profile/model/csvExport.ts`、`features/profile/model/exportOptions.ts`、`features/profile/ui/ImportPreviewModal.tsx`：导出和导入预览。

## 数据模型切片

新增模型放在 `domain/types/`，再由 `domain/types/index.ts` 导出。建议最小模型：

- `HealthProject`：`id`、`type`、`name`、`status`、`startDate`、`endDate?`、`schedule`、`createdAt`、`updatedAt`。
- `HealthProjectType`：第一版至少 `supplement`、`habit`。
- `HealthProjectStatus`：`active`、`paused`、`ended`、`archived`。
- `HealthProjectSchedule`：每日、每周若干天、间隔 N 天、按需。
- `SupplementConfig`：`dose?`、`unit?`、`timeLabel?`、`notes?`。
- `HealthProjectLog`：`id`、`projectId`、`targetDate`、`status`、`takenAt?`、`note?`。

不要把旧 `LogEntry.supplements` 改名或删除。它继续作为 legacy daily fact。

## 存储与迁移切片

如果新增表，必须一次完成这些点：

1. `core/storage/db.ts` 增加 Dexie version，并新增表，例如 `health_projects`、`health_project_logs`。
2. `core/storage/migration.ts` 增加对应版本迁移，默认空数组，不把旧补剂自动推断成项目。
3. `domain/types/snapshot.ts` 增加备份字段。
4. `core/storage/StorageService.ts` 的 snapshot / import / reset / clear / repository 覆盖新表。
5. `core/storage/importMerge.ts` 增加导入规范化，非法状态跳过并给 warning。
6. `core/storage/snapshotIntegrity.ts` 检查项目和记录的数量、孤儿 `projectId`。
7. CSV 导出只导出事实字段，不导出隐私备注全文。

## UI 切片

第一版推荐放在 `features/profile/MyView.tsx` 或其子模块中做管理入口，避免塞爆每日记录。

1. 健康项目列表：active / paused / ended / archived 分组。
2. 创建项目：名称、类型、周期、补剂可选剂量 / 单位 / 服用时间标签 / 备注。
3. 状态动作：暂停、恢复、结束、归档。
4. 每日记录接入：`LogForm` 不再展示写死补剂按钮，改为展示当天应记录项目。
5. 旧补剂展示：如果当天有 legacy `supplements`，显示“旧每日补剂记录”，只读。
6. Dashboard 摘要：优先显示当天健康项目完成情况；legacy supplements 仍可读。

## 实现顺序

1. 写 domain 类型和纯函数：计算某项目在某天是否应记录。
2. 写存储表、迁移、StorageService repository。
3. 写导入导出、snapshot integrity 和 import preview。
4. 写健康项目管理 UI。
5. 接入 `LogForm` 的当天计划项。
6. 接入 Dashboard / p1 summary / reproductive readiness 的兼容展示。
7. 补测试并跑全量检查。

## 验收步骤

- 新建一个每日补剂项目，今天在每日记录里能看到并标记完成。
- 暂停项目后，未来日期不再默认出现；恢复后重新出现。
- 结束项目后，结束日期之后不再生成待记录项。
- 旧记录里的 `supplements` 仍能在 Dashboard 和导出中看到。
- 备份后清空再导入，新健康项目和完成记录都能恢复。
- 导入含孤儿 `projectId` 的记录时有 warning，不让应用崩溃。

## 测试建议

- 新增 schedule 纯函数测试。
- 新增 migration / import normalize 测试。
- 新增 snapshot integrity 对项目和孤儿记录的测试。
- 如果 UI 改动较大，至少手动验证移动端和桌面端列表、创建、暂停、完成路径。

## 停线项

- 需要补剂自动推荐、剂量安全判断或医疗建议。
- 需要把旧补剂批量推断为长期计划。
- 需要成就、连续打卡、排名或效果分析。
- 需要导出补剂备注全文。
- schema 设计无法兼容现有备份 / 导入流程。
