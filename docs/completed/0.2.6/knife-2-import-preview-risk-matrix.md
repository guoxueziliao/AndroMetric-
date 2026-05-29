# 0.2.6 刀 2 Import Preview 风险矩阵

> 本文只规划刀 2：扩展 import preview 的数据数量、warning 和 blocker，让复杂备份在写入前可被理解。

## 状态

- 所属版本：0.2.6。
- 当前阶段：当前风险矩阵已完成，待实现。
- 前置：[`knife-1-data-contract-audit.md`](./knife-1-data-contract-audit.md) 与 [`knife-1-current-contract-audit-2026-05-28.md`](./knife-1-current-contract-audit-2026-05-28.md)。
- 实现边界：preview / risk matrix，不写入 IndexedDB，不做 repair。

## 当前审计约束

- 当前风险矩阵：[`knife-2-current-preview-risk-matrix-2026-05-28.md`](./knife-2-current-preview-risk-matrix-2026-05-28.md)。
- 三类成人行为事件已经是真实代码契约，应进入刀 2 preview 风险矩阵。
- training goals / goal check-ins 只有在真实 store / 类型已经落地时才进入刀 2，不为满足 0.2.6 文档单独发明存储。
- 选择性 JSON 导出的完整性问题应先作为 preview / 文案风险处理。
- 当前 model 已计算成人行为 counts 和 link issues，但 UI 尚未展示这些风险。

## 目标

刀 2 完成后，所有导入和恢复入口都应先展示可读 preview。

必须展示：

- dataVersion 状态。
- 现有基础数据数量。
- porn use events 数量。
- masturbation events 数量。
- sex events 数量。
- linked id warnings。
- high severity blockers。

条件展示：

- training goals 数量，仅在真实 store / 类型已落地后展示。
- goal check-ins 数量，仅在真实 store / 类型已落地后展示。
- orphan check-in warnings，仅在真实 store / 类型已落地后展示。

## 风险分级

建议分级：

- info：旧格式缺少新数组，但可安全补空。
- warning：orphan linked id、one-way relation、可选字段异常；orphan check-in 只在真实训练数据落地后纳入。
- high：重复 ID、必需字段缺失、不可自动合并的事件冲突。
- blocker：`dataVersion` 高于当前版本，或写入会覆盖无法选择策略的关键数据。

具体字段名和颜色以现有 preview 组件为准。

## dataVersion

必须保持：

- older：可导入，提示将迁移。
- match：可导入。
- newer：不可写入，确认按钮 disabled。

禁止：

- 高版本强制导入。
- 将 app version 当作 dataVersion。
- 因 high severity warning 自动降级为静默导入。

## 入口一致性

必须确认：

- JSON 文件导入走 preview。
- encrypted backup 导入走 preview。
- FS 备份恢复走 preview。
- 只读恢复预检复用同一 preview 结果。

任何恢复入口不得因为“来自本机”而绕过 preview。

## 验收

- preview counts 包含成人行为事件；训练数据只在真实 store / 类型已落地后展示。
- 旧格式缺少新数组显示 info，不作为错误。
- linked id orphan 显示 warning。
- duplicate id 显示 high 或 blocker，不静默覆盖。
- newer dataVersion 阻止写入。
- warnings 文案不羞辱、不诊断、不制造恐慌。

## 非目标

- 不做 repair 操作。
- 不写入 IndexedDB。
- 不做完整导入 UI 重设计。
- 不新增云端恢复。
- 不新增账号登录。
