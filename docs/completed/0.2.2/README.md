# 0.2.2 文档索引

> 本目录承载 0.2.2 成人行为与色情使用记录闭环的专题文档和执行拆解。0.2.2 代码实现已完成，待发布 / 归档；根入口仍是 [`../plan-0.2.2.md`](../plan-0.2.2.md)。

## 前置文档

- [数据模型入口](./adult-behavior-data-model.md)：刀 40 输出总入口。
- [类型与字段边界](./adult-behavior-data-model-types.md)：Porn use / Masturbation / Sex 事件类型草案。
- [Schema 与迁移](./adult-behavior-data-model-storage-migration.md)：Dexie schema、migration、旧数据兼容。
- [导入导出与完整性](./adult-behavior-data-model-import-export-integrity.md)：JSON、import preview、snapshot integrity。
- [事件关联](./adult-behavior-data-model-links.md)：typed linked ids 和关联修复规则。
- [测试与验收](./adult-behavior-data-model-tests.md)：刀 41+ 测试清单。
- [全文一致性审计](./consistency-audit-2026-05-28.md)：进入刀 41 前的 0.2.2 文档一致性结论。

## 产品讨论归档

- [产品决策与边界](./product-decisions.md)：核心基调、范围、不做项。
- [字段方向](./event-fields.md)：三类事件的字段方向。
- [事件关系与刀序](./event-relations-and-slices.md)：关系模型和刀 40 - 刀 49。
- [候选方向归档](./archive.md)：候选支线与弃用方向。

## 执行拆解

- [刀 41](./knife-41.md)：schema / migration / domain types，已完成。
- [刀 42](./knife-42.md)：storage / import-export / snapshot integrity，已完成。
- [刀 43](./knife-43.md)：Porn use event model + tests，已完成。
- [刀 44](./knife-44.md)：Masturbation event alignment，已完成。
- [刀 45](./knife-45.md)：Sex event mapping / adapter，已完成。
- [刀 46](./knife-46.md)：UI entry points + minimal forms，已完成。
- [刀 47](./knife-47.md)：Event linking UI，已完成。
- [刀 48](./knife-48.md)：Basic review loop，已完成。
- [刀 49](./knife-49.md)：Golden path + docs + version close，已完成。
