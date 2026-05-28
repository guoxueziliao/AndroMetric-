# 0.2.2 成人行为数据模型

> 本文件是 0.2.2 刀 40 的总览入口。详细契约已拆到同目录下的专题文档，避免单个文档过长。

## 来源

- 执行草案：[`plan-0.2.2.md`](../plan-0.2.2.md)

## 当前状态

- 状态：执行草案 / 待实现。
- 刀 40 已完成：产品决策已转换为可实现的数据模型契约。
- 下一步：进入刀 41，按本文档集实现 schema / migration / domain types。
- 实现前仍需重新检查当前代码状态、dirty worktree、migration 管线和 storage / import / export 入口。

## 文档拆分

- [类型与字段](./adult-behavior-data-model-types.md)
  - 三张事件表决策。
  - 共同基础字段。
  - `PornUseEvent` / `MasturbationEvent` / `SexEvent` 类型草案。
  - 旧 `SexRecordDetails` / `MasturbationRecordDetails` 兼容方向。
- [Schema 与 Migration](./adult-behavior-data-model-storage-migration.md)
  - Dexie schema v7。
  - `LATEST_VERSION` 数据迁移方向。
  - 旧数据生成新事件表规则。
  - 稳定 migration id、fallback time、旧字段保留策略。
- [导入导出与快照完整性](./adult-behavior-data-model-import-export-integrity.md)
  - `SnapshotData` / `ExportSnapshot` 扩展。
  - import preview / import merge。
  - snapshot integrity。
  - encrypted backup、CSV / Markdown 边界。
- [事件关联策略](./adult-behavior-data-model-links.md)
  - 类型化 linked ids。
  - 双向一致性。
  - 自动关联、手动关联、删除清理。
  - orphan / one-way repair。
- [测试与验收](./adult-behavior-data-model-tests.md)
  - schema / types。
  - migration。
  - repository / storage。
  - import / export。
  - snapshot integrity。
  - event links。
  - non-goals verification。

## 核心决策

- 0.2.2 采用三张独立 Dexie 表：
  - `porn_use_events`
  - `masturbation_events`
  - `sex_events`
- 不采用单表 `adult_events`。
- 三类事件都有稳定 `id`、`startedAt`、`targetDate`、`createdAt`、`updatedAt`、`status`、`source`。
- 三类事件使用类型化 linked ids，不采用通用 `relatedEventIds`。
- `targetDate` 继续使用项目统一 03:00 生理日规则。
- 旧 `LogEntry.masturbation[]` 可以生成 `MasturbationEvent[]`。
- 旧 `LogEntry.sex[]` 可以生成 `SexEvent[]`，并保留 `legacySexRecord`。
- 旧 `pornConsumption` 不生成 `PornUseEvent`。
- 0.2.2 migration 不删除旧 `logs.sex[]` / `logs.masturbation[]`。
- JSON export 是完整数据承诺，必须包含三类事件和 linked ids。
- CSV / Markdown 是可读性导出，可后置展开。
- 删除事件不级联删除关联事件，只清理 linked ids 或由 integrity report / repair 处理。

## 明确不做

- 内容收藏器。
- URL / 缩略图 / 图片 / 视频 / 音频本体。
- 演员名 / 创作者名。
- 成瘾布尔。
- 非法内容审核字段。
- 成人内容启用 / 禁用字段。
- 自动内容识别。
- 云同步。
- 伴侣评分 / 排名新模型。
- 性次数 / 射精次数 / 色情使用时长挑战模型。

## 刀 40 完成定义

刀 40 只产文档，不改代码。

已完成：

- TypeScript 类型草案。
- Dexie schema 方案。
- migration 方案。
- 旧数据兼容和默认值。
- 导入 / 导出 / 快照完整性策略。
- 事件关联策略。
- 测试清单。

本文档集定稿后，下一刀才允许进入：

- `core/storage/db.ts`
- `core/storage/migration.ts`
- domain types
- storage / import / export / snapshot integrity 实现
