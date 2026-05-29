# 0.2.2 刀 45 执行拆解

> 本文只规划刀 45：Sex event mapping / adapter。它承接刀 44 的 Masturbation event alignment，不全面重写 SexRecord 体验。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 schema / migration / domain types；刀 42 storage / import-export / snapshot integrity；刀 43 Porn use event model；刀 44 Masturbation event alignment。
- 实现边界：把现有 `SexRecordDetails` 映射到 `SexEvent` 语义，保留 `legacySexRecord`，补齐色情参与和 linked ids 的模型规则。

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
- 旧 `SexRecordDetails` 类型和现有编辑入口
- 现有 partner profile / partner id 数据形态
- 刀 41 产出的 `SexEvent` domain type
- 刀 42 产出的 storage / repository 入口
- 刀 43 / 44 的 model helper 风格

## 刀 45 目标

完成后应具备：

- Sex event 可通过模型 helper 创建合法默认对象。
- Sex event 可 hydrate 旧数据 / import 数据的缺失字段。
- Sex event 可 validate 必要字段和 enum / scale 字段。
- 旧 `SexRecordDetails` 可通过 adapter 映射到 `SexEvent`。
- `legacySexRecord` 完整保留旧记录主体。
- `partnerIds` 只在能明确匹配时写入。
- `pornInvolved` / `pornUseContext` 字段语义稳定。
- `linkedPornUseEventIds` / `linkedMasturbationEventIds` 字段默认值、去重和合法性稳定。

## 实现顺序

### 1. Model helper

建议新增或扩展：

- `features/sex-life/model/sexEvent.ts`
- 或沿用刀 43 / 44 形成的 adult behavior model 组织方式。

要落地：

- `createSexEventDraft(input)`
- `hydrateSexEvent(raw)`
- `normalizeSexEvent(event)`
- `validateSexEvent(event)`
- `mapSexRecordToEvent(record, log, partners?)`

实际命名以代码现有风格为准，文档只约束能力。

不要做：

- 不把 helper 放进 React component。
- 不让 model helper 直接读 Dexie。
- 不在 model helper 中写 UI 文案。

### 2. Defaults / hydrate

默认值：

- 数组字段默认 `[]`：
  - `partnerIds`
  - `interactionTypes`
  - `afterState`
  - `pornUseContext`
  - `riskFlags`
  - `linkedPornUseEventIds`
  - `linkedMasturbationEventIds`
  - `tags`
- nullable 标量默认 `null`：
  - `durationMinutes`
  - `hardnessLevel`
  - `ejaculated`
  - `ejaculationContext`
  - `orgasmIntensity`
  - `satisfaction`
  - `pornInvolved`
  - `arousalLevel`
  - `fatigueAfter`
  - `recoveryFeeling`
  - `contraception`
  - `sleepImpact`
- `penetration` 默认 `unknown`。
- `status` 默认 `completed`。
- `source` 新建时默认 `manual`，import / migration / repair 由调用方传入。
- `targetDate` 必须按 03:00 生理日规则由 `startedAt` 计算。

hydrate 规则：

- 缺数组字段时补 `[]`。
- 缺 nullable 字段时补 `null`。
- 缺 `penetration` 时补 `unknown`。
- 缺 `targetDate` 时可由 `startedAt` 计算；如果 `startedAt` 缺失，validate 应报告错误。
- 去重 linked ids、partner ids 和 tags，但不擅自创建 partner。

### 3. SexRecord adapter

旧 `LogEntry.sex[]` 已由刀 41 migration 生成 `SexEvent[]`。刀 45 补模型层 adapter，保留旧 SexRecord 主体结构和交互大框架。

映射规则：

- `record.id` 优先作为事件 ID。
- `log.date + record.startTime` 合成 `startedAt`。
- `startedAt` 计算 `targetDate`。
- `record.duration` -> `durationMinutes`。
- `record.ejaculation` -> `ejaculated`。
- `record.notes` -> `notes`。
- `record` 完整保留到 `legacySexRecord`。

谨慎映射：

- `record.partner` 只有明确是 `PartnerProfile.id`，或可无歧义匹配现有 partner id 时，才进入 `partnerIds`。
- `record.protection` 需要明确映射表；不能确定时 `contraception = null`。
- `record.ejaculationLocation` 需要明确映射表；不能确定时 `ejaculationContext = null`。
- `record.interactions` / `acts` / `positions` 不能确定时 `interactionTypes = []`，复杂结构保留在 `legacySexRecord`。

