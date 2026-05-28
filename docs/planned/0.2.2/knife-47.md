# 0.2.2 刀 47 执行拆解

> 本文只规划刀 47：Event linking UI。它承接刀 46 的最小表单，负责创建流程内关联、手动关联、已关联展示和解除关联，不做复盘。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 - 45 数据 / 模型 / storage；刀 46 UI entry points + minimal forms。
- 实现边界：让用户能明确建立、查看、解除 Porn use / Masturbation / Sex 事件之间的 typed linked ids。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`knife-46.md`](./knife-46.md)
3. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
4. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
5. [`adult-behavior-data-model-import-export-integrity.md`](./adult-behavior-data-model-import-export-integrity.md)
6. [`../completed/plan-0.2.1.md`](../../completed/plan-0.2.1.md)
7. [`../completed/ui-interaction-system.md`](../../completed/ui-interaction-system.md)

实现前还必须检查：

- `git status --short`
- 刀 42 的 repository / storage linked ids 写入能力。
- Porn use / Masturbation / Sex 三类最小表单位置。
- 现有 Modal / BottomSheet / Confirm / Toast API。
- 手机 Chrome 下长候选列表和键盘行为。

## 刀 47 目标

完成后应具备：

- 创建流程内可以明确关联新建或已有事件。
- 用户可以手动关联同一 `targetDate` 或前后 6 小时内的候选事件。
- 用户可以查看已关联事件。
- 用户可以解除关联。
- 写入关联时尽量保持双向 linked ids 一致。
- Orphan linked id 可以在 UI 中被识别或清理，不自动创建缺失事件。

## 实现顺序

### 1. Candidate query

候选范围：

- 同一 `targetDate`。
- 或 `startedAt` 前后 6 小时内。

排序建议：

1. 同一 `targetDate`。
2. 时间距离更近。
3. 事件类型更相关：
   - Masturbation 表单优先显示 Porn use，再显示 Sex。
   - Sex 表单优先显示 Porn use，再显示 Masturbation。
   - Porn use 表单优先显示 Masturbation，再显示 Sex。
4. 已有关联事件排在前面。

规则：

- 候选范围只是 UI 推荐，不是数据硬约束。
- 用户可以手动关联更远的事件，但刀 47 可以先只提供推荐范围。
- 不根据备注、平台名、content type、tag 自动推荐为已关联。

### 2. 创建流程内自动关联

允许：

- Masturbation 表单中同步创建 Porn use event，并自动双向关联。
- Masturbation 表单中选择已有 Porn use event，并写入双向 linked ids。
- Sex 表单中标记 `pornInvolved` 并同步创建 Porn use event，并自动双向关联。
- Sex 表单中选择已有 Porn use event，并写入双向 linked ids。
- Sex 表单关联 Masturbation event，或 Masturbation 表单关联 Sex event，并写入双向 linked ids。

限制：

- “自动关联”只指用户在创建流程里明确选择或同步创建。
- 不根据时间接近直接写入关联。
- 不根据同一天发生直接写入关联。
- 不根据 notes / platformName / tags / contentTypes 自动写入关联。
- 不做机器学习、行为预测或联网识别。

### 3. 手动关联 UI

建议形态：

- 在三类事件编辑表单中增加“关联事件”区块。
- 已有关联常显。
- “添加关联”打开 BottomSheet 或 Modal 选择候选事件。
- 候选项展示类型、时间、关键摘要和是否已关联。
- 支持按事件类型筛选。

手机 Chrome 规则：

- 候选列表可滚动。
- 触控项最小 44px 高。
- 操作按钮不依赖 hover。
- BottomSheet 不遮挡底部导航和键盘。
- 空状态使用短句，不写教程式说明。

### 4. 已关联事件展示

展示内容：

- 事件类型。
- `startedAt` 时间。
- `targetDate`。
- 关键摘要：
  - Porn use：时长、source/content 类型、是否进入自慰。
  - Masturbation：时长、是否射精、硬度或兴奋强度。
  - Sex：时长、是否射精、伴侣上下文摘要如可用。
- 解除关联操作。

规则：

- 已关联展示不是复盘，不输出趋势或解释。
- 不展示伴侣评分或排名。
- 不展示 URL、缩略图、图片、视频或演员名。
- Orphan linked id 可显示为“关联事件已不存在”，并提供清理。

### 5. 解除关联

规则：

- 用户解除 A -> B 时，应同时移除 B -> A。
- 如果 B 不存在，只移除 A 中的 orphan id，并记录清理结果。
- 解除关联不删除任何事件。
- 删除事件不级联删除关联事件。

Confirm：

- 普通解除关联可以低风险确认或直接操作后 Toast，按现有交互风格决定。
- 删除事件仍使用 danger Confirm。
- 有 linked ids 的事件删除时，文案说明“不会删除关联事件，只会解除关联”。

### 6. Integrity affordance

刀 47 只做轻量 UI affordance：

- 可识别 orphan linked id。
- 可提示单向关联由完整性检查或修复处理。
- 可清理当前事件里的 orphan linked id。

不要做：

- 不做完整 snapshot integrity UI。
- 不做导入预览 UI。
- 不做大规模 repair center。
- 不自动创建缺失事件。

## 非目标

刀 47 不做：

- Basic review loop。
- 时间线复盘。
- 周报 / 月报。
- 洞察或相关性分析。
- 自动推断关联。
- 根据时间接近直接写关联。
- 根据文本备注自动关联。
- 伴侣评分 / 排名。
- URL / 缩略图 / 图片 / 视频 / 音频本体。
- 成人内容开关。

这些属于刀 48+ 或明确不做范围。

## Tests

优先新增或扩展 UI / repository integration tests，具体形式按现有测试栈决定。

必须覆盖：

- 候选查询包含同一 `targetDate` 事件。
- 候选查询包含前后 6 小时事件。
- 候选排序按 targetDate、时间距离和类型相关性。
- 创建流程选择已有 Porn use 后双向 linked ids 写入。
- 创建流程同步创建 Porn use 后双向 linked ids 写入。
- 手动关联 Porn use <-> Masturbation。
- 手动关联 Porn use <-> Sex。
- 手动关联 Masturbation <-> Sex。
- 解除关联同时移除双方 linked ids。
- Orphan linked id 可清理且不创建缺失事件。
- 删除事件不级联删除关联事件。
- 不根据同一天或时间接近自动写入关联。

## 验收

刀 47 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果改动 UI bundle、表单结构或 repository transaction，建议同时跑：

```bash
npm run build
```

还应做手机 Chrome 手动验收：

- 在 Porn use 表单关联 Masturbation / Sex。
- 在 Masturbation 表单关联 Porn use / Sex。
- 在 Sex 表单关联 Porn use / Masturbation。
- 解除关联。
- 清理 orphan linked id。
- 删除有关联事件时确认文案正确。

验收标准：

- typecheck 通过。
- event linking tests 通过。
- 手动关联能双向写入。
- 解除关联不删除事件。
- Orphan linked id 不被静默删除。
- 无复盘范围蔓延。

## 交接给刀 48

刀 47 完成后，刀 48 接：

- Basic review loop。
- 同一生理日 Porn / Masturbation / Sex 事件时间线。
- 关键字段事实展示。
- 事件关联链路展示。
- 样本不足时只展示事实，不做过度归因。
