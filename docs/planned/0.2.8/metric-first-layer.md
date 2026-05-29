# 0.2.8 第一层指标口径

> 本文定义个人常态系统 v1 首屏必须优先支持的指标。

## 硬度 / 晨勃

数据来源：

- `LogEntry.morning.wokeWithErection`
- `LogEntry.morning.hardness`
- `StatsEngine` 的 `hardness` series。

聚合：

- 日值：当天可用晨勃硬度。
- 当前窗口：14 / 30 天有记录日的中位数。
- baseline：90 天有记录日的中位数和个人范围。

缺失：

- 没有晨勃记录不等于硬度为 0。
- 没有 `wokeWithErection` 或 `hardness` 时计入 missingDays。

## 恢复 / 疲劳

数据来源：

- adult behavior `fatigueAfter`。
- sex event `recoveryFeeling`。
- legacy adapter 中的 `fatigueCost`。
- 0.2.3 review facts 中的 recovery / fatigue 聚合。

聚合：

- 日值：当天疲劳 / 恢复相关记录的平均值或最高疲劳成本。
- 当前窗口：14 / 30 天有样本日的中位数。
- baseline：90 天个人范围。

缺失：

- 没有事后反馈或疲劳记录时，不推断恢复状态。
- 如果只有间接 fatigue cost，必须在 limitations 中说明。

## 睡眠 / 压力

数据来源：

- `LogEntry.sleep.startTime` / `endTime` / `quality`。
- `LogEntry.stressLevel`。
- `StatsEngine` 的 `sleep` 和 `stress` series。

聚合：

- 睡眠日值：主睡眠时长，必要时加上 nap 由现有 adapter 决定。
- 压力日值：当天压力等级。
- 当前窗口和 baseline 都使用有记录日中位数。

缺失：

- 睡眠起止时间缺失时不估算睡眠时长。
- 压力未记录时不填默认值。

## 性负荷

数据来源：

- `StatsEngine` 的 `sexLoad` series。
- sex event / masturbation event count。
- ejaculation flag。

第一版口径：

- sex：基础负荷 1.5；如有 ejaculation，再加 0.5。
- masturbation：基础负荷 1.0。
- 当天多事件求和。

缺失：

- 没有 sex / masturbation event 的日期可以按 0 计入负荷。
- 快速记录缺少细节时只按事件存在计入，不推断强度。

边界：

- 性负荷高不等于不好。
- 不输出“应该减少 / 增加性行为”。
