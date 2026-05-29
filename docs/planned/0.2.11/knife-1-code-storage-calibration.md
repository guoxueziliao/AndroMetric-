# 0.2.11 刀 1 代码校准与存储边界

> 本文定义 0.2.11 实现前的第一刀。目标是确认经验卡能否复用现有存储。

## 必查入口

- 0.2.10 观察计划实际实现。
- 0.2.5 goal / check-in / history 实际结构。
- `domain/types/training.ts`
- `features/stats/model/trainingSuggestions.ts`
- Stats / Training / History 相关 UI 入口。

## 校准输出

刀 1 必须输出：

- 经验卡是否能复用现有 history。
- 是否存在 note-like 附属字段。
- 可关联的 observation id / metric id。
- 是否需要新增 schema，默认应为否。
- 如果必须新增 store，回到规划重谈。

## 存储优先级

优先顺序：

1. 复用观察计划历史详情。
2. 复用 goal / check-in 附属备注。
3. 复用已有本地 note-like 结构。
4. 停下来重谈新增 store。

## 停线条件

- 0.2.10 未真实落地。
- 没有可关联 observation。
- 需要新增 store。
- 需要改变 JSON backup 契约。
- 需要把经验卡导出为可读报告。
