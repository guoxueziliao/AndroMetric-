# 0.2.2 刀 49 执行拆解

> 本文只规划刀 49：Golden path + docs + version close。它是 0.2.2 收口刀，不新增产品能力。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 - 48 全部完成。
- 实现边界：验证完整路径、修收口问题、更新文档和版本记录。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`event-relations-and-slices.md`](./event-relations-and-slices.md)
3. [`knife-41.md`](./knife-41.md)
4. [`knife-42.md`](./knife-42.md)
5. [`knife-43.md`](./knife-43.md)
6. [`knife-44.md`](./knife-44.md)
7. [`knife-45.md`](./knife-45.md)
8. [`knife-46.md`](./knife-46.md)
9. [`knife-47.md`](./knife-47.md)
10. [`knife-48.md`](./knife-48.md)
11. [`adult-behavior-data-model.md`](./adult-behavior-data-model.md)

实现前还必须检查：

- `git status --short`
- 当前版本号和 changelog 规则。
- `package.json` / app version 单源，如适用。
- 当前 test / build / typecheck 状态。
- 手机 Chrome 主路径。
- 旧导出样本或测试 fixture。

## 刀 49 目标

完成后应具备：

- 0.2.2 全部 golden path 可用。
- 旧数据升级后不丢旧日志。
- 三类事件可创建 / 编辑 / 删除 / 导入 / 导出 / 快照。
- linked ids 在 round-trip 后不丢失。
- snapshot integrity 覆盖三类事件。
- 手机 Chrome 主路径可用。
- 版本文档和 roadmap 状态更新。
- 没有范围蔓延到 0.2.3+。

## Golden path

必须手动或自动验证：

1. 旧数据打开。
2. migration 生成 `MasturbationEvent[]` / `SexEvent[]`。
3. 旧 `pornConsumption` 保留但不生成 Porn use event。
4. 新建 Porn use event。
5. 新建 Masturbation event。
6. 新建 Sex event。
7. 编辑三类事件。
8. 删除三类事件。
9. 关联 Porn use <-> Masturbation。
10. 关联 Porn use <-> Sex。
11. 关联 Masturbation <-> Sex。
12. 解除关联。
13. 查看同一生理日 basic review loop。
14. JSON export。
15. JSON import。
16. encrypted backup round-trip。
17. snapshot integrity。

## 旧数据升级验证

必须确认：

- 旧 `logs.sex[]` / `logs.masturbation[]` 仍保留。
- 旧 `LogEntry.masturbation[]` 可生成 `MasturbationEvent[]`。
- 旧 `LogEntry.sex[]` 可生成 `SexEvent[]`。
- 旧 `pornConsumption` 不生成 Porn use event。
- 缺 ID 时使用 deterministic migration id。
- 重复旧 ID 被修复或报告，不能静默覆盖。
- 缺 `startTime` 时使用 fallback。
- `targetDate` 按 03:00 生理日规则计算。
- `legacySexRecord` 完整保留旧 SexRecord。
- 旧 `partnerScore` 不映射成 `satisfaction`。
- 旧 `contentItems` / `assets` 不自动生成 Porn use event。

## Import / export / backup 验证

必须确认：

- JSON export 包含：
  - `pornUseEvents`
  - `masturbationEvents`
  - `sexEvents`
- 三类事件数组为空时仍输出 `[]`。
- JSON import 缺少三类事件数组时默认为空。
- JSON import 已包含三类事件时保留原始 ID。
- import preview counts 包含三类事件。
- import preview 能报告 duplicate id、orphan linked ids、one-way linked ids。
- import merge 按 `id` 合并三类事件。
- round-trip 后三类事件数量一致。
- round-trip 后 linked ids 不丢失。
- encrypted backup 走同一检查路径。

## Snapshot integrity 验证

必须确认：

- 快照写后读自检比较三类事件数量。
- 快照写后读自检比较三类事件 ID 集合。
- 完整性检查能报告 orphan linked ids。
- 完整性检查能报告 one-way linked ids。
- 完整性检查能报告缺失 `targetDate`。
- 完整性检查能报告 `targetDate` 与 `startedAt` 生理日不一致。
- 删除事件不级联删除关联事件。

## UI / mobile 验证

手机 Chrome 必查：

- Porn use 最小表单可新建、编辑、删除。
- Masturbation 表单可保存色情刺激轻量字段。
- Sex 表单可保存 `pornInvolved` / `pornUseContext`。
- Event linking UI 可添加、展示、解除关联。
- Basic review loop 可查看同一生理日时间线。
- 320px 宽度不水平溢出。
- 键盘弹出时保存按钮可达。
- Modal / BottomSheet body 不穿透滚动。
- Toast 不遮挡底部导航、FAB、键盘。
- 删除有关联事件时确认文案正确。

## 文案 / 范围审计

必须确认没有引入：

- 内容收藏器。
- URL / 缩略图 / 图片 / 视频 / 音频本体字段或 UI。
- 演员名 / 创作者名字段或 UI。
- 成人内容开关。
- 成瘾布尔。
- 非法内容审核字段。
- 伴侣评分 / 排名新模型。
- 性次数 / 射精次数 / 色情使用时长挑战模型。
- 医学诊断。
- 成瘾判定。
- 强因果结论。
- 云同步。
- 分享图。

## 文档和版本收口

按项目实际发布规则更新：

- CHANGELOG。
- app/package version，如 0.2.2 进入发布。
- `docs/README.md` 状态。
- `docs/roadmap/roadmap.md` 状态。
- `docs/roadmap/future-development.md` 收尾记录。
- 相关计划文档从 `planned/` 移动到 `completed/`，如果本项目采用完成后归档。

如果 0.2.2 只是代码完成但尚未发布，则文档应标为“实现完成 / 待发布”，不要提前写成已发布。

## 必跑命令

刀 49 完成时至少跑：

```bash
npm run typecheck
npm run test
npm run build
git diff --check
```

如项目当时已有 lint 要求，也跑：

```bash
npm run lint
```

## 非目标

刀 49 不做：

- 新字段扩展。
- 新统计模型。
- 0.2.3 review engine。
- 周报 / 月报。
- 0.2.4 训练建议。
- 轻目标。
- 品牌命名插刀。
- 全项目卡片统一。
- 额外 UI 重构。

刀 49 只收口 0.2.2 已定范围。

## 验收标准

- typecheck 通过。
- test 通过。
- build 通过。
- `git diff --check` 通过。
- 旧数据 migration 测试通过。
- 三类事件 CRUD 路径通过。
- 导入导出 round-trip 不丢事件关联。
- snapshot integrity 覆盖三类事件。
- 生理日 03:00 规则保持。
- 手机 Chrome 主路径通过。
- 文档状态与实际实现状态一致。

## 交接到 0.2.3

0.2.2 收口后，0.2.3 才接：

- adult behavior review engine。
- 7 / 14 / 30 天复盘。
- 周报 / 月报。
- sampleSize / confidence。
- 弱相关观察。
- Markdown 报告导出。

0.2.3 不能回头重写 0.2.2 的事件模型，除非发现数据安全或迁移缺陷。
