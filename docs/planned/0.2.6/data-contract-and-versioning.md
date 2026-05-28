# 0.2.6 数据契约与版本兼容

> 本文负责 JSON backup、dataVersion、旧包导入和新增数据维度承诺。

## 核心承诺

JSON backup 是完整数据承诺。

0.2.6 应确认 JSON backup 至少覆盖：

- logs。
- partners。
- tags。
- cycle events。
- pregnancy events。
- snapshots。
- 0.2.2 成人行为事件。
- 0.2.4 training goals。
- 0.2.4 goal check-ins。

CSV 是可读导出，不承担完整迁移承诺。Markdown 导出取消。

## 当前只读审计修正

只读审计结果见 [`knife-1-current-contract-audit-2026-05-28.md`](./knife-1-current-contract-audit-2026-05-28.md)。

当前代码状态下：

- 完整备份路径已覆盖三类成人行为事件。
- 选择性 JSON 导出路径尚未覆盖三类成人行为事件。
- `snapshots?` 在类型和 preview 中存在，但完整备份路径当前不嵌套保存已有快照历史。
- training goals / goal check-ins 还没有真实 store / 类型覆盖，应作为条件项，不应凭规划文档虚构。

## dataVersion 规则

必须保持：

- `dataVersion < 当前版本`：允许导入，显示将迁移。
- `dataVersion === 当前版本`：正常导入。
- `dataVersion > 当前版本`：拒绝写入，提示升级应用。

不得出现：

- 强制导入高版本数据。
- 静默丢弃未知新表。
- 用 app version 替代 dataVersion 判断兼容性。

## 旧包导入

旧包缺少新数组时：

- 缺三类成人行为事件：补空数组。
- 缺 training goals：补空数组。
- 缺 goal check-ins：补空数组。
- 缺可选 metadata：用安全默认值。

旧包导入不应该：

- 自动生成成人行为事件。
- 自动生成训练目标。
- 自动生成 check-in。
- 自动补全不存在的 linked target。

## 新数据维度

选择性导出需要确认：

- 成人行为事件是否作为独立维度。
- 训练数据是否作为独立维度。
- 如果归入“日志”，文案必须说明包含成人行为事件和训练数据。

按日期筛选：

- 成人行为事件使用 `targetDate`。
- training goals 使用 startDate / endDate 或全部保留，需要单独定规则。
- goal check-ins 使用 targetDate / createdAt，需要单独定规则。

按 tag 筛选：

- 成人行为事件如果自身有 tags，应按自身 tags 判断。
- training goals 默认不受 log tags 影响。

## 停下来重谈

出现以下情况，应停止推进：

- 需要重新设计整个 export format。
- 需要破坏旧 JSON 字段名。
- 需要导入时自动创造业务记录。
- 需要对高版本数据提供强制导入口。
- 需要后端或云端保存备份。
