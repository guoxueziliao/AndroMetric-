# 0.2.6 执行草案（数据安全与长期数据承诺）

> 本文是 0.2.6 的短入口。详细讨论拆到专题文档，避免单个计划文件过长。

## 当前状态

- 状态：执行草案 / 刀 1 当前契约只读审计已完成 / 待实现。
- 前置：0.2.2 成人行为事件、0.2.3 复盘报告、0.2.4 训练目标、0.2.5 目标历史。
- 主方向：多轮 schema 扩展后的数据安全、导入导出契约、完整性检查和恢复信心。
- 已定：0.2.6 不新增成人行为、训练、洞察或关系功能。
- 已定：0.2.6 不引入后端、账号、云同步或外部 API。
- 已定：JSON backup 仍是完整数据承诺；CSV 是唯一保留的可读导出；Markdown 导出取消。
- 已定：默认不新增 schema / migration；若实现时发现必须新增，应停止本版本规划并重新讨论。

## 文档拆分

- [目录索引](./0.2.6/README.md)
  - 0.2.6 专题文档入口。
- [范围与边界](./0.2.6/scope-and-boundaries.md)
  - 核心基调、版本目标、边界和明确不做。
- [数据契约与版本兼容](./0.2.6/data-contract-and-versioning.md)
  - JSON backup、dataVersion、旧包导入和新增数据维度承诺。
- [完整性检查与修复边界](./0.2.6/integrity-and-repair.md)
  - snapshot integrity、linked ids、orphan、one-way relation 和 repair 边界。
- [导入导出体验](./0.2.6/import-export-experience.md)
  - import preview、选择性导出、CSV、敏感字段提示和 Markdown 移除。
- [恢复演练与信心反馈](./0.2.6/recovery-drill-and-confidence.md)
  - 备份写后读、恢复演练、只读预检和用户可理解的信心提示。
- [Safety / Privacy Rails](./0.2.6/safety-and-privacy.md)
  - 隐私、分享、导出敏感内容、云端和外部分析边界。
- [开发刀序与验收](./0.2.6/slices-and-acceptance.md)
  - 刀 1 - 刀 6、验收标准和实现前置。
- [插刀 0：当前数据 UX 修复](./0.2.6/knife-0-current-data-ux-fixes.md)
  - 全部导出默认态、修复入口可发现、健康问题具体定位。
- [插刀 0A：导出范围 UX](./0.2.6/knife-0a-export-range-ux.md)
  - 默认全部导出、日期筛选状态和格式验收。
- [插刀 0B：修复入口状态流](./0.2.6/knife-0b-repair-entry-flow.md)
  - 数据生态与数据健康之间的体检 / 修复 / 手动检查闭环。
- [插刀 0C：健康问题定位](./0.2.6/knife-0c-health-issue-location.md)
  - issue path 到业务位置的文案映射和跳转行为。
- [插刀 0 验收矩阵](./0.2.6/knife-0-validation-matrix.md)
  - 0A / 0B / 0C 的实现顺序、必测场景和失败信号。
- [刀 1：数据契约审计](./0.2.6/knife-1-data-contract-audit.md)
  - 实现前审计完整备份、导入预览和完整性检查覆盖。
- [刀 1 当前契约审计结果](./0.2.6/knife-1-current-contract-audit-2026-05-28.md)
  - 只读记录当前代码里 backup、选择性导出、preview 和 integrity 的真实覆盖。
- [刀 2：Import Preview 风险矩阵](./0.2.6/knife-2-import-preview-risk-matrix.md)
  - preview counts、warning、high severity 和 blocker。
- [刀 2 当前风险矩阵](./0.2.6/knife-2-current-preview-risk-matrix-2026-05-28.md)
  - 只读记录当前 preview model / UI 差异和实现矩阵。
- [刀 3：Snapshot Integrity 扩展](./0.2.6/knife-3-snapshot-integrity-expansion.md)
  - 成人行为事件和训练数据完整性检查。
- [刀 3 当前 Integrity 矩阵](./0.2.6/knife-3-current-integrity-matrix-2026-05-28.md)
  - 只读记录当前 snapshot integrity、data health、issue 定位和修复入口差异。
- [刀 4：只读恢复预检](./0.2.6/knife-4-read-only-recovery-preflight.md)
  - 不写入 IndexedDB 的恢复预检。
- [刀 4 当前只读预检矩阵](./0.2.6/knife-4-current-readonly-preflight-matrix-2026-05-28.md)
  - 只读记录当前导入 / 备份恢复 preview 和完整 preflight 缺口。
- [刀 5：CSV 可读导出与 Markdown 移除边界](./0.2.6/knife-5-readable-export-boundary.md)
  - CSV 可读导出边界、Markdown 移除、敏感内容默认排除和 JSON backup 地位。
- [刀 6：Safety / Privacy 审计](./0.2.6/knife-6-safety-privacy-audit.md)
  - 导入、导出、repair、预检和文案审计。
- [实现交接摘要](./0.2.6/implementation-handoff.md)
  - 进入实现窗口前的一页范围、数据流、刀序和停下来重谈条件。
- [全文一致性审计](./0.2.6/consistency-audit-2026-05-28.md)
  - 0.2.6 范围、边界和执行草案一致性结论。
- [用户反馈插刀](./0.2.6/user-feedback-2026-05-28.md)
  - 全部导出、修复入口可发现、健康问题具体定位。
- [候选能力归档](./0.2.6/archive.md)
  - 云同步、账号、多设备合并、CRDT、自动分享等不进入本版的能力。

## 核心决策草案

- 0.2.6 的核心基调：让用户相信，复杂数据长期可备份、可导入、可检查、可恢复。
- 0.2.6 解决“数据越来越复杂后会不会丢、会不会导不回来、坏了能不能看见”。
- 0.2.6 不解决“多设备同步”“云端备份”“账号体系”“自动跨设备 merge”。
- JSON backup 必须完整承载 0.2.2 - 0.2.5 的新增数据。
- CSV 可以扩展可读摘要，但不得伪装成完整迁移格式；Markdown 导出取消。
- import preview 和 snapshot integrity 要把 linked ids、orphan、one-way relation、训练目标和 check-in 作为可见风险。
- repair 只能修复结构性问题，不自动创造业务事实。
- 导出 UX 默认表达为“全部导出”，日期区间只是可选筛选。
- 数据健康问题必须能定位到具体字段 / 子项，而不是只跳到当天表单。
- 数据生态中的修复提示必须和可执行按钮或下一步动作闭合。

## 明确不做

- 后端同步。
- 账号系统。
- 云端备份。
- 外部 AI 分析。
- 自动内容识别。
- CRDT / OT。
- 多设备实时合并。
- 强制自动清理用户数据。
- 分享图或社交传播。
- 医学诊断、成瘾判定、强因果结论。

## 下一步

0.2.6 当前已形成执行草案，并完成刀 1 当前契约只读审计、刀 2 当前风险矩阵、刀 3 当前 integrity 矩阵和刀 4 当前只读预检矩阵。后续进入实现窗口时，应按真实代码状态执行：

1. 插刀 0：当前数据 UX 修复。
2. 刀 1：按最新代码复核数据契约审计结果。
3. 刀 2：Import Preview 风险矩阵。
4. 刀 3：Snapshot Integrity 扩展。
5. 刀 4：只读恢复预检。
6. 刀 5：CSV 可读导出与 Markdown 移除边界。
7. 刀 6：Safety / Privacy 审计。

如果刀 1 发现 0.2.2 - 0.2.5 数据尚未真实落地，应按真实代码状态缩小 0.2.6 范围，不得凭规划文档假设数据已经存在。
