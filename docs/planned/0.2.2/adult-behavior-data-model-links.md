# 0.2.2 成人行为数据模型：事件关联策略

> 本文是 [`adult-behavior-data-model.md`](./adult-behavior-data-model.md) 的专题文档，负责 Porn use / Masturbation / Sex 的关联规则。

## 关联字段

0.2.2 使用类型化 linked ids，不采用通用 `relatedEventIds`。

```ts
export interface PornUseEvent {
  linkedMasturbationEventIds: string[];
  linkedSexEventIds: string[];
}

export interface MasturbationEvent {
  linkedPornUseEventIds: string[];
  linkedSexEventIds: string[];
}

export interface SexEvent {
  linkedPornUseEventIds: string[];
  linkedMasturbationEventIds: string[];
}
```

原因：

- 三类事件关系明确，类型化字段更利于 UI、导出和完整性检查。
- 类型化字段避免展示层反复解析 `{ type, id }`。
- 0.2.2 暂时只有三类成人行为事件，不需要通用事件图谱。

## 关系方向

数据模型允许单向存在，但写入用例应尽量保持双向一致。

规则：

- Porn use 关联 Masturbation：双方分别写入 `linkedMasturbationEventIds` / `linkedPornUseEventIds`。
- Porn use 关联 Sex：双方分别写入 `linkedSexEventIds` / `linkedPornUseEventIds`。
- Masturbation 关联 Sex：双方分别写入 `linkedSexEventIds` / `linkedMasturbationEventIds`。

写入原则：

- 用户主动创建 / 更新关联时，repository 或 use case 应在同一 transaction 内写双方 linked ids。
- 导入旧数据或外部数据时，可以暂时存在单向关系，但 import preview / integrity 必须报告。
- repair 可以补齐缺失的反向 linked id，但必须记录 repair 结果。

## 自动关联

0.2.2 只做创建流程内的明确自动关联，不做复杂推断。

允许：

- Masturbation 表单中同步创建 Porn use event，并自动双向关联。
- Masturbation 表单中选择已有 Porn use event，并写入双向 linked ids。
- Sex 表单中标记 `pornInvolved` 并同步创建 Porn use event，并自动双向关联。
- Sex 表单中选择已有 Porn use event，并写入双向 linked ids。
- Sex 表单关联自慰事件，或 Masturbation 表单关联性行为事件，并写入双向 linked ids。

不允许：

- 根据备注文本自动关联。
- 根据平台名、content type、tag 自动关联。
- 根据同一天发生就自动关联。
- 根据时间接近直接写入关联。
- 机器学习、行为预测或联网识别。

## 手动关联

UI 应支持用户手动选择相关事件。

推荐候选范围：

- 同一 `targetDate`。
- 或 `startedAt` 前后 6 小时内。

候选范围只是 UI 推荐，不是数据硬约束。用户可以手动关联更远的事件。

候选排序建议：

1. 同一 `targetDate`。
2. 时间距离更近。
3. 事件类型更相关，例如 Masturbation 表单优先显示 Porn use，再显示 Sex。
4. 已有关联事件排在前面。

手动解除关联：

- 用户解除 A -> B 时，应同时移除 B -> A。
- 如果 B 不存在，只移除 A 中的 orphan id，并记录修复或清理结果。

## 删除与清理

删除事件不级联删除关联事件。

规则：

- 删除 Porn use event 不删除 Masturbation / Sex event。
- 删除 Masturbation event 不删除 Porn use / Sex event。
- 删除 Sex event 不删除 Porn use / Masturbation event。

删除时应做：

- 删除目标事件本体。
- 查找其他两类事件中指向该事件的 linked id。
- 在同一 transaction 内清理这些 linked id。
- 如果清理失败，integrity check 必须报告 orphan linked ids。

确认级别：

- 删除成人行为事件属于敏感数据破坏性操作，应使用 0.2.1 Confirm contract。
- 有 linked ids 的事件删除时，确认文案必须说明“不会删除关联事件，只会解除关联”。

## Orphan linked ids

Orphan linked id 指向不存在的事件。

来源：

- 旧数据导入。
- 手动编辑 JSON。
- 早期 bug。
- 删除事件时清理失败。

处理策略：

- Import preview：报告 orphan 数量和类型。
- Snapshot integrity：报告 orphan 明细。
- Repair：允许清理 orphan linked ids，但不自动创建缺失事件。
- Export：默认保留当前数据；如果存在 orphan，应在导出前提示或在健康检查中提示，不能静默删除。

## 单向关联

单向关联指 A 指向 B，B 存在但没有反向指向 A。

处理策略：

- Import preview：报告单向关联数量。
- Snapshot integrity：报告单向关联明细。
- Repair：可以补齐反向 linked id。
- UI 展示：读取时可临时按“有关联”展示，但写入时应避免扩大不一致。

## 关联完整性函数

建议提供纯函数，供 import preview、snapshot integrity、repair 和 tests 共用：

```ts
export interface AdultEventLinkIssue {
  severity: 'info' | 'warning' | 'error';
  kind: 'orphan' | 'one_way' | 'duplicate_id' | 'missing_required_field';
  sourceType: 'porn_use' | 'masturbation' | 'sex';
  sourceId: string;
  targetType?: 'porn_use' | 'masturbation' | 'sex';
  targetId?: string;
  message: string;
}

export function checkAdultEventLinks(input: {
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
}): AdultEventLinkIssue[];
```

规则：

- 不读 Dexie。
- 不依赖 React。
- 不修改输入。
- repair 基于该函数输出另行生成修复结果。

## 关联测试清单

必须覆盖：

- Porn use <-> Masturbation 双向关联。
- Porn use <-> Sex 双向关联。
- Masturbation <-> Sex 双向关联。
- 单向关联报告。
- Orphan linked id 报告。
- 删除事件后清理其他事件 linked ids。
- 导入 round-trip 后 linked ids 不丢失。
- 重复 ID 被报告，不能静默合并。
