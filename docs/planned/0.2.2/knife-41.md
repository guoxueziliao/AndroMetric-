# 0.2.2 刀 41 执行拆解

> 本文只规划刀 41：schema / migration / domain types。它不是实现记录，也不替代数据模型文档集。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 40 数据模型文档集已完成。
- 实现边界：只做 schema / migration / domain types 和必要测试，不做 UI、review loop、import/export 完整接线。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`adult-behavior-data-model.md`](./adult-behavior-data-model.md)
3. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
4. [`adult-behavior-data-model-storage-migration.md`](./adult-behavior-data-model-storage-migration.md)
5. [`adult-behavior-data-model-tests.md`](./adult-behavior-data-model-tests.md)

实现前还必须检查：

- `git status --short`
- `core/storage/db.ts`
- `core/storage/migration.ts`
- `domain/types/sex.ts`
- `domain/types/log.ts`
- `domain/types/snapshot.ts`
- 现有 tests 目录和 migration 测试形态

## 刀 41 目标

完成后应具备：

- domain types 定义三类事件。
- Dexie schema 新增三张事件表。
- migration 管线能产出三类事件集合。
- 旧 `LogEntry.sex[]` / `LogEntry.masturbation[]` 可迁移成新事件。
- 旧 `pornConsumption` 不生成 Porn use event。
- 旧日志字段仍保留。
- 生理日 03:00 规则保持。
- 类型检查和 migration 测试通过。

## 已定边界：migration 返回结构

刀 41 只负责让 schema、domain types 和 migration 管线认识三类成人行为事件数组。

`runMigrations()` 的返回结构可以从只围绕 `logs` 扩展为完整 `StoredData`，至少能携带：

- `logs`
- `partners`
- `tags`
- `cycleEvents`
- `pregnancyEvents`
- `snapshots`，如当前管线已有
- `pornUseEvents`
- `masturbationEvents`
- `sexEvents`

刀 41 可以调整 `StoredData` / `SnapshotData` / `ExportSnapshot` 的类型，使这些结构能够承载三类事件数组。类型层可以出现字段，但行为层只要求 migration 能返回并保留这些字段。

刀 41 对 snapshot / export 类型的允许范围：

- 允许：给 `SnapshotData` / `ExportSnapshot` 增加 `pornUseEvents`、`masturbationEvents`、`sexEvents` 字段。
- 允许：这些字段在类型上为数组，并在 migration 结果中默认为 `[]`。
- 允许：为了 typecheck 调整必要的 import / export type references。
- 不要求：`StorageService.createSnapshot()` 从三张 Dexie 表读取事件。
- 不要求：`StorageService.restoreSnapshot()` 写入三张 Dexie 表。
- 不要求：JSON export / import merge 真正处理三类事件。
- 不要求：import preview、snapshot integrity、encrypted backup 处理三类事件。

但刀 41 不要求完成：

- `StorageService` 对三张事件表的完整 repository 读写。
- JSON export / import merge 的完整接线。
- import preview counts / warnings。
- snapshot integrity 三类事件校验。
- encrypted backup 的端到端验证。
- 任何导入导出 UI。

这些全部交给刀 42。刀 41 的完成定义是“数据骨架能站住”，刀 42 的完成定义才是“数据能完整进出系统”。

## 实现顺序

### 1. Domain types

建议新增或扩展：

- `domain/types/adultBehavior.ts`
- `domain/types/index.ts`
- 如有必要，调整 `domain/types/snapshot.ts`

要落地：

- `AdultBehaviorEventBase`
- `PornUseEvent`
- `MasturbationEvent`
- `SexEvent`
- shared enums
- typed linked ids

不要做：

- 不新增 UI 文案。
- 不引入 React / Dexie / DOM。
- 不把旧 `SexRecordDetails` 删除。

### 2. Dexie schema

修改：

- `core/storage/db.ts`

要落地：

- Dexie schema version `6 -> 7`。
- `HardnessDiaryDatabase` 增加：
  - `porn_use_events`
  - `masturbation_events`
  - `sex_events`
- stores 增加：

```ts
porn_use_events: '&id, startedAt, targetDate, status, source'
masturbation_events: '&id, startedAt, targetDate, status, source'
sex_events: '&id, startedAt, targetDate, status, source'
```

不要做：

