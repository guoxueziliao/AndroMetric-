# 0.2.2 刀 43 执行拆解

> 本文只规划刀 43：Porn use event model + tests。它承接刀 42 的 storage/import-export 能力，不做 UI 表单、事件关联 UI 或复盘。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 schema / migration / domain types；刀 42 storage / import-export / snapshot integrity。
- 实现边界：把 `PornUseEvent` 的字段契约落成领域模型、默认值、hydrate / validate 和模型测试。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`event-fields.md`](./event-fields.md)
3. [`adult-behavior-data-model.md`](./adult-behavior-data-model.md)
4. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
5. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
6. [`adult-behavior-data-model-tests.md`](./adult-behavior-data-model-tests.md)

实现前还必须检查：

- `git status --short`
- 刀 41 产出的 `PornUseEvent` domain type
- 刀 42 产出的 storage / repository 入口
- 现有 domain model / hydrate / validation helper 风格
- 现有 tag / notes / linked ids 处理方式

## 刀 43 目标

完成后应具备：

- Porn use event 可通过模型 helper 创建合法默认对象。
- Porn use event 可 hydrate 旧数据 / import 数据的缺失字段。
- Porn use event 可 validate 必要字段和禁止字段。
- tags / notes / linked ids 的基础规则稳定。
- 不从旧 `pornConsumption` 生成 Porn use event 的规则仍保持。
- 不引入内容收藏、URL、缩略图、演员名、成瘾布尔或成人内容开关。

## 实现顺序

### 1. Model helper

建议新增或扩展：

- `features/sex-life/model/pornUseEvent.ts`
- 或沿用项目现有 adult behavior / sex-life model 组织方式。

要落地：

- `createPornUseEventDraft(input)`
- `hydratePornUseEvent(raw)`
- `normalizePornUseEvent(event)`
- `validatePornUseEvent(event)`

实际命名以代码现有风格为准，文档只约束能力。

不要做：

- 不把 helper 放进 React component。
- 不让 model helper 直接读 Dexie。
- 不在 model helper 中写 UI 文案。

### 2. Defaults / hydrate

默认值：

- 数组字段默认 `[]`：
  - `contentTypes`
  - `sourceTypes`
  - `afterState`
  - `motives`
  - `linkedMasturbationEventIds`
  - `linkedSexEventIds`
  - `tags`
- nullable 标量默认 `null`：
  - `durationMinutes`
  - `arousalLevel`
  - `ledToMasturbation`
  - `ejaculated`
  - `controlFeeling`
  - `exceededIntendedTime`
  - `orgasmIntensity`
  - `fatigueAfter`
  - `satisfaction`
  - `sleepImpact`
- `edging` 默认 `none`。
- `status` 默认 `completed`。
- `source` 新建时默认 `manual`，import / migration / repair 由调用方传入。
- `targetDate` 必须按 03:00 生理日规则由 `startedAt` 计算。

hydrate 规则：

- 缺数组字段时补 `[]`。
- 缺 nullable 字段时补 `null`。
- 缺 `edging` 时补 `none`。
- 缺 `targetDate` 时可由 `startedAt` 计算；如果 `startedAt` 缺失，validate 应报告错误。
- 去重 linked ids 和 tags，但不擅自删除未知 tag 字符串。

### 3. Validation

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
- linked ids 必须是字符串数组。
- `platformName` 如存在，只是用户输入的平台名。

禁止字段：

- `actualUrl`
- 缩略图 / 图片 / 视频 / 音频内容本体。
- 演员名 / 创作者名。
- `addicted`
- `badPorn`
- `explicitnessLevel`
- 非法内容审核字段。
- 成人内容启用 / 禁用字段。

### 4. Tags / notes

规则：

- `tags` 复用现有标签体系，模型层只保存 tag 字符串或既有 tag reference 形态。
- 不为色情内容类型额外建立大型标签库。
- `notes` 是自由备注。
- 统计和复盘不能依赖 `notes` 文本解析。
- Markdown 导出是否包含 notes 全文不在刀 43 决定。

### 5. Linked ids

规则：

- Porn use event 持有：
  - `linkedMasturbationEventIds`
  - `linkedSexEventIds`
- 刀 43 只保证字段默认值、去重和模型级合法性。
- 双向写入 transaction 已归刀 42 storage / repository 能力。
- 创建流程内自动关联和手动关联 UI 归刀 47。
- 关联候选推荐归刀 47，不在刀 43 根据时间自动写入关联。

不要做：

- 不根据同一天或前后 6 小时自动写 linked ids。
- 不根据 notes / platformName / contentTypes / tags 自动关联。
- 不创建缺失的 Masturbation / Sex event。

### 6. Tests

优先新增或扩展 Porn use model tests。

必须覆盖：

- create draft 生成必要基础字段。
- `targetDate` 按 03:00 生理日规则计算。
- 数组字段缺失时 hydrate 为 `[]`。
- nullable 字段缺失时 hydrate 为 `null`。
- `edging` 缺失时 hydrate 为 `none`。
- tags / linked ids 去重。
- `durationMinutes` 非负校验。
- 1-5 scale 字段校验。
- enum 字段校验。
- 缺 `startedAt` 报错。
- 禁止字段不会进入 normalized event。
- 旧 `pornConsumption` 不生成 Porn use event 的测试仍保留。

## 非目标

刀 43 不做：

- Porn use UI 入口。
- Porn use 最小表单。
- 表单文案。
- 创建流程内自动关联。
- Event linking UI。
- Masturbation event alignment。
- Sex event adapter。
- Basic review loop。
- CSV / Markdown 明细导出。
- 内容收藏器。
- URL / 缩略图 / 图片 / 视频 / 音频本体。
- 演员名 / 创作者名。
- 成瘾布尔。
- 成人内容开关。

这些属于刀 44+、刀 46+ 或明确不做范围。

## 验收

刀 43 完成时至少跑：

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
- Porn use model tests 通过。
- Porn use event 默认值稳定。
- Porn use event hydrate / normalize 不丢 linked ids。
- 禁止字段没有进入模型。
- 无 UI 范围蔓延。

## 交接给刀 44

刀 43 完成后，刀 44 接：

- Masturbation event alignment。
- Masturbation event 默认值、hydrate / validate。
- 旧自慰结构 adapter 或兼容层。
- `linkedPornUseEventIds` / `linkedSexEventIds` 在自慰事件中的模型规则。
