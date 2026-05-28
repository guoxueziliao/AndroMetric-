# 0.2.3 刀 58 执行拆解

> 本文只规划刀 58：Golden path + docs + version close。它是 0.2.3 收口刀，不新增产品能力。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 57 完成后执行。
- 实现边界：完整路径验证、版本记录和文档归档。

## 必读文档

1. [`plan-0.2.3.md`](../plan-0.2.3.md)
2. [`slices-and-acceptance.md`](./slices-and-acceptance.md)
3. [`consistency-audit-2026-05-28.md`](./consistency-audit-2026-05-28.md)

## Golden path

必须验证：

1. 旧数据可打开。
2. 0.2.2 三类成人行为事件能进入复盘输入。
3. rolling 7 / 14 / 30 天复盘可用。
4. 自然周 / 自然月报告可用。
5. 事实时间线可用。
6. 窗口摘要可用。
7. 弱相关观察可用。
8. 样本不足时只展示事实。
9. Markdown 导出可用。
10. 导出前敏感数据提示可见。
11. 导出文件不默认包含 notes 全文、平台名或内容本体。

## 版本收口

按项目实际发布规则更新：

- CHANGELOG。
- app/package version，如 0.2.3 进入发布。
- `docs/roadmap/roadmap.md`。
- `docs/roadmap/future-development.md`。
- 将计划文档从 planned 推进到 completed 或 active 后归档。

## 验证命令

刀 58 完成时至少跑：

```bash
npm run test
npm run typecheck
npm run build
git diff --check
```

如实现改动涉及导出，还要验证 Markdown 导出内容。

## 非目标

- 不新增 0.2.4 训练建议。
- 不新增轻目标系统。
- 不新增 schema / migration。
- 不做分享图。

## 交接到 0.2.4

0.2.3 收口后，0.2.4 才接：

- 训练建议。
- 轻目标。
- 关系 / 表现训练。
- Safety Rails。
