# 0.2.2 事件关系与刀序

> 本文是 [`plan-0.2.2.md`](../plan-0.2.2.md) 的专题文档，归档事件关系模型和刀 40 - 刀 49。

## 事件关系模型

0.2.2 选择：

> Porn use event、Masturbation event、Sex event 全部使用独立事件 ID，并允许多对多关联。

原因：

- 色情使用、自慰、性行为都可能独立发生。
- 任一事件都可能发生在同一天多次。
- 色情使用可能导致自慰，也可能只是性行为前刺激，或者完全独立。
- 自慰可能发生在性行为前后，也可能和色情使用无关。
- 多对多关联比单向派生更稳定，导入导出和后续复盘也更清楚。

## 事件 ID

三类事件都必须有稳定 ID：

- `PornUseEvent.id`
- `MasturbationEvent.id`
- `SexEvent.id`

ID 要求：

- 本地生成。
- 导入导出时保持稳定。
- 不能依赖数组 index。
- 不能依赖时间戳唯一性。
- 迁移旧数据时必须为旧事件补 ID。

## 生理日归属

三类事件都必须支持生理日归属。

字段方向：

- `startedAt`：真实开始时间。
- `targetDate`：按 03:00 生理日规则计算出的归属日期。

规则：

- 03:00 前事件归属前一天。
- 不改变现有生理日规则。
- UI 可以按 `targetDate` 汇总，时间线可以按 `startedAt` 排序。

## 关联字段

Porn use event：

```ts
linkedMasturbationEventIds?: string[];
linkedSexEventIds?: string[];
```

Masturbation event：

```ts
linkedPornUseEventIds?: string[];
linkedSexEventIds?: string[];
```

Sex event：

```ts
linkedPornUseEventIds?: string[];
linkedMasturbationEventIds?: string[];
```

关系规则：

- 允许 0..n 关联。
- 不强制双向实时同步作为业务规则，但写入用例应尽量保持双向一致。
- 导入 / 修复流程需要能处理单向缺失关系。
- 关联不存在的 ID 时，导入预览或完整性检查应提示。

0.2.2 不采用单个通用 `relatedEventIds` 替代类型化字段。

## 自动关联与手动关联

0.2.2 支持：

- 创建流程内自动关联。
- 用户手动关联。

默认推荐窗口：

- 同一 `targetDate`。
- 或 `startedAt` 前后 6 小时内。

这是 UI 推荐规则，不是数据硬约束。

0.2.2 不做：

- 不根据文本备注自动关联。
- 不根据平台 / 内容类型自动关联。
- 不做机器学习或行为预测。
- 不做级联删除。
- 不做云端关联或同步。

## 导入导出与快照完整性

导出必须保留：

- 事件 ID。
- 事件类型。
- `startedAt`。
- `targetDate`。
- linked ids。

导入预览必须检查：

- ID 是否重复。
- linked ids 是否指向存在事件。
- 单向关联是否可修复。
- 旧数据是否需要补 ID。

snapshot integrity 需要覆盖：

- 三类事件数量。
- 三类事件 ID 唯一性。
- linked ids 可解析性。
- orphan linked ids。
- targetDate 是否存在。

## 已定刀序

### 刀 40 — Adult behavior data model

状态：已完成。

输出：

- `adult-behavior-data-model.md`
- `adult-behavior-data-model-types.md`
- `adult-behavior-data-model-storage-migration.md`
- `adult-behavior-data-model-import-export-integrity.md`
- `adult-behavior-data-model-links.md`
- `adult-behavior-data-model-tests.md`

### 刀 41 — Schema + migration + domain types

执行拆解：

- [`knife-41.md`](./knife-41.md)

范围：

- 更新 domain types。
- 更新 `core/storage/db.ts`。
- 更新 `core/storage/migration.ts`。
- 为旧数据补事件 ID、默认字段和兼容结构。
- 保持生理日规则不变。

验收：

- migration 测试覆盖旧数据升级。
- typecheck 通过。
- 旧导出样本仍可读取。

### 刀 42 — Storage, import/export, snapshot integrity

执行拆解：

- [`knife-42.md`](./knife-42.md)

范围：

- repository / StorageService 支持三类事件读写。
- 导出 JSON 保留事件 ID、类型、targetDate、linked ids。
- 导入预览检查 ID 重复、孤儿 linked ids、单向关联。
- import merge 不丢关联。
- snapshot integrity 检查三类事件数量、ID 唯一性、targetDate 和 linked ids。

### 刀 43 — Porn use event model + tests

执行拆解：

- [`knife-43.md`](./knife-43.md)

范围：

- 实现 Porn use event 的创建、更新、删除、查询。
- 实现 MVP 字段和强推荐可选字段的 default/hydrate。
- 实现 tags / notes / linked ids 基础能力。
- 补充模型测试。

### 刀 44 — Masturbation event alignment

执行拆解：

- [`knife-44.md`](./knife-44.md)

范围：

- 规范 Masturbation event 字段。
- 支持多次自慰事件。
- 接入 linkedPornUseEventIds / linkedSexEventIds。
- 保留现有自慰内容 item/editor，除非数据模型必须调整。
- 增加 adapter 或兼容层，避免一次性推翻旧结构。

### 刀 45 — Sex event mapping / adapter

执行拆解：

- [`knife-45.md`](./knife-45.md)

范围：

- 将现有 SexRecord 映射到 Sex event 语义。
- 接入 pornInvolved / pornUseContext / linkedPornUseEventIds。
- 接入 linkedMasturbationEventIds。
- 保留现有 SexRecord 主体结构和交互大框架。

### 刀 46 — UI entry points + minimal forms

执行拆解：

- [`knife-46.md`](./knife-46.md)

范围：

- 新增 Porn use event 记录入口。
- 提供 Porn use 最小表单。
- Masturbation / Sex 表单中增加必要的关联入口或轻量字段。
- 手机 Chrome 优先。

### 刀 47 — Event linking UI

执行拆解：

- [`knife-47.md`](./knife-47.md)

范围：

- 支持创建流程内自动关联。
- 支持用户手动关联同一 targetDate 或前后 6 小时事件。
- 展示已关联事件。
- 支持解除关联。

### 刀 48 — Basic review loop

执行拆解：

- [`knife-48.md`](./knife-48.md)

范围：

- 基础复盘视图：同一生理日内 Porn / Masturbation / Sex 事件时间线。
- 展示硬度、射精、时长、满意度、疲劳、睡眠影响等关键字段。
- 展示事件关联链路。
- 样本不足时只展示事实，不做过度归因。

### 刀 49 — Golden path + docs + version close

执行拆解：

- [`knife-49.md`](./knife-49.md)

范围：

- 全应用 golden path。
- 旧数据升级验证。
- 新事件创建 / 编辑 / 删除 / 导入 / 导出 / 快照验证。
- 手机 Chrome 验证。
- 更新 CHANGELOG、版本号和相关文档。

验收：

- `npm run build`
- `npm run test`
- `npm run typecheck`
- 旧数据 migration 测试通过。
- 导入导出 round-trip 不丢事件关联。
- snapshot integrity 覆盖三类事件。
- 生理日 03:00 规则保持。
