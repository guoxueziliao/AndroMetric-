# 0.2.21 执行计划

## 目标

把已有数据体检与自修复能力，从只覆盖 `logs` + `partners` 扩展到全部事件表，并把「只报告不修」的孤立关系升级为可选、可撤销的清理动作。开发完成后：体检覆盖全表、跨表孤儿可检测、清理前自动备份且可回滚、评分口径不变。

## 进入开发前校准

先读这些文件：

- `core/storage/StorageService.ts`：`runHealthCheck()`（293 行起）、`repairData()`（302 行起）、`clearAllData()` 的全表清单。
- `utils/dataHealthCheck.ts`：`DataHealthReport`、`HealthIssue`、`checkDataHealth`、`brokenRelations` 检测。
- `utils/historyRepair.ts`：`repairLogUsingHistory` 结构修复逻辑。
- `features/profile/model/useProfileMaintenance.ts`：`handleRepairData`（修复前自动建 `auto-safety` 快照）、`runHealthCheck`、各表 live query。
- `features/tags/TagHealthCheck.tsx`：标签健康检查 UI 现状。
- `core/storage/snapshotIntegrity.ts`：快照完整性校验。
- `domain/types/*`：各事件表类型与外键字段（`partnerId` / `goalId` / `projectId` 等）。

## 校准事实（2026-05-31 实测）

- `runHealthCheck` 仅 `db.logs.toArray()` + `db.partners.toArray()` → `checkDataHealth(logs, partners)`。
- `repairData` 仅遍历 `logs` 调 `repairLogUsingHistory`，`bulkPut` 回写，返回修复条数。
- `brokenRelations` 仅检测 `logs` 内 `sex[].partner` 引用不存在的伴侣，push 一条 severity low 的 `relation` issue，**无修复动作**。
- `handleRepairData` 已有「确认 → 建快照 → 修复 → 写 dataFixVersion → 重新体检」流程，可直接复用。
- 未纳入体检 / 修复的表：`sex_events`、`masturbation_events`、`porn_use_events`、`training_goals`、`goal_checkins`、`cycle_events`、`pregnancy_events`、`health_projects`、`health_project_plans`、`health_project_logs`。

## 实现切片

### 切片 1：体检覆盖扩展

按 `health-check-coverage.md`：

- 让 `runHealthCheck` 读取全部事件表，传入 `checkDataHealth`。
- 为每张表增加结构 / 缺字段 / 孤立引用统计，并入 `DataHealthReport.stats`（扩展字段，不改三维评分公式）。
- 每类问题生成 `HealthIssue`（沿用现有 `type` / `severity` / `path` 形态）。

### 切片 2：跨表孤立关系检测

按 `orphan-and-relation-repair.md`，检测：

- 事件 `partnerId` 引用已删伴侣。
- `goal_checkins.goalId` 引用已删 `training_goals`。
- `health_project_plans` / `health_project_logs` 引用已删 `health_projects`。
- `logs` 内 `sex[].partner` 引用（已存在，纳入统一口径）。

每条孤儿生成 `relation` 类 `HealthIssue`，标注来源表、引用字段和目标 id。

### 切片 3：孤立关系可选清理

- 为孤立引用提供「清理」动作：解除引用或移除孤儿记录，按 `orphan-and-relation-repair.md` 的每类策略。
- 清理必须逐类可选、需用户确认，不默认执行。
- 复用 `handleRepairData` 的「先建快照」前置，清理后重新体检。

### 切片 4：UI 与结果呈现

- 在现有数据健康 / 维护入口（`useProfileMaintenance` + 我的页数据区）呈现分表统计与孤儿列表。
- 修复 / 清理结果用 Toast 与重新体检反馈。
- 文案只表达「数据结构 / 关系」问题，不表达健康学判断。

## 实现顺序

1. 代码校准：确认全表外键字段与现有体检 / 修复入口。
2. 扩展 `checkDataHealth` 输入与统计（切片 1）。
3. 加跨表孤儿检测（切片 2）。
4. 加可选、可撤销清理（切片 3），复用快照前置。
5. 接 UI 呈现（切片 4）。
6. 回归：修复 / 清理后体检数下降，快照可回滚。

## 验收步骤

- 体检报告覆盖全部事件表，不再只统计 logs + partners。
- 能检测出至少：孤立伴侣引用、孤立打卡、孤立健康项目子记录。
- 任何清理动作前都创建了快照，且可从快照恢复。
- 评分口径（structure / completeness / analytics 0-100）算法未变。
- 没有任何静默删除：所有清理需确认。
- 修复 / 清理后重新体检，对应 issue 数下降。

## 检查命令

```bash
rg -n "runHealthCheck|repairData|checkDataHealth|brokenRelations" core/storage utils features
rg -n "partnerId|goalId|projectId|planId" domain/types core/storage
rg -n "snapshots.create|auto-safety|dataFixVersion" features/profile core/storage
npm run test
npx tsc --noEmit
```

## 测试建议

- 单测：构造孤立引用数据集，断言体检能检出、清理能修复、计数正确。
- 单测：清理前后快照存在性与可恢复性。
- 回归：评分函数对相同输入产出不变（防止误改算法）。
- 手动：我的页数据健康入口在亮 / 暗下显示分表统计与孤儿列表。

## 停线项

- 检测或清理需要新增 schema / migration。
- 孤立数据的处理需要改健康算法或评分公式。
- 需要静默 / 自动后台清理。
- 需要把孤立数据上升为健康结论或风险判断。
- 跨表关系无法在现有外键字段内判定（需重新设计数据模型）。
