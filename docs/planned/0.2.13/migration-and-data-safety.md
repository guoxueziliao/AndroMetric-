# 0.2.13 迁移与数据安全

## 旧字段兼容

当前 daily log 的 `supplements` 字段不能直接丢：

- 旧记录继续可读。
- 导入旧数据时保留旧 daily log 事实。
- 可以在 UI 中提示“旧补剂记录来自每日记录”。
- 不自动把所有旧补剂事实生成长期计划。

兼容结论：

- `supplements` 继续作为 legacy daily fact。
- 新计划执行只写入 `HealthProjectLog` 或实现时等价 store。
- 旧字段不计入计划执行率。
- 不在 migration 中删除旧字段。

## 迁移原则

- 如果新增 store，必须配套 Dexie schema version 和 migration。
- 迁移只创建空表或兼容字段，不凭旧记录自动推断长期计划。
- 旧 `supplements` 字段在本版本后仍可保留为 legacy daily fact，不强制删除。
- import preview 必须区分 legacy supplements 和新健康项目数据。

## 数据安全接入

0.2.13 必须等待 0.2.6 数据安全能力稳定后再实现：

- JSON backup 覆盖新项目、计划和执行记录。
- import preview 展示新健康项目数量和 legacy supplements 事实数量。
- snapshot integrity 能发现 orphan project log。
- repair 不能自动创造项目或执行事实。
- CSV / 可读导出默认不静默包含健康项目备注全文。
