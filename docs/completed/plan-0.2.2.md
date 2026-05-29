# 0.2.2 实现完成记录（成人行为与色情使用记录闭环）

> 本文是 0.2.2 的短入口。详细讨论已拆到专题文档，避免单个计划文件过长。

## 当前状态

- 状态：代码实现完成，待发布 / 归档。
- 前置：0.2.0 视觉系统骨架完成；0.2.1 应用层视觉与交互完成。
- 0.2.2 方向讨论已完成，不再扩展产品范围；新想法进入 0.2.3+。
- 刀 40 数据模型文档集已完成，刀 41-49 代码实现已完成。
- 版本号：0.2.2。
- 目录索引：[`0.2.2/README.md`](./0.2.2/README.md)。

## 文档拆分

- [产品决策与边界](./0.2.2/product-decisions.md)
  - 核心基调。
  - 数据模型边界。
  - 公开资料调研结论。
  - 已回答问题与暂不决策项。
- [字段方向](./0.2.2/event-fields.md)
  - Porn use event 字段方向。
  - Masturbation event 字段方向。
  - Sex event 字段方向。
- [事件关系与刀序](./0.2.2/event-relations-and-slices.md)
  - 事件关系模型。
  - 刀 40 - 刀 49。
- [候选方向归档](./0.2.2/archive.md)
  - 主方向与候选方向。
  - 数据安全、品牌命名等支线归档。
- [全文一致性审计](./0.2.2/consistency-audit-2026-05-28.md)
  - 进入刀 41 前的 0.2.2 文档一致性结论。
- [刀 41 执行拆解](./0.2.2/knife-41.md)
  - schema / migration / domain types 的实现交接。
- [刀 42 执行拆解](./0.2.2/knife-42.md)
  - storage / import-export / snapshot integrity 的实现交接。
- [刀 43 执行拆解](./0.2.2/knife-43.md)
  - Porn use event model + tests 的实现交接。
- [刀 44 执行拆解](./0.2.2/knife-44.md)
  - Masturbation event alignment 的实现交接。
- [刀 45 执行拆解](./0.2.2/knife-45.md)
  - Sex event mapping / adapter 的实现交接。
- [刀 46 执行拆解](./0.2.2/knife-46.md)
  - UI entry points + minimal forms 的实现交接。
- [刀 47 执行拆解](./0.2.2/knife-47.md)
  - Event linking UI 的实现交接。
- [刀 48 执行拆解](./0.2.2/knife-48.md)
  - Basic review loop 的实现交接。
- [刀 49 执行拆解](./0.2.2/knife-49.md)
  - Golden path + docs + version close 的实现交接。

## 核心决策

- 版本主题：把成人行为和色情使用记录补成可复盘的健康数据闭环。
- 范围性质：0.2.2 是产品能力版，允许受控 schema / migration。
- 数据原则：不重命名旧字段，不破坏旧数据读取，新增字段必须有默认值或兼容逻辑。
- 隐私原则：本地优先，无后端、无账号、无上传。
- 事件建模：Porn use event、Masturbation event、Sex event 三类独立建模。
- 事件 ID：三类事件都必须有稳定独立 ID，导入导出保持稳定。
- 生理日：三类事件都保留 `startedAt`，并按 03:00 生理日规则计算 `targetDate`。
- 事件关系：允许多对多关联，使用类型化 linked ids，不采用通用 `relatedEventIds`。
- Porn use event：独立建模，同时可被自慰 / 性行为引用为刺激源或上下文。
- Masturbation event：规范字段并支持多次自慰事件；不强行推翻现有自慰内容 item/editor。
- Sex event：做对齐式规范化，不全面重做 SexRecord；重点补色情内容参与和事件关联。
- 导入导出：必须保留事件 ID、事件类型、`startedAt`、`targetDate`、linked ids。
- Snapshot integrity：必须检查三类事件数量、ID 唯一性、linked ids、orphan linked ids、targetDate。

## 明确不做

- 成瘾布尔。
- 非法内容审核字段。
- 成人内容开关。
- 内容收藏器。
- URL / 缩略图 / 图片 / 视频 / 音频本体。
- 演员名 / 创作者名。
- 自动内容识别。
- 复杂自动推断。
- 云端同步。
- 完整 STI / 避孕 / 怀孕风险管理系统。
- 伴侣评分 / 排名新模型。
- 性次数 / 射精次数 / 色情使用时长挑战模型。
- 全项目卡片统一。

## 开发顺序

0.2.2 已按“数据模型 → schema/migration → 存储与导入导出 → 事件模型 → UI → 复盘 → 收口”的顺序完成实现。

1. 刀 40：Adult behavior data model，已完成。
2. 刀 41：Schema + migration + domain types，已完成。
3. 刀 42：Storage, import/export, snapshot integrity，已完成。
4. 刀 43：Porn use event model + tests，已完成。
5. 刀 44：Masturbation event alignment，已完成。
6. 刀 45：Sex event mapping / adapter，已完成。
7. 刀 46：UI entry points + minimal forms，已完成。
8. 刀 47：Event linking UI，已完成。
9. 刀 48：Basic review loop，已完成。
10. 刀 49：Golden path + docs + version close，已完成。

原则：

- 先文档化数据模型，再写代码。
- 先保证旧数据安全，再做新 UI。
- 先让三类事件可存、可导、可恢复，再做复盘展示。
- 不把统计洞察做在字段模型之前。

## 后续状态

0.2.2 当前不再继续扩范围。发布完成后，可把本文和专题目录按 docs 维护规则迁移到 `completed/`；在迁移前，本文作为实现完成但待发布的记录保留在 `planned/`。

下一条实现线是 0.2.3，见 [`plan-0.2.3.md`](./plan-0.2.3.md)。
