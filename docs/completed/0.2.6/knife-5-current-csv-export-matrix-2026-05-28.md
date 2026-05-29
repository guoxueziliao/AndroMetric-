# 0.2.6 刀 5 当前 CSV 导出矩阵（2026-05-28）

> 本文记录刀 5 的只读代码审计和实现矩阵。它不修改产品代码。

## 当前代码状态

当前导出仍保留三种格式：

- `ExportFormat = 'json' | 'csv' | 'markdown'`。
- `ExportOptionsModal` 仍展示 Markdown 格式按钮。
- `MyView` 仍展示“导出 Markdown”入口。
- `useProfileMaintenance` 仍有 markdown 分支和 `buildMarkdownExport(...)`。
- `tests/markdownExport.test.ts` 与 markdown export 测试仍存在。

当前 CSV 导出文件包括 `meta.json`、`days.csv`、`sex.csv`、`masturbation.csv`、`exercise.csv`、`alcohol.csv`、`partners.csv`、`tags.csv`、`cycle_events.csv`、`pregnancy_events.csv` 和 `snapshots.csv`。

当前 `ExportDataset` 只包含 logs / partners / tags / cycleEvents / pregnancyEvents / snapshots。

当前 CSV 尚未包含 `porn_use_events.csv`、独立 `masturbation_events.csv`、独立 `sex_events.csv`、`adult_event_links.csv`、`training_goals.csv` 和 `goal_checkins.csv`。

## 当前风险

Markdown 相关风险：

- UI 仍有入口，会违背“砍掉 Markdown”的新决策。
- model 和测试仍维护 Markdown 分支，会继续制造维护成本。

CSV 隐私风险：`days.csv`、`sex.csv`、`masturbation.csv`、`exercise.csv`、`partners.csv`、cycle / pregnancy CSV 当前包含 `notes`、伴侣 `notes` 或 `payload_json`。这些字段可能包含敏感全文，不符合 0.2.6 “CSV 默认不包含敏感全文”的边界。

## 刀 5 实现矩阵

| 主题 | 当前状态 | 刀 5 要做 | 边界 |
| --- | --- | --- | --- |
| Markdown 入口 | UI / model / tests 仍存在 | 删除或隐藏入口，移除分支或标为不可达 | 不新增替代报告中心 |
| CSV dataset | 不含三类独立成人行为事件 | 增加已落地事件维度或明确不纳入 | 不影响 JSON backup |
| CSV notes | 多个文件默认导出 notes | 默认移除，或显式敏感开关 | 不静默导出全文 |
| CSV dimensions | 仅基础维度 | 增加成人行为事件可选维度 | training 未落地则不虚构 |
| 日期筛选 | 空日期等价全部 | 配合 `rangeMode` 明确全部 / 日期 | 不让用户以为必须填日期 |
| 文案 | CSV/Markdown 旧口径残留 | 改成 JSON backup + CSV | 不鼓励分享 |

## CSV 文件建议

- 保留：`meta.json`、`days.csv`、`sex.csv`、`masturbation.csv`、`exercise.csv`、`alcohol.csv`、`partners.csv`、`tags.csv`、`cycle_events.csv`、`pregnancy_events.csv`、`snapshots.csv`。
- 新增或确认：`porn_use_events.csv`、`masturbation_events.csv`、`sex_events.csv`、`adult_event_links.csv`。
- 条件项：`training_goals.csv`、`goal_checkins.csv`，只在真实 store / 类型已经落地后加入。

## 敏感字段默认

默认不导出：

- logs notes 全文。
- sex notes 全文。
- masturbation notes 全文。
- exercise notes 全文。
- partner notes 全文。
- 色情内容 URL / 文件 / 缩略图。

如果未来需要 notes，应单独加显式选项，例如“包含敏感备注全文”，并在导出前提示。

## 测试验收

至少补测试：

- Markdown 格式不再出现在导出格式选项。
- MyView 不再显示“导出 Markdown”。
- `ExportFormat` 不再接受 markdown，或 markdown 分支不可达。
- CSV 默认不包含 notes 列或 notes 内容。
- CSV zip 仍包含 meta.json。
- CSV 能导出三类已落地成人行为事件摘要。
- training CSV 只有真实 store 落地后才出现。

一句话结论：

> 刀 5 的重点是删掉 Markdown 维护面，把 CSV 收成低敏、可读、非迁移格式，并继续让 JSON backup 承担完整恢复。
