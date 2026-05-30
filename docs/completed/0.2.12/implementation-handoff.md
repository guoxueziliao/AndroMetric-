# 0.2.12 实现交接摘要

> 本文是 0.2.12 进入实现窗口前的短交接单。

## 版本范围

0.2.12 只做个人阶段回顾 v1。它是单独实现版本，但产品上作为 0.2.8 的只读月度回看聚合层。

已定边界：
- 默认自然月回顾。
- 只读派生。
- 最低依赖 0.2.8；0.2.9 - 0.2.11 是增强章节。
- 不新增 schema。
- 不导出、不分享。
- 不做评分、诊断或预测。

## 数据流

```text
0.2.8 monthly normal review
  -> optional 0.2.9 - 0.2.11 sources
  -> monthly stage review
  -> sections
  -> record gaps
  -> Safety / Privacy audit
```

## 文件候选

实现前优先检查：
- 0.2.8 personal normal 实际结果。
- 0.2.9 explanation cards。
- 0.2.10 observation plans。
- 0.2.11 experience cards。
- `features/stats/StatsView.tsx`
- `features/dashboard/Dashboard.tsx`

最终文件名以实现时真实代码为准。

## 执行入口

按以下顺序执行：

1. [`knife-1-code-source-calibration.md`](./knife-1-code-source-calibration.md)
2. [`knife-2-stage-review-builder.md`](./knife-2-stage-review-builder.md)
3. [`knife-3-review-ui-navigation.md`](./knife-3-review-ui-navigation.md)
4. [`knife-4-record-gaps-limitations.md`](./knife-4-record-gaps-limitations.md)
5. [`knife-5-safety-privacy-audit.md`](./knife-5-safety-privacy-audit.md)

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

0.2.12 可以作为执行草案交给实现窗口。若只有 0.2.8 落地，应缩小为基础月度个人常态回看；0.2.9 - 0.2.11 未落地时隐藏对应增强章节。
