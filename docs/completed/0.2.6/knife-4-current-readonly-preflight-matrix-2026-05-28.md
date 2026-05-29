# 0.2.6 刀 4 当前只读恢复预检矩阵（2026-05-28）

> 本文记录刀 4 的只读代码审计和实现矩阵。它不修改产品代码。

## 当前恢复入口

当前已有两个 preview 入口：文件导入 `useProfileMaintenance.handleFileChange(...)`，以及文件系统备份恢复 `useBackupSettings.handleRestoreBackup(...)`。

文件导入当前会读取文件、识别加密备份、必要时解密、调用 `buildImportPreview(rawText, encrypted, logs)`，并在 newer dataVersion 时禁用确认。用户确认后才创建“导入前自动快照”并调用 `StorageService.restoreSnapshot(...)`。

文件系统备份恢复当前会从备份目录读取文件、调用 `buildImportPreview(rawText, false, logs)`，打开同一个 `ImportPreviewModal`。用户确认后才创建“文件系统恢复前自动快照”并调用 `StorageService.restoreSnapshot(...)`。

## 当前缺口

当前 preview 已做到“不确认就不写库”，但还不是完整只读恢复预检。

缺口：

- preview 不先运行 `runMigrations(...)`。
- preview 不运行 `checkSnapshotIntegrity(...)`。
- preview 不输出 integrity warnings / blockers。
- preview 不展示 migration 后的数据维度变化。
- preview 不显示“预检未写入 IndexedDB”的明确状态。
- 文件系统备份恢复暂不处理加密备份。

## 刀 4 实现边界

刀 4 应新增一个内存态 preflight builder：输入 raw text，输出 rawText、encrypted、parse status、dataVersion / versionStatus、import preview、migrated data summary、integrity issues、blockers、warnings 和 safeToImport。

预检期间禁止调用 `StorageService.restoreSnapshot(...)`、`StorageService.snapshots.create(...)`，禁止写入 Dexie / localStorage，禁止清理 linked ids、创建缺失事件或上传文件。

## 预检流程

```text
raw file text
  -> decrypt if needed
  -> parse snapshot
  -> extract data payload
  -> buildImportPreview
  -> if newer dataVersion: blocker
  -> runMigrations in memory
  -> build temporary Snapshot-like object
  -> checkSnapshotIntegrity
  -> merge warnings / blockers
  -> show result
```

`runMigrations(...)` 当前是纯函数式转换导入对象；可在内存中复用。若实现时发现某一步会写入外部状态，应停止并改为纯 helper。

## 风险分级

| 条件 | 等级 | 行为 |
| --- | --- | --- |
| raw text 无法解析 | blocker | 不允许导入 |
| 解密失败 | blocker | 不允许导入 |
| dataVersion 高于当前 | blocker | 不允许导入 |
| migration 抛错 | blocker | 不允许导入 |
| duplicate adult event id | high | 建议阻止或强确认 |
| orphan / one-way link | warning | 可导入，但展示详情 |
| targetDate mismatch | warning | 可导入，但展示详情 |
| 旧格式缺少新数组 | info | 可导入，补空数组 |

## UI 要求

在现有 `ImportPreviewModal` 上扩展即可：标题或状态显示“已完成只读预检”，显示“未写入当前数据”，合并展示 preview counts 和 integrity issues，blockers 禁用确认按钮，warnings 可展开查看，文件导入和文件系统备份恢复复用同一 preflight 结果。

不要新增顶级“恢复演练中心”。

## 测试验收

至少补测试：

- 高版本 dataVersion 预检阻止导入。
- 旧版本 payload 预检会在内存运行 migration。
- orphan link issue 会进入 preflight warnings。
- preflight 不调用 snapshot create。
- preflight 不调用 restoreSnapshot。
- 加密文件解密失败时产生 blocker。
- 文件导入和文件系统恢复使用同一 preflight helper。

## 进入刀 5 的条件

刀 4 完成后，刀 5 才处理 CSV 可读导出和 Markdown 移除边界。刀 5 可以复用完整 JSON backup 和选择性 JSON 导出的边界结论、preview / preflight 的 counts，以及 integrity issue 的安全文案。

一句话结论：

> 刀 4 的重点是把“导入前看一眼”升级成“导入前在内存里跑完可导入性检查”，并且保证预检本身零写入。
