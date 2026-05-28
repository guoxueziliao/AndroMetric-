# 0.2.6 刀 1 数据契约审计

> 本文只规划刀 1：进入 0.2.6 实现前，确认当前完整备份、导入预览和完整性检查的真实覆盖范围。

## 状态

- 所属版本：0.2.6。
- 当前阶段：一次只读审计已完成，进入实现窗口前仍需按最新代码复核。
- 前置：按真实代码确认 0.2.2 - 0.2.5 的落地状态；本轮已发现训练数据尚未进入当前 snapshot 契约。
- 实现边界：审计数据契约，不改业务功能，不新增 schema。

## 当前只读审计结果

2026-05-28 已记录一次只读代码审计：

- 结果文档：[`knife-1-current-contract-audit-2026-05-28.md`](./knife-1-current-contract-audit-2026-05-28.md)。
- 当前完整备份路径已覆盖基础数据、生殖事件、三类成人行为事件、settings 和 userName。
- 当前选择性 JSON 导出路径只覆盖基础数据、生殖事件和 snapshots，不覆盖三类成人行为事件。
- 当前 import preview 已覆盖三类成人行为事件数量和 link issue。
- 当前 snapshot integrity 已覆盖三类成人行为事件的读回数量、ID 集合、link issue 和 targetDate 生理日一致性。
- 当前代码没有真实 `training_goals` / `goal_checkins` store；训练目标和 check-in 在 0.2.6 中应按条件项处理，不应凭规划文档假设已经落地。

## 目标

刀 1 完成后，开发窗口应知道：

- JSON backup 当前实际包含哪些数据。
- 0.2.2 - 0.2.5 新增数据是否全部进入完整备份。
- import preview 是否能展示新增复杂数据。
- snapshot integrity 是否能检查新增复杂数据。
- 是否仍然可以坚持无 schema / migration。

## 必查入口

实现前优先检查：

- `domain/types/snapshot.ts`
- `core/storage/StorageService.ts`
- `core/storage/migration.ts`
- `core/storage/importMerge.ts`
- `core/storage/snapshotIntegrity.ts`
- `features/profile/model/importPreview.ts`
- JSON export / import 入口。
- encrypted backup 入口。
- existing import preview tests。
- existing snapshot integrity tests。

最终文件名以实现时真实代码为准。

## 完整数据清单

JSON backup 完整承诺至少覆盖：

- logs。
- partners。
- tags。
- cycle events。
- pregnancy events。
- snapshots。
- porn use events。
- masturbation events。
- sex events。
- training goals。
- goal check-ins。

如果实现时发现还有 settings / meta / app state 等已纳入旧备份契约的数据，也必须继续保留。

## 审计输出

刀 1 完成时必须输出：

- 当前 backup 数据维度清单。
- 当前 import preview counts 清单。
- 当前 snapshot integrity 检查清单。
- 缺失维度列表。
- 缺失 warning / blocker 列表。
- 是否需要新增 schema / migration 的结论。
- 进入刀 2 的明确结论。

## 停下来重谈

出现以下情况，不进入刀 2：

- 需要重新设计整个 export format。
- 需要破坏旧 JSON 字段名。
- 需要新增后端或云端备份。
- 需要自动创造业务记录来补旧数据。
- 需要导入高版本 unknown data。
- 需要新增 schema / migration 才能完成审计目标。

## 非目标

- 不实现 import preview 新 UI。
- 不实现 repair。
- 不实现只读恢复预检。
- 不新增 CSV / Markdown 明细导出。
- 不修改成人行为、训练、复盘或目标历史业务功能。
