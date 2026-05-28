# 0.2.2 成人行为数据模型：类型与字段

> 本文是 [`adult-behavior-data-model.md`](./adult-behavior-data-model.md) 的专题文档，负责类型草案和字段边界。

## Store 形态

0.2.2 采用三张独立 Dexie 表，而不是一张混合 `adult_events` 表：

- `porn_use_events`
- `masturbation_events`
- `sex_events`

原因：

- 三类事件字段差异明显。
- 三张表更符合“三类事件独立建模”的产品方向。
- migration、导入导出、snapshot integrity 可以分别统计数量、ID 唯一性和 linked ids。
- 单表会产生大量按 `type` 分支的可选字段，容易让领域类型退化成宽松对象。

## 共同基础字段

```ts
export type AdultBehaviorEventSource =
  | 'manual'
  | 'quick'
  | 'import'
  | 'migration'
  | 'repair';

export type AdultBehaviorEventStatus =
  | 'completed'
  | 'in_progress';

export interface AdultBehaviorEventBase {
  id: string;
  startedAt: string;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  status: AdultBehaviorEventStatus;
  source: AdultBehaviorEventSource;
  tags?: string[];
  notes?: string;
}
```

字段规则：

- `id`：稳定事件 ID，本地生成，导入导出保持不变；不能依赖数组 index，也不能只依赖时间戳唯一性。
- `startedAt`：真实开始时间，使用 ISO datetime string；时间线按它排序。
- `targetDate`：按 03:00 生理日规则计算出的 `YYYY-MM-DD`。
- `createdAt` / `updatedAt`：ISO datetime string，用于导入合并、编辑排序和后续审计。
- `status`：默认 `completed`；`in_progress` 只给 ongoing / 快捷记录场景预留。
- `source`：记录事件来源。旧数据迁移为 `migration`，导入为 `import`，手动创建为 `manual`。
- `tags`：复用现有标签体系，默认 `[]`。
- `notes`：自由备注，统计和复盘不能依赖备注文本解析。

不放入共同基础字段：

- `durationMinutes`：放在各事件类型里。
- `afterState`：放在各事件类型里。
- `linked*EventIds`：各事件类型独立定义。
- `partnerIds`：只属于 Sex event。
- 完整 `DataQuality`：0.2.2 先用 `source` 和 migration 规则兜住。

## Shared enums

```ts
export type AdultBehaviorScale5 = 1 | 2 | 3 | 4 | 5;

export type AdultBehaviorAfterState =
  | 'satisfied'
  | 'calm'
  | 'tired'
  | 'empty'
  | 'anxious'
  | 'guilty'
  | 'more_aroused'
  | 'neutral';

export type AdultBehaviorSleepImpact =
  | 'none'
  | 'delayed_sleep'
  | 'slept_better'
  | 'woke_up'
  | 'unknown';

export type AdultBehaviorEdging =
  | 'none'
  | 'single'
  | 'multiple';
```

## PornUseEvent

Porn use event 记录色情使用本身，服务健康复盘闭环，不服务内容收藏。

```ts
export type PornContentType =
  | 'video'
  | 'image'
  | 'text'
  | 'audio'
  | 'live'
  | 'chat'
  | 'social_feed'
  | 'ai_generated'
  | 'fantasy_reading'
  | 'other';

export type PornSourceType =
  | 'porn_site'
  | 'x_twitter'
  | 'adult_forum'
  | 'reddit_like'
  | 'social_media'
  | 'chat_app'
  | 'creator_platform'
  | 'local_file'
  | 'ai_chat'
  | 'memory_fantasy'
  | 'other';

export type PornUseMotive =
  | 'sexual_arousal'
  | 'masturbation_aid'
  | 'stress_relief'
  | 'boredom'
  | 'habit'
  | 'sleep_aid'
  | 'partner_play'
  | 'pre_sex_arousal'
  | 'explore_preference'
  | 'emotional_escape'
  | 'other';

export interface PornUseEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  contentTypes: PornContentType[];
  sourceTypes: PornSourceType[];
  arousalLevel: AdultBehaviorScale5 | null;
  ledToMasturbation: boolean | null;
  ejaculated: boolean | null;
  afterState: AdultBehaviorAfterState[];
  motives?: PornUseMotive[];
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  edging?: AdultBehaviorEdging;
  orgasmIntensity?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  satisfaction?: AdultBehaviorScale5 | null;
  sleepImpact?: AdultBehaviorSleepImpact | null;
  platformName?: string;
  linkedMasturbationEventIds: string[];
  linkedSexEventIds: string[];
}
```

规则：

- `durationMinutes` 字段存在但允许 `null`；新建表单强推荐填写。
- `contentTypes` / `sourceTypes` 默认 `[]`。
- `arousalLevel` 是性兴奋强度，和硬度不是同一个指标。
- `ledToMasturbation` 表示这次色情使用是否进入自慰；有具体自慰记录时应通过 `linkedMasturbationEventIds` 关联。
- `ejaculated` 表示这次色情使用过程中是否射精；如果射精发生在自慰事件里，优先在 Masturbation event 中记录。
- `afterState` 是用户自评状态，不是系统道德判断。
- `controlFeeling` 不命名为 addiction。
- `platformName` 只记录用户主动输入的平台名；不记录 URL，不抓取内容。

默认值：

- 数组字段默认 `[]`。
- nullable 标量默认 `null`。
- `edging` 默认 `none`。
- 旧 `pornConsumption` 不生成 Porn use event。

不进入 PornUseEvent：

