# 0.2.6 刀 3 当前 Integrity 矩阵（2026-05-28）

> 本文记录刀 3 的只读代码审计和实现矩阵。它不修改产品代码。

## 当前 Snapshot Integrity

`assertSnapshotReadback(...)` 当前检查：新快照可读回、读回 ID 一致、`snapshot.data` JSON 长度没有明显缩短、logs / partners 数量一致、三类成人行为事件数量和 ID 集合一致。

`checkSnapshotIntegrity(...)` 当前检查：三类成人行为事件 duplicate id、linked id orphan、one-way relation、缺失 `targetDate`、`targetDate` 与 03:00 生理日规则不一致。

当前未覆盖：

- tags / cycleEvents / pregnancyEvents / snapshots 的读回数量一致性。
- issue 顶层 `affectedType` / `affectedId` / `path` / `suggestedAction`。
- trainingGoals / goalCheckins。
- orphan goal check-in。
- archived goal 与 check-in 保留关系。

## 当前 Data Health

`HealthIssue` 类型当前已有 `id`、`date`、`type`、`message`、`severity`、`hintAction?` 和 `path?`。

`checkDataHealth(...)` 当前会为部分 content issue 写入 `path`，例如 `masturbation[0].contentItems[1]`。

当前 UI 展示日期、issue type、message 和“前往修复”。

当前 UI 未展示 `path`、`hintAction`、path 的中文业务位置、点击后应检查的表单区块，以及无法自动聚焦时的人工检查路径。

当前点击行为只是按日期跳到表单，因此用户知道“哪一天有问题”，但不知道“哪一项、哪个字段有问题”。

## 当前修复入口

`healthReport.canRepair` 为 true 时，数据健康区显示“一键修复”按钮。

数据生态区当前可能提示“建议运行一键修复”，但提示本身不带按钮，也不说明按钮在数据健康区。

`StorageService.repairData()` 当前只通过 `repairLogUsingHistory(...)` 修复日志结构，不修复成人行为 linked ids，不创建事件，不创建训练目标。

## 刀 3 实现矩阵

| 主题 | 当前状态 | 刀 3 要补 | 边界 |
| --- | --- | --- | --- |
| Readback | logs / partners / 三类事件 | 补 tags / cycle / pregnancy / snapshots 数量一致性 | 不改变快照格式 |
| 成人行为 link | 已检查 orphan / one-way / duplicate | 输出可展示位置和建议动作 | 不自动创建事件 |
| targetDate | 已按 03:00 生理日检查 | 输出事件类型、ID、当前值、期望值 | 不自动改写事实 |
| HealthIssue path | 类型已有，部分 issue 已填 | UI 展示中文路径 | 不要求自动聚焦所有字段 |
| hintAction | 部分 issue 已填 | UI 展示下一步动作 | 不显示不可执行修复 |
| 数据生态提示 | 只有文字提示 | 链接到体检 / 修复按钮或说明位置 | 不新增顶级入口 |
| training 数据 | 当前无真实 store | 仅真实落地后加入检查 | 不新增 schema |

## Path 文案映射

需要一个轻量映射层，把技术 path 转成业务位置：

- `masturbation[0]` -> “自慰记录 1”。
- `masturbation[0].contentItems[1]` -> “自慰记录 1 / 素材 2”。
- `sex[0].interactions[1]` -> “性生活记录 1 / 互动 2”。
- `exercise[0]` -> “运动记录 1”。
- unknown path -> 原样展示，并提示“请在当天表单中手动检查此路径”。

成人行为独立事件的 link issue 需要映射：

- `porn_use pu_1` -> “色情内容使用事件 pu_1”。
- `masturbation mb_1` -> “自慰事件 mb_1”。
- `sex sx_1` -> “性生活事件 sx_1”。

## 修复边界

允许展示 path、业务位置和 suggested action；允许对可派生的 one-way relation 提供用户确认后的修复；允许对 orphan link 提供用户确认后的“移除失效关联”。

禁止自动创建缺失事件、训练目标或 check-in；禁止自动合并不同 ID；禁止自动删除 notes；禁止在没有 health report 时显示“可一键修复”；禁止在 `canRepair=false` 时显示不可点击的一键修复承诺。

## 测试验收

至少补测试：

- `checkSnapshotIntegrity` issue 保留 source / target / id。
- `target_date_mismatch` 包含当前 targetDate 和期望生理日。
- path formatter 能把 content item path 转成中文位置。
- Health issue UI 展示 path / hintAction。
- 数据生态提示能引导到体检或修复入口。
- repair 不会创建缺失成人行为事件。

## 进入刀 4 的条件

刀 3 完成后，刀 4 的只读恢复预检可以复用 import preview 的 counts / warning、snapshot integrity 的 issue list、health issue 的 path 展示规则，以及 blocker / warning / info 分级。

一句话结论：

> 刀 3 的重点是把“发现问题”升级为“指出具体位置和下一步动作”，同时继续禁止自动创造业务事实。
