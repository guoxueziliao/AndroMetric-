# 0.2.20 视觉系统收尾与固化 v1

> 本目录承载 0.2.20 的轻量专题文档。根入口是 [`../plan-0.2.20.md`](../plan-0.2.20.md)。

## 阅读顺序

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含代码入口、收尾切片、验收、检查命令和停线项。
- [范围与边界](./scope-and-boundaries.md)：确认 0.2.20 只做收尾与固化。
- [Token 清单与现状](./token-inventory.md)：现有 token 与遗留别名对照。
- [CSS 变量统一](./css-variable-consolidation.md)：唯一事实来源与死文件清理。
- [组件 token 接入](./component-token-adoption.md)：31 处 `brand-*` 的迁移映射。
- [验收与交接](./acceptance-and-handoff.md)：实现顺序和验收底线。
- [实现交接摘要](./implementation-handoff.md)：开发会话入口。
- [一致性审计](./consistency-audit-2026-05-31.md)：最终收口检查。

## 当前结论

- 0.2.20 已定为视觉系统收尾与固化 v1。
- 视觉 token 系统已存在，本版只收尾迁移、统一命名、删除别名。
- `index.css` 是 token 唯一事实来源；`styles/theme.css` 是待删死文件。
- 只做同义替换，不引入新视觉风格、不改品牌资产。
- 默认不新增 schema / migration。
- 已可交给开发会话做实现前代码校准。
