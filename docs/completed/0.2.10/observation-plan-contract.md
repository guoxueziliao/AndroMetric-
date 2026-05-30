# 0.2.10 观察计划契约

> 本文定义观察计划的数据语义。0.2.10 默认复用 0.2.5 goal / check-in；不新增 schema。

## 前置

0.2.10 依赖 0.2.5：

- training goal。
- check-in。
- goal history。

如果这些能力未真实落地，0.2.10 暂停实现。

## 建议结构

若复用 goal，需要映射为：

```ts
interface ObservationPlanDraft {
  sourceExplanationId?: string;
  sourceMetricId?: string;
  contextType: string;
  windowDays: 7 | 14;
  title: string;
  focusFields: string[];
  startDate: string;
  endDate: string;
}
```

这只是创建草案，不代表新增存储类型。

## 状态

允许：

- draft。
- active。
- completed。
- archived。

不做：

- failed。
- streak_broken。
- unhealthy。
- risk_detected。

## 输出

到期回看只展示：

- 观察窗口。
- 记录天数。
- 缺失天数。
- 相关事实。
- limitations。

不展示成功率、评分或医学解释。

## 停下来重谈

- 需要新增 store。
- 需要写入诊断字段。
- 需要完成率排名。
- 需要自动创建 plan。
