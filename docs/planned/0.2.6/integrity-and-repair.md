# 0.2.6 完整性检查与修复边界

> 本文负责 snapshot integrity、linked ids、orphan、one-way relation 和 repair 边界。

## 目标

完整性检查应帮助用户知道：

- 备份是否包含应有数据。
- 导入后数量是否一致。
- 事件关联是否还指向存在对象。
- 训练目标和 check-in 是否仍能对应。
- 哪些问题能修，哪些只能提示。

## 检查范围

当前只读矩阵见 [`knife-3-current-integrity-matrix-2026-05-28.md`](./knife-3-current-integrity-matrix-2026-05-28.md)。

应覆盖：

- 三类成人行为事件数量。
- 三类成人行为事件 ID 唯一性。
- linked ids 是否指向存在事件。
- one-way relation。
- `targetDate` 是否存在。
- `targetDate` 与 03:00 生理日规则是否明显冲突。
- training goal 数量。
- goal check-in 数量。
- orphan goal check-in。
- archived goal 是否保留 check-in。

其中 training goal / goal check-in 只在真实 store / 类型已经落地后纳入；当前 0.2.6 不为完整性检查单独新增 schema。

## 问题分级

建议分级：

- info：旧格式缺少新数组，但可安全补空。
- warning：orphan linked id、one-way relation、orphan check-in。
- high：重复 ID、必需字段缺失、dataVersion 高于当前。
- blocker：导入会覆盖无法合并的关键数据，且用户无法选择策略。

具体命名以现有 import preview / integrity 结构为准。

## Repair 边界

允许 repair：

- 补空数组。
- 补齐 one-way relation 的反向 linked id。
- 清理指向不存在事件的 linked id，但必须由用户确认。
- 重新计算可派生的 integrity summary。

禁止 repair：

- 自动创建缺失事件。
- 自动创建训练目标。
- 自动创建 check-in。
- 自动改写成人行为事实。
- 自动删除用户备注。
- 自动合并两个不同 ID 的事件。

## 用户表达

完整性提示必须：

- 说清楚影响。
- 说清楚是否会丢数据。
- 说清楚是否需要用户确认。
- 说清楚具体位置：日期、字段路径、记录索引或子项索引。
- 能把 `masturbation[0].contentItems[1]` 这类 path 转成用户可理解文案。
- 避免责备用户。

不得使用：

- “数据错误导致你记录失败”。
- “你应该清理这些成人内容”。
- “系统已自动删除异常记录”。

## 验收

- integrity 能报告三类成人行为事件数量。
- integrity 能报告 linked id orphan。
- integrity 能报告 one-way relation。
- integrity 能报告 goal check-in orphan。
- 数据健康问题能展示具体字段 / 子项位置。
- 修复建议必须能直接触发、跳转到按钮或说明为什么暂不可修。
- repair 不自动创造业务事实。
- repair 不静默删除敏感历史。
