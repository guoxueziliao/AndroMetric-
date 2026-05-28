# 0.2.3 刀 52 执行拆解

> 本文只规划刀 52：事实时间线与窗口聚合。它承接刀 51 的 review input，不输出 insight。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 51 完成后执行。
- 实现边界：事实 timeline 和窗口事实聚合。

## 必读文档

1. [`knife-51-review-input-adapter.md`](./knife-51-review-input-adapter.md)
2. [`review-input-and-timeline.md`](./review-input-and-timeline.md)
3. [`review-center-and-reports.md`](./review-center-and-reports.md)

## 目标

完成后应具备：

- `ReviewTimelineEvent` / `ReviewTimelineDay` 或等价结构。
- `AdultBehaviorWindowFacts` 或等价结构。
- timeline 按 `targetDate` 分组。
- 成人行为事件按 `startedAt` 排序。
- daily log 指标使用稳定 sort key。
- missing data 作为一等输出。

## 实现步骤

1. 建立 timeline event builders。
2. 建立固定 kind 排序。
3. 建立 timeline day grouping。
4. 建立 Porn use / Masturbation / Sex / Recovery facts 聚合。
5. 建立 missing data 生成。
6. 补充 facts / timeline tests。

## Tests

必须覆盖：

- 同一 `targetDate` 下成人行为事件按 `startedAt` 排序。
- daily log 指标没有具体时间时排序稳定。
- linked ids 进入 timeline 但不生成因果字段。
- orphan linked ids 进入 missing data 或 warning。
- 缺失字段不按 0 统计。
- 均值只在样本数大于 0 时输出。

## 非目标

- 不输出相关性。
- 不输出医学或行为判断。
- 不写 UI 文案。
- 不做 Markdown 导出。
- 不新增 schema / migration。

## 交接给刀 53

刀 53 基于 `AdultBehaviorWindowFacts` 建立 confidence gating。
