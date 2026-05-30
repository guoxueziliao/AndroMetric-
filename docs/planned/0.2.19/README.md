# 0.2.19 个人指标自定义与权重 v1

> 本目录承载 0.2.19 的轻量专题文档。根入口是 [`../plan-0.2.19.md`](../plan-0.2.19.md)。

## 阅读顺序

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含代码入口、偏好模型、模块接入和验收。
- [范围与边界](./scope-and-boundaries.md)：确认 0.2.19 做什么、不做什么。
- [指标偏好模型](./metric-preference-model.md)：三档轻量分组和默认规则。
- [界面与模块使用](./ui-and-module-usage.md)：各模块如何消费偏好。
- [设置与存储边界](./settings-and-storage-boundary.md)：存储、迁移和停线项。
- [验收与交接](./acceptance-and-handoff.md)：实现顺序和验收底线。
- [实现交接摘要](./implementation-handoff.md)：开发会话入口。
- [一致性审计](./consistency-audit-2026-05-30.md)：最终收口检查。

## 当前结论

- 0.2.19 已定为个人指标自定义与权重 v1。
- 第一版只做三档：重点关注 / 普通显示 / 弱化隐藏。
- 不做 1-100 分精细权重。
- 不改变原始记录、健康评分或医学解释。
- 默认不新增 schema / migration。
- 已可交给开发会话做实现前代码校准。
