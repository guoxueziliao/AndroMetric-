# 0.2.3 Review Engine 边界

> 本文从 0.2.3 入口拆出，保存统计模型边界、review engine 位置和输出原则。

## 核心基调

0.2.3 的核心基调暂定为：

> 让成人行为、色情使用和健康状态形成可解释的复盘系统。

0.2.2 解决“记录什么”和“怎么结构化”；0.2.3 解决“记录之后能看见什么”。重点不是给用户下判断，而是把硬度、性行为、自淫/自慰、色情使用、射精、睡眠、酒精、运动、压力、疲劳和满意度放到同一套复盘语言里。

0.2.3 应继续坚持：

- 不做医学诊断。
- 不做成瘾判定。
- 不做道德审判。
- 不做强因果结论。
- 样本不足时明确提示。
- 本地优先，不上传数据。

## 已定统计模型边界

0.2.3 允许新增轻量 `adult behavior review engine`。

定位：

- 用于复盘成人行为、色情使用和健康状态之间的时间关系、趋势和共现。
- 输出解释性提示、事实摘要、样本量提示和弱相关观察。
- 不输出医学诊断、成瘾判定、道德判断或强因果结论。

允许做：

- 汇总 Porn use / Masturbation / Sex / Morning hardness / Sleep / Alcohol / Exercise / Mood / Stress 等数据。
- 计算近 7 / 14 / 30 天趋势。
- 计算频率、时长、射精次数、边缘控制次数、疲劳、满意度、睡眠影响。
- 计算事件链路，例如色情使用 → 自慰 → 射精 → 睡眠 → 次日硬度。
- 做简单共现和窗口比较，例如“高色情使用时长的次日硬度均值”和“低色情使用时长的次日硬度均值”。
- 给出样本量和可信等级。

不允许做：

- 医学诊断。
- ED / 成瘾 / 性功能障碍判定。
- “X 导致 Y”的强因果结论。
- 道德化评价。
- 云端模型或联网分析。
- 复杂黑箱模型。
- 在样本不足时强行输出洞察。

## 输入契约

review engine 不直接接收 Dexie 原始结果。调用层必须先通过 adapter 生成 `AdultBehaviorReviewInput`。

输入契约见 [`review-input-and-timeline.md`](./review-input-and-timeline.md)。

关键边界：

- adapter 只整理输入，不生成判断。
- review engine 先输出事实时间线和窗口聚合。
- insight 必须建立在窗口聚合和 confidence gating 之后。
- linked ids 只表示记录关联，不直接代表因果。

### Review engine 位置

建议新增：

- `features/stats/model/adultBehaviorReview.ts`

或在 0.2.3 数据形态更清楚后，放入：

- `features/stats/model/AdultBehaviorReviewEngine.ts`

规则：

- 只依赖 domain types 和纯数据输入。
- 不直接读 Dexie。
- 不依赖 React。
- 不写 UI 文案死在模型内部，模型输出结构化结果，由 UI 层负责展示文案。

### 与现有 StatsEngine 的边界

0.2.3 选择新增轻量 adult behavior review engine，而不是把现有 StatsEngine 改成成人行为专用引擎。

边界：

- 现有 StatsEngine 继续负责通用统计、图表数据和既有指标。
- adult behavior review engine 负责成人行为、色情使用、硬度、恢复和行为链路的复盘输出。
- 两者可以共享时间窗口、聚合 helper 和 domain types。
- adult behavior review engine 不直接读 Dexie，不直接依赖 React，也不修改 storage。
- UI 层负责把 StorageService / repository 读出的数据整理后传入 engine。

0.2.3 不新增 schema / migration。若实现时发现必须持久化 review 结果，应退出本刀重新讨论，不在实现中顺手加表。

### 输出原则

review engine 输出应包含：

- `metric`
- `window`
- `sampleSize`
- `confidence`
- `direction`
- `summary`
- `supportingFacts`
- `limitations`

`confidence` 建议：

- `none`：样本不足，只展示事实。
- `low`：样本少或波动大，只做提示。
- `medium`：样本初步可看。
- `high`：样本较多且趋势稳定，但仍不做因果结论。

0.2.3 默认最多做到 `medium`，除非数据量和算法都足够支撑。
