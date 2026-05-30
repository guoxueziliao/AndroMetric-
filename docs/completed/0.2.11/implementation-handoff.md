# 0.2.11 实现交接摘要

> 本文是 0.2.11 进入实现窗口前的短交接单。

## 版本范围

0.2.11 只做个人经验沉淀 v1。它是单独实现版本，但产品上只是 0.2.10 观察结束后的经验保存能力。

已定边界：
- 依赖 0.2.10 观察计划。
- 默认不新增 schema。
- 必须确认可靠持久化位置。
- 用户手动保存经验卡。
- 不自动总结规律。
- 不分享、不导出可读报告。

## 数据流

```text
observation review
  -> fact summary
  -> user reflection
  -> experience card
  -> history review
  -> Safety / Privacy audit
```

## 文件候选

实现前优先检查：
- 0.2.10 观察计划实际入口。
- 0.2.5 goal / history 实际结构。
- `domain/types/training.ts`
- `features/stats/StatsView.tsx`
- `features/dashboard/Dashboard.tsx`

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

0.2.11 可以作为执行草案交给实现窗口。实现时不得新增独立经验知识库；若 0.2.10 未真实落地或没有可靠持久化位置，暂停实现或回到规划；若真实代码与文档不一致，以代码为准缩小范围并回改文档。
