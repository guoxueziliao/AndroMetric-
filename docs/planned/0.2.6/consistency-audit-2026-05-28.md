# 0.2.6 全文一致性审计（2026-05-28）

> 本文记录 0.2.6 范围、边界和执行草案一致性审计。审计只覆盖规划文档，不代表代码已实现。

## 结论

0.2.6 当前形成执行草案：主方向是数据安全与长期数据承诺，重点是复杂本地数据的备份契约、导入预览、完整性检查和恢复预检。

本轮确认五条边界：

- 0.2.6 默认不新增 schema / migration。
- 0.2.6 不新增成人行为、训练、洞察或关系功能。
- JSON backup 是完整迁移格式。
- CSV / Markdown 是可读导出，不替代 JSON backup。
- 不引入后端、账号、云同步、外部 API、分享图或外部 AI 分析。

## 已确认一致

- 版本定位：0.2.6 承接 0.2.2 - 0.2.5 的复杂数据增长。
- 数据边界：优先复用 `SnapshotData` / `ExportSnapshot`、import preview 和 snapshot integrity。
- dataVersion 边界：高版本不可写入，旧版本可迁移。
- preview 边界：所有恢复入口先 preview，不因本机备份而绕过。
- integrity 边界：检查结构性问题，不创造业务事实。
- repair 边界：可修结构，不自动创建事件、目标或 check-in。
- 可读导出边界：CSV / Markdown 不默认包含敏感全文，不鼓励分享。
- 导出范围边界：默认全部导出，日期区间只是可选筛选。
- 修复入口边界：数据生态提示必须能闭合到按钮或下一步动作。
- 健康定位边界：问题不能只跳转到当天表单，必须展示具体字段 / 子项位置。
- 隐私边界：本地优先，无账号、无云端、无外部分析。

## 已修正

- `plan-0.2.6.md`：状态从研究草案推进为执行草案 / 待实现。
- `slices-and-acceptance.md`：将候选刀序推进为刀 1 - 刀 6 执行顺序。
- `README.md`：补齐刀 1 - 刀 6、实现交接和一致性审计入口。
- `roadmap.md` / `future-development.md`：同步 0.2.6 执行草案状态和执行刀序。

## 执行草案收口

已补齐：

- `knife-0-current-data-ux-fixes.md`：全部导出默认态、修复入口可发现、健康问题具体定位。
- `knife-0a-export-range-ux.md`：导出范围默认全部、日期筛选状态和格式验收。
- `knife-0b-repair-entry-flow.md`：数据生态到数据健康的体检 / 修复 / 手动检查状态流。
- `knife-0c-health-issue-location.md`：issue path 到业务位置的文案映射和跳转行为。
- `knife-0-validation-matrix.md`：0A / 0B / 0C 的实现顺序、必测场景和失败信号。
- `knife-1-data-contract-audit.md`：实现前审计完整备份、导入预览和完整性检查覆盖。
- `knife-1-current-contract-audit-2026-05-28.md`：记录当前代码里 backup、选择性导出、preview 和 integrity 的真实覆盖。
- `knife-2-import-preview-risk-matrix.md`：preview counts、warning、high severity 和 blocker。
- `knife-2-current-preview-risk-matrix-2026-05-28.md`：记录当前 preview model / UI 差异和实现矩阵。
- `knife-3-snapshot-integrity-expansion.md`：成人行为事件和训练数据完整性检查。
- `knife-3-current-integrity-matrix-2026-05-28.md`：记录当前 snapshot integrity、data health、issue 定位和修复入口差异。
- `knife-4-read-only-recovery-preflight.md`：不写入 IndexedDB 的恢复预检。
- `knife-4-current-readonly-preflight-matrix-2026-05-28.md`：记录当前导入 / 备份恢复 preview 和完整 preflight 缺口。
- `knife-5-readable-export-boundary.md`：CSV / Markdown 可读导出边界。
- `knife-6-safety-privacy-audit.md`：导入、导出、repair、预检和文案审计。
- `implementation-handoff.md`：进入实现窗口前的一页交接摘要。
- `user-feedback-2026-05-28.md`：记录全部导出、修复入口可发现、健康问题具体定位三项反馈。

当前已完成刀 1 只读审计、刀 2 当前风险矩阵、刀 3 当前 integrity 矩阵和刀 4 当前只读预检矩阵；实现窗口仍需按最新代码复核。若 0.2.2 - 0.2.5 数据尚未真实落地，应按真实代码状态缩小 0.2.6 范围。

## 文档长度

0.2.6 当前专题文档均控制在短文档范围内，未出现超长单文档。

## 下一步

后续进入实现窗口时，建议按顺序执行：

1. 插刀 0：当前数据 UX 修复。
2. 刀 1：数据契约审计。
3. 刀 2：Import Preview 风险矩阵。
4. 刀 3：Snapshot Integrity 扩展。
5. 刀 4：只读恢复预检。
6. 刀 5：CSV / Markdown 可读导出边界。
7. 刀 6：Safety / Privacy 审计。
