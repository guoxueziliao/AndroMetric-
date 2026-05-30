# 0.2.13 一致性审计（2026-05-29）

> 本文只审计 0.2.13 规划文档一致性，不代表代码已实现。

## 结论

0.2.13 当前形成执行草案 / 待实现。

已定主题：健康项目与补剂周期系统 v1。

已定边界：

- 补剂进入第一版。
- 有周期计划的健康习惯进入第一版。
- 用药不进入周期计划系统。
- 旧 `supplements` 作为 legacy daily fact 继续兼容读取。
- 不自动把旧补剂事实迁移成长期计划。
- 入口位置为每日记录健康区主入口，Dashboard 轻提示，不新增顶级导航。
- 补剂详情采用名称、可选剂量、单位、服用时间标签、周期和备注。
- 周期复杂度限制为每日、隔日、每周若干天、连续 N 天、暂停 / 恢复和手动结束。
- 历史回看限制为项目详情事实回看；Dashboard 只展示今日轻提示；后续阶段回顾只读概况。
- 必须等待 0.2.6 数据安全能力稳定后再实现。

## 一致范围

- `plan-0.2.13.md`：主题、范围、依赖和推荐实现顺序一致。
- `scope-and-boundaries.md`：健康项目和医疗边界一致。
- `data-model-and-migration.md`：新模型和类型边界一致。
- `migration-and-data-safety.md`：旧字段兼容、migration 和数据安全接入一致。
- `schedule-contract.md`：周期、状态和 due item 生成规则一致。
- `daily-log-integration.md`：每日记录只展示计划生成项，旧补剂仅兼容展示。
- `safety-and-privacy.md`：非医疗、非推荐、非剂量判断边界一致。
- `slices-and-acceptance.md`：实现顺序、验收底线和停下来重谈条件一致。
- `implementation-handoff.md`：实现前校准、停下来重谈和验收底线一致。

## 需要实现前校准

- `DailyLog.supplements` 的真实类型和导入导出覆盖。
- 当前每日记录健康区的 UI 入口。
- 生殖 / 备孕面板是否仍读取 legacy `supplements`。
- 0.2.6 完成后的 JSON backup、import preview 和 snapshot integrity 扩展方式。

## 不能顺手扩大

- 用药计划。
- 服药提醒。
- 自动推荐补剂。
- 剂量安全判断。
- 外部 API、账号、云同步。
- 把旧补剂记录自动推断成长期计划。
