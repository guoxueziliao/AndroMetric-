# 开发前代码校准模板

> 版本无关的固定流程。0.2.16 起，进入任意 planned 版本实现前，先按本模板产出一页校准结果，确认真实代码与版本文档一致后再写产品代码。0.2.18 长期维护与版本执行工作台可直接复用本模板。

## 为什么需要

planned 队列很长，文档可能早于实现成稿。直接照文档写代码会出现：假设的数据结构不存在、以为要建表其实已有字段、入口与文档归属冲突。校准的目的是在写代码前暴露这些偏差。

## 校准清单

进入某个版本开发前逐条确认：

- 当前代码是否已有同类能力。
- 数据结构是否已经落地。
- schema / migration 是否支持计划中的字段。
- 导入导出和数据健康是否覆盖相关数据。
- UI 入口和文档入口是否一致。
- 旧 planned 文档是否已经过期。

## 输出模板

每个版本进入开发前，按以下格式输出一页结果：

- 目标版本：
- 当前代码入口：
- 当前数据结构：
- 已存在能力：
- 缺失能力：
- 文档与代码冲突：
- 需要 schema / migration：
- 数据安全影响：
- UI 入口影响：
- 停下来重谈：
- 建议实现顺序：

## 阻断条件（命中任一即停下来重谈）

- 文档假设的数据结构不存在。
- 需要 schema / migration 但版本文档说不需要。
- 已有代码入口与 planned 主归属冲突。
- 实现会破坏数据安全承诺（备份 / 导出 / 不静默删数据）。
- 实现会恢复已否决方向。

## 边界

- 只校准目标版本，不把所有 planned 版本重新审一遍。
- 校准阶段不直接修改产品代码。
- 校准不替代具体版本的实现刀序。

## 示例：0.2.16 校准结果

- 目标版本：0.2.16 长期使用体验与洞察校准 v1
- 当前代码入口：`domain/types/log.ts`（`DataQualityState` 六态）、`utils/dataQuality.ts`（`isFieldUsable` / `RECORDED_STATES`）、`domain/rules/dataQuality.ts`（`calculateDataQuality` 0–100）、`features/state/model/PersonalStateEngine.ts`（none/low/medium/high）、`features/stats/model/personalNormalEngine.ts`（none/low/medium + 三状态）、`features/stats/model/contextExplanationEngine.ts`（none/low/medium）。
- 当前数据结构：现有 `logs` 字段足够派生覆盖率与可信度，无需新字段。
- 已存在能力：各引擎已各自产出可信度等级与 `limitations` 原因文案；样本 / 覆盖率阈值已落地。
- 缺失能力：无共享可信度→标签层（`{none:'', low:'样本有限', medium:'初步可看'}` 在两个 Section 重复，复盘用了不同的 `样本少`）；无长期数据质量覆盖率概览。
- 文档与代码冲突：文档提到的 `WeekOverview.tsx`、`TrendsPanel.tsx` 实际存在；无冲突。
- 需要 schema / migration：否。
- 数据安全影响：无（只读派生 / 纯文案，不持久化、不导出）。
- UI 入口影响：在统计「常态」tab 顶部新增只读数据质量卡；状态页头部补可信度档位词。
- 停下来重谈：无触发。
- 建议实现顺序：共享可信度 helper → 数据质量概览引擎与卡片 → 状态页档位词 → 校准模板固化。
