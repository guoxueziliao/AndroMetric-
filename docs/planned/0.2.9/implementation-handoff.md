# 0.2.9 实现交接摘要

> 本文是 0.2.9 进入实现窗口前的短交接单。它不声明当前代码已经实现这些能力。

## 版本范围

0.2.9 只做个人变化解释层 v1。它是单独实现版本，但产品上归属 0.2.8 个人常态 / 长期趋势详情。

已定边界：
- 不做强因果。
- 不做医学解释。
- 不做未来预测。
- 不自动生成目标。
- 不新增 schema。
- 不新增可读导出。

## 数据流

候选数据流：

```text
personal normal result
  -> changed metrics
  -> context facts
  -> explanation cards
  -> 0.2.8 detail UI / Dashboard hint
  -> Safety / Privacy audit
```

卡片必须显示：

```text
window + sampleSize + confidence + limitations
```

## 文件候选

实现前优先检查：
- `features/stats/model/StatsEngine.ts`
- `features/stats/model/eventAdapter.ts`
- `features/stats/model/adultBehaviorReviewFacts.ts`
- `features/stats/model/adultBehaviorReviewConfidence.ts`
- `features/stats/StatsView.tsx`
- `features/dashboard/Dashboard.tsx`
- `domain/types/adultBehavior.ts`
- `domain/types/log.ts`
- `domain/types/training.ts`
- `domain/types/reproductive.ts`

最终文件名以实现时真实代码为准。

## 刀序

- 刀 1：代码校准与依赖版本确认。
- 刀 2：上下文窗口构建。
- 刀 3：解释卡片引擎。
- 刀 4：并入 0.2.8 详情页的 UI 与 Dashboard。
- 刀 5：Safety / Privacy 审计。

逐刀文档见 [开发刀序与验收](./slices-and-acceptance.md)。

## 验证底线

实现完成后至少验证：

```bash
npm run test
npm run typecheck
git diff --check
```

如果触达 UI，也应跑：

```bash
npm run build
```

## 交接结论

0.2.9 可以作为执行草案交给实现窗口。实现时不得做独立解释层工作台；若 0.2.8 尚未真实落地，暂停 0.2.9 实现；若真实代码与文档不一致，以代码为准缩小范围并回改文档。