- 不建 linked ids 数组索引。
- 不建 `partnerIds` 数组索引。
- 不删除旧 stores。

### 3. Migration data shape

修改：

- `core/storage/migration.ts`
- 可能涉及 `domain/types/snapshot.ts`

要落地：

- `LATEST_VERSION` 从 `46` 升到下一版。
- `StoredData` 支持：
  - `pornUseEvents`
  - `masturbationEvents`
  - `sexEvents`
- `runMigrations()` 不再只返回 `logs`。
- 导入旧数据缺少三类事件表时补空数组。

风险点：

- 现有 `runMigrations(data)` 管线主要围绕 `logs`，需要小心扩展返回结构。
- `StorageService.restoreSnapshot()` 目前只消费 logs / partners / tags / reproductive events / snapshots，刀 41 可以先让 migration 返回新结构，但完整 storage 接线属于刀 42。
- 如果实现中发现 `SnapshotData` / `ExportSnapshot` 类型必须提前扩展，刀 41 只做类型层预留；读写、预览、完整性检查仍留给刀 42。

### 4. Old data migration

要实现：

- `buildMasturbationEventsFromLogs(logs)`
- `buildSexEventsFromLogs(logs)`
- `pornUseEvents` 缺失时补 `[]`

规则：

- 旧 masturbation `id` 优先作为新事件 ID。
- 旧 sex `id` 优先作为新事件 ID。
- 缺 ID 时使用已定 deterministic migration id：
  - Masturbation：`mig_mb_${log.date}_${index}`
  - Sex：`mig_sex_${log.date}_${index}`
- 不使用 `Date.now()` / `Math.random()` 作为 ID 唯一来源。
- `index` 使用旧 `logs.masturbation[]` / `logs.sex[]` 中的原始数组下标，从 `0` 开始。
- 重复旧 ID 时保留第一条原 ID，后续重复项追加 deterministic suffix：`${id}_dup_${index}`。
- 缺 `startTime` 时：
  - Masturbation fallback `23:00`
  - Sex fallback `22:00`
- 生成 `targetDate` 必须使用 03:00 生理日规则。
- `source = 'migration'`。
- 旧 `logs.sex[]` / `logs.masturbation[]` 不删除。

不要做：

- 不从旧 `pornConsumption` 生成 Porn use event。
- 不从旧 `contentItems` / `assets` 生成 Porn use event。
- 不把 `partnerScore` 映射成 `satisfaction`.
- 不自动创建 PartnerProfile。
- 不自动推断色情参与。

### 5. Tests

优先新增或扩展 migration / model tests。

必须覆盖：

- 旧数据生成 masturbation events。
- 旧数据生成 sex events。
- 旧 `pornConsumption` 不生成 porn use events。
- 缺 ID 时生成稳定 migration id：`mig_mb_${log.date}_${index}` / `mig_sex_${log.date}_${index}`。
- 重复旧 ID 时保留第一条原 ID，后续重复项追加 `${id}_dup_${index}`。
- 缺 `startTime` 时使用 fallback。
- 03:00 前事件归属前一天。
- `legacySexRecord` 保留旧 SexRecord。
- 旧 `partnerScore` 不映射到 `satisfaction`。
- typecheck 通过。

## 非目标

刀 41 不做：

- UI entry points。
- Porn use 表单。
- Event linking UI。
- Basic review loop。
- StorageService 完整三表 repository 接线。
- import preview UI。
- export options UI。
- snapshot integrity 完整 UI 告警。
- CSV / Markdown 成人行为导出。
- 删除旧 `logs.sex[]` / `logs.masturbation[]`。

这些属于刀 42+。

## 验收

刀 41 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果实现涉及 build-time 类型导出或 Dexie 类型，建议同时跑：

```bash
npm run build
```

验收标准：

- typecheck 通过。
- migration tests 通过。
- 旧数据迁移不丢 logs。
- 三类事件数组存在。
- 旧 `pornConsumption` 保留但不生成 Porn use event。
- 生理日规则未改变。
- 无 UI 范围蔓延。

## 交接给刀 42

刀 41 完成后，刀 42 接：

- repository / StorageService 三类事件读写。
- JSON export / import merge 接三类事件。
- import preview counts 和 warnings。
- snapshot integrity 三类事件校验。
- encrypted backup 同路径验证。
