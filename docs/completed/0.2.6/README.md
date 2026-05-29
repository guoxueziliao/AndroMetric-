# 0.2.6 文档索引

> 本目录承载 0.2.6 数据安全与长期数据承诺的专题文档。0.2.6 代码实现已完成，已归档；根入口见 [`../plan-0.2.6.md`](../plan-0.2.6.md)。

## 专题文档

- [范围与边界](./scope-and-boundaries.md)：核心基调、版本目标、边界和明确不做。
- [数据契约与版本兼容](./data-contract-and-versioning.md)：JSON backup、dataVersion、旧包导入和新增数据维度承诺。
- [完整性检查与修复边界](./integrity-and-repair.md)：snapshot integrity、linked ids、orphan、one-way relation 和 repair 边界。
- [导入导出体验](./import-export-experience.md)：import preview、选择性导出、CSV、敏感字段提示和 Markdown 移除。
- [恢复演练与信心反馈](./recovery-drill-and-confidence.md)：备份写后读、恢复演练、只读预检和用户可理解的信心提示。
- [Safety / Privacy Rails](./safety-and-privacy.md)：隐私、分享、导出敏感内容、云端和外部分析边界。
- [开发刀序与验收](./slices-and-acceptance.md)：刀 1 - 刀 6、验收标准和实现前置。
- [插刀 0：当前数据 UX 修复](./knife-0-current-data-ux-fixes.md)：全部导出默认态、修复入口可发现、健康问题具体定位。
- [插刀 0A：导出范围 UX](./knife-0a-export-range-ux.md)：默认全部导出、日期筛选状态和格式验收。
- [插刀 0B：修复入口状态流](./knife-0b-repair-entry-flow.md)：数据生态与数据健康之间的体检 / 修复 / 手动检查闭环。
- [插刀 0C：健康问题定位](./knife-0c-health-issue-location.md)：issue path 到业务位置的文案映射和跳转行为。
- [插刀 0 验收矩阵](./knife-0-validation-matrix.md)：0A / 0B / 0C 的实现顺序、必测场景和失败信号。
- [决策：移除 Markdown 导出](./decision-markdown-export-removal-2026-05-28.md)：JSON backup 为完整迁移格式，CSV 为唯一保留可读导出。
- [刀 1：数据契约审计](./knife-1-data-contract-audit.md)：实现前审计完整备份、导入预览和完整性检查覆盖。
- [刀 1 当前契约审计结果](./knife-1-current-contract-audit-2026-05-28.md)：只读记录当前代码里 backup、选择性导出、preview 和 integrity 的真实覆盖。
- [刀 2：Import Preview 风险矩阵](./knife-2-import-preview-risk-matrix.md)：preview counts、warning、high severity 和 blocker。
- [刀 2 当前风险矩阵](./knife-2-current-preview-risk-matrix-2026-05-28.md)：只读记录当前 preview model / UI 差异和实现矩阵。
- [刀 3：Snapshot Integrity 扩展](./knife-3-snapshot-integrity-expansion.md)：成人行为事件完整性检查；训练数据只在真实 store / 类型落地后纳入。
- [刀 3 当前 Integrity 矩阵](./knife-3-current-integrity-matrix-2026-05-28.md)：只读记录当前 snapshot integrity、data health、issue 定位和修复入口差异。
- [刀 4：只读恢复预检](./knife-4-read-only-recovery-preflight.md)：不写入 IndexedDB 的恢复预检。
- [刀 4 当前只读预检矩阵](./knife-4-current-readonly-preflight-matrix-2026-05-28.md)：只读记录当前导入 / 备份恢复 preview 和完整 preflight 缺口。
- [刀 5：CSV 可读导出与 Markdown 移除边界](./knife-5-readable-export-boundary.md)：CSV 可读导出边界、Markdown 移除、敏感内容默认排除和 JSON backup 地位。
- [刀 5 当前 CSV 导出矩阵](./knife-5-current-csv-export-matrix-2026-05-28.md)：只读记录当前 Markdown 残留、CSV 文件、敏感字段和实现矩阵。
- [刀 6：Safety / Privacy 审计](./knife-6-safety-privacy-audit.md)：导入、导出、repair、预检和文案审计。
- [实现交接摘要](./implementation-handoff.md)：进入实现窗口前的一页范围、数据流、刀序和停下来重谈条件。
- [全文一致性审计](./consistency-audit-2026-05-28.md)：范围、边界和执行草案一致性结论。
- [用户反馈插刀](./user-feedback-2026-05-28.md)：全部导出、修复入口可发现、健康问题具体定位。
- [候选能力归档](./archive.md)：云同步、账号、多设备合并、CRDT、自动分享等不进入本版的能力。
