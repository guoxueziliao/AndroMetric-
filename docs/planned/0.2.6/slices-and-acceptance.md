# 0.2.6 开发刀序与验收

> 本文负责 0.2.6 的开发顺序、版本验收和实现前置。

## 已定刀序

### 插刀 0：当前数据 UX 修复

执行文档：[`knife-0-current-data-ux-fixes.md`](./knife-0-current-data-ux-fixes.md)

细节文档：[`knife-0a-export-range-ux.md`](./knife-0a-export-range-ux.md)、[`knife-0b-repair-entry-flow.md`](./knife-0b-repair-entry-flow.md)、[`knife-0c-health-issue-location.md`](./knife-0c-health-issue-location.md)、[`knife-0-validation-matrix.md`](./knife-0-validation-matrix.md)。

- 默认导出明确为全部导出。
- 日期筛选只是可选状态。
- 数据生态修复提示闭合到体检、修复按钮或不可修说明。
- 数据健康 issue 展示具体字段 / 子项定位。
- 不新增 schema / migration。
- 不重写导出系统或健康检查模型。

### 刀 1：代码状态与数据契约审计

执行文档：[`knife-1-data-contract-audit.md`](./knife-1-data-contract-audit.md)

当前只读审计结果：[`knife-1-current-contract-audit-2026-05-28.md`](./knife-1-current-contract-audit-2026-05-28.md)

- 检查当前 `SnapshotData` / `ExportSnapshot`。
- 检查 import preview。
- 检查 snapshot integrity。
- 确认 0.2.2 - 0.2.5 数据是否进入 JSON backup。
- 明确完整数据清单。
- 明确缺口。
- 明确是否仍然不需要 schema / migration。
- 明确是否可以进入刀 2。
- 训练目标和 check-in 只在真实 store / 类型已经落地时纳入，不凭规划文档虚构。

### 刀 2：Import Preview 扩展

执行文档：[`knife-2-import-preview-risk-matrix.md`](./knife-2-import-preview-risk-matrix.md)

当前风险矩阵：[`knife-2-current-preview-risk-matrix-2026-05-28.md`](./knife-2-current-preview-risk-matrix-2026-05-28.md)

- 增加成人行为事件数量。
- 只在真实 store / 类型已经落地时增加 training goal / check-in 数量。
- 增加 linked id / orphan / one-way warning。
- 保持高版本 dataVersion blocker。
- 所有恢复入口都走 preview。
- 高版本不能写入。
- warning 和 blocker 可读。
- 旧格式缺少新数组显示 info，不作为错误。

### 刀 3：Snapshot Integrity 扩展

执行文档：[`knife-3-snapshot-integrity-expansion.md`](./knife-3-snapshot-integrity-expansion.md)

当前矩阵：[`knife-3-current-integrity-matrix-2026-05-28.md`](./knife-3-current-integrity-matrix-2026-05-28.md)

- 检查三类成人行为事件。
- 检查 linked ids。
- 只在真实 store / 类型已经落地时检查 training goal / check-in。
- 只在训练数据真实落地后检查 orphan check-in。
- 数据健康 issue 展示具体字段 / 子项定位。
- 数据生态修复提示闭合到按钮或下一步动作。
- integrity 能发现结构性问题。
- 不自动创造业务事实。
- 不静默删除历史。
- repair 操作必须有确认。

### 刀 4：只读恢复预检

执行文档：[`knife-4-read-only-recovery-preflight.md`](./knife-4-read-only-recovery-preflight.md)

当前矩阵：[`knife-4-current-readonly-preflight-matrix-2026-05-28.md`](./knife-4-current-readonly-preflight-matrix-2026-05-28.md)

- 解析备份。
- migration 到当前版本。
- 运行 preview 和 integrity。
- 不写入 IndexedDB。
- 用户能在覆盖前知道文件是否可导入。
- blockers 阻止导入。
- warnings 可继续查看。
- 预检不创建安全快照。
- 文件导入和文件系统备份恢复复用同一 preflight helper。

### 刀 5：CSV / Markdown 可读导出边界

执行文档：[`knife-5-readable-export-boundary.md`](./knife-5-readable-export-boundary.md)

- 明确 CSV / Markdown 是否展示新增维度摘要。
- 明确导出默认是全部导出，日期只是可选筛选。
- 明确 notes / 伴侣私密备注默认不导出。
- 提示 Markdown 不是完整备份。
- JSON backup 地位不被削弱。
- 默认导出范围不被日期区间误导。
- 可读导出不泄露默认敏感全文。
- 文案不鼓励分享。
- 不新增分享图或医生报告。

### 刀 6：Safety / Privacy 审计

执行文档：[`knife-6-safety-privacy-audit.md`](./knife-6-safety-privacy-audit.md)

- 审计导出、导入、repair、预检、空状态和错误文案。
- 无云同步引导。
- 无分享引导。
- 无外部 AI 引导。
- 无绝对安全承诺。
- repair 操作需要确认。
- 不出现云端、账号或分享入口。

## 版本验收标准

0.2.6 完成时必须满足：

- JSON backup 完整覆盖当前已实现数据维度。
- import preview 展示新增复杂数据数量和风险。
- snapshot integrity 能检查成人行为事件和训练数据。
- 只读恢复预检不写入 IndexedDB。
- 高版本 dataVersion 不能写入。
- CSV / Markdown 不被描述成完整迁移格式。
- 导出默认支持全部导出，并清楚展示范围。
- 数据健康问题能定位到具体字段或子项。
- 数据生态修复提示能闭合到可执行动作。
- 插刀 0 已处理当前用户反馈。
- 不引入后端、账号、云同步或外部 API。
- 默认不新增 schema / migration。
- 实现前已完成刀 1 审计，并按真实代码状态确认范围。

一句话验收：

> 0.2.6 让复杂本地数据可备份、可预检、可检查、可恢复，但不把隐私数据带向云端或分享。
