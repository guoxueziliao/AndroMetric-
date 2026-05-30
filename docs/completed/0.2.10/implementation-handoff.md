# 0.2.10 实现交接摘要

> 本文是 0.2.10 进入实现窗口前的短交接单。

## 版本范围

0.2.10 只做个人观察计划 v1。它是单独实现版本，但产品上只是 0.2.8 / 0.2.9 详情里的短期观察动作。

已定边界：
- 依赖 0.2.5 goal / check-in。
- 不新增 schema。
- 不新增独立观察计划中心。
- 不自动创建计划。
- 不做治疗、挑战或打卡系统。
- 不新增分享或可读导出。

## 数据流

```text
explanation card / personal normal detail
  -> observation plan draft
  -> user confirmation
  -> goal / check-in reuse
  -> factual review
  -> Safety / Privacy audit
```

## 文件候选

实现前优先检查：
- `domain/types/training.ts`
- `features/stats/model/trainingSuggestions.ts`
- 0.2.5 goal / check-in 实际入口。
- 0.2.9 explanation card 实际入口。
- `features/dashboard/Dashboard.tsx`
- `features/stats/StatsView.tsx`

最终文件名以实现时真实代码为准。

## 验证底线

实现完成后至少验证：

```bash
npm run test
npm run typecheck
git diff --check
```

触达 UI 时也跑：

```bash
npm run build
```

## 交接结论

0.2.10 可以作为执行草案交给实现窗口。实现时不得新增独立观察计划中心；若 0.2.5 或 0.2.9 未真实落地，暂停实现；若真实代码与文档不一致，以代码为准缩小范围并回改文档。
