# 0.2.21 数据健康与自修复 v1

> 本目录承载 0.2.21 的轻量专题文档。根入口是 [`../plan-0.2.21.md`](../plan-0.2.21.md)。

## 阅读顺序

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含代码入口、扩展切片、验收、检查命令和停线项。
- [范围与边界](./scope-and-boundaries.md)：确认 0.2.21 只做覆盖扩展与孤立关系清理。
- [体检覆盖扩展](./health-check-coverage.md)：现有体检范围与需纳入的表 / 跨表关系。
- [孤立关系检测与清理](./orphan-and-relation-repair.md)：跨表孤儿检测规则与可选清理。
- [修复安全与备份](./repair-safety-and-backup.md)：修复前快照、可撤销、不静默删数据。
- [验收与交接](./acceptance-and-handoff.md)：实现顺序和验收底线。
- [实现交接摘要](./implementation-handoff.md)：开发会话入口。
- [一致性审计](./consistency-audit-2026-05-31.md)：最终收口检查。

## 当前结论

- 0.2.21 已定为数据健康与自修复 v1。
- 数据体检 / 修复已存在，本版只扩展覆盖范围与孤立关系清理。
- 现有 `runHealthCheck` / `repairData` 只覆盖 `logs` + `partners`；本版扩展到全部事件表。
- 评分口径不变，只增加被扫描来源。
- 任何修复 / 清理必须先建快照、可撤销，不静默删数据。
- 默认不新增 schema / migration；若必须改则停下来讨论。
- 已可交给开发会话做实现前代码校准。
