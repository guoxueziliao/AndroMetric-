# 0.2.2 执行草案（成人行为与色情使用记录闭环）

> 本文档用于 0.2.2 开发执行。
> 当前已确定主方向：把成人行为和色情使用记录补成真正的产品核心闭环。
> 本文的产品方向和数据边界已可作为后续开发依据；具体字段类型和 migration 细节必须先落到 `docs/planned/adult-behavior-data-model-0.2.2.md`，再进入代码实现。

## 当前状态

- 状态：执行草案。
- 前置：0.2.0 视觉系统骨架完成；0.2.1 应用层视觉与交互完成。
- 已定主方向：成人行为与色情使用记录闭环。
- 已定：允许 schema / migration；三类事件独立建模；Porn use / Masturbation / Sex event 字段方向；事件关系模型。
- 待细化：具体 TypeScript 类型、Dexie schema、migration 步骤、UI 刀序、测试清单。

## 收尾结论

0.2.2 的方向讨论已完成，本文档进入可接手执行草案状态。

后续不再继续扩展 0.2.2 的产品范围；新增想法进入 0.2.3+。0.2.2 的下一步不是继续发散，而是从刀 40 开始，把本文产品决策转成 `docs/planned/adult-behavior-data-model-0.2.2.md`。

开发顺序必须保持：

1. 数据模型文档。
2. schema / migration / domain types。
3. storage / import / export / snapshot integrity。
4. 三类事件模型。
5. UI entry points。
6. 事件关联 UI。
7. 基础复盘。
8. golden path 和版本收口。

## 决策清单

- 版本主题：把成人行为和色情使用记录补成可复盘的健康数据闭环。
- 范围性质：0.2.2 是产品能力版，允许受控 schema / migration。
- 前置硬要求：第一刀必须产 `docs/planned/adult-behavior-data-model-0.2.2.md`，该文档完成前不进入代码实现。
- 数据原则：不重命名旧字段，不破坏旧数据读取，新增字段必须有默认值或兼容逻辑。
- 隐私原则：本地优先，无后端、无账号、无上传；不保存色情内容本体、URL 快照、缩略图、图片、视频、演员名。
- 事件建模：Porn use event、Masturbation event、Sex event 三类独立事件建模。
- 事件 ID：三类事件都必须有稳定独立 ID，导入导出保持稳定。
- 生理日：三类事件都保留 `startedAt`，并按 03:00 生理日规则计算 `targetDate`。
- 事件关系：允许多对多关联，使用类型化 linked ids，不采用通用 `relatedEventIds` 作为主方案。
- Porn use event：独立建模，同时可被自慰 / 性行为引用为刺激源或上下文。
- Porn use 字段：MVP 包括开始时间、时长、内容类型、来源类型、兴奋强度、是否进入自慰、是否射精、使用后状态。
- Masturbation event：规范字段并支持多次自慰事件；不强行推翻现有自慰内容 item/editor。
- Masturbation 字段：MVP 包括开始时间、时长、是否射精、高潮强度、边缘控制、硬度、兴奋强度、刺激源、事后状态、满意度。
- Sex event：做对齐式规范化，不全面重做 SexRecord；重点补色情内容参与和事件关联。
- Sex 字段：重点新增/映射 `pornInvolved`、`pornUseContext`、`linkedPornUseEventIds`、`linkedMasturbationEventIds`。
- 关联 UI：支持创建流程内自动关联和用户手动关联；推荐同一 `targetDate` 或前后 6 小时事件。
- 删除规则：不做级联删除；删除事件后清理或报告孤儿 linked ids。
- 导入导出：必须保留事件 ID、事件类型、`startedAt`、`targetDate`、linked ids；round-trip 不能丢关联。
- Snapshot integrity：必须检查三类事件数量、ID 唯一性、linked ids 可解析性、orphan linked ids、targetDate。
- 明确不做：成瘾布尔、非法内容审核字段、成人内容开关、内容收藏器、自动内容识别、复杂自动推断、云端同步、完整 STI/避孕/怀孕风险管理系统。

## 开发前置硬要求

0.2.2 第一刀必须产：

- `docs/planned/adult-behavior-data-model-0.2.2.md`

该文档完成前，不进入代码实现。

该文档必须把本文的产品决策转换为可开发的数据模型：

- TypeScript 类型草案。
- Dexie schema 方案。
- migration 方案。
- 旧数据兼容和默认值。
- 导入 / 导出 / 快照完整性策略。
- 事件关联策略。
- 测试清单。

## 核心基调

0.2.2 的核心基调暂定为：

> 把成人行为和色情使用记录补成可复盘的健康数据闭环。

0.2.1 负责把应用层操作界面定调；0.2.2 开始补产品能力。重点不是“多加几个露骨字段”，而是让用户能把性行为、自淫/自慰、色情使用、射精、硬度、恢复和次日状态串起来，形成可记录、可回看、可分析的闭环。

