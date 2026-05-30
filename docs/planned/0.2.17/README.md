# 0.2.17 高级筛选与自定义回看 v1

> 本目录承载 0.2.17 的轻量专题文档。根入口是 [`../plan-0.2.17.md`](../plan-0.2.17.md)。

## 阅读顺序

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含筛选模型、UI 切片、验收和停线项。
- [范围与边界](./scope-and-boundaries.md)：高级筛选和自定义回看的边界。
- [筛选维度契约](./filter-dimensions.md)：可筛选字段和组合规则。
- [回看体验](./review-experience.md)：结果页、摘要和保存视图。
- [验收与交接](./acceptance-and-handoff.md)：实现顺序和停线项。
- [实现交接摘要](./implementation-handoff.md)：开发会话入口。
- [一致性审计](./consistency-audit-2026-05-29.md)：最终收口检查。

## 当前结论

- 0.2.17 已收口为执行草案 / 待实现。
- 它不是全局搜索。
- 它不是全文搜索。
- 默认不新增 schema / migration。
- 自定义筛选视图默认不保存。
- 已可交给开发会话。
