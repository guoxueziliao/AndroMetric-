# 0.2.2 全文一致性审计（2026-05-28）

> 本文记录 0.2.2 文档集在进入刀 41 前的一轮全文一致性审计。审计只覆盖规划文档，不代表代码已实现。

## 结论

本轮未发现 0.2.2 文档集内的硬冲突。当前可按 [`knife-41.md`](./knife-41.md) 进入 schema / migration / domain types。

## 已确认一致

- 数据模型：采用三张独立 Dexie 表 `porn_use_events` / `masturbation_events` / `sex_events`，不采用单表 `adult_events`。
- 事件关系：采用类型化 linked ids，不采用通用 `relatedEventIds` 主方案。
- 生理日：三类事件都使用 `startedAt` + `targetDate`，`targetDate` 按项目统一 03:00 生理日规则计算。
- 旧数据迁移：旧 `LogEntry.masturbation[]` 生成 `MasturbationEvent[]`，旧 `LogEntry.sex[]` 生成 `SexEvent[]`。
- Porn legacy：旧 `pornConsumption` 保留在日志中，但不生成 `PornUseEvent`。
- 旧日志保留：0.2.2 migration 不删除旧 `logs.sex[]` / `logs.masturbation[]`。
- 迁移 ID：缺旧 ID 时使用 `mig_mb_${log.date}_${index}` / `mig_sex_${log.date}_${index}`；重复旧 ID 保留第一条，后续追加 `${id}_dup_${index}`。
- Sex adapter：旧 `SexRecordDetails` 完整保留到 `legacySexRecord`，旧 `partnerScore` 不映射成 `satisfaction`。
- 导入导出：JSON 是完整数据承诺；CSV / Markdown 是可读性导出，可以后置展开，但不能影响 JSON round-trip。
- 刀 41 / 刀 42 边界：刀 41 只让 schema、domain types、migration 返回结构能承载三类事件；完整 StorageService、import/export、snapshot integrity、encrypted backup 端到端接线归刀 42。
- 删除与修复：删除事件不级联删除关联事件；orphan linked ids 只能报告或清理，不自动创建缺失事件；one-way linked ids 可由 repair 补齐反向关系。
- 0.2.2 / 0.2.3 边界：刀 48 只做同一生理日事实回看，不做 review engine、周报/月报、sampleSize/confidence 洞察或 Markdown 报告导出。
- 隐私与安全：无后端、无账号、无上传；不新增成人内容开关、成瘾布尔、医学诊断、强因果结论、分享图或内容收藏器。

## 已清理

- `docs/planned/` 已按版本拆分为 `0.2.2/`、`0.2.3/`、`0.2.4/`。
- 根入口保留 `plan-0.2.2.md` / `plan-0.2.3.md` / `plan-0.2.4.md`。
- 各版本目录新增轻量 `README.md`，作为专题文档索引。
- 旧文件名显示文本已统一为新目录命名。
- `docs/README.md` 改为总索引，不再摊开 0.2.2 全部刀文档。

## 验证结果

- Markdown 相对链接：全部可解析。
- 旧路径 / 旧文件名残留：未检出。
- `git diff --check`：通过。
- 文档长度：当前 `planned` 最长文档为 340 行，未再出现超长单文档。

## 下一步

进入实现窗口前，先按 [`plan-0.2.2.md`](../plan-0.2.2.md) 和 [`knife-41.md`](./knife-41.md) 重新检查代码状态、dirty worktree、`core/storage/db.ts`、`core/storage/migration.ts`、domain types 和现有 migration 测试形态。