这个版本应继续坚持：

- 本地优先，无后端、无账号、无上传。
- 成人内容直白记录，不审查、不羞耻化。
- 产品表达仍以健康监控、自我管理、趋势复盘为主，不做挑逗式消费内容。
- 手机 Chrome 高频记录优先。

## 已定方向

0.2.2 选择“方向 A：成人行为与色情使用记录增强”作为主方向。

需要解决的问题：

- 现有性行为和自慰记录已经是核心模块，但色情使用还没有形成清晰记录闭环。
- 自淫/自慰、色情使用、射精、硬度、伴侣、疲劳/恢复、睡眠等数据之间的关系还不够结构化。
- 用户可以记录事件，但后续复盘“什么影响了硬度和性状态”还不够直接。
- 成人内容文案和字段可以更直白，但必须服务数据记录，而不是变成情色内容展示。

## 已定数据模型边界

0.2.2 允许 schema / migration。

原因：

- 0.2.2 的目标是把成人行为和色情使用记录补成可复盘的数据闭环，只靠 UI 文案和临时字段很难完成。
- 色情使用、射精、刺激源、时长、强度、恢复、次日状态等信息如果没有结构化字段，后续统计和导出会继续混乱。
- 该版本是产品能力版，不是 0.2.1 那样的应用层 UI 版，可以接受受控的数据模型演进。

但必须遵守：

- 先产数据模型设计文档，再写代码。
- 不允许边做 UI 边随手加字段。
- 任何 schema 改动必须同步 Dexie version、migration、导入/导出、快照完整性、测试。
- 不重命名已有用户可见字段或导出 JSON 字段。
- 旧数据必须可读取，新增字段必须有默认值或兼容逻辑。
- 生理日规则不变：03:00 前事件归属前一天。

### 前置设计文档

0.2.2 第一刀应产：

- `docs/planned/adult-behavior-data-model-0.2.2.md`

该文档必须先回答：

- 色情使用记录独立成模块，还是作为自淫/自慰记录扩展。
- 性行为、自淫/自慰、色情使用三者的数据边界。
- 新字段加在现有 `LogEntry`，还是新建事件表。
- 新字段如何进入导出、导入预览、快照、加密备份。
- 新字段是否需要迁移默认值。
- 哪些字段只记录，不参与 0.2.2 统计。
- 哪些字段会进入 0.2.2 或后续版本的复盘 / insight。

### Schema 决策原则

- 优先扩展现有日志结构，除非色情使用记录需要独立生命周期或多条事件。
- 如果同一天可能有多次色情使用 / 自淫 / 性行为事件，必须考虑数组事件或独立事件表，不能只塞单个字段。
- 字段命名要直白、稳定、可导出，不为 UI 委婉表达牺牲数据语义。
- 对成人露骨内容不做过滤字段，不做审核状态字段。
- 不引入云同步、账号或远程分类。

### 必须同步的工程面

如果 0.2.2 最终修改 schema，必须同步：

- `core/storage/db.ts`
- `core/storage/migration.ts`
- domain types
- hydration / defaulting 逻辑
- import preview / import merge
- export JSON / CSV / Markdown 如适用
- snapshot integrity
- tests

### 不做

0.2.2 不做：

- 破坏旧数据读取。
- 为成人内容增加审核、过滤、开关或云端分类字段。
- 在数据模型未定稿前开 UI 实现。
- 用自由文本替代所有结构化字段。

## 公开资料调研结论

调研范围：

- X / Twitter 公开成人内容政策与成人内容生态。
- 性教育与性健康资料。
- 色情使用、自慰、问题性色情使用相关研究。
- 公开论坛中关于“看色情但不自慰”“自慰但不用色情”“戒色情但不戒自慰”等讨论。

参考资料：

- X 官方 Adult Content Policy：允许合意制作和分发的成人裸体或性行为内容，但要求正确标记，且不能展示在高度可见区域。
- X 官方 Non-consensual nudity policy：合意成人内容允许，非合意裸体、隐私侵犯和伤害性内容禁止。
- Devon Sexual Health：色情常被用于性唤起、辅助自慰，或被误当作性教育；但色情不是性教育。
- Reproductive Health 2024：色情使用者与非使用者在自慰、性欲、性困扰等维度存在差异。
- Archives of Sexual Behavior 2025 EMA study：研究把“涉及色情使用的 episode，不论是否伴随自慰或高潮”和“无色情的自慰 episode”区分开处理。
- Current Sexual Health Reports 2023：色情使用与性功能关系没有简单共识，但色情辅助自慰、伴侣性反应差异和问题性使用是研究重点。
- 公开论坛讨论显示，“只看色情不自慰”“自慰但不用色情”“色情 + 边缘控制 / 延迟高潮”“戒色情但保留自慰”都是常见用户语境。

