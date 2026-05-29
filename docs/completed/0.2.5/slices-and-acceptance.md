# 0.2.5 开发刀序与验收

> 本文负责 0.2.5 的开发顺序、版本验收和实现前置。

## 已定刀序

### 刀 1：代码状态与 0.2.4 实现校准

执行文档：[`knife-1-code-and-data-calibration.md`](./knife-1-code-and-data-calibration.md)

目标：

- 检查 0.2.4 实际完成状态。
- 确认 `TrainingGoal` / `GoalCheckin` 数据形态。
- 确认目标数量和历史是否足够支撑目标历史工作台。
- 确认是否仍然不需要 schema / migration。

验收：

- 明确入口位置。
- 明确数据来源。
- 明确是否仍然不需要 schema / migration。
- 明确是否可以进入刀 2。

### 刀 2：目标历史与筛选

执行文档：[`knife-2-goal-history-workbench.md`](./knife-2-goal-history-workbench.md)

目标：

- active / paused / completed / archived 目标列表。
- category 筛选。
- 最近 check-in。
- 归档和恢复操作边界。

验收：

- 目标历史可读。
- 不出现评分、排名、打卡压力。
- archived 目标保留 check-in。
- orphan check-in 被提示但不删除。

### 刀 3：跨周期进度反馈

执行文档：[`knife-3-cross-cycle-feedback.md`](./knife-3-cross-cycle-feedback.md)

目标：

- 周期摘要。
- category 分布。
- check-in 完成情况。
- 缺失数据提示。
- 稳定性趋势。

验收：

- 样本不足只展示事实。
- 不输出能力分。
- 不输出失败判断。
- 不新增长期聚合 cache。

### 刀 4：目标历史工作台 / 入口 UI

执行文档：[`knife-4-entry-ui-dashboard.md`](./knife-4-entry-ui-dashboard.md)

目标：

- 根据刀 1 结论实现入口。
- Dashboard 保持轻提示。
- 移动端信息密度收口。

验收：

- 不做课程中心。
- 不做任务中心。
- 不做连续打卡。
- 不新增顶级 Training 导航。

### 刀 5：Safety / Privacy 审计

执行文档：[`knife-5-safety-privacy-audit.md`](./knife-5-safety-privacy-audit.md)

目标：

- 审计目标历史、长期摘要、导出提示、空状态和 Dashboard 文案。

验收：

- 无医学诊断。
- 无成瘾判定。
- 无强因果。
- 无伴侣评分 / 排名。
- 无分享导向。

## 版本验收标准

0.2.5 完成时必须满足：

- 用户能查看目标历史。
- 用户能筛选 active / paused / completed / archived 目标。
- 用户能查看 check-in 历史。
- 用户能看到跨周期摘要。
- 用户能看到缺失数据和样本不足提示。
- Dashboard 仍只展示轻提示。
- 不新增完整训练课程、游戏化、AI 教练或关系管理系统。
- 默认不新增 schema / migration。
- 实现前已完成刀 1 校准，并确认 0.2.4 训练目标数据真实可用。

一句话验收：

> 0.2.5 让 0.2.4 的轻目标闭环变成可回看的长期自我管理系统，但不做训练游戏、课程平台或 AI 教练。
