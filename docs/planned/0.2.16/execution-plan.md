# 0.2.16 执行计划

## 目标

提升长期使用后的体验与洞察可信度。开发完成后，长期用户应能看出哪些洞察可信、哪些只是样本不足的提示，首页 / 状态页也应更适合长期使用。

## 进入开发前校准

先读这些入口：

- `domain/types/log.ts`：`DataQuality`、`FieldQuality`、`touchedPaths`。
- `domain/rules/dataQuality.ts`：当前质量分计算。
- `features/daily-log/LogForm.tsx`：质量环、字段记录状态、保存路径。
- `features/state/model/PersonalStateEngine.ts`：状态、置信度、预测和目标。
- `features/state/StateView.tsx`：状态页呈现。
- `features/stats/model/personalNormalEngine.ts`、`features/stats/ui/PersonalNormalSection.tsx`：个人常态。
- `features/stats/model/contextExplanationEngine.ts`、`features/stats/ui/ExplanationLayerSection.tsx`：解释层。
- `features/dashboard/Dashboard.tsx`、`features/dashboard/WeekOverview.tsx`、`features/dashboard/TrendsPanel.tsx`：首页长期信息。

## 实现切片

### 切片 1：数据质量提示统一

- 梳理数据质量状态：recorded / none / unknown / not_recorded / inferred / defaulted。
- 页面上只展示对用户有意义的状态，不暴露内部枚举。
- 对样本不足、缺失严重、默认值过多的指标给出统一文案。
- 不把数据缺口说成用户做错了。

### 切片 2：洞察可信度校准

- 给趋势、个人常态、解释卡和状态预测统一可信度文案。
- 低样本时用“样本不足，先作为观察线索”。
- 中等样本时用“初步可看”。
- 高样本时才用更稳定的表达，但仍不做医学诊断。
- 强因果词必须替换为弱相关或同时出现。

### 切片 3：首页 / 状态页长期化

- 首页减少短期噪音，优先显示最近记录、长期摘要和明确行动入口。
- 状态页把置信度、样本数和限制放在用户能看到的位置。
- 不重做 Dashboard，只做信息排序、文案和小组件调整。

### 切片 4：实现前校准模板

- 固化后续版本开发前必须做的代码校准清单。
- 这个清单可以在 0.2.18 工作台中复用。
- 不为模板新增应用内 UI。

## 实现顺序

1. 做代码校准，列出现有所有可信度 / 样本 / 缺口文案。
2. 新增或整理共享文案 / helper，优先放纯函数层。
3. 接入 PersonalState、PersonalNormal、ExplanationLayer。
4. 调整 Dashboard / StateView 的长期使用排序。
5. 补测试和文案检索。

## 验收步骤

- 样本不足时，状态页不会给确定结论。
- 个人常态偏离时，文案表达为“与自身历史不同”，不是“异常”。
- 首页不会被低价值提示淹没。
- 数据质量差的字段在复盘中有缺口提示。
- 后续版本文档能引用一份实现前校准流程。

## 测试建议

- 给可信度 helper 增加样本数边界测试。
- 给 `PersonalStateEngine` 或 `personalNormalEngine` 增加低样本断言。
- 手动验证空数据、少量数据、长期数据三种场景。
- 用 `rg` 检查强因果词：`导致`、`证明`、`必然`、`诊断`。

## 停线项

- 需要重做 Dashboard。
- 需要新增医学评分。
- 需要 AI 自动解释。
- 需要把所有 planned 版本重新审一遍。
- 需要更改历史数据含义。
