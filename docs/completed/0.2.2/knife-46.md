# 0.2.2 刀 46 执行拆解

> 本文只规划刀 46：UI entry points + minimal forms。它承接刀 45 的 Sex event adapter，只做最小可用记录入口，不做完整事件关联 UI 或复盘。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 schema / migration / domain types；刀 42 storage / import-export / snapshot integrity；刀 43 - 45 三类事件模型。
- 实现边界：新增 Porn use 最小记录入口，并在 Masturbation / Sex 表单中接入必要轻量字段或入口。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`event-fields.md`](./event-fields.md)
3. [`knife-43.md`](./knife-43.md)
4. [`knife-44.md`](./knife-44.md)
5. [`knife-45.md`](./knife-45.md)
6. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
7. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
8. [`../completed/plan-0.2.1.md`](../../completed/plan-0.2.1.md)
9. [`../completed/ui-interaction-system.md`](../../completed/ui-interaction-system.md)

实现前还必须检查：

- `git status --short`
- 现有 LogForm / daily log 记录入口。
- 现有 MasturbationRecordModal。
- 现有 SexRecordModal。
- 0.2.1 Modal / BottomSheet / Toast / Confirm / Checkbox / RecordCard 实际 API。
- 手机 Chrome 下现有长表单滚动和键盘行为。

## 刀 46 目标

完成后应具备：

- 用户能从高频记录路径新建 Porn use event。
- Porn use 最小表单能保存 0.2.2 MVP 字段。
- Masturbation 表单能表达是否伴随色情刺激，且不强制创建 Porn use event。
- Sex 表单能表达 `pornInvolved` / `pornUseContext` 的轻量字段，且不强制关联 Porn use event。
- 保存成功 / 失败有 Toast 反馈。
- 删除或放弃成人行为记录使用既有 Confirm / dirty close 规则。
- 手机 Chrome 320px 宽度下可用，footer 不遮挡内容，键盘不压住关键操作。

## UI 基线

刀 46 必须沿用 0.2.1 的应用层约束：

- 手机 Chrome 优先，桌面保持可用。
- 成人内容是产品默认语境，不新增成人内容开关。
- 成人内容编辑弹层使用 `adult` tone；删除、清空、覆盖等破坏性操作使用 `danger`。
- Toast 只做轻反馈，不做 action / undo。
- Confirm 负责风险确认。
- 表单输入时不做布局动画。
- 卡片 hover 不作为手机端主要反馈。
- 长表单必须能滚动，footer 不遮挡内容。

## 实现顺序

### 1. Porn use 记录入口

入口候选：

- 日记编辑里的成人行为记录区。
- 现有性活动 / 自慰记录附近。
- 快速记录入口中的成人行为组。

要落地：

- 明确一个主入口即可，不同时铺满多个入口。
- 入口文案使用直白成人健康表达，例如“色情使用”。
- 入口使用 adult 语义，不包装成“内容浏览”或“私密内容”。
- 入口不暗示这是内容收藏器。

不要做：

- 不新增独立 Porn use 页面。
- 不新增成人内容开关。
- 不新增内容平台 / 收藏夹入口。
- 不新增 URL / 图片 / 视频 / 缩略图上传入口。

### 2. Porn use 最小表单

MVP 字段：

- `startedAt`
- `durationMinutes`
- `contentTypes`
- `sourceTypes`
- `arousalLevel`
- `ledToMasturbation`
- `ejaculated`
- `afterState`
- `notes`，可选

强推荐但可折叠或后置：

- `motives`
- `controlFeeling`
- `exceededIntendedTime`
- `edging`
- `orgasmIntensity`
- `fatigueAfter`
- `satisfaction`
- `sleepImpact`

表单规则：

- `startedAt` 必须可编辑，默认当前时间。
- `targetDate` 不要求用户手动填写，由模型按 03:00 生理日规则计算。
- `durationMinutes` 强推荐，但允许暂时为空。
- 多选字段使用 checkbox / chip / existing selector，避免自由文本替代结构化字段。
- `platformName` 如出现，只能作为用户主动输入的平台名，不出现 URL 输入。
- 表单文案直白、工具化，不做挑逗式表达。

### 3. Masturbation 表单轻量接入

