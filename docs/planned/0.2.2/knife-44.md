# 0.2.2 刀 44 执行拆解

> 本文只规划刀 44：Masturbation event alignment。它承接刀 43 的 Porn use model，不重写现有自慰 UI，不推翻内容 item/editor。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 schema / migration / domain types；刀 42 storage / import-export / snapshot integrity；刀 43 Porn use event model。
- 实现边界：把 `MasturbationEvent` 的字段契约落成模型默认值、hydrate / validate、旧结构 adapter 或兼容层。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`event-fields.md`](./event-fields.md)
3. [`adult-behavior-data-model.md`](./adult-behavior-data-model.md)
4. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
5. [`adult-behavior-data-model-storage-migration.md`](./adult-behavior-data-model-storage-migration.md)
6. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
7. [`adult-behavior-data-model-tests.md`](./adult-behavior-data-model-tests.md)

实现前还必须检查：

- `git status --short`
- 旧 `MasturbationRecordDetails` 类型和现有编辑入口
- 刀 41 产出的 `MasturbationEvent` domain type
- 刀 42 产出的 storage / repository 入口
- 刀 43 的 model helper 风格
- 现有 contentItems / item editor 数据形态

## 刀 44 目标

完成后应具备：

- Masturbation event 可通过模型 helper 创建合法默认对象。
- Masturbation event 可 hydrate 旧数据 / import 数据的缺失字段。
- Masturbation event 可 validate 必要字段和 enum / scale 字段。
- 旧自慰结构可通过 adapter 或兼容层接入新事件语义。
- 一天多次自慰事件的模型语义稳定。
- `linkedPornUseEventIds` / `linkedSexEventIds` 字段默认值、去重和合法性稳定。
- 现有 `contentItems` / item editor 不被强行推翻。

## 实现顺序

### 1. Model helper

建议新增或扩展：

- `features/sex-life/model/masturbationEvent.ts`
- 或沿用刀 43 形成的 adult behavior model 组织方式。

要落地：

- `createMasturbationEventDraft(input)`
- `hydrateMasturbationEvent(raw)`
- `normalizeMasturbationEvent(event)`
- `validateMasturbationEvent(event)`
- `mapMasturbationRecordToEvent(record, log)`

实际命名以代码现有风格为准，文档只约束能力。

不要做：

- 不把 helper 放进 React component。
- 不让 model helper 直接读 Dexie。
- 不在 model helper 中写 UI 文案。

### 2. Defaults / hydrate

默认值：

- 数组字段默认 `[]`：
  - `stimulationSources`
  - `afterState`
  - `linkedPornUseEventIds`
  - `linkedSexEventIds`
  - `tags`
- nullable 标量默认 `null`：
  - `durationMinutes`
  - `ejaculated`
  - `orgasmIntensity`
  - `hardnessLevel`
  - `arousalLevel`
  - `satisfaction`
  - `fatigueAfter`
  - `sleepImpact`
  - `controlFeeling`
  - `exceededIntendedTime`
  - `ejaculationCount`
- `edging` 默认 `none`。
- `sessionCount` 默认 `1`。
- `status` 默认 `completed`。
- `source` 新建时默认 `manual`，import / migration / repair 由调用方传入。
- `targetDate` 必须按 03:00 生理日规则由 `startedAt` 计算。

hydrate 规则：

- 缺数组字段时补 `[]`。
- 缺 nullable 字段时补 `null`。
- 缺 `edging` 时补 `none`。
- 缺 `sessionCount` 时补 `1`。
- 缺 `targetDate` 时可由 `startedAt` 计算；如果 `startedAt` 缺失，validate 应报告错误。
- 去重 linked ids 和 tags，但不擅自删除未知 tag 字符串。

### 3. 旧结构 adapter / 兼容层

旧 `LogEntry.masturbation[]` 已由刀 41 migration 生成 `MasturbationEvent[]`。刀 44 只补模型层 adapter / 兼容层，避免现有 UI 被一次性推翻。

映射规则：

- `record.id` 优先作为事件 ID。
- `log.date + record.startTime` 合成 `startedAt`。
- `startedAt` 计算 `targetDate`。
- `record.duration` -> `durationMinutes`。
- `record.ejaculation` -> `ejaculated`。
- `record.orgasmIntensity` -> `orgasmIntensity`。
- `record.edging` -> `edging`。
- `record.satisfactionLevel` -> `satisfaction`。
- `record.notes` -> `notes`。