调研判断：

- 色情使用可以独立发生，不一定伴随自慰。
- 自淫 / 自慰可以不伴随色情内容。
- 性行为也可能伴随色情内容，例如伴侣共同观看、以色情内容作为刺激源或性脚本来源。
- 色情使用既可以是独立事件，也可以是自慰 / 性行为事件中的刺激源属性。
- 如果只把色情使用塞进自慰记录，会丢失“只看色情、不自慰 / 不射精”的数据。
- 如果只把色情使用做成独立模块，又会割裂“色情刺激导致自慰 / 射精 / 性功能变化”的链路。

## 已定色情使用建模方向

0.2.2 选择：

> 色情使用作为独立事件建模，同时允许被自慰 / 性行为记录引用为刺激源或上下文。

这意味着：

- 色情使用不是自慰记录的附属字段。
- 自慰记录可以关联一次或多次色情使用。
- 性行为记录可以关联色情使用，例如伴侣共同观看或性交前刺激。
- 色情使用可以独立存在，记录“看了色情内容但没有自慰 / 没有射精 / 只是刷内容 / 只是边缘控制”等情况。
- 后续复盘时，可以分析色情使用、自慰、射精、硬度、睡眠、心情、次日状态之间的关系。

### 模型语义

0.2.2 暂定三个层次：

1. **Sex event / 性行为事件**
   - 与伴侣或多人发生的性行为。
   - 关注伴侣、插入、避孕、射精、满意度、硬度、体验、风险和恢复。

2. **Masturbation event / 自淫自慰事件**
   - 个人性刺激和自慰行为。
   - 可以有色情刺激，也可以没有。
   - 关注时长、方式、射精、边缘控制、硬度、满意度、疲劳和恢复。

3. **Porn use event / 色情使用事件**
   - 观看、浏览、搜索、刷成人内容、色情内容或性刺激内容的行为。
   - 可以导致自慰 / 射精，也可以不导致。
   - 可以独立发生，也可以被自慰 / 性行为引用。

### 字段方向

色情使用事件建议关注：

- 时间与时长。
- 内容类型 / 刺激源类型。
- 来源或平台类型，不强制记录具体网址。
- 使用动机：性唤起、辅助自慰、压力释放、无聊、习惯、伴侣共同观看、探索偏好等。
- 强度 / 兴奋度。
- 是否进入自慰。
- 是否射精。
- 是否边缘控制 / 延迟高潮。
- 是否失控或超出预期时长。
- 使用后状态：满足、空虚、疲劳、焦虑、平静等。
- 是否影响睡眠或次日状态。

字段设计必须中性记录，不做道德审查：

- 不命名为“成瘾状态”。
- 不强迫用户给色情使用贴负面标签。
- 可以记录“失控感 / 超时 / 后悔 / 疲劳”，但作为用户自评事实，不作为系统审判。

### 设计约束

- 具体 schema 仍要在 `docs/planned/adult-behavior-data-model-0.2.2.md` 中定。
- 倾向支持多事件，而不是每天只有一个色情使用字段。
- 如果新建事件表，需要评估 Dexie schema、migration、导入导出和快照影响。
- 如果先扩展现有 `LogEntry`，必须证明能支持同一天多次事件和事件间关联。
- 不记录或抓取真实色情内容本身，不保存图片、视频、网址快照。
- 平台 / 来源只做用户手动选择或文本备注，不做联网识别。

## 已定 Porn Use Event 字段方向

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

### MVP 核心字段

0.2.2 MVP 应包含：

- `startedAt`：开始时间，必填，用于生理日归属和时间线。
- `durationMinutes`：时长，必填或强推荐。
- `contentTypes`：内容类型，多选。
- `sourceTypes`：来源类型，多选或单选。
- `arousalLevel`：兴奋强度，1-5。
- `ledToMasturbation`：是否进入自慰。
- `ejaculated`：是否射精。
- `afterState`：使用后状态，多选。

建议 `contentTypes` 候选：

- `video`
- `image`
- `text`
- `audio`
- `live`
- `chat`
- `social_feed`
- `ai_generated`
- `fantasy_reading`
- `other`

建议 `sourceTypes` 候选：

- `porn_site`
- `x_twitter`
- `adult_forum`
- `reddit_like`
- `social_media`
- `chat_app`
- `creator_platform`
- `local_file`
- `ai_chat`
- `memory_fantasy`
- `other`

建议 `afterState` 候选：

- `satisfied`
- `calm`
- `tired`
- `empty`
- `anxious`
- `guilty`
- `more_aroused`
- `neutral`

`afterState` 是用户自评状态，不是系统道德判断。

### 强推荐可选字段

0.2.2 应优先考虑：

