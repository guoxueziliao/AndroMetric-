# 0.2.2 字段方向

> 本文是 [`plan-0.2.2.md`](../plan-0.2.2.md) 的专题文档，归档 Porn use / Masturbation / Sex event 的字段方向。可实现类型以数据模型文档集为准。

## Porn Use Event 字段方向

色情使用事件字段围绕健康复盘闭环设计，而不是内容收藏。

目标是记录：

- 什么时候看。
- 看了多久。
- 为什么看。
- 刺激强度如何。
- 有没有进入自慰。
- 有没有射精。
- 有没有边缘控制、失控感或超时。
- 使用后身体 / 情绪如何。
- 是否影响睡眠、次日硬度、性欲和恢复。

MVP 核心字段：

- `startedAt`
- `durationMinutes`
- `contentTypes`
- `sourceTypes`
- `arousalLevel`
- `ledToMasturbation`
- `ejaculated`
- `afterState`

强推荐可选字段：

- `motives`
- `controlFeeling`
- `exceededIntendedTime`
- `edging`
- `orgasmIntensity`
- `fatigueAfter`
- `satisfaction`
- `sleepImpact`

谨慎可选字段：

- `tags`
- `platformName`
- `notes`
- `linkedMasturbationEventIds`
- `linkedSexEventIds`

明确不做：

- `actualUrl`
- 缩略图、图片、视频、音频内容本身
- 演员名 / 创作者名
- `addicted: boolean`
- `badPorn: boolean`
- `explicitnessLevel`
- 非法内容审核字段
- 成人内容启用字段

## Masturbation Event 字段方向

自慰事件聚焦个人性刺激行为本身，以及它对射精、边缘控制、硬度、兴奋、疲劳、满意度、睡眠和恢复的影响。

设计原则：

- 自淫 / 自慰可以伴随色情内容，也可以完全不伴随色情内容。
- 色情使用已经独立建模，自慰事件不再把“有没有色情内容”当成核心身份。
- 自慰事件可以关联 0..n 个 Porn use event。
- 一天可以有多次自慰事件，每次记录独立的时长、射精、刺激源和事后状态。
- 不做道德判断，不做成瘾布尔，不强制记录具体色情内容。

MVP 核心字段：

- `startedAt`
- `durationMinutes`
- `ejaculated`
- `orgasmIntensity`
- `edging`
- `hardnessLevel`
- `arousalLevel`
- `stimulationSources`
- `afterState`
- `satisfaction`

强推荐可选字段：

- `fatigueAfter`
- `sleepImpact`
- `controlFeeling`
- `exceededIntendedTime`
- `sessionCount`
- `ejaculationCount`
- `linkedPornUseEventIds`
- `linkedSexEventIds`
- `tags`
- `notes`

自慰方式 / 工具：

- 可用 `tags` 记录偏好、方式、刺激点和情境。
- 现有 `contentItems` / item editor 暂不强行推翻。
- 不为工具 / 方式建立大型分类库。

明确不做：

- 成瘾布尔。
- 道德化评价字段。
- 性次数 / 射精次数挑战字段。
- 色情内容 URL、缩略图、图片、视频、音频本体。
- 演员名 / 创作者名。

## Sex Event 字段方向

0.2.2 规范 Sex event，但不全面重做 SexRecord 体验。

方向：

- Sex event 与 Porn use / Masturbation 对齐，纳入成人行为健康闭环。
- 支持多事件，但 0.2.2 不一定大改 UI。
- 保留现有 SexRecord 主体结构和交互大框架。
- 现有字段能复用就复用，不重复造同义字段。
- 新字段优先通过 adapter 或字段映射接入。

MVP 核心字段：

- `startedAt`
- `durationMinutes`
- `partnerIds`
- `interactionTypes`
- `penetration`
- `hardnessLevel`
- `ejaculated`
- `ejaculationContext`
- `orgasmIntensity`
- `satisfaction`
- `afterState`
- `pornInvolved`
- `linkedPornUseEventIds`
- `linkedMasturbationEventIds`

强推荐可选字段：

- `pornUseContext`
- `arousalLevel`
- `fatigueAfter`
- `recoveryFeeling`
- `contraception`
- `riskFlags`
- `sleepImpact`
- `tags`
- `notes`

色情内容参与规则：

- 性交前自己观看，用于唤起。
- 和伴侣共同观看。
- 性交过程中播放或使用。
- 性行为后继续观看 / 自慰。
- 作为偏好探索或性脚本来源。

现有 SexRecord 兼容：

- 保留现有 SexRecord 主体结构。
- 复杂 `interactions` 先在数据模型文档里映射。
- 新闭环字段通过 adapter、字段映射或局部 UI 增量接入。
- 伴侣管理不在 0.2.2 大规模重构。

明确不做：

- 全面重做 SexRecordModal。
- 大规模重构伴侣管理。
- 完整 STI / 避孕 / 怀孕风险管理系统。
- 自动风险判断。
- 道德化评分。
- 记录色情内容本体。
- 强制所有性行为必须填色情关联。
- 强制记录伴侣敏感信息。
