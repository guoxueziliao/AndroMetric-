# 0.2.6 刀 3 Snapshot Integrity 扩展

> 本文只规划刀 3：扩展完整性检查，使成人行为事件和训练数据能被结构性检查。

## 状态

- 所属版本：0.2.6。
- 当前阶段：当前 integrity 矩阵已完成，待实现。
- 前置：[`knife-2-import-preview-risk-matrix.md`](./knife-2-import-preview-risk-matrix.md)。
- 实现边界：integrity check 和结构性 repair 边界，不新增业务事实。

## 当前审计约束

- 当前矩阵：[`knife-3-current-integrity-matrix-2026-05-28.md`](./knife-3-current-integrity-matrix-2026-05-28.md)。
- 当前 snapshot integrity 已检查三类成人行为事件 link issue 和 targetDate 生理日一致性。
- 仍需补强读回一致性覆盖、issue 定位信息和选择性导出相关风险提示。
- training goal / goal check-in integrity 只在真实训练数据存储已经落地后纳入，不在 0.2.6 中凭空新增 schema。
- 当前 Data Health issue 类型已有 `path` / `hintAction`，但 UI 尚未展示具体业务位置。

## 目标

刀 3 完成后，完整性检查应能发现复杂数据的结构问题。

必须检查：

- 三类成人行为事件数量。
- 三类成人行为事件 ID 唯一性。
- `targetDate` 是否存在。
- `targetDate` 与 03:00 生理日规则是否明显冲突。
- linked ids 是否指向存在事件。
- one-way relation。
- training goal 数量。
- goal check-in 数量。
- orphan goal check-in。
- archived goal 是否保留 check-in。
- 现有数据健康 issue 是否包含可展示定位信息。

## Repair 边界

允许：

- 补空数组。
- 补齐 one-way relation 的反向 linked id。
- 清理指向不存在事件的 linked id，但必须由用户确认。
- 重新计算可派生的 summary。

禁止：

- 自动创建缺失事件。
- 自动创建训练目标。
- 自动创建 check-in。
- 自动改写成人行为事实。
- 自动删除 notes。
- 自动合并两个不同 ID 的事件。
- 自动删除 archived goal 的 check-in。

## 输出形态

完整性结果应至少包含：

- issue count。
- severity。
- issue type。
- affected data type。
- affected id 或 count。
- field path 或业务位置。
- suggested action。
- 用户可理解的说明。

如果现有结构不支持全部字段，刀 3 可以用现有 issue shape 承载，但不能只输出模糊总数。

## 健康问题定位

数据健康问题不能只跳转到日期表单。

必须做到：

- issue 列表展示字段路径或业务位置。
- path 可转成人类可读文案，例如“自慰记录 1 / 素材 2 / 来源平台”。
- 点击问题后，至少让用户知道应该检查哪个表单区块。
- 无法自动聚焦时，显示人工检查路径。

数据生态提示“一键修复”时：

- 如果可修复，应提供可点击入口。
- 如果还没运行体检，应提示先运行体检。
- 如果 `canRepair=false`，不显示不可执行的“一键修复”建议。

## 验收

- integrity 能报告三类事件数量和 ID 问题。
- integrity 能报告 orphan linked ids。
- integrity 能报告 one-way relation。
- integrity 能报告 orphan goal check-in。
- 健康问题能定位到具体字段 / 子项。
- 数据生态修复提示能闭合到按钮或下一步动作。
- repair 不自动创造业务事实。
- repair 不静默删除敏感历史。

## 非目标

- 不做 UI 大改。
- 不做导出格式重设计。
- 不做云同步。
- 不做医学解释。
- 不做自动内容识别。