- `motives`：使用动机，多选。
- `controlFeeling`：控制感 1-5，不命名为 addiction。
- `exceededIntendedTime`：是否超出预期时长。
- `edging`：是否边缘控制 / 延迟高潮。
- `orgasmIntensity`：高潮强度 1-5，仅在射精 / 高潮时适用。
- `fatigueAfter`：使用后疲劳感 1-5。
- `satisfaction`：满意度 1-5。
- `sleepImpact`：睡眠影响。

建议 `motives` 候选：

- `sexual_arousal`
- `masturbation_aid`
- `stress_relief`
- `boredom`
- `habit`
- `sleep_aid`
- `partner_play`
- `pre_sex_arousal`
- `explore_preference`
- `emotional_escape`
- `other`

建议 `sleepImpact` 候选：

- `none`
- `delayed_sleep`
- `slept_better`
- `woke_up`
- `unknown`

### 谨慎可选字段

这些字段有价值，但要避免产品变成内容收藏 / 偏好数据库：

- `tags`：复用现有标签体系，允许用户自定义偏好、类型、刺激点。
- `platformName`：具体平台名，可选文本，不强引导。
- `notes`：自由备注，允许露骨直白，但统计不依赖备注。
- `linkedMasturbationEventIds`：关联自慰事件。
- `linkedSexEventIds`：关联性行为事件。

### 明确不做

0.2.2 不记录：

- `actualUrl`
- 缩略图、图片、视频、音频内容本身
- 演员名 / 创作者名
- `addicted: boolean`
- `badPorn: boolean`
- `explicitnessLevel`
- 非法内容审核字段
- 成人内容启用字段

原因：

- 本产品是健康记录工具，不是内容收藏器。
- 不做联网识别，不做审核系统。
- 不用道德化字段替代用户自评。
- 不把成人内容作为需要启用 / 禁用的模式。

## 已定 Masturbation Event 字段方向

0.2.2 规范 Masturbation event 字段，并支持多次自慰事件。

自慰事件聚焦个人性刺激行为本身，以及它对射精、边缘控制、硬度、兴奋、疲劳、满意度、睡眠和恢复的影响。

设计原则：

- 自淫 / 自慰可以伴随色情内容，也可以完全不伴随色情内容。
- 色情使用已经独立建模，自慰事件不再把“有没有色情内容”当成核心身份。
- 自慰事件可以关联 0..n 个 Porn use event。
- 一天可以有多次自慰事件，每次记录独立的时长、射精、刺激源和事后状态。
- 不做道德判断，不做成瘾布尔，不强制记录具体色情内容。

### MVP 核心字段

0.2.2 MVP 应包含：

- `startedAt`：开始时间，必填，用于时间线和生理日归属。
- `durationMinutes`：持续时长，必填或强推荐。
- `ejaculated`：是否射精，必须是一等字段。
- `orgasmIntensity`：高潮 / 射精强度 1-5，射精时强推荐。
- `edging`：是否边缘控制 / 延迟高潮，必须是一等字段。
- `hardnessLevel`：自慰过程中的硬度 1-5，复用 HardnessSelector 语义。
- `arousalLevel`：性兴奋强度 1-5，与硬度分开。
- `stimulationSources`：刺激源，多选。
- `afterState`：事后状态，多选。
- `satisfaction`：满意度 1-5。

建议 `stimulationSources` 候选：

- `porn`
- `fantasy`
- `memory`
- `sexting`
- `partner_media`
- `ai_chat`
- `touch_only`
- `toy`
- `other`

建议 `afterState` 候选与 Porn use event 尽量复用：

- `satisfied`
- `calm`
- `tired`
- `empty`
- `anxious`
- `guilty`
- `more_aroused`
- `neutral`

### 强推荐可选字段

0.2.2 应优先考虑：

- `fatigueAfter`：使用后疲劳感 1-5。
- `sleepImpact`：睡眠影响。
- `controlFeeling`：控制感 1-5，中性自评。
- `exceededIntendedTime`：是否超过预期时长。
- `sessionCount`：同一事件内次数，默认 1。
- `ejaculationCount`：射精次数，射精时默认 1，支持多次射精。
- `linkedPornUseEventIds`：关联色情使用事件。
- `linkedSexEventIds`：关联性行为事件。
- `tags`：复用标签体系。
- `notes`：自由备注，允许露骨直白，但统计不依赖备注。

建议 `sleepImpact` 候选与 Porn use event 保持一致：

- `none`
- `delayed_sleep`
- `slept_better`
- `woke_up`
- `unknown`

### 自慰方式 / 工具

自慰方式和工具可以记录，但不在 0.2.2 做重型分类库。

可选方向：

- 用 `tags` 记录偏好、方式、刺激点和情境。
- 或增加轻量 `methods` 多选字段。

如增加 `methods`，候选可包括：

- `hand`
- `toy`
- `pressure`
- `prone`
- `shower`
- `other`

