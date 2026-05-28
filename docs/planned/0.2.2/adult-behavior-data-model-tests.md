# 0.2.2 成人行为数据模型：测试与验收

> 本文是 [`adult-behavior-data-model.md`](./adult-behavior-data-model.md) 的专题文档，负责刀 41+ 的测试和验收清单。

## Schema / types

必须覆盖：

- `PornUseEvent`、`MasturbationEvent`、`SexEvent` 类型能通过 `npm run typecheck`。
- `HardnessDiaryDatabase` 包含三张新表。
- Dexie schema version 从 `6` 升到 `7`。
- 三张新表主键都是 `&id`。
- 三张新表都有 `startedAt`、`targetDate`、`status`、`source` 索引。
- 第一版不为 linked ids、`partnerIds`、`tags` 建数组索引。

## Migration

必须覆盖：

- v46 旧数据导入后，`pornUseEvents` 默认为 `[]`。
- v46 旧 `LogEntry.masturbation[]` 能生成 `MasturbationEvent[]`。
- v46 旧 `LogEntry.sex[]` 能生成 `SexEvent[]`。
- 旧 `logs.sex[]` / `logs.masturbation[]` 在 migration 后仍保留。
- 旧 `pornConsumption` 不生成 Porn use event。
- 缺旧 `record.id` 时生成稳定 migration id：`mig_mb_${log.date}_${index}` / `mig_sex_${log.date}_${index}`。
- 缺 ID 的 `index` 使用原始数组下标，从 `0` 开始。
- 重复旧 `record.id` 时保留第一条原 ID，后续重复项追加 `${id}_dup_${index}`，不能静默覆盖。
- 缺 `startTime` 时使用约定 fallback，并保持 `source = 'migration'`。
- `targetDate` 按 03:00 生理日规则计算。
- `partnerScore` 不映射为 `satisfaction`。
- 旧 SexRecord 完整保留到 `legacySexRecord`。
- 旧 `contentItems` / `assets` 不自动生成 Porn use event。

## Repository / storage

必须覆盖：

- 可创建 / 读取 / 更新 / 删除 Porn use event。
- 可创建 / 读取 / 更新 / 删除 Masturbation event。
- 可创建 / 读取 / 更新 / 删除 Sex event。
- 创建事件时自动计算 `targetDate`。
- 更新事件时更新 `updatedAt`。
- 删除事件不级联删除关联事件。
- 删除事件会清理其他事件中的 linked id，或 integrity 能报告 orphan。
- 创建流程内自动关联时，同一 transaction 写双方 linked ids。

## Import / export

必须覆盖：

- JSON export 包含三类事件数组，即使为空。
- JSON import 缺少三类事件数组时默认为空。
- JSON import 已包含三类事件时保留原始 ID。
- 导入合并三类事件以 `id` 为主键，不以 `startedAt` 或 `targetDate` 合并。
- ID 冲突会出现在 import preview。
- orphan linked ids 会出现在 import preview。
- 单向关联会出现在 import preview 或 integrity report。
- round-trip 后三类事件数量一致。
- round-trip 后 linked ids 不丢失。
- 加密导出 / 导入走同一检查路径。

## Snapshot integrity

必须覆盖：

- 快照写后读自检比较三类事件数量。
- 快照写后读自检比较三类事件 ID 集合。
- 快照完整性检查能报告 orphan linked ids。
- 快照完整性检查能报告单向关联。
- 快照完整性检查能报告缺失 `targetDate`。
- 快照完整性检查能报告 `targetDate` 与 `startedAt` 生理日不一致。

## Event links

必须覆盖：

- Porn use <-> Masturbation 双向关联。
- Porn use <-> Sex 双向关联。
- Masturbation <-> Sex 双向关联。
- 手动解除关联会同时移除双方 linked ids。
- 删除 Porn use 不删除 Masturbation / Sex。
- 删除 Masturbation 不删除 Porn use / Sex。
- 删除 Sex 不删除 Porn use / Masturbation。
- Orphan repair 清理 linked id，但不创建缺失事件。
- One-way repair 补齐反向 linked id。

## UI-facing data contract

数据模型层不要求完成 UI，但必须为 UI 提供稳定契约：

- 三类事件都可按 `targetDate` 查询。
- 三类事件都可按 `startedAt` 排序。
- 手动关联候选可以基于同一 `targetDate` 或前后 6 小时计算。
- Sex event 可保留旧 `legacySexRecord` 供现有 UI adapter 使用。
- Porn use event 不包含 URL、缩略图、图片、视频、音频本体、演员名或成人内容开关。

## Non-goals verification

实现完成后必须确认没有引入：

- 单表 `adult_events`。
- 通用 `relatedEventIds` 主方案。
- 成瘾布尔。
- 非法内容审核字段。
- 成人内容启用 / 禁用字段。
- 色情内容收藏字段。
- 自动内容识别。
- 云同步。
- 伴侣评分 / 排名新模型。
- 性次数 / 射精次数 / 色情使用时长挑战模型。
