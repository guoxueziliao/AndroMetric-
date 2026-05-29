# 0.2.6 导入导出体验

> 本文负责 import preview、选择性导出、CSV 和敏感字段提示。Markdown 导出已取消。

## Import Preview

import preview 应继续作为所有恢复入口的前置层。

应展示：

- dataVersion 状态。
- 各数据维度数量。
- 三类成人行为事件数量。
- training goal 数量，仅在真实 store / 类型已落地后展示。
- goal check-in 数量，仅在真实 store / 类型已落地后展示。
- linked id warning。
- orphan check-in warning。
- high severity blocker。

不应该：

- 在未 preview 前直接覆盖当前数据。
- 因为来源是本机备份就跳过 preview。
- 隐藏成人行为事件数量。

## 选择性导出

当前只读审计发现：选择性 JSON 导出路径尚未覆盖三类成人行为事件；完整备份路径才覆盖当前成人行为事件。实现时必须先统一文案和数据契约，避免用户以为“导出 JSON”已经等于完整迁移备份。

默认导出范围：

- 导出弹窗默认应表达为全部导出。
- 开始日期 / 结束日期只是可选筛选。
- 用户清空日期后回到全部导出。
- JSON backup 的完整迁移导出不能被误解为只导出日期区间。

选择性导出应让用户知道：

- JSON 是完整迁移格式。
- CSV 是可读格式。
- Markdown 导出已取消，不再作为可选格式维护。
- 勾选哪些维度会影响完整性。
- 只导出部分维度时，导入回去可能缺上下文。

建议新增或确认维度：

- 成人行为事件。
- 训练目标与 check-in，仅在真实 store / 类型已落地后纳入。
- 快照。

## CSV

CSV 可以新增：

- porn use events。
- masturbation events。
- sex events。
- adult event links。
- training goals，仅在真实 store / 类型已落地后加入。
- goal check-ins，仅在真实 store / 类型已落地后加入。

CSV 默认不包含：

- notes 全文。
- 伴侣私密备注。
- 色情内容本体。
- URL / 缩略图 / 文件。

## 文案边界

允许：

- “此备份包含成人行为事件。”；若训练数据已真实落地，可追加“并包含训练目标”。
- “存在关联指向缺失记录，导入后可继续检查。”
- “CSV 不是完整备份，请保留 JSON backup。”
- “Markdown 导出已移除，请使用 JSON backup 或 CSV。”

禁止：

- “可以放心删除 JSON，只留 CSV。”
- “系统会自动修复所有问题。”
- “导出后可分享给他人。”