禁止映射：

- 不把旧 `partnerScore` 映射成 `satisfaction`。
- 不自动创建 PartnerProfile。
- 不自动推断色情内容参与。
- 不自动生成 risk flags。
- 不删除旧 `logs.sex[]`。

### 4. Porn involvement

字段语义：

- `pornInvolved` 表示本次性行为是否有色情内容参与；未知时为 `null`。
- `pornUseContext` 表示参与上下文，例如性交前唤起、共同观看、过程中播放、事后继续观看等。
- `linkedPornUseEventIds` 表示具体关联的 Porn use event。

规则：

- `pornInvolved = true` 不强制必须有关联的 Porn use event。
- 有 `linkedPornUseEventIds` 时，可以推导为色情内容有参与，但不要反向自动创建 Porn use event。
- 没有 `linkedPornUseEventIds` 时，不代表没有色情内容参与。
- 旧数据不能根据备注、标签、平台名或伴侣信息自动推断 `pornInvolved`。

### 5. Validation

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
- 1-5 scale 字段只能是 `1 | 2 | 3 | 4 | 5 | null`。
- enum 字段只能使用契约内枚举值。
- linked ids / partner ids 必须是字符串数组。
- `riskFlags` 只能使用契约内枚举值。

语义规则：

- `satisfaction` 是用户主观体验，不是伴侣评分。
- `partnerIds` 是上下文，不用于排名、评分或优劣判断。
- `riskFlags` 只做记录，不做自动风险判断。
- `penetration = unknown` 是合法状态，不强迫用户补全。

### 6. Linked ids

规则：

- Sex event 持有：
  - `linkedPornUseEventIds`
  - `linkedMasturbationEventIds`
- 刀 45 只保证字段默认值、去重和模型级合法性。
- 双向写入 transaction 已归刀 42 storage / repository 能力。
- 创建流程内自动关联和手动关联 UI 归刀 47。
- `pornInvolved` 或 `pornUseContext` 不能自动写 linked ids。

不要做：

- 不根据同一天或前后 6 小时自动写 linked ids。
- 不根据 notes / partner / tags 自动关联。
- 不创建缺失的 Porn use / Masturbation event。

### 7. Tests

优先新增或扩展 Sex event model / adapter tests。

必须覆盖：

- create draft 生成必要基础字段。
- `targetDate` 按 03:00 生理日规则计算。
- 数组字段缺失时 hydrate 为 `[]`。
- nullable 字段缺失时 hydrate 为 `null`。
- `penetration` 缺失时 hydrate 为 `unknown`。
- linked ids / partner ids / tags 去重。
- `durationMinutes` 非负校验。
- 1-5 scale 字段校验。
- enum 字段校验。
- 缺 `startedAt` 报错。
- 旧 `SexRecordDetails` 可映射到 `SexEvent`。
- 旧 SexRecord 完整保留到 `legacySexRecord`。
- 旧 `partnerScore` 不映射到 `satisfaction`。
- 无法明确匹配 partner 时不写入 `partnerIds`。
- 旧数据不自动推断 `pornInvolved`。
- 旧数据不自动生成 risk flags。

## 非目标

刀 45 不做：

- Sex UI 重做。
- 伴侣管理重构。
- 自动创建 PartnerProfile。
- Porn use 自动创建。
- Masturbation event 自动创建。
- 创建流程内自动关联。
- Event linking UI。
- Basic review loop。
- CSV / Markdown 明细导出。
- 伴侣评分 / 排名新模型。
- 医学 / STI / 怀孕风险判断系统。
- 成人内容开关。

这些属于刀 46+、刀 47、后续版本或明确不做范围。

## 验收

刀 45 完成时至少跑：

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
- Sex event model / adapter tests 通过。
- 旧 SexRecord 完整保留到 `legacySexRecord`。
- 旧 `partnerScore` 未映射成 `satisfaction`。
- 没有伪造 PartnerProfile。
- 没有自动推断色情参与或 risk flags。
- Sex event hydrate / normalize 不丢 linked ids。
- 无 UI 范围蔓延。

## 交接给刀 46

刀 45 完成后，刀 46 接：

- UI entry points + minimal forms。
- Porn use event 最小记录入口。
- Masturbation / Sex 表单中的必要关联入口或轻量字段。
- 手机 Chrome 优先的最小可用记录流程。