`edging` 已经是一等字段，不必在 `methods` 里重复。

### 和 Porn Use Event 的关系

- Masturbation event 可以引用 0..n 个 Porn use event。
- Porn use event 可以标记 `ledToMasturbation = true`。
- 如果用户在创建自慰记录时同时记录色情使用，UI 可以顺手创建并关联 Porn use event。
- 不要求每次自慰都必须关联色情使用。

### 现有内容编辑器

0.2.2 不强行推翻现有自慰内容 item/editor。

方向：

- 新事件结构先通过 `tags` / `notes` / 关联能力兼容现有内容。
- 老的内容编辑器保留，除非数据模型设计文档证明必须调整。
- 是否重做自慰内容管理，留到 0.2.3 或对应专题。

### 明确不做

0.2.2 不做：

- 成瘾判断字段。
- 道德化评分。
- 强制用户记录具体色情内容。
- 自动推断自慰方式。
- 记录图片 / 视频素材本体。
- 大改现有自慰内容 item/editor，除非数据模型必须。
- 把所有自慰偏好内置成固定分类库。

## 已定 Sex Event 字段方向

0.2.2 规范 Sex event，但不全面重做 SexRecord 体验。

方向：

- Sex event 与 Porn use / Masturbation 对齐，纳入成人行为健康闭环。
- 支持多事件，但 0.2.2 不一定大改 UI。
- 保留现有 SexRecord 主体结构和交互大框架。
- 现有字段能复用就复用，不重复造同义字段。
- 新字段优先通过 adapter 或字段映射接入。

设计原则：

- 性行为可能独立发生，也可能与色情使用、自淫 / 自慰前后关联。
- 色情内容可能发生在性交前、性交中、性交后，或伴侣共同观看。
- 0.2.2 的重点是补闭环相关字段和事件关联，不是完整重写性行为记录器。

### MVP 核心字段

0.2.2 MVP 应包含或映射：

- `startedAt`：开始时间，必填。
- `durationMinutes`：时长，强推荐。
- `partnerIds`：伴侣 ID，可多选，保留现有伴侣体系。
- `interactionTypes`：性行为类型，多选。
- `penetration`：是否插入，boolean 或 enum。
- `hardnessLevel`：性行为过程中的硬度 1-5。
- `ejaculated`：是否射精。
- `ejaculationContext`：射精位置 / 情境，可选。
- `orgasmIntensity`：高潮 / 射精强度 1-5。
- `satisfaction`：满意度 1-5。
- `afterState`：事后状态，多选。
- `pornInvolved`：是否有色情内容参与。
- `linkedPornUseEventIds`：关联色情使用事件。
- `linkedMasturbationEventIds`：关联自慰事件。

建议 `interactionTypes` 候选：

- `penetrative`
- `oral`
- `manual`
- `mutual_masturbation`
- `toy`
- `video_sex`
- `other`

建议 `ejaculationContext` 候选：

- `inside_condom`
- `inside_no_condom`
- `outside`
- `oral`
- `manual`
- `not_applicable`
- `other`

建议 `afterState` 候选与 Porn use / Masturbation 保持一致：

- `satisfied`
- `calm`
- `tired`
- `empty`
- `anxious`
- `guilty`
- `more_aroused`
- `neutral`

### 强推荐可选字段

0.2.2 应优先考虑：

- `pornUseContext`：色情内容参与情境。
- `arousalLevel`：性兴奋强度 1-5。
- `fatigueAfter`：事后疲劳 1-5。
- `recoveryFeeling`：恢复感，可后置。
- `contraception`：避孕方式，如现有字段已存在则优先兼容。
- `riskFlags`：风险标记，多选，先记录不展开完整风险流程。
- `sleepImpact`：睡眠影响。
- `tags`：复用现有标签体系。
- `notes`：自由备注，允许直白。

建议 `pornUseContext` 候选：

- `pre_sex_arousal`
- `during_partner_play`
- `during_intercourse`
- `post_sex`
- `shared_viewing`
- `solo_before_meeting`
- `other`

建议 `contraception` 候选：

- `condom`
- `pill`
- `iud`
- `withdrawal`
- `none`
- `unknown`
- `other`

建议 `riskFlags` 候选：

- `condom_broke`
- `unprotected`
- `sti_concern`
- `pregnancy_concern`
- `consent_concern`
- `other`

`riskFlags` 只做记录，不在 0.2.2 做自动风险判断或完整性健康风险管理。

### 色情内容参与规则

0.2.2 必须支持记录性行为中的色情内容参与：

- 性交前自己观看，用于唤起。
- 和伴侣共同观看。
- 性交过程中播放或使用。
- 性行为后继续观看 / 自慰。
- 作为偏好探索或性脚本来源。

字段方向：

- `pornInvolved`
- `pornUseContext`
- `linkedPornUseEventIds`

