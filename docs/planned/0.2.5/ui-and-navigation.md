# 0.2.5 入口、UI 与导航

> 本文负责 Training Center 入口、Dashboard 和移动端信息密度。

## 入口原则

0.2.5 不新增顶级 Training 导航。

默认入口：

- 成人行为复盘内二级入口。
- Stats / Insights 内 tab。
- Dashboard 轻入口。

允许入口：

- 成人行为复盘内二级入口。
- Stats / Insights 内 tab。
- Dashboard 轻入口。

重新讨论顶级 Training Center 的条件：

- active / paused / archived 目标数量明显增加。
- 用户需要查看目标历史。
- 用户需要跨周期比较 check-in。
- 复盘入口承载不住目标管理。

## 页面结构

目标历史工作台建议包含：

1. 当前目标。
2. 到期 check-in。
3. 目标历史。
4. 周期摘要。
5. 缺失数据 / 完整性提示。

不包含：

- 训练课程。
- 每日任务。
- 打卡日历。
- 排行榜。
- 成就墙。

## Dashboard

Dashboard 仍只做轻提示：

- 最近 active goal。
- 即将到期 check-in。
- 本周关注。
- 低恢复提示。

Dashboard 不做：

- 完整目标列表。
- 历史中心。
- 课程入口。
- 连续打卡。

## 移动端优先级

手机 Chrome 优先：

1. 到期 check-in。
2. 当前 active goal。
3. 本周关注。
4. 历史摘要。
5. 筛选和归档。

避免：

- 首屏塞满历史图表。
- 目标卡片过多。
- 长文案压迫操作。
- 打卡式 UI。

## 操作边界

允许：

- 暂停目标。
- 归档目标。
- 恢复 paused 目标。
- 查看历史 check-in。

谨慎：

- 恢复 archived 目标。
- 批量归档。
- 删除目标。

默认不做：

- 目标模板库。
- 训练课程导航。
- 目标市场。
