# 0.2.6 刀 5 CSV 可读导出与 Markdown 移除边界

> 本文只规划刀 5：保留 CSV 可读导出，砍掉 Markdown 导出，并明确敏感内容边界。

## 状态

- 所属版本：0.2.6。
- 当前阶段：当前 CSV 导出矩阵已完成，待实现。
- 前置：[`knife-4-read-only-recovery-preflight.md`](./knife-4-read-only-recovery-preflight.md) 与 [`knife-4-current-readonly-preflight-matrix-2026-05-28.md`](./knife-4-current-readonly-preflight-matrix-2026-05-28.md)。
- 实现边界：CSV 可读导出边界、Markdown 导出下线和提示，不替代 JSON backup。

## 核心结论

决策依据：[`decision-markdown-export-removal-2026-05-28.md`](./decision-markdown-export-removal-2026-05-28.md)。

当前矩阵：[`knife-5-current-csv-export-matrix-2026-05-28.md`](./knife-5-current-csv-export-matrix-2026-05-28.md)。

JSON backup 是完整迁移格式。

导出 UX 默认应是全部导出：

- 打开导出弹窗时默认全部数据。
- 日期区间只是用户主动开启的筛选。
- 清空日期后回到全部导出。
- UI 必须明确当前范围是全部数据还是日期筛选。

CSV 是唯一保留的可读导出：

- 可以帮助用户检查和回看。
- 不承诺完整恢复。
- 不默认包含敏感全文。
- 不鼓励分享。

Markdown 导出已定：砍掉。

- 不再作为 0.2.6 维护范围。
- 不新增 Markdown 摘要。
- 若当前产品已有 Markdown 导出入口，实现时应删除或隐藏入口。
- 不为 Markdown 补新增复杂数据维度。
- 不再用“Markdown 不是完整备份”作为主要提示，因为入口本身应消失。

## CSV 候选

可以新增或确认：

- `porn_use_events.csv`
- `masturbation_events.csv`
- `sex_events.csv`
- `adult_event_links.csv`

条件项：

- `training_goals.csv`
- `goal_checkins.csv`

training 相关 CSV 只在真实 store / 类型已经落地后加入，不为 0.2.6 单独虚构 schema。

CSV 默认不包含：

- notes 全文。
- 伴侣私密备注。
- 色情内容本体。
- URL / 缩略图 / 文件。

## 文案要求

必须提示：

- CSV 不是完整备份。
- JSON backup 才是完整迁移格式。
- 可读导出可能包含敏感成人健康摘要。

禁止：

- “导出后可分享给他人。”
- “只保留 CSV 即可。”
- “系统会自动隐藏所有敏感内容。”
- “Markdown 可替代完整备份。”

## 验收

- CSV 不削弱 JSON backup 地位。
- Markdown 导出入口已移除或隐藏。
- 默认导出范围是全部导出。
- 日期筛选有明确开关或状态提示。
- CSV 不默认包含敏感全文。
- training CSV 只有真实 store / 类型落地后才出现。
- 导出入口有敏感数据提示。
- 不新增分享图。
- 不新增外部分析入口。

## 非目标

- 不做全新报告中心。
- 不做医生报告。
- 不做社交分享。
- 不做云端导出。