- `actualUrl`
- 缩略图、图片、视频、音频内容本体
- 演员名 / 创作者名
- `addicted`
- `badPorn`
- `explicitnessLevel`
- 非法内容审核字段
- 成人内容启用字段

## MasturbationEvent

Masturbation event 记录自淫 / 自慰行为本身，支持一天多次事件，并通过 typed linked ids 关联 Porn use event 或 Sex event。

```ts
export type MasturbationStimulationSource =
  | 'porn'
  | 'fantasy'
  | 'memory'
  | 'sexting'
  | 'partner_media'
  | 'ai_chat'
  | 'touch_only'
  | 'toy'
  | 'other';

export interface MasturbationEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  ejaculated: boolean | null;
  orgasmIntensity: AdultBehaviorScale5 | null;
  edging: AdultBehaviorEdging;
  hardnessLevel: AdultBehaviorScale5 | null;
  arousalLevel: AdultBehaviorScale5 | null;
  stimulationSources: MasturbationStimulationSource[];
  afterState: AdultBehaviorAfterState[];
  satisfaction: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  sleepImpact?: AdultBehaviorSleepImpact | null;
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  sessionCount?: number;
  ejaculationCount?: number | null;
  linkedPornUseEventIds: string[];
  linkedSexEventIds: string[];
}
```

规则：

- `ejaculated` 是一等字段；未知或未记录时为 `null`。
- `orgasmIntensity` 射精时强推荐，不射精或未知时允许 `null`。
- `hardnessLevel` 复用 HardnessSelector 语义，和 `arousalLevel` 分开。
- `stimulationSources` 选 `porn` 时，应鼓励用户关联 Porn use event。
- `satisfaction` 是主观满足 / 泄压感，不命名为表现评分。
- `sessionCount` 默认 `1`，不做挑战指标。
- `ejaculationCount` 的默认值在 migration 实现时按文档测试校准。

旧 `MasturbationRecordDetails` 兼容：

- `id` 优先作为事件 ID。
- `log.date + startTime` 合成 `startedAt`，再计算 `targetDate`。
- `duration` -> `durationMinutes`。
- `ejaculation` -> `ejaculated`。
- `orgasmIntensity` -> `orgasmIntensity`。
- `edging` -> `edging`。
- `satisfactionLevel` -> `satisfaction`。
- `contentItems` / `assets` / `materials` / `props` / `tools` 不直接生成 Porn use event。

## SexEvent

Sex event 记录性行为事件，并把现有 `SexRecordDetails` 主体结构映射到 0.2.2 的成人行为闭环。0.2.2 不全面重写 SexRecord 体验，不大规模重构伴侣管理。

```ts
export type SexInteractionType =
  | 'penetrative'
  | 'oral'
  | 'manual'
  | 'mutual_masturbation'
  | 'toy'
  | 'video_sex'
  | 'other';

export type SexPenetration = 'yes' | 'no' | 'unknown';

export type SexEjaculationContext =
  | 'inside_condom'
  | 'inside_no_condom'
  | 'outside'
  | 'oral'
  | 'manual'
  | 'not_applicable'
  | 'other';

export type SexPornUseContext =
  | 'pre_sex_arousal'
  | 'during_partner_play'
  | 'during_intercourse'
  | 'post_sex'
  | 'shared_viewing'
  | 'solo_before_meeting'
  | 'other';

export type SexContraception =
  | 'condom'
  | 'pill'
  | 'iud'
  | 'withdrawal'
  | 'none'
  | 'unknown'
  | 'other';

export type SexRiskFlag =
  | 'condom_broke'
  | 'unprotected'
  | 'sti_concern'
  | 'pregnancy_concern'
  | 'consent_concern'
  | 'other';

export interface SexEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  partnerIds: string[];
  interactionTypes: SexInteractionType[];
  penetration: SexPenetration;
  hardnessLevel: AdultBehaviorScale5 | null;
  ejaculated: boolean | null;
  ejaculationContext: SexEjaculationContext | null;
  orgasmIntensity: AdultBehaviorScale5 | null;
  satisfaction: AdultBehaviorScale5 | null;
  afterState: AdultBehaviorAfterState[];
  pornInvolved: boolean | null;
  pornUseContext?: SexPornUseContext[];
  arousalLevel?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  recoveryFeeling?: AdultBehaviorScale5 | null;
  contraception?: SexContraception | null;
  riskFlags?: SexRiskFlag[];
  sleepImpact?: AdultBehaviorSleepImpact | null;
  legacySexRecord?: SexRecordDetails;
  linkedPornUseEventIds: string[];
  linkedMasturbationEventIds: string[];
}
```

规则：

- `partnerIds` 默认 `[]`；旧记录只有伴侣名称时不能伪造 PartnerProfile。
- `penetration` 用 enum，保留 `unknown`。
- `satisfaction` 是用户主观体验，不是伴侣评分。
- `pornInvolved` 不强制必须关联具体 Porn use event。
- `riskFlags` 只做记录，不做自动风险判断。
- `legacySexRecord` 保留现有 `SexRecordDetails` 和复杂 `interactions`，供 adapter 使用。

旧 `SexRecordDetails` 兼容：

- `id` 优先作为事件 ID。
- `log.date + startTime` 合成 `startedAt`，再计算 `targetDate`。
- `duration` -> `durationMinutes`。
- `ejaculation` -> `ejaculated`。
- `record` 完整保留到 `legacySexRecord`。
- `partner` 只有明确是 partner id 或可无歧义匹配时才进入 `partnerIds`。
- `protection`、`ejaculationLocation`、`interactions` 的具体映射留给 adapter 实现。
- `partnerScore` 不映射到 `satisfaction`。
