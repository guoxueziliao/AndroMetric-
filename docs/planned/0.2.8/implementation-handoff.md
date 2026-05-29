# 0.2.8 实现交接摘要

> 本文是 0.2.8 进入实现窗口前的短交接单。它不替代刀 1 - 刀 5，也不声明当前代码已经实现这些能力。

## 版本范围

0.2.8 只做个人常态系统 v1，包括个人基线、长期趋势和克制的偏离提示。

已定边界：
- 不做医学诊断。
- 不做人群标准比较。
- 不做未来预测。
- 不做外部 AI。
- 不持久化 baseline cache。
- 不新增顶级导航。

## 数据流

候选数据流：

```text
logs / adult behavior events / review facts
  -> metric series
  -> personal baseline
  -> derived result contract
  -> personal normal state
  -> long-term trend cards
  -> Safety / Privacy audit
```

显示原则：
```text
current window
  + personal baseline range
  + sampleSize
  + missingDays
  + confidence
  + limitations
```

默认窗口：
```text
baseline window: 90 days
current window: 14 / 30 days
extended context: 180 days when enough data exists
```

## 文件候选

实现前优先检查：
- `features/stats/model/StatsEngine.ts`
- `features/stats/model/eventAdapter.ts`
- `features/stats/model/adultBehaviorReviewFacts.ts`
- `features/stats/model/adultBehaviorReviewConfidence.ts`
- `features/stats/model/adultBehaviorReviewInsights.ts`
- `features/stats/StatsView.tsx`
- `features/dashboard/Dashboard.tsx`
- `features/profile/model/csvExport.ts`
- `features/profile/model/importPreview.ts`
- `domain/types/`

最终文件名以实现时真实代码为准。

## 刀序交接

- 刀 1：统计、复盘数据与指标口径校准。
- 刀 2：个人基线派生模型。
- 刀 3：个人常态工作台。
- 刀 4：偏离提示与记录缺口。
- 刀 5：Safety / Privacy 审计。

逐刀文档见 [开发刀序与验收](./slices-and-acceptance.md)。

## 验证底线

实现完成后至少验证：
```bash
npm run test
npm run typecheck
git diff --check
```

如果触达 UI 或导出入口，也应跑：
```bash
npm run build
```

## 停下来重谈

如果实现中需要 cache、人群基线、医学阈值、预测模型、外部 AI，或要把偏离写成异常 / 风险等级，应停止扩张。

## 交接结论

0.2.8 可以作为执行草案交给实现窗口。实现必须先校准当前 stats / review 代码，以真实代码决定第一批基线指标；不得凭规划文档假设所有指标都有足够样本。
