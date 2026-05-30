# 0.2.13 文档索引

> 本目录承载健康项目与补剂周期系统 v1 的专题文档。根入口是 [`../plan-0.2.13.md`](../plan-0.2.13.md)。

## 专题文档

- [执行计划](./execution-plan.md)：开发会话优先阅读，包含代码入口、实现切片、验收和停线项。
- [范围与边界](./scope-and-boundaries.md)：健康项目、补剂、健康习惯和用药边界。
- [数据模型](./data-model-and-migration.md)：健康项目、计划、执行记录和类型边界。
- [迁移与数据安全](./migration-and-data-safety.md)：旧 `supplements` 兼容、migration、backup、preview 和 integrity。
- [周期计划契约](./schedule-contract.md)：每日、隔日、每周、连续 N 天、暂停期和结束规则。
- [每日记录接入](./daily-log-integration.md)：从写死补剂列表迁移到计划生成的待记录项。
- [Safety / Privacy Rails](./safety-and-privacy.md)：非医疗、非医嘱、非推荐和敏感内容边界。
- [开发刀序与验收](./slices-and-acceptance.md)：实现顺序、验收底线和停下来重谈条件。
- [实现交接摘要](./implementation-handoff.md)：进入实现窗口前的一页范围、数据流和停下来重谈条件。
- [一致性审计](./consistency-audit-2026-05-29.md)：范围、依赖、兼容和安全边界收口。

## 当前结论

- 0.2.13 已收口为执行草案 / 待实现。
- 补剂进入第一版。
- 有周期计划的健康习惯可以进入第一版。
- 用药不进入周期计划系统，只作为每日健康事实或备注。
- 0.2.13 不做药物医嘱、疾病治疗、自动推荐补剂、剂量安全判断或医学诊断。

## 推荐实现顺序

1. 代码校准。
2. 数据模型与 migration。
3. 项目管理。
4. 每日记录接入。
5. 数据安全接入。
6. Safety / Privacy 审计。
