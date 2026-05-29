# 0.2.4 开发交接摘要

> 本文是 0.2.4 开发窗口的短交接单，用作范围、数据流和验收对照。

## 版本范围

0.2.4 只做训练建议、进度反馈、轻目标、check-in、性表现训练视图和关系上下文接入。

当前状态：正在开发。

已定边界：

- 允许最小 schema / migration。
- 只持久化 `TrainingGoal` 和 `GoalCheckin`。
- 不持久化 `TrainingSuggestion`。
- 不新增独立 Training 页面。
- 不做完整游戏化、徽章、等级、连续挑战。
- 不做云端 AI 或外部 API。
- 不做医学诊断、成瘾判定、强因果、伴侣评分或伴侣排名。

## 推荐数据流

```text
0.2.3 review facts / insights
  -> local rule suggestions
  -> suggested goal draft
  -> user confirmation
  -> TrainingGoal
  -> GoalCheckin
  -> training view / dashboard hint
  -> Safety Rails audit
```

规则：

- 规则建议不直接读 Dexie。
- 建议即时生成，不入库。
- 候选目标不等于已创建目标。
- 用户确认后才创建 `TrainingGoal`。
- check-in 才更新目标状态。
- 所有建议、目标和文案都过 Safety Rails。

## 刀序交接

- 刀 1：数据模型最终审计，已规划定稿。
- 刀 2：schema / migration / import-export。
- 刀 3：规则型建议系统。
- 刀 4：轻目标创建与 check-in。
- 刀 5：性表现训练视图。
- 刀 6：关系上下文接入。
- 刀 7：Safety Rails 审计。

## 文件候选

最终文件位置由实现窗口按真实代码结构确认。若现有结构没有更合适约定，可考虑：

- `features/stats/model/trainingSuggestions.ts`
- `features/stats/model/trainingGoals.ts`
- `features/stats/model/trainingSafetyRails.ts`
- `features/stats/model/trainingCheckins.ts`
- `features/stats/ui/TrainingSuggestionsPanel.tsx`
- `features/stats/ui/TrainingGoalCard.tsx`
- `features/stats/ui/GoalCheckinModal.tsx`

存储相关：

- `core/storage/db.ts`
- `core/storage/migration.ts`
- JSON export / import 入口。
- snapshot integrity 入口。

## 必须停下来重谈的情况

遇到以下情况，不应在实现中顺手扩大范围：

- 需要持久化 `TrainingSuggestion`。
- 需要独立 Training 页面。
- 需要完整训练计划、徽章、等级或连续挑战。
- 需要云端 AI / 外部 API。
- 需要自动创建目标。
- 需要 30 / 60 / 90 天目标周期。
- 需要伴侣评分、排名或优劣判断。
- 需要医学诊断、成瘾判定或强因果结论。

## 验证底线

至少覆盖：

- 旧数据升级后新 store 为空。
- JSON export / import 保留训练目标和 check-in。
- 禁用 category 不能进入 active 数据。
- 高负荷 / 低恢复只推荐恢复或记录质量。
- 候选目标不自动创建。
- check-in pause / complete 同步目标状态。
- Dashboard 不展示完整训练中心。
- 关系建议不评价伴侣。
- Safety Rails 审计通过。

## 交接结论

0.2.4 当前正在开发。开发和验证完成后，再更新 roadmap、future-development、版本号 / CHANGELOG 和 planned / completed 归档状态。
