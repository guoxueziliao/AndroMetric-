# 0.2.3 刀 55 执行拆解

> 本文只规划刀 55：成人行为复盘入口与总览 UI。它承接刀 51 - 刀 54 的数据输出。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 54 完成后执行。
- 实现边界：入口、首屏信息架构和移动端可读性。

## 必读文档

1. [`review-home-information-architecture.md`](./review-home-information-architecture.md)
2. [`review-input-and-timeline.md`](./review-input-and-timeline.md)
3. [`weak-correlation-insights.md`](./weak-correlation-insights.md)

## 目标

完成后应具备：

- 现有统计 / 洞察区域中的成人行为复盘入口。
- Window switcher。
- Primary summary。
- Behavior load。
- Missing data。
- Insight preview。
- Timeline preview。
- Report actions 入口。

## UI 边界

- 不新增顶级导航。
- Dashboard 只放轻入口或摘要提示。
- 首屏不做色情使用统计器。
- 不隐藏 sampleSize / confidence / limitations。

## Tests / 验收

必须覆盖或手动验证：

- 手机 Chrome 首屏可读。
- `confidence = none` 不进入 insight preview。
- missing data 可见。
- 导出 action 不直接分享。
- 不出现诊断、成瘾、强因果或伴侣排名文案。

## 非目标

- 不实现 Markdown 导出。
- 不实现训练建议。
- 不实现轻目标。
- 不新增 schema / migration。

## 交接给刀 56

刀 56 基于同一份 facts / insights 实现周报、月报和 Markdown 导出。