不要求每次性行为都必须关联色情使用。

### 现有 SexRecord 兼容

0.2.2 不全面重写 SexRecordModal。

方向：

- 保留现有 SexRecord 主体结构。
- 如果现有记录已经有复杂 interaction 数组，先在数据模型文档里映射。
- 新闭环字段通过 adapter、字段映射或局部 UI 增量接入。
- 伴侣管理不在 0.2.2 大规模重构。

### 明确不做

0.2.2 不做：

- 全面重做 SexRecordModal。
- 大规模重构伴侣管理。
- 完整 STI / 避孕 / 怀孕风险管理系统。
- 自动风险判断。
- 道德化评分。
- 记录色情内容本体。
- 强制所有性行为必须填色情关联。
- 强制记录伴侣敏感信息。

## 已定事件关系模型

0.2.2 选择：

> Porn use event、Masturbation event、Sex event 全部使用独立事件 ID，并允许多对多关联。

原因：

- 色情使用、自慰、性行为都可能独立发生。
- 任一事件都可能发生在同一天多次。
- 色情使用可能导致自慰，也可能只是性行为前刺激，或者完全独立。
- 自慰可能发生在性行为前后，也可能和色情使用无关。
- 多对多关联比单向派生更稳定，导入导出和后续复盘也更清楚。

### 事件 ID

三类事件都必须有稳定 ID：

- `PornUseEvent.id`
- `MasturbationEvent.id`
- `SexEvent.id`

ID 要求：

- 本地生成。
- 导入导出时保持稳定。
- 不能依赖数组 index。
- 不能依赖时间戳唯一性。
- 迁移旧数据时必须为旧事件补 ID。

### 生理日归属

三类事件都必须支持生理日归属。

字段方向：

- `startedAt`：真实开始时间。
- `targetDate` 或等价字段：按 03:00 生理日规则计算出的归属日期。

规则：

- 03:00 前事件归属前一天。
- 不改变现有生理日规则。
- UI 可以按 `targetDate` 汇总，时间线可以按 `startedAt` 排序。

### 关联字段

Porn use event：

```ts
linkedMasturbationEventIds?: string[];
linkedSexEventIds?: string[];
```

Masturbation event：

```ts
linkedPornUseEventIds?: string[];
linkedSexEventIds?: string[];
```

Sex event：

```ts
linkedPornUseEventIds?: string[];
linkedMasturbationEventIds?: string[];
```

关系规则：

- 允许 0..n 关联。
- 不强制双向实时同步作为业务规则，但数据写入用例应尽量保持双向一致。
- 导入 / 修复流程需要能处理单向缺失关系。
- 关联不存在的 ID 时，导入预览或完整性检查应提示。

### 通用 relatedEventIds

0.2.2 不采用单个通用 `relatedEventIds` 替代类型化字段。

原因：

- 类型化字段更利于 UI 和统计。
- Porn / Masturbation / Sex 三类事件关系足够明确。
- 通用 related 会让后续导出和分析多一层解析负担。

如果后续事件类型变多，再考虑：

```ts
relatedEvents?: Array<{ type: 'porn_use' | 'masturbation' | 'sex'; id: string }>;
```

但 0.2.2 不作为主方案。

### 自动关联与手动关联

0.2.2 支持两类关联方式：

1. **创建流程内自动关联**
   - 用户在自慰记录中同时填写色情使用，系统创建 Porn use event 并自动关联。
   - 用户在性行为记录中标记色情内容参与，系统可创建或选择 Porn use event 并关联。

2. **用户手动关联**
   - 用户可以从同一生理日或相邻时间窗口中选择相关事件。
   - UI 默认推荐同一 targetDate 内、时间接近的事件。

0.2.2 不做复杂自动推断：

- 不根据文本备注自动关联。
- 不根据平台/内容类型自动关联。
- 不做机器学习或行为预测。

### 关联窗口

默认推荐窗口：

- 同一 `targetDate`。
- 或 `startedAt` 前后 6 小时内。

这是 UI 推荐规则，不是数据硬约束。用户可以手动关联更远的事件。

### 删除与关联清理

删除事件时：

- 删除目标事件本体。
- 其他事件中指向它的 linked id 应清理，或在完整性检查中修复。
- 高风险删除按 0.2.1 Confirm severity 执行。

不做级联删除：

- 删除 Porn use event 不自动删除自慰事件。
- 删除 Masturbation event 不自动删除 Porn use event。
- 删除 Sex event 不自动删除关联事件。

### 导入导出

导出必须保留：

- 事件 ID。
- 事件类型。
- `startedAt`。
- `targetDate`。
- linked ids。

导入预览必须检查：

- ID 是否重复。
- linked ids 是否指向存在事件。
- 单向关联是否可修复。
- 旧数据是否需要补 ID。

导入合并必须避免：

