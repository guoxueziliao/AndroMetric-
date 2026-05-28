# 0.2.5 实现交接摘要

> 本文是 0.2.5 进入实现窗口前的短交接单。它不替代刀 1 - 刀 5，也不声明当前代码已经实现这些能力。

## 版本范围

0.2.5 只做轻量 Training Center / 目标历史工作台、长期目标历史、跨周期进度反馈和 Dashboard 轻入口。

已定边界：

- 默认不新增 schema / migration。
- 复用 0.2.4 的 `TrainingGoal` / `GoalCheckin`。
- Training Center 作为复盘 / 统计区域内的二级工作台或 tab。
- 不新增顶级 Training 导航。
- 不做 AI 教练、技巧课程、训练课程、完整游戏化或连续打卡。
- 不做医学诊断、成瘾判定、强因果、伴侣评分或伴侣排名。
- 不做分享图、社交传播、云端同步或外部 AI 分析。

## 推荐数据流

```text
0.2.4 TrainingGoal / GoalCheckin
  -> runtime goal history selectors
  -> status / category filters
  -> goal detail + check-in history
  -> cross-cycle facts
  -> review / stats secondary workbench
  -> Dashboard light hint
  -> Safety / Privacy audit
```

规则：

- 目标历史从既有数据运行时派生。
- 跨周期摘要不入库。
- `cycleFeeling` 不展示成评分。
- archived 目标保留 check-in。
- orphan check-in 保留并提示。
- Dashboard 不承载完整工作台。

## 刀序交接

- 刀 1：代码状态与数据校准。
- 刀 2：目标历史工作台。
- 刀 3：跨周期进度反馈。
- 刀 4：入口 UI 与 Dashboard。
- 刀 5：Safety / Privacy 审计。

## 文件候选

最终文件位置由实现窗口按真实代码结构确认。若现有结构没有更合适约定，可考虑：

- `features/stats/model/trainingGoalHistory.ts`
- `features/stats/model/trainingProgressSummary.ts`
- `features/stats/ui/TrainingHistoryWorkbench.tsx`
- `features/stats/ui/TrainingGoalHistoryList.tsx`
- `features/stats/ui/TrainingGoalDetail.tsx`
- `features/stats/ui/TrainingProgressSummary.tsx`

存储相关默认不改 schema，只读取：

- `core/storage/StorageService.ts`
- JSON export / import 入口。
- snapshot integrity 入口。

## 必须停下来重谈的情况

遇到以下情况，不应在实现中顺手扩大范围：

- 需要新增 schema / migration。
- 需要持久化 `TrainingSuggestionHistory`。
- 需要新增 `TrainingPlan` / `GoalTemplate` / `Milestone`。
- 需要 Badge / Level / streak。
- 需要独立顶级 Training 页面。
- 需要训练课程或技巧库。
- 需要云端 AI / 外部 API。
- 需要医学诊断、成瘾判定或强因果结论。
- 需要伴侣评分、排名或优劣判断。

## 验证底线

至少覆盖：

- 目标历史按 status 筛选。
- 目标历史按 category 筛选。
- 目标详情显示 check-in 历史。
- archived 目标保留 check-in。
- orphan check-in 被提示但不删除。
- 样本不足不输出趋势判断。
- Dashboard 不展示完整训练中心。
- 不出现评分、排名、失败率、连续打卡或挑战。
- 不新增 schema / migration。

## 交接结论

0.2.5 可以作为后续实现草案，但实现窗口必须先完成刀 1。若 0.2.4 的训练目标数据尚未真实落地，应停止 0.2.5 实现，回到 0.2.4 或重新规划。
