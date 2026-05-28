# 0.2.6 刀 2 当前 Import Preview 风险矩阵（2026-05-28）

> 本文记录刀 2 的只读代码审计和实现矩阵。它不修改产品代码。

## 当前代码状态

`buildImportPreview(...)` 当前已经计算：

- dataVersion：`older` / `match` / `newer`。
- metadata：appVersion / exportDate / settings / userName。
- 基础 counts：logs / partners / tags。
- 生殖事件 counts：cycleEvents / pregnancyEvents。
- snapshots count。
- 成人行为 counts：pornUseEvents / masturbationEvents / sexEvents。
- 日志冲突：merge 策略下按日期和字段比较。
- 成人行为 link issues：duplicate id / orphan / one-way。

`ImportPreviewModal` 当前展示：

- 文件类型、导出时间、导出版本、dataVersion。
- older / newer 版本提示。
- logs / partners / tags / cycleEvents / pregnancyEvents / snapshots counts。
- settings / userName 是否存在。
- 导入策略和日志冲突。

当前 UI 未展示：

- 三类成人行为事件 counts。
- 成人行为 link issues。
- link issue severity / kind / source / target。
- 旧格式缺少成人行为数组的 info 提示。
- trainingGoals / goalCheckins counts。

## 刀 2 实现边界

刀 2 只做 preview 可见性和风险矩阵，不做真实写入逻辑。

必须保持：

- `newer dataVersion` 继续禁用确认导入。
- encrypted backup 先解密再走同一 preview。
- merge / overwrite 策略继续由用户选择。
- 导入前自动快照仍在确认导入后创建。
- warnings 不阻止导入，blocker 才阻止导入。

不做：

- 不新增 store。
- 不新增 schema / migration。
- 不做 repair。
- 不自动创建训练目标或 check-in。
- 不重写导入弹窗结构。

## 风险矩阵

| 来源 | 条件 | 等级 | 展示 | 是否阻止导入 |
| --- | --- | --- | --- | --- |
| dataVersion | 高于当前版本 | blocker | 红色版本提示 | 是 |
| dataVersion | 低于当前版本 | info | “将自动迁移” | 否 |
| 成人行为数组 | 缺少数组字段 | info | “旧格式未包含该类事件” | 否 |
| 成人行为 counts | 任一 count > 0 | info | 展示三类数量 | 否 |
| 成人行为 link | orphan | warning | 展示 source / target / id | 否 |
| 成人行为 link | one_way | warning | 展示 source / target / id | 否 |
| 成人行为 link | duplicate_id | high | 展示重复 ID | 建议否，除非导入逻辑能明确处理 |
| 日志冲突 | merge 下字段冲突 | warning | 复用当前冲突列表 | 否 |
| training 数据 | 当前无真实 store | info | 不展示假 counts；文档标为条件项 | 否 |

如果实现时增加 blocker 类型，应只用于“写入会造成不可预测破坏”的情况，不把普通 warning 升级成阻断。

## UI 展示要求

在现有弹窗中补齐即可：

- counts grid 增加 porn use / masturbation / sex 三项。
- 有 link issues 时增加一个可折叠区。
- link issue 文案只描述结构问题，不做医学或行为判断。
- duplicate id 用更高强度样式，并说明需要谨慎。
- 旧格式三类数组全缺失时，用 info 文案说明“旧备份没有这些数据维度”。

建议文案：

- “此备份包含 3 条成人行为事件。”
- “1 条关联指向不存在的记录，导入后可在数据健康中继续检查。”
- “发现重复事件 ID，建议先保留备份文件并谨慎导入。”

避免文案：

- “数据已损坏，不能使用。”
- “系统会自动修好所有问题。”
- “成人行为记录异常。”

## 测试验收

至少补测试：

- preview counts 包含三类成人行为事件。
- orphan link issue 会进入 `eventLinkIssues`。
- one-way link issue 会进入 `eventLinkIssues`。
- duplicate id 标为 `error` 或 UI high。
- legacy payload 缺少三类数组时 counts 为 0。
- newer dataVersion 仍禁用确认导入。
- UI 能展示成人行为 counts 和 link issue 摘要。

## 进入刀 3 的条件

刀 2 完成后，刀 3 才扩展 snapshot integrity：

- 复用同一套 link issue 文案或映射。
- 为 issue 增加更具体的 field path / business location。
- 只在训练数据真实落地后加入 orphan goal check-in。

一句话结论：

> 刀 2 的重点是把已经存在于 preview model 的成人行为数量和 link 风险展示出来，同时保持训练数据为条件项。
