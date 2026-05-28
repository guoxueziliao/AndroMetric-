# 0.2.2 成人行为数据模型：导入导出与快照完整性

> 本文是 [`adult-behavior-data-model.md`](./adult-behavior-data-model.md) 的专题文档，负责数据进出和完整性检查。

## 目标

0.2.2 新增三类事件表后，数据进出必须保证：

- JSON export round-trip 不丢事件。
- linked ids 不被静默删除。
- orphan linked ids 在导入预览或完整性检查中显式报告。
- 旧数据包缺少三类事件字段时可以导入，默认空数组。

## SnapshotData / ExportSnapshot

`SnapshotData` 需要扩展：

```ts
export interface SnapshotData {
  version: number;
  logs: LogEntry[];
  partners: PartnerProfile[];
  tags: TagEntry[];
  cycleEvents: CycleEvent[];
  pregnancyEvents: PregnancyEvent[];
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
  snapshots?: Snapshot[];
}
```

刀 41 只需要允许类型和 migration 返回结构承载这些字段；完整导出、导入合并、导入预览、快照完整性和加密备份端到端接线归刀 42。

刀 41 允许做：

- 给 `SnapshotData` / `ExportSnapshot` 增加三类事件数组字段。
- 让 migration 缺省补出空数组。
- 为了 typecheck 调整必要 type references。

刀 41 不要求做：

- `StorageService.createSnapshot()` 读取三张事件表。
- `StorageService.restoreSnapshot()` 写入三张事件表。
- JSON export / import merge 处理三类事件。
- import preview counts / warnings。
- snapshot integrity 校验三类事件。
- encrypted backup 端到端验证。

导出规则：

以下规则归刀 42：

- `StorageService.createSnapshot()` 必须从三张 Dexie 表读取事件，并写入 `data.pornUseEvents`、`data.masturbationEvents`、`data.sexEvents`。
- `dataVersion` 使用 `LATEST_VERSION`，不能用 app version 判断兼容性。
- 新格式导出必须包含三类事件数组，即使为空也输出 `[]`。
- 旧 `logs.sex[]` / `logs.masturbation[]` 在 0.2.2 内仍保留在 `logs` 中。

## Export options

选择性导出需要新增维度，或把三类事件明确纳入 `logs` 维度。

本节归刀 42+，不进入刀 41。

建议：

- JSON export：新增独立维度 `adultBehaviorEvents`，包含三类事件。
- CSV / Markdown export：可以先不展开三类事件明细，但不能影响 JSON 完整导出。
- 按日期筛选：三类事件使用 `targetDate`，不使用 `startedAt` 的自然日。
- 按 tag 筛选：如果事件自身 `tags` 命中，应保留对应事件；不能只看 `LogEntry.tags`。

如果 UI 不想新增维度，也可以把三类事件归入“日志”维度，但文案必须说明“日志包含成人行为事件”。

## Import preview

`buildImportPreview()` counts 需要新增：

本节归刀 42+，不进入刀 41。

```ts
counts: {
  logs: number;
  partners: number;
  tags: number;
  cycleEvents: number;
  pregnancyEvents: number;
  snapshots: number;
  pornUseEvents: number;
  masturbationEvents: number;
  sexEvents: number;
}
```

导入预览必须额外检查：

- 三类事件 ID 是否重复。
- 三类事件缺少 `startedAt` / `targetDate` / `id` 的数量。
- linked ids 是否指向存在事件。
- 单向关联数量，例如 Porn use 指向 Masturbation，但 Masturbation 未反向指回。
- 旧数据是否缺少三类事件表。

预览表达原则：

- 旧数据缺少三类事件表不是错误，只显示“旧格式，无成人行为事件表”。
- orphan linked ids 是 warning，不静默删除。
- ID 重复是 high severity，需要用户选择覆盖 / 合并策略或阻止导入。
- `dataVersion > LATEST_VERSION` 标记 newer，不盲目写入未知字段。

## Import merge

事件导入合并规则不同于 `logs`。

本节归刀 42+，不进入刀 41。

`logs` 以 `date` 为主键合并；三类事件必须以 `id` 为主键合并：

- 当前不存在该 `id`：新增。
- 当前存在该 `id` 且内容相同：跳过。
- 当前存在该 `id` 但内容不同：产生事件冲突。
- 冲突解决沿用 `keep-current` / `use-import`，或在 UI 刀中增加事件级选择。

事件合并禁止：

- 按 `startedAt` 合并两个不同 ID 的事件。
- 生成新 ID 来解决冲突。
- 因为 linked target 暂时不存在就删除 linked id。

导入写入顺序：

1. run migration，得到 logs + 三类事件。
2. 计算 ID 冲突、orphan linked ids、单向关联。
3. 按策略 merge logs。
4. 按 `id` merge 三类事件。
5. 写入同一个 Dexie transaction。
6. 写入后跑 snapshot / integrity readback。

## Snapshot integrity

`snapshotIntegrity` 需要新增三类事件校验。

本节归刀 42+，不进入刀 41。

读回自检必须比较：

- `pornUseEvents.length`
- `masturbationEvents.length`
- `sexEvents.length`
- 三类事件 ID 集合是否一致。
- 三类事件 linked ids 是否仍然可解析。

完整性检查需要覆盖：

- `PornUseEvent.linkedMasturbationEventIds` 指向存在的 `MasturbationEvent.id`。
- `PornUseEvent.linkedSexEventIds` 指向存在的 `SexEvent.id`。
- `MasturbationEvent.linkedPornUseEventIds` 指向存在的 `PornUseEvent.id`。
- `MasturbationEvent.linkedSexEventIds` 指向存在的 `SexEvent.id`。
- `SexEvent.linkedPornUseEventIds` 指向存在的 `PornUseEvent.id`。
- `SexEvent.linkedMasturbationEventIds` 指向存在的 `MasturbationEvent.id`。
- 三类事件都有 `targetDate`。
- `targetDate` 与 `startedAt` 的 03:00 生理日规则一致，或能报告异常。

双向关联修复策略：

- A 指向 B，B 存在但未反向指向 A：报告 one-way；repair 可补齐反向 linked id。
- A 指向不存在的 B：报告 orphan；不能自动创建 B，只能允许用户清理 linked id。

## Encrypted backup

加密导出 / 导入使用同一 `ExportSnapshot` 数据结构。

本节归刀 42+，不进入刀 41。

要求：

- 加密前包含三类事件数组。
- 解密后走同一 import preview / migration / merge / integrity 路径。
- 不能因为是加密备份就跳过 linked ids 检查。

## CSV / Markdown

0.2.2 JSON 是完整数据承诺；CSV / Markdown 是可读性导出。

本节归刀 42+，不进入刀 41。

MVP：

- JSON 必须完整包含三类事件和 linked ids。
- CSV 可以先保留旧导出，或新增成人行为事件 CSV。
- Markdown 可以先不展开三类事件原始备注，避免敏感内容意外进入可读导出。

如新增 CSV：

- `porn_use_events.csv`
- `masturbation_events.csv`
- `sex_events.csv`
- `adult_event_links.csv` 可选，用于展开 linked ids。

Markdown 原则：

- 默认不包含 `notes` / `legacySexRecord.notes` 全文。
- 如后续允许包含，必须由用户显式选择。
- 文件名不默认使用露骨字段。
