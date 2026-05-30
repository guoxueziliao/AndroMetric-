# 0.2.11 刀 2 经验卡契约与来源映射

> 本文定义经验卡字段如何从观察回看映射而来。

## 输入

- 观察计划 id。
- 观察窗口。
- 相关 metric / context。
- 事实总结。
- 缺失数据和 limitations。
- 用户手动心得。

## 字段边界

`factSummary`：

- 可以由系统预填。
- 只能包含事实、窗口、样本和缺口。
- 不包含原因、规律、建议。

`userReflection`：

- 用户手动输入。
- 可以是主观感受。
- 不被系统改写为结论。

## 关联字段

允许关联：

- observation id。
- metric id。
- contextTypes。
- dateRange。

不关联：

- 伴侣私密备注全文。
- notes 全文。
- 色情标题、平台名或 URL。

## 验收

- 每张卡有 limitations。
- 系统不自动生成心得。
- 没有 proven / rule / diagnosis 状态。
- 不新增导出字段。
