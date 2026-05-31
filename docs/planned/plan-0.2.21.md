# 0.2.21 数据健康与自修复 v1

> 0.2.21 不是从零做数据健康。代码里已有体检报告（0-100 评分）、`repairData` 结构修复和带前置备份的修复流程；0.2.21 把这套已存在但只覆盖 `logs` / `partners` 的能力，扩展到其余事件表，并把「只报告不修」的孤立关系变成可清理的修复动作。它不改任何健康算法、统计算法或复盘结论。

## 当前状态

- 状态：执行草案 / 待实现。
- 前置：0.2.15 已完成；0.2.16 - 0.2.20 已收口为执行草案，0.2.16 为下一候选实现线。
- 主方向：把数据体检与自修复从「logs + partners」扩展到全表与跨表孤立关系。
- 实现前代码校准结论（2026-05-31 实测）：
  - `core/storage/StorageService.ts` 的 `runHealthCheck()` 只扫 `db.logs` + `db.partners`（经 `checkDataHealth`）。
  - `repairData()` 只修 `logs`（经 `utils/historyRepair.ts` 的 `repairLogUsingHistory`），修复前自动建 `auto-safety` 快照。
  - `utils/dataHealthCheck.ts` 已有 `DataHealthReport`：structure / completeness / analytics 三维 0-100 评分、`HealthIssue` 列表、`brokenRelations` 统计、`canRepair`。
  - `brokenRelations` 仅检测 `logs` 内 `sex[].partner` 引用不存在的伴侣，severity low，且**只报告不修**。
  - 其余表不在体检 / 修复范围：`sex_events`、`masturbation_events`、`porn_use_events`、`training_goals`、`goal_checkins`、`cycle_events`、`pregnancy_events`、`health_projects`、`health_project_plans`、`health_project_logs`。
  - 已有 UI：`features/tags/TagHealthCheck.tsx`、`features/profile/model/useProfileMaintenance.ts`（`handleRepairData` / `runHealthCheck`）、`core/storage/snapshotIntegrity.ts`。

## 文档拆分

- [目录索引](./0.2.21/README.md)
  - 0.2.21 专题文档入口。
- [执行计划](./0.2.21/execution-plan.md)
  - 真实代码校准、扩展切片、实现顺序、验收步骤、检查命令和停线项。
- [范围与边界](./0.2.21/scope-and-boundaries.md)
  - 只做体检覆盖扩展与孤立关系清理，不改算法。
- [体检覆盖扩展](./0.2.21/health-check-coverage.md)
  - 现有体检范围与需要纳入的表 / 跨表关系。
- [孤立关系检测与清理](./0.2.21/orphan-and-relation-repair.md)
  - 跨表孤儿的检测规则与可选清理动作。
- [修复安全与备份](./0.2.21/repair-safety-and-backup.md)
  - 修复前自动快照、可撤销、不静默删数据的约束。
- [验收与交接](./0.2.21/acceptance-and-handoff.md)
  - 实现顺序、验收底线和停下来重谈条件。
- [实现交接摘要](./0.2.21/implementation-handoff.md)
  - 给开发会话的一页入口。
- [一致性审计](./0.2.21/consistency-audit-2026-05-31.md)
  - 与已定边界、not doing 列表和当前代码基线对齐。

## 初步范围

- 把 `runHealthCheck` 的扫描范围从 `logs + partners` 扩展到全部事件表。
- 检测跨表孤立引用：事件引用已删伴侣、打卡引用已删训练目标、健康项目日志/计划引用已删项目等。
- 把孤立关系从「只报告」升级为「可选清理动作」，且清理前必须建备份、可撤销。
- 统一「数据健康」入口呈现：分表统计、issue 列表、修复入口。
- 保持现有 0-100 评分口径，只扩展统计来源，不改评分算法。

## 明确不做

- 不改任何健康算法、统计算法、复盘逻辑或评分公式。
- 不做医学诊断、风险评分或异常的健康学解释。
- 不静默删除用户数据；任何清理都需确认且可撤销。
- 不做云端校验、跨设备一致性或账号。
- 不把数据健康扩展成自动后台清理服务。
- 不新增业务模型或新记录类型。

## 已定边界

- 0.2.21 是体检 / 修复能力的覆盖扩展，不是新分析模型。
- 复用现有 `DataHealthReport` 结构与 `handleRepairData` 的「修复前自动快照」模式。
- 任何修复 / 清理动作必须先建快照、结果可见、可回滚。
- 评分口径不变，只增加被扫描的数据来源。
- 若扩展需要改 schema / migration，停下来讨论；优先在现有表结构内做检测与清理。

## 暂不做

- 不在本规划窗口改产品代码。
- 不做自动定时清理。
- 不恢复隐私模糊 / 全局搜索。
- 不把孤立数据的处理上升为强因果或健康结论。
