# 0.2.2 刀 42 执行拆解

> 本文只规划刀 42：storage / import-export / snapshot integrity。它承接刀 41 的数据骨架，不做 UI、事件表单或复盘。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 schema / migration / domain types 完成。
- 实现边界：让三类成人行为事件能完整读写、导入、导出、快照和完整性检查。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`knife-41.md`](./knife-41.md)
3. [`adult-behavior-data-model.md`](./adult-behavior-data-model.md)
4. [`adult-behavior-data-model-import-export-integrity.md`](./adult-behavior-data-model-import-export-integrity.md)
5. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
6. [`adult-behavior-data-model-tests.md`](./adult-behavior-data-model-tests.md)

实现前还必须检查：

- `git status --short`
- `core/storage/db.ts`
- `core/storage/storageService.ts` 或现有 StorageService 入口
- `core/storage/migration.ts`
- import preview / import merge 现有入口
- export / snapshot / encrypted backup 现有入口
- snapshot integrity 现有测试形态

## 刀 42 目标

完成后应具备：

- 三类事件可通过 storage / repository 层读写。
- JSON export 包含三类事件数组，即使为空。
- JSON import 缺少三类事件数组时安全默认为空。
- JSON import 已包含三类事件时保留原始 ID 和 linked ids。
- import preview 能展示三类事件数量和关键 warning。
- import merge 以事件 `id` 合并三类事件。
- snapshot integrity 校验三类事件数量、ID、`targetDate` 和 linked ids。
- encrypted backup 走同一 import / export / integrity 路径。

## 实现顺序

### 1. Storage / repository 接线

要落地：

- 三类事件的 create / read / update / delete 基础能力。
- 按 `id` 查询单条事件。
- 按 `targetDate` 查询生理日事件。
- 按 `startedAt` 排序读取时间线事件。
- 创建 / 更新事件时保留稳定 `id`。
- 创建 / 更新事件时计算或校验 `targetDate`。

不要做：

- 不做 UI 表单。
- 不做自动关联推荐 UI。
- 不实现复盘分析。
- 不重写旧 `logs.sex[]` / `logs.masturbation[]` UI adapter。

### 2. JSON export

要落地：

- `StorageService.createSnapshot()` 或当前 JSON export 路径读取三张事件表。
- `SnapshotData` / `ExportSnapshot` 输出：
  - `pornUseEvents`
  - `masturbationEvents`
  - `sexEvents`
- 新格式导出即使为空也输出 `[]`。
- `dataVersion` 使用 `LATEST_VERSION`。
- 旧 `logs.sex[]` / `logs.masturbation[]` 仍留在 `logs` 中。

不要做：

- 不把 CSV / Markdown 明细作为刀 42 必须项。
- 不默认导出 notes 全文到 Markdown。
- 不新增分享图。

### 3. Import preview

要落地：

- counts 新增：
  - `pornUseEvents`
  - `masturbationEvents`
  - `sexEvents`
- 旧数据缺少三类事件表时显示旧格式提示，不作为错误。
- 检查三类事件重复 ID。
- 检查缺少 `id` / `startedAt` / `targetDate` 的事件数量。
- 检查 orphan linked ids。
- 检查 one-way linked ids。
- `dataVersion > LATEST_VERSION` 仍按现有 newer 策略处理。

严重级别建议：

- 缺少三类事件表：info。
- orphan linked ids：warning。
- one-way linked ids：warning。
- 缺少必要字段：warning 或 error，按现有导入策略对齐。
- 重复 ID：high severity，不能静默覆盖。

### 4. Import merge

要落地：

- 先运行 migration，得到 logs + 三类事件。
- `logs` 继续按既有 date 主键合并。
- 三类事件按 `id` 合并。
- 当前不存在该 `id`：新增。
- 当前存在该 `id` 且内容相同：跳过。
- 当前存在该 `id` 但内容不同：产生事件冲突。
- 冲突解决沿用现有 `keep-current` / `use-import` 语义，除非现有 UI 必须后续扩展。
- 写入尽量在同一个 Dexie transaction 内完成。

禁止：

- 不按 `startedAt` 合并两个不同 ID 的事件。
- 不生成新 ID 来解决导入冲突。
- 不因为 linked target 暂时不存在就删除 linked id。
- 不从旧 `pornConsumption` 生成 Porn use event。

### 5. Snapshot integrity

要落地：

- 快照写后读自检比较三类事件数量。
- 比较三类事件 ID 集合。
- 检查三类事件都有 `targetDate`。
- 检查 `targetDate` 与 `startedAt` 的 03:00 生理日规则一致。
- 检查 linked ids 是否指向存在事件。
- 报告 orphan linked ids。
- 报告 one-way linked ids。

repair 规则：

- one-way linked id：可由 repair 补齐反向 linked id。
- orphan linked id：不能自动创建缺失事件，只能报告或清理 linked id。
- 删除事件不级联删除其他事件。

### 6. Encrypted backup

要落地：

- 加密前的 snapshot 包含三类事件数组。
- 解密后走同一 migration / import preview / merge / integrity 路径。
- 加密备份不能跳过 linked ids 检查。

## 非目标

刀 42 不做：

- Porn use 表单。
- Masturbation 表单重做。
- Sex form adapter 重做。
- Event linking UI。
- 创建流程内自动关联推荐。
- Basic review loop。
- CSV / Markdown 成人行为明细导出必做项。
- 伴侣评分 / 排名。
- 成人内容开关。
- 云端同步。
- 删除旧 `logs.sex[]` / `logs.masturbation[]`。

这些属于刀 43+、刀 46+ 或更后续版本。

## Tests

优先新增或扩展 storage / import-export / snapshot integrity tests。

必须覆盖：

- 三类事件可 create / read / update / delete。
- 按 `targetDate` 查询三类事件。
- JSON export 包含三类事件数组，即使为空。
- JSON import 缺少三类事件数组时默认为空。
- JSON import 已包含三类事件时保留原始 ID。
- import preview counts 包含三类事件。
- import preview 能报告重复 ID。
- import preview 能报告 orphan linked ids。
- import preview 能报告 one-way linked ids。
- import merge 以 `id` 合并三类事件。
- import merge 不按 `startedAt` 合并不同事件。
- round-trip 后三类事件数量一致。
- round-trip 后 linked ids 不丢失。
- snapshot integrity 比较三类事件数量和 ID 集合。
- snapshot integrity 能报告缺失 `targetDate`。
- snapshot integrity 能报告生理日不一致。
- encrypted backup round-trip 保留三类事件和 linked ids。

## 验收

刀 42 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果修改 export / backup / Dexie transaction 路径，建议同时跑：

```bash
npm run build
```

验收标准：

- typecheck 通过。
- storage / import-export / snapshot integrity tests 通过。
- JSON round-trip 不丢三类事件。
- linked ids 不被静默删除。
- orphan / one-way linked ids 能报告。
- 旧格式数据仍可导入。
- 无 UI 范围蔓延。

## 交接给刀 43

刀 42 完成后，刀 43 接：

- Porn use event model。
- Porn use event 创建、更新、删除、查询的领域规则。
- Porn use MVP 字段 default / hydrate。
- Porn use tags / notes / linked ids 基础能力。
- Porn use model tests。