- 生成新 ID 导致关联丢失。
- 按时间戳误合并不同事件。
- 删除无法识别的 linked ids 而不提示。

### 快照完整性

snapshot integrity 需要覆盖：

- 三类事件数量。
- 三类事件 ID 唯一性。
- linked ids 可解析性。
- orphan linked ids。
- targetDate 是否存在。

### 不做

0.2.2 事件关系模型不做：

- 复杂图数据库。
- 自动行为推断。
- 级联删除。
- 云端关联或同步。
- 基于内容识别的自动关联。

## 已定刀序

0.2.2 按“数据模型 → schema/migration → 存储与导入导出 → 事件模型 → UI → 复盘 → 收口”的顺序执行。

原则：

- 先文档化数据模型，再写代码。
- 先保证旧数据安全，再做新 UI。
- 先让三类事件可存、可导、可恢复，再做复盘展示。
- 不把统计洞察做在字段模型之前。

### 刀 40 — Adult behavior data model

形态：产文档，不动代码。

输出：

- `docs/planned/adult-behavior-data-model-0.2.2.md`

必须包含：

- `PornUseEvent` TypeScript 类型草案。
- `MasturbationEvent` TypeScript 类型草案。
- `SexEvent` 对现有结构的映射方案。
- 事件 ID 策略。
- `targetDate` 生理日归属策略。
- linked ids 关系策略。
- Dexie schema 方案。
- migration 方案。
- 旧数据默认值和兼容策略。
- 导入 / 导出 / 快照完整性策略。
- 测试清单。

不做：

- 不改代码。
- 不设计完整 UI。

### 刀 41 — Schema + migration + domain types

范围：

- 更新 domain types。
- 更新 `core/storage/db.ts`。
- 更新 `core/storage/migration.ts`。
- 为旧数据补事件 ID、默认字段和兼容结构。
- 保持生理日规则不变。

验收：

- migration 测试覆盖旧数据升级。
- typecheck 通过。
- 旧导出样本仍可读取。

### 刀 42 — Storage, import/export, snapshot integrity

范围：

- repository / StorageService 支持三类事件读写。
- 导出 JSON 保留事件 ID、类型、targetDate、linked ids。
- 导入预览检查 ID 重复、孤儿 linked ids、单向关联。
- import merge 不丢关联。
- snapshot integrity 检查三类事件数量、ID 唯一性、targetDate 和 linked ids。

验收：

- 新旧数据导入导出都可用。
- 快照完整性测试覆盖新增事件。
- 删除事件不级联删除关联事件，但能清理或报告孤儿关联。

### 刀 43 — Porn use event model + tests

范围：

- 实现 Porn use event 的创建、更新、删除、查询。
- 实现 MVP 字段和强推荐可选字段的 default/hydrate。
- 实现 tags / notes / linked ids 基础能力。
- 补充模型测试。

不做：

- 不记录 URL、缩略图、图片/视频本体、演员名。
- 不做成瘾布尔或审核字段。

### 刀 44 — Masturbation event alignment

范围：

- 规范 Masturbation event 字段。
- 支持多次自慰事件。
- 接入 linkedPornUseEventIds / linkedSexEventIds。
- 保留现有自慰内容 item/editor，除非数据模型必须调整。
- 增加 adapter 或兼容层，避免一次性推翻旧结构。

验收：

- 旧自慰记录可读取。
- 新自慰事件可独立创建。
- 自慰事件可关联 Porn use event。

### 刀 45 — Sex event mapping / adapter

范围：

- 将现有 SexRecord 映射到 Sex event 语义。
- 接入 pornInvolved / pornUseContext / linkedPornUseEventIds。
- 接入 linkedMasturbationEventIds。
- 保留现有 SexRecord 主体结构和交互大框架。

不做：

- 不全面重做 SexRecordModal。
- 不大规模重构伴侣管理。
- 不做完整 STI / 避孕 / 怀孕风险管理系统。

### 刀 46 — UI entry points + minimal forms

范围：

- 新增 Porn use event 记录入口。
- 提供 Porn use 最小表单。
- Masturbation / Sex 表单中增加必要的关联入口或轻量字段。
- 手机 Chrome 优先。

验收：

- 用户可以独立记录色情使用。
- 用户可以记录自慰并关联色情使用。
- 用户可以记录性行为并标记色情内容参与。

### 刀 47 — Event linking UI

范围：

- 支持创建流程内自动关联。
- 支持用户手动关联同一 targetDate 或前后 6 小时事件。
- 展示已关联事件。
- 支持解除关联。

不做：

- 不做复杂自动推断。
- 不根据备注或内容类型自动关联。

### 刀 48 — Basic review loop

范围：

- 基础复盘视图：同一生理日内 Porn / Masturbation / Sex 事件时间线。
- 展示硬度、射精、时长、满意度、疲劳、睡眠影响等关键字段。
- 展示事件关联链路。
- 样本不足时只展示事实，不做过度归因。

