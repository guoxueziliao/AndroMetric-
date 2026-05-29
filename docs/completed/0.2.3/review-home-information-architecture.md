# 0.2.3 成人行为复盘首屏信息架构

> 本文负责 0.2.3 刀 55 的复盘入口与首屏信息架构。它不定义具体 React 组件，只定义页面信息层级和展示边界。

## 入口形态

0.2.3 复盘入口嵌入现有统计 / 洞察区域，不新增顶级导航。

允许形态：

- 现有统计页中的 tab。
- 现有洞察页中的 section。
- 统计 / 洞察区域内的二级页面。

Dashboard 只放轻入口或摘要提示，不承载完整复盘中心。

## 首屏目标

首屏回答三个问题：

1. 最近硬度和恢复怎么样。
2. 最近性活动负荷如何。
3. 哪些数据足够看，哪些只能继续记录。

首屏不回答：

- 用户是否有医学问题。
- 用户是否色情成瘾。
- 哪个因素导致硬度变化。
- 哪个伴侣、偏好或内容类型更好 / 更差。

## 信息层级

### 1. Window switcher

首屏顶部提供窗口切换：

- 滚动 7 天。
- 滚动 14 天。
- 滚动 30 天。
- 自然周。
- 自然月。

规则：

- 默认进入滚动 14 天。
- 7 天适合快速近况。
- 14 天适合多数初步复盘。
- 30 天适合趋势观察。
- 自然周 / 自然月适合报告和导出。

### 2. Primary summary

主摘要优先展示：

- 晨间硬度均值 / 样本数。
- 性行为 / 自慰中的硬度样本数。
- 恢复状态摘要。
- 睡眠样本数和睡眠均值。
- 疲劳样本数。

规则：

- 每个主指标都显示样本数或缺失提示。
- 样本不足时显示事实，不显示判断。
- 不把 Porn use 次数或时长放成首屏最大指标。

### 3. Behavior load

展示窗口内成人行为负荷：

- Porn use 次数 / 总时长。
- Masturbation 次数。
- Sex 次数。
- 射精次数。
- 边缘控制次数。

规则：

- 命名为“行为负荷”或“活动负荷”，不命名为挑战、战绩或能力。
- 不做排行榜。
- 不做最高纪录。
- 不把次数变化写成好 / 坏。

### 4. Timeline preview

展示最近若干个 `ReviewTimelineDay`：

- 按 `targetDate` 分组。
- 每天展示关键事件数量和链路摘要。
- 支持进入完整事实时间线。

规则：

- timeline 只展示事实。
- linked ids 只展示“有关联”，不写成“导致”。
- orphan linked ids 显示为记录缺口或完整性提示，不静默隐藏。

### 5. Insight preview

展示 1 - 3 条通过 confidence gating 的弱相关观察。

规则：

- 每条显示 `sampleSize` 和 `confidence`。
- 每条保留限制说明入口或短限制文本。
- `confidence = none` 时不进入 insight preview，只进入记录缺口或事实提示。
- 不输出医学、成瘾、强因果或道德化文案。

### 6. Missing data

缺失数据必须可见：

- 晨间硬度记录不足。
- 睡眠记录不足。
- 成人行为事件样本不足。
- 硬度样本不足。
- 关联事件缺失或 orphan linked ids。

规则：

- 缺失数据不是责备。
- 文案只说明“当前不能判断什么”。
- 可以建议继续记录，但不做训诫。

### 7. Report actions

首屏底部或报告区域提供：

- 查看周报。
- 查看月报。
- 导出 Markdown。

规则：

- 导出前必须出现敏感成人健康数据提醒。
- 不做分享图。
- 不默认调用系统分享。

## 移动端信息密度

手机 Chrome 首屏优先顺序：

1. Window switcher。
2. Primary summary。
3. Behavior load。
4. Missing data。
5. Insight preview。
6. Timeline preview。
7. Report actions。

原因：

- 移动端先让用户知道“现在能不能看”。
- 样本不足提示要早于洞察，避免伪确定性。
- 时间线可下滑查看，不必抢首屏最大空间。

## 不做

- 不新增顶级导航。
- 不把首屏做成色情使用统计器。
- 不做伴侣排名。
- 不做最高时长 / 最高次数记录。
- 不做分享图。
- 不隐藏 sampleSize / confidence / limitations。

## 交接

- 刀 55 实现 UI 时以本文为信息架构依据。
- 事实数据来自 [`review-input-and-timeline.md`](./review-input-and-timeline.md)。
- insight preview 只能使用 [`weak-correlation-insights.md`](./weak-correlation-insights.md) 中允许的 insight。
