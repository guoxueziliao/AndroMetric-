# 0.2.6 实现交接摘要

> 本文是 0.2.6 进入实现窗口前的短交接单。它不替代刀 1 - 刀 6，也不声明当前代码已经实现这些能力。

## 版本范围

0.2.6 只做数据安全与长期数据承诺：JSON backup 契约、import preview、snapshot integrity、只读恢复预检、可读导出边界和 Safety / Privacy 审计。

已定边界：

- 默认不新增 schema / migration。
- 不新增成人行为、训练、洞察或关系功能。
- JSON backup 是完整迁移格式。
- CSV 是可读导出，不替代 JSON backup；Markdown 导出取消。
- 不引入后端、账号、云同步或外部 API。
- 不做 CRDT / OT、多设备实时合并或自动内容识别。
- 不做分享图、社交传播、医生报告或外部 AI 分析。

## 推荐数据流

```text
SnapshotData / ExportSnapshot
  -> JSON backup complete dimensions
  -> import preview counts + risk matrix
  -> snapshot integrity
  -> read-only recovery preflight
  -> optional readable CSV summary
  -> Safety / Privacy audit
```

规则：

- JSON backup 必须完整保留当前数据维度。
- 旧数据缺少新数组时补空数组。
- 高版本 dataVersion 不能写入。
- preview 先于任何真实恢复。
- integrity 只检查和修复结构问题，不创造业务事实。
- repair 必须确认，不静默删除敏感历史。

## 当前审计输入

最新只读审计：[`knife-1-current-contract-audit-2026-05-28.md`](./knife-1-current-contract-audit-2026-05-28.md)。

实现窗口需要特别注意：

- 完整备份路径当前已覆盖三类成人行为事件。
- 选择性 JSON 导出路径当前不覆盖三类成人行为事件。
- `snapshots?` 在类型和 preview 中存在，但完整备份路径当前不嵌套保存已有快照历史。
- 训练目标和 check-in 当前没有真实 store / 类型覆盖；只在 0.2.4 存储真实落地后纳入 0.2.6。

## 刀序交接

- 插刀 0：当前数据 UX 修复。
- 刀 1：数据契约审计。
- 刀 2：Import Preview 风险矩阵；当前矩阵见 [`knife-2-current-preview-risk-matrix-2026-05-28.md`](./knife-2-current-preview-risk-matrix-2026-05-28.md)。
- 刀 3：Snapshot Integrity 扩展；当前矩阵见 [`knife-3-current-integrity-matrix-2026-05-28.md`](./knife-3-current-integrity-matrix-2026-05-28.md)。
- 刀 4：只读恢复预检；当前矩阵见 [`knife-4-current-readonly-preflight-matrix-2026-05-28.md`](./knife-4-current-readonly-preflight-matrix-2026-05-28.md)。
- 刀 5：CSV 可读导出与 Markdown 移除边界。
- 刀 6：Safety / Privacy 审计。

## 文件候选

最终文件位置由实现窗口按真实代码结构确认。若现有结构没有更合适约定，可考虑：

- `features/profile/model/importPreview.ts`
- `features/profile/model/exportOptions.ts`
- `features/profile/ExportOptionsModal.tsx`
- `features/profile/model/useProfileMaintenance.ts`
- `features/profile/MyView.tsx`
- `utils/dataHealthCheck.ts`
- `core/storage/snapshotIntegrity.ts`
- `core/storage/importMerge.ts`
- `core/storage/StorageService.ts`
- `services/BackupService.ts`
- import preview modal 相关 UI。
- export options modal 相关 UI。

## 必须停下来重谈的情况

遇到以下情况，不应在实现中顺手扩大范围：

- 需要新增 schema / migration。
- 需要重新设计整个 export format。
- 需要破坏旧 JSON 字段名。
- 需要导入时自动创造业务记录。
- 需要强制导入高版本数据。
- 需要后端、账号、云同步或外部 API。
- 需要 CRDT / OT。
- 需要医生报告或分享图。

## 验证底线

至少覆盖：

- JSON backup 包含当前完整数据维度。
- 旧格式缺少新数组时可导入并补空数组。
- import preview 展示成人行为事件和训练数据数量。
- newer dataVersion 阻止写入。
- snapshot integrity 能报告 orphan linked ids。
- snapshot integrity 能报告 orphan check-in。
- 只读恢复预检不写入 IndexedDB。
- 导出默认范围是全部导出，日期筛选是可选状态。
- 数据健康问题能定位到具体字段 / 子项。
- 数据生态修复提示能闭合到可执行动作。
- CSV 不被描述成完整备份。
- Markdown 导出入口应移除或隐藏。
- repair 不自动创造业务事实。

## 交接结论

0.2.6 可以作为后续实现草案，但实现窗口必须先完成刀 1。若刀 1 发现当前 0.2.2 - 0.2.5 数据尚未真实落地，应按真实代码状态缩小 0.2.6 范围，不得凭规划文档假设数据已经存在。
