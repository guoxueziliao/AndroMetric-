# 0.2.7 数据契约与迁移边界

> 本文只规划 0.2.7 的伴侣、关系上下文和女性性健康关怀数据契约。是否修改 schema 必须由实现前真实代码审计决定。

## 当前已知数据形态

当前代码中至少存在几类伴侣引用：

- `PartnerProfile.id`：伴侣资料 stable id。
- `PartnerProfile.name`：用户可编辑显示名。
- `SexRecordDetails.partner`：legacy 伴侣名字段。
- `SexInteraction.partner`：legacy 互动伴侣名字段。
- `SexEvent.partnerIds`：成人行为事件中的 stable id 列表。
- reproductive events 的 `partnerId`：生理 / 怀孕相关 partner id。
- `PartnerProfile.reproductiveProfile`：伴侣生殖健康目标和周期设置。
- `CycleEvent`：月经、排卵检测、经量、痛经、点滴出血和备孕同房等事件。
- `PregnancyEvent`：验孕、出血、疼痛、就诊和妊娠结局等事件。
- `MenstrualDailySummary`：每日摘要中的周期状态和预测提示。

0.2.7 的第一刀必须确认这些字段在当前代码中的真实读写入口，不能只按文档假设。

## 契约原则

- 新流程优先使用 stable partner id。
- legacy name 记录必须兼容读取。
- 不按名字自动合并伴侣。
- 不因为伴侣资料被删除而删除历史性行为、成人行为或 reproductive 数据。
- orphan partner id 应作为完整性提示，不应静默丢弃。
- 用户修改伴侣显示名不应破坏历史 stable id 引用。
- 月经 / 生殖健康数据只能作为关怀上下文，不能自动推断伴侣意愿、排卵确定性或怀孕结论。

## 迁移边界

默认不做大迁移。

允许：

- 增加 optional 字段。
- 增加只读 integrity 检查。
- 在 UI 中提示 legacy name 记录无法稳定关联。
- 用户手动选择“把这条历史记录关联到某个伴侣”。

不允许：

- 自动把同名伴侣合并。
- 自动把 legacy name 改写成某个 partner id。
- 自动创建伴侣资料。
- 自动删除 orphan 引用。
- 为了关系功能重写 sex record 历史结构。

## 导入导出边界

JSON backup 必须保留完整伴侣资料和引用。

CSV / 报告类可读导出默认不包含：

- 伴侣私密备注全文。
- 敏感点和刺激偏好全文。
- 边界 / 禁忌明细。
- 沟通记录全文。
- 周期不适、疼痛、出血、验孕或恢复备注全文。

如果 CSV 需要输出伴侣列，优先输出稳定、可理解、低敏的信息，例如 partner id 或显示名；是否输出由 0.2.6 的可读导出边界决定。

## Integrity 候选

0.2.7 可以新增或扩展以下只读检查：

- adult behavior `partnerIds` 是否指向存在的 partner。
- reproductive `partnerId` 是否指向存在的 partner。
- legacy sex record 是否只有 name、没有 stable id。
- 周期 / 怀孕事件是否能追溯到明确伴侣。
- 删除伴侣资料后是否仍有历史引用。
- 同名伴侣是否需要用户手动确认。

这些检查只提示问题，不自动修复业务事实。
