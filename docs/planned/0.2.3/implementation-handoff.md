# 0.2.3 实现交接摘要

> 本文是 0.2.3 进入实现窗口前的短交接单。它不替代刀 50 的代码入口校准，也不声明当前代码已经实现这些文件。

## 版本范围

0.2.3 只做成人行为复盘、事实时间线、窗口聚合、弱相关观察、周报 / 月报和 Markdown 导出。

已定边界：

- 不新增 schema / migration。
- 不持久化 review result。
- 不新增顶级导航。
- 不做医学诊断、成瘾判定、强因果、道德化评价或分享图。
- 不做 0.2.4 的训练建议、轻目标和养成路径。

## 推荐数据流

实现窗口应优先保持这条数据流：

```text
StorageService / repository read
  -> AdultBehaviorReviewInput adapter
  -> timeline + window facts
  -> confidence gating
  -> weak correlation insights
  -> review UI / report / Markdown export
```

规则：

- 读取数据发生在调用层，不发生在 review engine 内。
- adapter 只整理纯输入，不生成判断。
- timeline / facts 只输出事实，不输出相关性或建议。
- insight 必须经过 confidence gating。
- UI 和报告可以生成自然文案，但不能删除 `sampleSize`、`confidence` 和 `limitations`。

## 文件拆分候选

刀 50 需要用真实代码状态确认最终位置。若现有结构没有更合适的约定，建议从以下拆分开始：

- `features/stats/model/adultBehaviorReviewInput.ts`
  - `AdultBehaviorReviewInput`
  - `ReviewWindow`
  - adapter 相关纯函数
- `features/stats/model/adultBehaviorReviewFacts.ts`
  - `ReviewTimelineEvent`
  - `ReviewTimelineDay`
  - `AdultBehaviorWindowFacts`
- `features/stats/model/adultBehaviorReviewConfidence.ts`
  - `ReviewConfidence`
  - sample size gating helpers
- `features/stats/model/adultBehaviorReviewInsights.ts`
  - 第一批弱相关观察
  - `ReviewInsight`
- `features/stats/model/adultBehaviorReviewReport.ts`
  - 周报 / 月报数据结构
  - Markdown report builder 的纯数据输入

如果现有 stats model 已经有统一 barrel 或 engine 文件，以上可以合并到更贴近现有风格的文件名，但必须保持 adapter、facts、confidence、insights、report 的职责边界。

## UI 边界候选

最终组件名由刀 50 根据现有统计页结构确认。0.2.3 UI 至少需要这些边界：

- Review entry：统计 / 洞察区域里的入口，不是顶级导航。
- Window switcher：滚动 7 / 14 / 30 天、自然周、自然月。
- Primary summary：硬度、恢复、睡眠、疲劳与样本数。
- Behavior load：Porn use、Masturbation、Sex、射精、边缘控制的事实负荷。
- Missing data：缺失数据和不能判断的内容。
- Insight preview：只显示通过 gating 的 1 - 3 条弱相关观察。
- Timeline preview：事实时间线预览，可进入完整时间线。
- Report actions：周报、月报和 Markdown 导出入口。

移动端优先级以 [`review-home-information-architecture.md`](./review-home-information-architecture.md) 为准。

## 测试边界

实现窗口应优先覆盖：

- 03:00 生理日归属。
- rolling 7 / 14 / 30 天窗口边界。
- 自然周 / 自然月窗口边界。
- notes 全文、平台名和内容本体不会默认进入 Markdown。
- `sampleSize < 3` 时不输出 insight。
- `confidence = none` 不进入 insight preview。
- orphan linked ids 不静默消失。
- 旧数据和缺字段数据不会被假默认值污染。

## 必须停下来重谈的情况

遇到以下情况，不应在实现中顺手扩大范围：

- 必须新增数据库字段、表或 migration。
- 必须持久化 review result。
- 现有 0.2.2 三类事件还没有稳定读路径。
- 需要云端模型、联网分析或分享图。
- 需要输出医学诊断、成瘾判定或强因果结论。
- 需要把训练建议、目标系统或养成路径提前放进 0.2.3。

## 交接顺序

1. 先执行刀 50，确认真实代码入口和文件位置。
2. 刀 51 建 input adapter。
3. 刀 52 建 timeline 和 window facts。
4. 刀 53 建 confidence gating。
5. 刀 54 建第一批弱相关观察。
6. 刀 55 接 UI。
7. 刀 56 接报告和 Markdown。
8. 刀 57 做安全文案审计。
9. 刀 58 做 golden path、版本和文档收口。