要落地：

- 能表达 `stimulationSources`，其中包含 `porn`。
- 当选择 `porn` 时，可以提示“可在后续关联 Porn use event”，但不自动创建。
- 不阻塞保存：用户可以只记录自慰事件，不关联 Porn use event。
- 保留现有自慰内容 item/editor，不强行替换。

不要做：

- 不根据 contentItems / tags / notes 自动创建 Porn use event。
- 不在刀 46 做完整事件选择器。
- 不强制用户补 Porn use 详情。

### 4. Sex 表单轻量接入

要落地：

- 能表达 `pornInvolved`。
- 能表达必要的 `pornUseContext`。
- 不强制必须关联具体 Porn use event。
- 不强制改造现有 SexRecord 大表单结构。
- 不新增伴侣评分 / 排名 UI。

不要做：

- 不自动创建 Porn use event。
- 不根据 partner / notes / tags 推断色情参与。
- 不在刀 46 做完整事件选择器。
- 不大改伴侣管理。

### 5. Feedback / confirm

Toast：

- 保存成功：短句反馈。
- 保存失败：error toast，说明失败对象。
- 旧数据或字段缺失导致降级：warning toast 或表单内提示。

Confirm：

- 删除 Porn use / Masturbation / Sex event：使用 danger。
- 放弃未保存表单：使用 medium severity。
- 删除有关联事件时，文案说明“不会删除关联事件，只会解除关联”，具体解除逻辑归刀 47 或已有 repository 能力。

不要做：

- 不做 undo toast。
- 不做通知中心。
- 不做浏览器系统通知。

### 6. Mobile acceptance

手机 Chrome 必查：

- 320px 宽度不水平溢出。
- 键盘弹出时关键输入和保存按钮可达。
- 表单 footer 不遮挡最后一项。
- Modal / BottomSheet 打开时 body 不穿透滚动。
- Toast 不遮挡底部导航、FAB、键盘。
- 长选项列表可滚动。
- 成人 tone 在深色模式下对比度足够。

## 非目标

刀 46 不做：

- Event linking UI。
- 事件候选选择器。
- 创建流程内自动关联。
- 已关联事件展示。
- Basic review loop。
- 周报 / 月报。
- CSV / Markdown 成人行为明细导出。
- Porn use 独立页面。
- 内容收藏器。
- URL / 缩略图 / 图片 / 视频 / 音频本体。
- 演员名 / 创作者名。
- 成人内容开关。
- 伴侣评分 / 排名。
- SexRecord 全面重做。
- Masturbation item editor 重做。

这些属于刀 47+、刀 48 或明确不做范围。

## Tests

优先新增或扩展 UI / interaction tests，具体形式按现有测试栈决定。

必须覆盖：

- Porn use 表单可创建事件。
- Porn use 表单保存后调用正确 storage / repository。
- `startedAt` 生成 `targetDate`。
- `durationMinutes` 为空时仍可保存。
- 多选字段能保存数组。
- Masturbation 表单能保存 `stimulationSources` 包含 `porn`。
- Sex 表单能保存 `pornInvolved` / `pornUseContext`。
- 保存成功 / 失败反馈存在。
- 删除或放弃表单触发 Confirm。
- 不出现 URL / 缩略图 / 图片 / 视频 / 演员名输入。

## 验收

刀 46 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果改动 UI bundle、路由或组件结构，建议同时跑：

```bash
npm run build
```

还应做手机 Chrome 手动验收：

- 新建 Porn use event。
- 编辑并保存 Porn use event。
- 在 Masturbation 表单选择色情刺激但不关联事件。
- 在 Sex 表单标记色情参与但不关联事件。
- 删除 / 放弃表单确认。

验收标准：

- typecheck 通过。
- UI / model / storage 相关测试通过。
- 手机 Chrome 主路径可用。
- Porn use 最小表单不变成内容收藏器。
- Masturbation / Sex 只做轻量接入。
- 无事件关联 UI 范围蔓延。

## 交接给刀 47

刀 46 完成后，刀 47 接：

- Event linking UI。
- 创建流程内自动关联。
- 手动关联同一 `targetDate` 或前后 6 小时事件。
- 已关联事件展示。
- 解除关联。
