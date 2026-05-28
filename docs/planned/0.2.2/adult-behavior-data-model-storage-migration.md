# 0.2.2 成人行为数据模型：Schema 与 Migration

> 本文是 [`adult-behavior-data-model.md`](./adult-behavior-data-model.md) 的专题文档，负责 IndexedDB schema 与旧数据迁移。

## 当前代码基线

- `core/storage/db.ts` 当前 Dexie schema version 是 `6`。
- `core/storage/migration.ts` 当前 `LATEST_VERSION` 是 `46`。
- 两个版本轨道不同：
  - Dexie schema version 管 IndexedDB store / index 结构。
  - `LATEST_VERSION` 管导出数据结构和记录 migration。

## Schema 目标

- 新增三张事件表。
- 不删除 `logs.sex[]` / `logs.masturbation[]`。
- 不重命名旧导出字段。
- 不把旧 `pornConsumption` 迁移成事件表记录。

## Dexie 类型草案

```ts
export type HardnessDiaryDatabase = Dexie & {
  logs: Table<LogEntry, string>;
  partners: Table<PartnerProfile, string>;
  cycle_events: Table<CycleEvent, string>;
  pregnancy_events: Table<PregnancyEvent, string>;
  meta: Table<MetaEntry, string>;
  system_logs: Table<SystemLog, number>;
  snapshots: Table<Snapshot, number>;
  tags: Table<TagEntry, [string, string]>;
  porn_use_events: Table<PornUseEvent, string>;
  masturbation_events: Table<MasturbationEvent, string>;
  sex_events: Table<SexEvent, string>;
};
```

## Dexie stores 草案

```ts
dbInstance.version(7).stores({
  logs: '&date, status',
  partners: '&id',
  cycle_events: '&id, partnerId, date, kind, source',
  pregnancy_events: '&id, partnerId, date, kind, source',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension',
  porn_use_events: '&id, startedAt, targetDate, status, source',
  masturbation_events: '&id, startedAt, targetDate, status, source',
  sex_events: '&id, startedAt, targetDate, status, source'
});
```

索引规则：

- `&id`：稳定主键，导入导出保持不变。
- `startedAt`：时间线排序、前后 6 小时关联推荐。
- `targetDate`：日视图、复盘和导出日期筛选。
- `status`：为 `in_progress` / 快捷记录场景预留。
- `source`：migration、import、manual、quick 数据审计。

第一版不建数组索引：

- `linkedPornUseEventIds`
- `linkedMasturbationEventIds`
- `linkedSexEventIds`
- `partnerIds`
- `tags`

原因：

- 0.2.2 的第一优先级是稳定存储、migration、导入导出和完整性检查。
- linked ids 更适合由 integrity / repository 层遍历检查。
- Dexie 数组索引会放大 schema 复杂度；等查询入口明确后再增量添加。

## Migration 管线目标

当前 `runMigrations(data)` 主要输入 / 输出 `logs`，返回 `StoredData` 时只显式返回 `{ version, logs }`。0.2.2 必须扩展为能返回三类事件集合。

0.2.2 migration 目标：

- 为旧 `LogEntry.masturbation[]` 生成 `MasturbationEvent[]`。
- 为旧 `LogEntry.sex[]` 生成 `SexEvent[]`。
- 不从旧 `pornConsumption` 自动生成 `PornUseEvent[]`。
- 保留旧 `logs.sex[]` / `logs.masturbation[]`，至少在 0.2.2 内不删除。
- 导入旧数据时，缺失三类事件表安全默认为空。

## StoredData 扩展

```ts
export interface StoredData {
  version: number;
  logs: LogEntry[];
  partners?: PartnerProfile[];
  tags?: TagEntry[];
  cycleEvents?: CycleEvent[];
  pregnancyEvents?: PregnancyEvent[];
  pornUseEvents?: PornUseEvent[];
  masturbationEvents?: MasturbationEvent[];
  sexEvents?: SexEvent[];
}
```

命名规则：

- TypeScript / export data 使用 camelCase：`pornUseEvents`、`masturbationEvents`、`sexEvents`。
- Dexie store 使用 snake_case：`porn_use_events`、`masturbation_events`、`sex_events`。
- JSON 导入导出保持 camelCase。

## Migration step

建议新增：

```ts
export const LATEST_VERSION = 47;

function migrateV46toV47(data: StoredData): StoredData {
  return {
    ...data,
    pornUseEvents: data.pornUseEvents ?? [],
    masturbationEvents: data.masturbationEvents ?? buildMasturbationEventsFromLogs(data.logs),
    sexEvents: data.sexEvents ?? buildSexEventsFromLogs(data.logs)
  };
}
```

必须满足：

- migration 能同时访问 `logs` 和已有三类事件集合。
- 导入数据已有新事件表时，保留原始事件 ID 和 linked ids，不重复生成。
- 导入数据没有新事件表时，才从旧 `logs.masturbation[]` / `logs.sex[]` 生成事件。
- `pornUseEvents` 缺失时补 `[]`，不从 `pornConsumption` 生成事件。

## Masturbation migration

旧 `LogEntry.masturbation[]` 可以生成 `MasturbationEvent[]`。

