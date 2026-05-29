# 0.2.6 决策：移除 Markdown 导出（2026-05-28）

> 用户明确反馈：Markdown 导出没有实际价值，直接砍掉。

## 决策

0.2.6 起不再把 Markdown 导出作为维护目标。

当前规划改为：

- JSON backup：唯一完整迁移格式。
- CSV：唯一保留的可读导出格式。
- Markdown：导出入口删除或隐藏，不补新增数据维度。

## 影响范围

实现窗口需要检查：

- 导出弹窗中的 Markdown 按钮。
- `ExportFormat` / export options 中的 markdown 分支。
- Markdown export builder。
- Markdown 导出相关测试。
- 文案中“CSV / Markdown 可读导出”的历史表述。

## 保留边界

0.2.3 中曾讨论过周报 / 月报 Markdown，这是历史规划记录。当前 0.2.6 决策优先级更高：产品导出入口不继续维护 Markdown。

如果未来需要“报告”，应作为应用内视图或另一个明确需求重新规划，而不是沿用 Markdown 导出。
