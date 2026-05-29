# 0.2.6 刀 4 只读恢复预检

> 本文只规划刀 4：在不覆盖当前 IndexedDB 的前提下，预检备份是否可导入。

## 状态

- 所属版本：0.2.6。
- 当前阶段：当前只读预检矩阵已完成，待实现。
- 前置：[`knife-3-snapshot-integrity-expansion.md`](./knife-3-snapshot-integrity-expansion.md) 与 [`knife-3-current-integrity-matrix-2026-05-28.md`](./knife-3-current-integrity-matrix-2026-05-28.md)。
- 实现边界：解析、migration、preview、integrity，不写入当前数据库。

## 当前审计约束

当前矩阵：[`knife-4-current-readonly-preflight-matrix-2026-05-28.md`](./knife-4-current-readonly-preflight-matrix-2026-05-28.md)。

当前文件导入和文件系统备份恢复都已经先走 `buildImportPreview(...)`，但还没有在确认前运行 migration 和 snapshot integrity。刀 4 要把 preview 扩展为完整 preflight，同时保证 preflight 不创建快照、不 restore、不写 Dexie。

## 目标

刀 4 完成后，用户可以在真正恢复前知道备份文件的风险。

预检流程：

1. 读取备份文件。
2. 解密或解析。
3. migration 到当前 dataVersion。
4. 生成 import preview。
5. 运行 integrity check。
6. 输出可导入状态。
7. 不写入 IndexedDB。

## 输出

预检应展示：

- 可导入 / 不可导入。
- dataVersion 状态。
- 各数据维度数量。
- warnings。
- blockers。
- 是否包含成人行为事件。
- 是否包含训练目标和 check-in，仅在真实 store / 类型已落地后展示。

## 写入边界

预检期间不得：

- 写入 IndexedDB。
- 创建安全快照。
- 修改当前数据。
- 清理 linked ids。
- 创建缺失事件。
- 上传文件。

如果需要临时数据结构，应使用内存对象。不得为预检新增持久化 store。

## 入口

允许入口：

- 导入 modal 内的预检结果。
- 备份列表恢复前的预检。
- encrypted backup 导入前的预检。

不做：

- 独立“恢复演练中心”顶级导航。
- 定时自动预检用户本地文件。

## 验收

- 预检高版本备份时阻止写入。
- 预检旧版本备份时显示迁移提示。
- 预检能显示成人行为事件数量；训练数据数量只在真实 store / 类型已落地后展示。
- 预检 warnings 不阻止用户查看详情。
- 预检不写入 IndexedDB。

## 非目标

- 不做真实恢复流程重写。
- 不新增云端备份。
- 不新增账号。
- 不做分享导出。