| Old field | New field | Rule |
|---|---|---|
| `log.date` + `record.startTime` | `startedAt` | 合成 ISO datetime；缺失 `startTime` 时 fallback |
| `startedAt` | `targetDate` | 使用 03:00 生理日规则 |
| `record.id` | `id` | 优先沿用；缺失时生成稳定 migration id |
| `record.duration` | `durationMinutes` | 数字有效则映射，否则 `null` |
| `record.ejaculation` | `ejaculated` | boolean 有效则映射，否则 `null` |
| `record.orgasmIntensity` | `orgasmIntensity` | 1-5 有效则映射，否则 `null` |
| `record.edging` | `edging` | 合法值映射，否则 `none` |
| `record.satisfactionLevel` | `satisfaction` | 1-5 有效则映射，否则 `null` |
| `record.notes` | `notes` | 原样保留 |

默认值：

- `source = 'migration'`
- `status = 'completed'`，旧 `record.status === 'inProgress'` 时可映射为 `in_progress`。
- `createdAt` / `updatedAt` 优先使用 `log.updatedAt` 转 ISO。
- `stimulationSources = []`
- `afterState = []`
- `linkedPornUseEventIds = []`
- `linkedSexEventIds = []`
- `sessionCount = 1`

不做：

- 不把旧 `contentItems` / `assets` / `materials` / `props` 自动生成 Porn use event。
- 不从 `actors` 迁移演员名。
- 不根据旧素材标签自动判断色情内容类型。

## Sex migration

旧 `LogEntry.sex[]` 可以生成 `SexEvent[]`。

| Old field | New field | Rule |
|---|---|---|
| `log.date` + `record.startTime` | `startedAt` | 合成 ISO datetime；缺失 `startTime` 时 fallback |
| `startedAt` | `targetDate` | 使用 03:00 生理日规则 |
| `record.id` | `id` | 优先沿用；缺失时生成稳定 migration id |
| `record.duration` | `durationMinutes` | 数字有效则映射，否则 `null` |
| `record.ejaculation` | `ejaculated` | boolean 有效则映射，否则 `null` |
| `record.notes` | `notes` | 原样保留 |
| `record` | `legacySexRecord` | 完整保留 |

谨慎映射：

- `record.partner`：只有明确是 `PartnerProfile.id`，或能无歧义匹配现有 partner id 时，才进入 `partnerIds`。
- `record.protection`：具体映射表留给 adapter；不能确定时 `contraception = null`。
- `record.ejaculationLocation`：具体映射表留给 adapter；不能确定时 `ejaculationContext = null`。
- `record.interactions` / `acts` / `positions`：migration 第一版可以先 `interactionTypes = []`。

默认值：

- `source = 'migration'`
- `status = 'completed'`
- `partnerIds = []`
- `interactionTypes = []`
- `penetration = 'unknown'`
- `hardnessLevel = null`
- `orgasmIntensity = null`
- `satisfaction = null`
- `afterState = []`
- `pornInvolved = null`
- `linkedPornUseEventIds = []`
- `linkedMasturbationEventIds = []`

不做：

- 不把旧 `partnerScore` 映射成 `satisfaction`。
- 不自动创建 PartnerProfile。
- 不自动推断色情内容参与。
- 不自动生成 risk flags。

## Porn use migration

旧 `LogEntry.pornConsumption` 不生成 `PornUseEvent`。

原因：

- 它是日级强度字段，不是事件级记录。
- 缺少 `startedAt`、`durationMinutes`、`contentTypes`、`sourceTypes`、是否进入自慰、是否射精、使用后状态等事件级信息。
- 自动生成会制造高置信假事件，影响复盘可信度。

处理规则：

- 保留 `log.pornConsumption` 原字段。
- `pornUseEvents` 缺失时补 `[]`。
- UI 可提示“旧版本有日级色情使用强度，但没有事件详情”。

## Stable migration id

旧记录缺失 `id` 时，migration 生成 ID 必须稳定，不能使用 `Date.now()` 或 `Math.random()` 作为唯一来源。

已定格式：

```ts
mig_mb_${log.date}_${index}
mig_sex_${log.date}_${index}
```

规则：

- `index` 使用旧 `logs.masturbation[]` / `logs.sex[]` 中的原始数组下标，从 `0` 开始。
- 不排序后再取下标。
- 不使用 `Date.now()` / `Math.random()` / UUID 作为缺失 ID 的唯一来源。

重复旧 ID：

- 优先保留第一条原 ID。
- 后续重复项追加 deterministic suffix，例如 `${id}_dup_${index}`。
- integrity check 记录重复 ID 修复结果。

## Fallback time

缺失 `startTime` 时：

- Masturbation event：`23:00`
- Sex event：`22:00`

fallback 只用于旧数据兼容，不表示真实发生时间。生成事件的 `source = 'migration'`。

## Logs retention

0.2.2 migration 不删除旧 `logs.sex[]` / `logs.masturbation[]`。

原因：

- 旧 UI / 导出 / adapter 仍可能依赖。
- 一次性删除会扩大回归面。
- 0.2.2 的目标是建立新事件闭环，不是清理旧字段。
