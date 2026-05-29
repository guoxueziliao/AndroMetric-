# 0.2.8 刀 2 基线派生模型

> 本文定义刀 2 的实现边界。刀 2 只能在刀 1 代码校准完成后开始。

## 前置条件

开始前必须已有：

- 第一层指标真实 dataSource 清单。
- 每个指标的缺失语义。
- 可进入 v1 的指标列表。
- 被隐藏的第二层指标列表。
- 是否依赖 0.2.5 / 0.2.7 的结论。

如果刀 1 发现第一层指标无法稳定派生，应缩小 0.2.8 范围，而不是新增字段。

## 派生步骤

建议顺序：

1. 生成 metric series。
2. 切分 current window：14 / 30 天。
3. 切分 baseline window：90 天。
4. 计算可用样本和 coverage。
5. 计算 baselineMedian。
6. 计算 baselineRange。
7. 计算 currentValue。
8. 生成 recordGaps。
9. 映射 state / confidence / direction。
10. 输出 `PersonalNormalResult`。

所有步骤都应是纯派生，不写入存储。

## Baseline Range

第一版优先使用：

- P25 - P75：默认个人常态核心范围。

允许退回：

- median +/- MAD。

退回条件：

- 样本数量刚达到最低门槛。
- 取值离散度过低。
- 实现工具无法稳定计算分位数。

退回时必须写入 limitations。

## Current Value

当前窗口取值按指标类型处理：

- 硬度 / 晨勃：有记录日的 median。
- 恢复 / 疲劳：可用反馈的 median 或 derived。
- 睡眠：有 start/end 的日均时长。
- 压力：有记录日的 median 或 max，按刀 1 校准结果决定。
- 性负荷：窗口内日均或总量，按 UI 展示需要选择一种。

不得在同一指标内混用多个口径。

## Record Gaps

缺口至少分为：

- missing_log：整天无可信记录。
- missing_field：有日记但缺指标字段。
- legacy_value：只有迁移或旧字段值。
- insufficient_event_detail：事件存在但缺少强度、疲劳或满意度等细节。

缺口用于降级 confidence，不用于批评用户记录不完整。

## 验收

刀 2 完成时必须证明：

- 派生结果符合 [派生数据契约](./derived-data-contract.md)。
- 状态映射符合 [状态判定规则](./state-decision-rules.md)。
- `null` 和可信 `0` 没有混淆。
- 没有新增 schema、store、cache 或导出字段。
- 样本不足时只展示事实。

## 停下来重谈

出现以下情况应停止：

- baselineRange 需要医学阈值。
- currentValue 需要外部基准。
- confidence 需要升级到 high。
- 需要把多个指标合成总分。
- 需要持久化派生结果。
