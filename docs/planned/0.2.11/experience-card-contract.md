# 0.2.11 经验卡契约

> 本文定义经验卡的数据语义。0.2.11 默认不新增 schema，真实实现前必须先校准可复用存储。

## 建议结构

```ts
interface ExperienceCardDraft {
  sourceObservationId?: string;
  sourceMetricId?: string;
  contextTypes: string[];
  dateRange: { startDate: string; endDate: string };
  title: string;
  factSummary: string;
  userReflection: string;
  limitations: string[];
}
```

这是草案结构，不代表新增存储类型。

## 字段语义

- `factSummary`：来自观察回看的事实摘要。
- `userReflection`：用户手动输入的主观心得。
- `limitations`：样本、缺失和上下文限制。
- `contextTypes`：睡眠、压力、性负荷等上下文标签。

## 状态

允许：

- draft。
- saved。
- archived。

不做：

- verified。
- proven。
- rule。
- diagnosis。

## 存储边界

默认优先：

- 复用 0.2.5 / 0.2.10 历史结构。
- 或作为现有本地记录的附属 note-like 数据。

若必须新增 store，应回到规划重谈。若没有可靠持久化位置，0.2.11 应暂停实现，不能把经验卡做成无法回看的临时 UI。

## 输出边界

经验卡只展示：

- 用户标题。
- 事实摘要。
- 用户心得。
- 关联窗口。
- limitations。

不展示证明强度、成功率或医学解释。