不做：

- 不做复杂统计模型。
- 不做强因果结论。
- 不做推荐系统。

### 刀 49 — Golden path + docs + version close

范围：

- 全应用 golden path。
- 旧数据升级验证。
- 新事件创建 / 编辑 / 删除 / 导入 / 导出 / 快照验证。
- 手机 Chrome 验证。
- 更新 CHANGELOG、版本号和相关文档。

验收：

- `npm run build`
- `npm run test`
- `npm run typecheck`
- 旧数据 migration 测试通过。
- 导入导出 round-trip 不丢事件关联。
- snapshot integrity 覆盖三类事件。
- 生理日 03:00 规则保持。

## 可选方向

### 主方向：成人行为与色情使用记录增强

围绕性行为、自淫/自慰、色情使用、射精、伴侣、偏好、刺激源、频率和恢复状态，补齐更直白、更结构化的记录体验。

可能内容：

- 色情使用记录是否独立成模块，还是作为自慰/性行为的扩展字段。
- 自淫/自慰记录的信息结构重塑。
- 性行为记录更清晰地表达插入、射精、伴侣、体位、避孕、体验、风险等字段。
- 成人内容标签和偏好记录增强。
- 更明确的“行为负荷 / 恢复 / 次日硬度”关联入口。

风险：

- 可能涉及新字段、schema、migration。
- 可能扩大导出格式和历史数据兼容范围。
- 必须保持本地优先、无审核、不羞耻化。

### 方向 B：洞察与复盘增强

围绕“记录之后能看见什么”，增强健康因素、性行为、色情使用、睡眠、酒精、运动、压力与勃起质量之间的关联复盘。

可作为 0.2.2 的第二阶段或 0.2.3 候选。若 0.2.2 增加新记录字段，洞察增强需要依赖足够数据积累，不宜和字段设计混在同一刀里过深推进。

可能内容：

- 更明确的周/月复盘。
- 硬度与行为因素的关联解释。
- 性活动负荷、自慰频率、色情使用和恢复状态的趋势。
- 更好的 insight 分组、可信度、样本量提示。
- Dashboard / Stats / State 的信息架构再整理。

风险：

- 容易碰统计模型和业务算法。
- 需要避免伪科学和过度归因。
- 需要明确样本不足时的表达。

### 方向 C：数据安全、备份与恢复体验增强

围绕“本地成人隐私数据不能丢，也不能误暴露”，继续增强备份、恢复、导入、导出、加密、快照、回滚和隐私模式。

可作为 0.2.2 的约束，而不是主方向。任何新增成人行为字段都必须兼容导入导出、快照、加密备份和隐私模式。

可能内容：

- 备份状态可视化。
- 导入/覆盖/合并流程更清楚。
- 加密导出体验增强。
- 快照回滚体验增强。
- 隐私模式扩展，例如截图保护、启动遮罩、敏感字段隐藏。

风险：

- 高风险数据操作多，必须严格确认和测试。
- 可能触及浏览器能力差异。
- 不应引入云同步，除非方向重新拍板。

### 方向 D：品牌命名与产品身份落地

如果 0.2.1 只完成应用层定调但品牌尚未完全落地，0.2.2 可以专门处理产品身份。

可能内容：

- 产品命名最终拍板。
- slogan / 隐私名 / manifest / README / title 全量同步。
- 图标资产、PWA screenshots、安装体验。
- Welcome 文案最终替换。
- 品牌视觉细节补齐。

风险：

- 如果命名已在 0.2.1 插刀完成，本方向不需要单独成版本。
- 不能只做“换名字”，需要有明确交付价值。

## 初步判断问题

下一轮讨论 0.2.2 时，先回答：

1. 0.2.2 是否允许 schema / migration？
2. 色情使用记录是独立模块，还是作为自淫/自慰记录的扩展？
3. 性行为、自淫/自慰、色情使用三者的数据边界怎么划？
4. “射精 / 未射精 / 边缘控制 / 多次射精”等字段是否进入 0.2.2？
5. 是否记录色情内容类型、刺激源、时长、强度、欲望、失控感、满意度、疲劳和恢复？
6. 是否把色情使用和次日硬度 / 睡眠 / 心情 / 性欲建立基础关联？
7. 新字段是否进入导出、导入预览、快照完整性检查？
8. 哪些内容只做记录，不做统计，避免过度归因？
9. 0.2.2 是否需要更新 tags 体系，还是先复用现有标签？
10. 是否需要先产数据模型设计文档，再进代码实现？

## 暂不决策

- 不在本文档当前状态确定 0.2.2 的版本号是否一定使用。
- 不提前拆刀。
- 不提前设计数据库字段。
- 不提前承诺新增业务模块。
