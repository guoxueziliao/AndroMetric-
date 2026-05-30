# 0.2.15 导航与信息架构整理 v1

> 本目录承载 0.2.15 的轻量专题文档。根入口是 [`../plan-0.2.15.md`](../plan-0.2.15.md)。

## 阅读顺序

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含代码入口、切片、验收和停线项。
- [范围与边界](./scope-and-boundaries.md)：确认 0.2.15 只做信息架构整理。
- [主导航归属](./main-navigation-contract.md)：四个主入口的职责。
- [模块归属矩阵](./module-placement-matrix.md)：0.2.7 - 0.2.14 能力放置规则。
- [入口命名与层级](./entry-naming-and-depth.md)：入口文案和层级规则。
- [验收与交接](./acceptance-and-handoff.md)：实现顺序、验收底线和停下来重谈条件。
- [一致性审计](./consistency-audit-2026-05-29.md)：范围和前序版本对齐。

## 当前结论

- 默认不新增顶级导航。
- 默认保留 `日历 / 状态 / 性生活 / 我的` 四入口。
- 不做隐私模糊。
- 不做全局搜索 / 快速跳转。
- 不新增 schema / migration。
- 只整理入口、层级、命名和模块归属。
