# 0.2.5 全文一致性审计（2026-05-28）

> 本文记录 0.2.5 范围、边界和执行草案一致性审计。审计只覆盖规划文档，不代表代码已实现。

## 结论

0.2.5 当前形成执行草案：主方向是轻量 Training Center / 目标历史工作台、长期目标历史和跨周期进度反馈。

本轮确认三条边界：

- 0.2.5 默认不新增 schema / migration。
- Training Center 先作为复盘 / 统计区域内的二级工作台或 tab，不新增顶级导航。
- 长期反馈只做事实、稳定性和缺口提示，不做评分、排名、打卡压力或诊断。

## 已确认一致

- 版本定位：0.2.5 承接 0.2.4 的轻目标和 check-in 闭环。
- 数据边界：优先复用 `TrainingGoal` 和 `GoalCheckin`。
- 入口边界：Dashboard 只做轻入口，不承载完整目标历史。
- Training Center 边界：工作台型目标历史，不是课程、任务、打卡或 AI 教练中心。
- 反馈边界：跨周期反馈只表达目标历史、记录完整性、恢复稳定性和样本缺口。
- Safety 边界：不做医学诊断、成瘾判定、强因果、伴侣评分或伴侣排名。
- 游戏化边界：不做等级、徽章、连续打卡、排行榜或挑战。
- 隐私边界：不做分享图、社交传播、云端同步或外部 AI 分析。

## 已修正

- `plan-0.2.5.md`：状态从研究入口推进为执行草案，关键范围从“暂定”改为“已定”。
- `training-center-and-history.md`：明确 Training Center 默认是二级工作台，不新增顶级导航。
- `ui-and-navigation.md`：移除默认独立 Training Center 入口，改为复盘 / 统计区域二级入口和 Dashboard 轻入口。
- `data-model-and-migration.md`：补充实现中不得顺手新增长期训练模型的约束。
- `scope-and-boundaries.md`：将核心基调从“暂定”收口为已定基调。
- `slices-and-acceptance.md`：将候选刀序推进为刀 1 - 刀 5 执行顺序。

## 执行草案收口

已补齐：

- `knife-1-code-and-data-calibration.md`：实现前校准 0.2.4 真实代码状态、数据形态和入口位置。
- `knife-2-goal-history-workbench.md`：目标历史工作台、筛选、归档 / 恢复和空状态。
- `knife-3-cross-cycle-feedback.md`：跨周期事实反馈、样本边界、稳定性和缺失提示。
- `knife-4-entry-ui-dashboard.md`：复盘 / 统计区域二级入口、Dashboard 轻入口和移动端优先级。
- `knife-5-safety-privacy-audit.md`：长期历史、摘要、Dashboard、导出提示和文案审计。
- `implementation-handoff.md`：进入实现窗口前的一页交接摘要。

实现仍需从刀 1 开始；如果 0.2.4 训练目标数据尚未真实落地，应停止 0.2.5 实现，回到 0.2.4 或重新规划。

## 文档长度

0.2.5 当前专题文档均控制在短文档范围内，未出现超长单文档。

## 下一步

后续进入实现窗口时，建议按顺序执行：

1. 刀 1：代码状态与数据校准。
2. 刀 2：目标历史工作台。
3. 刀 3：跨周期进度反馈。
4. 刀 4：入口 UI 与 Dashboard。
5. 刀 5：Safety / Privacy 审计。