不做：

- 不把旧 `contentItems` / `assets` / `materials` / `props` / `tools` 自动生成 Porn use event。
- 不从旧素材、演员或标签推断色情内容类型。
- 不删除旧 `logs.masturbation[]`。
- 不重做 item editor。

### 4. Validation

必要字段：

- `id`
- `startedAt`
- `targetDate`
- `createdAt`
- `updatedAt`
- `status`
- `source`

校验规则：

- `targetDate` 与 `startedAt` 的 03:00 生理日规则一致。
- `durationMinutes` 为 `null` 或非负数字。
- `sessionCount` 为正整数。
- `ejaculationCount` 为 `null` 或非负整数。
- 1-5 scale 字段只能是 `1 | 2 | 3 | 4 | 5 | null`。
- enum 字段只能使用契约内枚举值。
- linked ids 必须是字符串数组。

语义规则：

- `ejaculated` 未知时为 `null`，不要强制 `false`。
- `orgasmIntensity` 不射精或未知时允许 `null`。
- `hardnessLevel` 和 `arousalLevel` 是两个指标，不能互相推断。
- `satisfaction` 是主观满足 / 泄压感，不命名为表现评分。
- `sessionCount` / `ejaculationCount` 只记录事实，不做挑战指标。

### 5. Linked ids

规则：

- Masturbation event 持有：
  - `linkedPornUseEventIds`
  - `linkedSexEventIds`
- 刀 44 只保证字段默认值、去重和模型级合法性。
- 双向写入 transaction 已归刀 42 storage / repository 能力。
- 创建流程内自动关联和手动关联 UI 归刀 47。
- `stimulationSources` 包含 `porn` 时，只能鼓励关联 Porn use event，不能自动创建或自动写 linked id。

不要做：

- 不根据同一天或前后 6 小时自动写 linked ids。
- 不根据 contentItems / tags / notes 自动关联。
- 不创建缺失的 Porn use / Sex event。

### 6. Tests

优先新增或扩展 Masturbation event model tests。

必须覆盖：

- create draft 生成必要基础字段。
- `targetDate` 按 03:00 生理日规则计算。
- 数组字段缺失时 hydrate 为 `[]`。
- nullable 字段缺失时 hydrate 为 `null`。
- `edging` 缺失时 hydrate 为 `none`。
- `sessionCount` 缺失时 hydrate 为 `1`。
- tags / linked ids 去重。
- `durationMinutes` 非负校验。
- `sessionCount` 正整数校验。
- `ejaculationCount` 非负整数或 `null` 校验。
- 1-5 scale 字段校验。
- enum 字段校验。
- 缺 `startedAt` 报错。
- 旧 `MasturbationRecordDetails` 可映射到 `MasturbationEvent`。
- 旧 `contentItems` / `assets` 不自动生成 Porn use event。

## 非目标

刀 44 不做：

- Masturbation UI 重做。
- contentItems / item editor 重做。
- Porn use 自动创建。
- 创建流程内自动关联。
- Event linking UI。
- Sex event adapter。
- Basic review loop。
- CSV / Markdown 明细导出。
- 成瘾布尔。
- 道德化评价字段。
- 性次数 / 射精次数挑战字段。
- 色情内容 URL、缩略图、图片、视频、音频本体。
- 演员名 / 创作者名。

这些属于刀 45+、刀 46+、刀 47 或明确不做范围。

## 验收

刀 44 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果新增或调整 shared model exports，建议同时跑：

```bash
npm run build
```

验收标准：

- typecheck 通过。
- Masturbation event model tests 通过。
- 旧自慰结构 adapter / 兼容层测试通过。
- Masturbation event 默认值稳定。
- Masturbation event hydrate / normalize 不丢 linked ids。
- 旧 `contentItems` / item editor 未被强行推翻。
- 无 UI 范围蔓延。

## 交接给刀 45

刀 44 完成后，刀 45 接：

- Sex event mapping / adapter。
- 现有 SexRecord 与 SexEvent 的语义映射。
- `legacySexRecord` 保留策略。
- `pornInvolved` / `pornUseContext` / linked ids 在 Sex event 中的模型规则。
