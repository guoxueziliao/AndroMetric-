# 0.2.7 关系上下文模型

> 本文定义关系上下文系统 v1 的产品语义。它不是关系管理模型，也不是伴侣评价模型。

## 核心定义

关系上下文是一次成人行为或一段训练目标背后的关系情境。

它回答：

- 当时处在什么关系类型和互动情境中？
- 沟通是否充分？
- 边界和偏好是否被尊重？
- 伴侣反馈和自我感受如何影响满意度、恢复和后续目标？
- 女性伴侣当时是否处在经期、预计窗口期、备孕 / 避孕目标或恢复期等需要关怀的状态？

它不回答：

- 谁更好。
- 谁更适合。
- 谁导致表现好 / 差。
- 这段关系是否健康。
- 用户应该和谁继续关系。
- 女性伴侣是否应该发生性生活。
- 月经 / 排卵 / 怀孕状态的医学结论。

## v1 上下文维度

### 关系情境

用于描述本次互动的关系背景。

候选字段：

- `relationshipContext`: stable / dating / casual / service / unknown。
- `familiarity`: first_time / familiar / long_term / unknown。
- `planned`: yes / no / spontaneous / unknown。
- `privacyComfort`: comfortable / mixed / uncomfortable / unknown。

这些字段只用于上下文，不用于排名或评分。

### 沟通状态

用于记录本次互动前后沟通是否充分。

候选字段：

- `communicationBefore`: clear / partial / none / not_recorded。
- `communicationAfter`: feedback_shared / no_feedback / not_recorded。
- `needsFollowUp`: boolean。
- `communicationNote`: optional private text。

`communicationNote` 是敏感文本，默认不进入 CSV / 报告类导出。

### 边界与偏好

用于记录边界确认和偏好上下文。

候选字段：

- `boundaryConfirmed`: yes / partial / no / not_recorded。
- `boundaryIssue`: none / minor / uncomfortable / not_recorded。
- `preferenceMatched`: yes / partial / no / not_recorded。
- `boundaryNote`: optional private text。

边界字段只用于提醒和复盘，不用于评价伴侣。

### 反馈与恢复

用于连接本次体验和后续恢复。

候选字段：

- `partnerFeedback`: positive / neutral / mixed / negative / not_recorded。
- `selfFeltRespected`: yes / mixed / no / not_recorded。
- `aftercareQuality`: good / partial / missing / not_recorded。
- `relationshipStress`: low / medium / high / not_recorded。

这些字段不能被系统包装成关系诊断。

### 周期与女性性健康关怀

用于把已有月经 / 生殖健康内容作为性生活计划和复盘上下文。

候选字段：

- `cycleContext`: period / predicted_period / fertile_window / trying_to_conceive / avoid_pregnancy / pregnant / recovery / unknown。
- `cycleComfort`: comfortable / discomfort / pain / not_recorded。
- `careNeeded`: rest / slower_pace / avoid_sex / aftercare / contraception_check / not_recorded。
- `cycleContextSource`: menstrual_summary / cycle_event / reproductive_profile / manual / unknown。

这些字段必须表达为“关怀和沟通提示”，不能表达为性行为要求。

## 来源层级

关系上下文可以来自三层：

- 单次记录：最重要，描述本次实际情境。
- 伴侣资料：长期背景，描述稳定偏好和边界。
- 月经 / 生殖健康数据：周期状态、备孕 / 避孕目标和恢复背景。
- 训练 check-in：回看沟通目标是否持续。

复盘应优先使用单次记录，其次使用伴侣资料，最后使用目标历史。长期资料不能覆盖单次记录。

## 数据落地策略

默认先按真实代码审计决定：

- 如果现有 sex / adult behavior event 已有合适扩展点，可用 optional `relationshipContext` 对象。
- 如果没有稳定扩展点，先做只读 UI 和文档，不强行 schema。
- 如果需要新增字段，必须同步 JSON backup、import preview、snapshot integrity 和隐私导出边界。

## v1 非目标

- 不建立 Relationship 表。
- 不建立关系阶段 / 关系协议模型。
- 不做关系评分。
- 不做伴侣画像自动推断。
- 不做自动关系建议。
- 不把私密 note 放进复盘结论。
