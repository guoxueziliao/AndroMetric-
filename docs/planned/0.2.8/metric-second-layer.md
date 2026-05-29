# 0.2.8 第二层指标口径

> 本文定义个人常态系统 v1 可以随后接入的指标。它们不抢占首屏主判断。

## 色情使用

数据来源：

- `PornUseEvent.durationMinutes`
- `PornUseEvent.ejaculated`
- `PornUseEvent.ledToMasturbation`
- legacy `pornConsumption`

第一版展示：

- 使用次数。
- 总时长。
- 有明确事件时显示；legacy 档位只作为低可信事实。

## 满意度

数据来源：

- sex event `satisfaction`。
- masturbation event `satisfaction`。
- legacy sex / masturbation satisfaction fields。

第一版展示：

- 分 sex / masturbation 两类展示，不合成总满意度。
- 样本不足时只显示事实。

## 运动

数据来源：

- `LogEntry.exercise[].duration`
- `LogEntry.exercise[].intensity`
- `StatsEngine` 的 `exercise` series。

第一版展示：

- 运动时长。
- 高强度运动天数可作为后续增强，不进入第一轮判断。

## 目标历史

数据来源：

- 0.2.5 training goal / check-in。

第一版展示：

- 只在 0.2.5 数据真实落地后显示。
- 只显示目标关注方向和 check-in 覆盖，不合成“进步分”。

## 关系上下文

数据来源：

- 0.2.7 relationship context。

第一版展示：

- 只在 0.2.7 数据真实落地后显示。
- 只显示中性上下文存在与否，不做关系归因。
