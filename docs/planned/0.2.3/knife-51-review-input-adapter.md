# 0.2.3 刀 51 执行拆解

> 本文只规划刀 51：Review input adapter。它承接刀 50 的代码入口校准，不实现 timeline、insight 或 UI。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 50 完成后执行。
- 实现边界：把现有数据整理成纯 `AdultBehaviorReviewInput`。

## 必读文档

1. [`knife-50-code-orientation.md`](./knife-50-code-orientation.md)
2. [`review-input-and-timeline.md`](./review-input-and-timeline.md)
3. [`review-engine.md`](./review-engine.md)
4. [`consistency-audit-2026-05-28.md`](./consistency-audit-2026-05-28.md)

## 目标

完成后应具备：

- `AdultBehaviorReviewInput` 类型或等价结构。
- `ReviewWindow` 类型或等价结构。
- 输入 adapter 能接收调用层传入的 logs 和三类成人行为事件。
- 支持 rolling 7 / 14 / 30 天、自然周、自然月。
- 不直接读 Dexie。
- 不生成 insight。

## 实现步骤

1. 根据刀 50 结果确定文件位置。
2. 定义 review window helpers。
3. 定义 daily log input mapper。
4. 定义成人行为事件筛选逻辑。
5. 按 `targetDate` 过滤窗口内事件。
6. 补充 adapter tests。

## Tests

必须覆盖：

- rolling 7 / 14 / 30 天窗口边界。
- 自然周 / 自然月窗口边界。
- `endDate` 包含在窗口内。
- 事件按 `targetDate` 进入窗口。
- 缺失字段保持 `null` / `undefined`，不填假默认值。
- adapter 不读取 Dexie。

## 非目标

- 不实现 timeline。
- 不做窗口聚合。
- 不输出 insight。
- 不写 UI 文案。
- 不新增 schema / migration。

## 交接给刀 52

刀 52 基于 `AdultBehaviorReviewInput` 输出 `ReviewTimelineDay` 和 `AdultBehaviorWindowFacts`。
