# 0.2.1 完成记录（应用层视觉与交互）

> 本文档最初作为 0.2.1 执行草案，现已按代码实际状态归档为完成记录。
> 0.2.1 基于 0.2.0 的视觉 token、Tailwind 构建化、dark/light 双值机制、动效 token、manifest / 图标整理完成应用层视觉与交互收口。

## 状态

- 当前状态：开发完成，已归档。
- 版本主题：私密男性健康操作台的应用层定调。
- 范围边界：只做应用层视觉与交互，不加入新业务功能。
- 主场景：手机 Chrome 浏览器。
- 品牌依赖：命名同步 / Welcome v2 未阻塞组件主线，后续可作为品牌插刀单独处理。

## 完成结果

0.2.1 已完成应用层视觉与交互主线：

- `OverlayPrimitive` 落地，`Modal` / `BottomSheet` 共用底层 overlay 行为。
- `Toast` 支持 `success | error | info | warning`，并按类型区分自动消失时长。
- `ConfirmModal` 支持风险分级和文本确认。
- `Switch` / `Checkbox` 建立为共享布尔控件，旧 `.toggle-checkbox` CSS 已移除。
- `DataCard` / `RecordCard` 支持语义 tone，日记编辑中的性活动记录已改用 `kind` 映射。
- `HardnessSelector` 保留 1-5 存储语义，完成更直白的成人医学/功能表达与 `density` / `readOnly` 接口。
- 成人/性健康核心本地图标与交互动效规则已落到 `docs/completed/ui-interaction-system.md`。
- 未引入新业务能力、schema、migration、后端、分享或导出语义变化。

验证记录：

- `npm run typecheck` 通过。
- `npm run test` 通过，16 files / 76 tests。
- `npm run build` 通过，PWA manifest / service worker 正常生成。
- `npm run lint` 通过但保留既有 warnings。
- `git diff --check` 通过。

## 收尾结论

0.2.1 的方向讨论和开发实现已完成，本文档进入归档状态。

后续不再继续扩展 0.2.1 的产品范围。未纳入 0.2.1 的新业务能力进入 0.2.2+ 继续讨论。

0.2.1 后续只保留品牌相关插刀可能带来的文案/资产同步：

1. 品牌命名拍板后可插入“命名同步 / Welcome v2”。
2. 0.2.2 进入代码前，先完成 `docs/completed/0.2.2/adult-behavior-data-model.md`。

未纳入 0.2.1 的新业务能力，进入 0.2.2+ 继续讨论。

## 决策清单

- 核心基调：私密男性健康操作台的应用层定调。“私密”指本地封闭、用户主权、无审查、不羞耻化，不等于低调保守。
- 成人内容：产品默认就是成人自用、露骨、色情、性健康语境，不做成人内容开关、过滤模式或安全模式。
- 范围：0.2.1 严格限定为应用层视觉与交互，不新增记录类型、统计模型、schema、后端、分享或导出语义。
- 使用场景：手机 Chrome 优先，桌面保持可用但不是主设计基准。
- Overlay：抽 `OverlayPrimitive`，公开保留 `Modal` 和 `BottomSheet`；不做移动端自动互换；引入 `variant: default | danger | adult | quiet` 和 `size: sm | md | lg | full`。
- Toast / Confirm：Toast 轻量状态反馈，Confirm 负责风险确认；Toast 支持 `success | error | info | warning`；危险操作按 `low | medium | high | critical` 分级。
- Selection controls：做 `Switch` + `Checkbox`，优先迁移高频和低风险位置；不做完整选择器体系；`Switch` 不需要 `adult` tone。
- DataCard / RecordCard：从色相 tone 改语义 tone；`DataCard` 是纯 UI primitive，`RecordCard` 是记录条目 wrapper；成人/性相关记录用 `adult`，破坏性操作用 `danger`。
- HardnessSelector v2：保留 1-5 存储值；主标签改成成人医学/功能表达，旧隐喻作为副标签；支持 `density` 和 `readOnly`。
- Welcome v2：等品牌命名拍板后做；单屏；直接说成人男性健康、硬度/勃起质量、性爱、自淫/自慰、色情使用和健康因素关联；强调本地、无账号、不上传。
- 图标：保留 `lucide-react` 做通用操作图标；成人/性健康核心语义允许少量本地 SVG React 定制图标。
- 动效：新增 `docs/completed/ui-interaction-system.md`，沉淀图标范围、成人图标边界、组件级动效 cookbook、禁止动效清单和手机 Chrome 验收点。
- 刀序：刀 32 审计；刀 33 Overlay；刀 34 Toast/Confirm；刀 35 Switch/Checkbox；刀 36 DataCard/RecordCard；刀 37 HardnessSelector；刀 38 icons + interaction docs；插刀 A 命名/Welcome；刀 39 收口。

## 背景

0.2.0 是视觉系统骨架：把颜色、字体、圆角、阴影、动效、PWA 资产和长期视觉文档建立为单源。0.2.1 应该在此基础上处理“应用层”问题：通用组件接口、组件级动效语言、首屏构图、切换控件、图标策略，以及可能的品牌命名同步。

0.2.1 不应再回到散落 class 的替换工作，也不应扩大成品牌 VI 完成态。它的目标是让用户实际每天触摸的 UI 变得一致、可维护、可继续扩展。

## 已定核心基调

0.2.1 的核心基调定为：

> 私密男性健康操作台的应用层定调。

这里的“私密”不等于低调、含蓄或内容保守，而是指数据和内容处在用户自己的本地空间里，外界不可见、应用不审查、不羞耻化、不替用户过滤成人内容。产品允许用户记录露骨、淫秽、色情、直白的性行为和色情使用内容；这些内容是男性健康数据的一部分，不需要为了“健康”而被包装成中性或隐晦表达。

同时，0.2.1 的表达方式仍以健康监控和自我管理为主，不把产品做成挑逗式消费内容。也就是说：

- 内容层：开放、直白、成人、自用，不做道德审查。
- 产品层：健康监控、行为记录、趋势分析、自我管理。
- 交互层：操作台，强调快速记录、稳定反馈、清晰复盘。
- 工程层：应用层定调，重点落在 `Modal`、`Toast`、`RecordCard`、`Switch`、`HardnessSelector`、Welcome 等用户每天触摸的界面。

边界说明：

- 不新增后端、社区、分享流、公开传播或云审核机制。
- 不在 0.2.1 新增业务大功能；露骨表达主要影响文案、信息层级、控件命名、Welcome 定位和后续组件语义。
- 不用“私密”作为视觉保守的理由；视觉可以更成人、更直接，但仍要服务记录效率和数据可读性。

## 已定范围边界

0.2.1 严格限定为应用层视觉与交互版本，不加入新业务功能。

允许做：

- 重塑 `Modal`、`Toast`、`RecordCard`、`Switch`、`HardnessSelector` 等共享 UI。
- 调整 Welcome 文案、成人表达、信息层级和首屏构图。
- 改按钮、卡片、开关、危险确认、反馈提示的交互。
- 为组件重构补必要的基础 props、类型、动效 token 使用。
- 修因为 UI 重构暴露出的轻微交互 bug。

不允许做：

- 新增记录类型，例如单独加“色情使用记录”模块。
- 新增统计模型、洞察算法、推荐系统。
- 新增数据库字段、Dexie schema、migration。
- 新增后端、云同步、分享、社区、审核。
- 大改导出格式或历史数据语义。
- 顺手重构 storage、domain、StatsEngine 等业务层。

判断标准：

> 如果一个改动改变了“用户能记录什么、系统能分析什么、数据怎么存”，它就不是 0.2.1。
> 如果一个改动改变的是“用户如何看见、操作、确认、反馈、理解已有功能”，它属于 0.2.1。

新业务功能进入 0.2.2 或 0.3.0 单独讨论。

## 已定使用场景优先级

0.2.1 以移动端为主，当前高频使用场景是手机 Chrome 浏览器。

这会影响后续所有应用层判断：

- 弹层、表单、开关、Toast、卡片、硬度选择器都优先按窄屏、触摸、单手操作设计。
- 桌面端需要保持可用和不难看，但不是 0.2.1 的主要设计基准。
- PWA 安装态要检查，但普通手机 Chrome 浏览器访问同样是核心路径。
- 不能为了桌面布局整齐牺牲移动端记录效率。

## 已定 Overlay 方向

0.2.1 选择：

> 抽底层 `OverlayPrimitive`，公开保留 `Modal` 和 `BottomSheet`。

不把 `Modal` 和 `BottomSheet` 合并成一个公开 `Overlay`。两者继续作为语义组件存在：

- `Modal`：居中编辑、确认、信息展示、设置、导入导出等。
- `BottomSheet`：移动端底部操作、短流程选择、轻量编辑、靠近手指的临时操作。

底层新增 `OverlayPrimitive` 统一公共行为：

- fixed layer / z-index
- backdrop
- ESC 关闭
- 点击背景关闭
- body scroll lock
- safe area
- motion variants
- 基础 aria 属性
- header / body / footer 布局骨架

### Overlay 已定细节

- 移动端不自动把 `Modal` 变成 `BottomSheet`。调用方必须显式选择，避免同一个功能在不同屏幕布局差异过大。
- `closeOnBackdrop` 默认规则：
  - 普通信息、普通编辑弹窗默认 `true`。
  - 危险确认、导入导出、未保存编辑默认 `false`。
- footer 由组件统一负责 padding、border、背景、对齐和安全区域。调用方只传按钮或按钮组，不再自己写外层 footer 容器。
- 引入 `variant`，至少支持：
  - `default`：普通编辑 / 信息。
  - `danger`：删除、清空、覆盖、不可逆操作。
  - `adult`：性行为、自慰、色情使用等成人内容相关弹层。
  - `quiet`：设置、说明、轻量提示。
- 引入 `size`，至少支持 `sm | md | lg | full`。
- 0.2.1 不为 focus trap 引新依赖。先做基础 `aria-modal`、ESC、body scroll lock；focus trap 列为后续增强，除非项目已有可直接复用的依赖。

### Overlay 实施原则

- 第一刀先审计调用点，不直接改爆所有弹窗。
- 第二刀抽 `OverlayPrimitive`，让 `Modal` 和 `BottomSheet` 内部复用。
- 公开 API 小步统一，保留现有 `Modal` 调用的兼容路径。
- `ConfirmModal` 可以进入这套 tone 体系，但不强行和 primitive 同刀完成。
- 所有改动以手机 Chrome 可用性为验收主轴：滚动不穿透、footer 不遮挡、关闭行为可预测、长内容不溢出。

## 已定反馈体系

0.2.1 选择：

> Toast 轻量状态反馈，Confirm 负责风险确认。

Toast 不承载复杂决策，不做 undo，不做 action，不变成消息中心。危险操作统一进入 `ConfirmModal`，并接入 Overlay 的 `danger` / `adult` tone。

### Toast 规则

Toast 类型支持：

- `success`：操作完成，例如保存成功、导出完成、备份完成。
- `error`：操作失败，例如导入失败、保存失败。
- `info`：中性状态，例如记录已取消、正在创建备份。
- `warning`：需要注意但不是失败，例如文件版本较旧、数据将被覆盖、部分内容未导出。

手机 Chrome 主场景下，Toast 默认显示在顶部安全区下方：

- 保持顶部 stack，不根据场景上下切换。
- 避免遮挡底部导航、FAB、输入键盘和 BottomSheet。
- 需要处理 safe area、左右边距、最大宽度和两行以内的长文案。

默认自动消失时长：

- `success`: 2200ms
- `info`: 2600ms
- `warning`: 3600ms
- `error`: 4500ms

所有 Toast 都允许手动关闭。0.2.1 不做永久 Toast、Toast action、undo、通知历史或浏览器系统通知。

Toast 文案允许成人、露骨、直白，但仍保持工具型短句，不做挑逗式文案。例如“自慰记录已保存”“性爱记录已删除”是允许的。

### Confirm 规则

`ConfirmModal` 进入 Overlay 体系，作为风险确认的统一入口。

建议能力：

- `variant="default | danger | adult | quiet"`
- `severity="low | medium | high | critical"`
- `confirmLabel`
- `cancelLabel`
- `requireText`，用于 critical 操作
- 按 severity 决定 `closeOnBackdrop` 默认值

危险操作分级：

- `low`：删除单条普通记录、取消进行中记录。
- `medium`：删除性行为/自慰记录、删除伴侣资料、移除标签。
- `high`：导入覆盖、备份回滚、批量修复、删除快照。
- `critical`：清空全部数据、破坏性导入、重置应用。

默认策略：

- `low`：普通确认，backdrop 可关。
- `medium`：`danger` 或 `adult` tone，明确对象，backdrop 默认 false。
- `high`：`danger` tone，说明影响，backdrop false。
- `critical`：`danger` tone，要求输入确认文本，backdrop false。

成人 tone 使用规则：

- 成人内容编辑、选择、信息展示用 `adult`。
- 删除、清空、覆盖等破坏性操作优先 `danger`，即使对象是成人内容。
- “成人内容 + 破坏操作”用 `danger`，文案里直说对象。

按钮顺序：

- 手机端取消在左，确认在右。
- 破坏性确认按钮在右，使用危险态。
- 主操作只保留一个，不并列多个主按钮。
- critical 操作确认按钮必须使用明确动词，例如“清空全部数据”，不使用泛泛的“确定”。

## 已定 Selection Controls 边界

成人内容不需要单独开关。

原因：

- 本产品是本地个人使用工具，不存在公开传播、社区审核或他人可见的内容流。
- 软件几乎所有核心内容都与成人、露骨、色情、性健康相关；这不是一个可选模式，而是产品默认语境。
- 性行为、自慰、色情使用相关内容是产品核心数据的一部分，不是需要额外解锁、过滤或隐藏的附属模式。
- 0.2.1 不做“成人内容启用/禁用”“露骨内容过滤”“安全模式”这类总开关。
- 控件不承担成人/非成人切换职责；成人内容的处理应体现在文案直白、整体产品语境、隐私模式和本地数据边界上，而不是通过开关把它包装成可疑或默认不可见内容。

## 已定 Selection Controls 方向

0.2.1 选择：

> 做 `Switch` + `Checkbox`，但只优先迁移高频和低风险位置，不做完整选择器体系。

0.2.1 建立最小布尔控件体系：

- `Switch`：用于即时状态切换、字段启用/隐藏、用户理解为“打开/关闭”的状态。
- `Checkbox`：用于多选、确认、导出选项、表单属性勾选。

不在 0.2.1 建完整 `SegmentedControl` / `RadioGroup` / `PillSelector` / `IconToggleGroup` / `FaceSelector` 体系。这些进入后续 FormControls v2 或具体页面重构。

### Switch 规则

适合使用 `Switch`：

- 一开一关的即时状态。
- 打开后出现或隐藏一组字段。
- 用户把它理解成“启用某个状态”。
- 设置里的隐私模式、自动备份、PWA 相关开关。
- 高频记录里“是否有梦”“是否梦遗”等已有布尔状态。

不适合使用 `Switch`：

- 多选列表中的一项。
- 导出选项里勾选多个数据类型。
- 勾选确认后果。
- 批量选择。
- 多个并列属性勾选。

`Switch` 暂不需要 `adult` tone。成人、露骨、色情是产品默认语境，不是开关的状态；成人表达由页面、弹层、卡片、文案和整体 tone 承担。

建议组件形态：

```ts
type SwitchTone = 'default' | 'danger' | 'quiet';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: SwitchTone;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}
```

带标签形态：

```ts
interface SwitchFieldProps extends SwitchProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  statusText?: React.ReactNode;
}
```

手机端规则：

- 可点击区域最小 44px 高。
- `SwitchField` 整行可点，不只点小开关。
- label 不超过两行，description 用较小字号。
- 状态文字如“已开/已关”可选，不强制。
- disabled 必须明显，但仍可读。
- 动画不能导致表单布局跳动。

### Checkbox 规则

适合使用 `Checkbox`：

- 多选。
- 表单属性勾选。
- 导出内容选择。
- “我确认知道后果”这类确认。
- 多个并列布尔属性。

`Checkbox` 不代表内容过滤，也不代表成人内容启用，只是普通表单控件。

### 迁移优先级

第一批：

- 所有 `.toggle-checkbox` 调用点。
- `features/daily-log/LogForm.tsx`
- `features/daily-log/SleepSection.tsx`
- `features/daily-log/NapRecordModal.tsx`
- `features/sex-life/MasturbationRecordModal.tsx`

第二批：

- `features/daily-log/MorningSection.tsx`
- `features/backup/BackupSettings.tsx`
- `features/profile/MyView.tsx`
- `features/profile/ExportOptionsModal.tsx`

暂缓：

- `features/sex-life/PartnerEditForm.tsx`
- `features/sex-life/SexRecordModal.tsx` 中细碎 checkbox
- 伴侣资料类复杂表单

暂缓项等 FormControls v2 或对应页面重构时再处理，避免 0.2.1 范围失控。

## 已定 DataCard / RecordCard 方向

0.2.1 选择：

> 从色相命名改成语义命名，并采用 `DataCard` / `RecordCard` 的收敛版方案 C。

方向：

- `DataCard` 升级为通用 data card，是纯 UI primitive，负责布局、tone、density、actions。
- `RecordCard` 作为记录条目 wrapper，负责把记录类型映射到 `DataCard` tone。
- 0.2.1 不做全项目卡片统一，优先覆盖日记编辑和 Dashboard 历史记录。
- 成人/性相关记录使用 `adult` tone，文案允许直白，不用“亲密”“私密行为”等委婉包装。
- 删除、清空、覆盖等破坏性操作仍然使用 `danger`，即使对象是成人内容。

### Tone 规则

`RecordCardTone` 不再使用 `blue | pink | amber | emerald | violet | slate` 这种色相命名，改为语义命名。

建议 `DataCardTone`：

```ts
type DataCardTone =
  | 'default'
  | 'health'
  | 'adult'
  | 'recovery'
  | 'stimulant'
  | 'activity'
  | 'warning'
  | 'danger'
  | 'quiet';
```

含义：

- `default`：普通数据。
- `health`：晨勃、硬度、身体状态、健康指标。
- `adult`：性爱、自慰、色情内容、性偏好。
- `recovery`：睡眠、午休、恢复。
- `stimulant`：酒精、咖啡因、饮品。
- `activity`：运动、体力活动。
- `warning`：需要注意但不是危险。
- `danger`：删除、错误、破坏性状态。
- `quiet`：低强调、设置、辅助信息。

建议 `RecordKind`：

```ts
type RecordKind =
  | 'morning'
  | 'sex'
  | 'masturbation'
  | 'sleep'
  | 'nap'
  | 'exercise'
  | 'alcohol'
  | 'caffeine'
  | 'mood'
  | 'health'
  | 'note';
```

映射：

- `morning` → `health`
- `sex` → `adult`
- `masturbation` → `adult`
- `sleep` / `nap` → `recovery`
- `exercise` → `activity`
- `alcohol` / `caffeine` → `stimulant`
- `mood` / `health` → `health`
- `note` → `default`

### Slot 规则

建议底层 `DataCard` 支持：

```tsx
<DataCard
  tone="adult"
  density="comfortable"
  leading={...}
  title={...}
  meta={...}
  description={...}
  badges={...}
  actions={...}
/>
```

建议 `RecordCard` 支持：

```tsx
<RecordCard
  kind="sex"
  icon={...}
  title="性爱记录"
  meta="23:40"
  description="伴侣 · 45 分钟 · 射精"
  badges={...}
  actions={...}
/>
```

slot 定义：

- `leading` / `icon`：图标或小型状态标识。
- `title`：主信息，必须有。
- `meta`：时间、数值、短标签。
- `description`：第二行说明，可选。
- `badges`：状态标签，可选。
- `actions`：编辑、删除、更多，可选。
- 默认不支持复杂 `footer`，避免卡片膨胀；需要复杂内容时不叫 `RecordCard`。

### Actions 规则

- 编辑按钮使用铅笔图标。
- 删除按钮使用垃圾桶图标。
- 更多按钮使用 ellipsis。
- 图标按钮最小触控区 36px，推荐 40px。
- 手机端 actions 默认常显，不依赖 hover。
- 桌面端可以 hover 强化，但不能只有 hover 才能操作。
- 删除按钮使用 `danger` hover / press。
- 每个按钮必须有 `aria-label`。
- 单张卡片不并列超过 3 个 action。

### Density 规则

引入：

```ts
density?: 'compact' | 'comfortable';
```

- `compact`：历史列表、Dashboard timeline。
- `comfortable`：日记编辑、表单内记录块。

0.2.1 不引入 `spacious`，避免卡片过大。

### 迁移范围

第一批：

- `features/daily-log/LogForm.tsx` 现有 `RecordCard`
- `features/dashboard/LogHistory.tsx`
- `features/dashboard/Dashboard.tsx` 中记录列表 / 历史卡片相关位置

第二批：

- `features/sex-life/SexLifeView.tsx` 中性活动条目
- `features/sex-life/PartnerDetail.tsx` 中记录摘要
- `features/backup/VersionHistoryModal.tsx` 中数据列表，如果适合可用 `DataCard`，但不强制

暂缓：

- Stats 中的分析卡片
- Dashboard 的趋势 / 洞察面板
- Settings / Profile 的设置卡片

这些更像 `Panel` / `InfoCard`，不一定属于 `RecordCard`。

### 架构边界

- `DataCard` 放在 `shared/ui`，不绑定具体 `LogEntry`。
- `RecordCard` 可以放在 `shared/ui`，但不得引入 storage、Dexie、feature 内部模块或复杂业务类型。
- 如果未来 `RecordCard` 需要读取 `LogEntry` 字段或做业务派生，应把 adapter 放到对应 feature/model，不放进 `shared/ui`。
- 0.2.1 不让 `shared/ui` 依赖 storage、domain 复杂类型或 feature 内部。

### 不做

0.2.1 不做：

- 全部卡片统一。
- Stats / Insight / Backup / Settings 卡片全量迁移。
- 复杂展开卡片。
- 卡片内嵌表单。
- 拖拽排序。
- swipe actions。
- hover-only actions。

## 已定 HardnessSelector v2 方向

`HardnessSelector` 是成人男性健康核心控件。0.2.1 允许更露骨、更成人化的文案，但表达方式仍是健康记录和功能评估，不做挑逗式情色文案。

### 业务语义

- 必须保留当前 1-5 等级业务语义和存储值。
- 不改历史数据，不改导出数据语义，不触发 schema 或 migration。
- 0.2.1 只改变呈现、文案、交互和可复用接口。

### 文案方向

主标签改成直白的成人医学 / 功能表达，旧的隐喻体系保留为副标签。

方向：

- 主表达可以使用“阴茎硬度”“勃起质量”“插入硬度”“疲软”“半勃起”“可插入”“完全勃起”等直白词。
- 可以明确出现“自慰”“性交”“射精”等成人健康记录词。
- 旧标签如“豆腐 / 剥皮 / 带皮 / 冻瓜 / 铁棒”不再作为主标签，可作为辅助记忆副标签或 tooltip / 小字保留。
- 不使用挑逗句、调情句、拟人化情色句。

建议等级表达草案：

- 1：疲软 / 豆腐
- 2：轻度勃起 / 剥皮
- 3：半勃起，勉强插入 / 带皮
- 4：充分勃起，可稳定插入 / 冻瓜
- 5：完全勃起，高硬度 / 铁棒

具体文案可在实现前再按界面空间微调，但方向不再回避成人和性功能表达。

### 视觉方向

- 保留“硬度增长”的视觉方向。
- 从当前偏卡通的柱状硬度隐喻，重做成更稳的分段 / 刻度 / 进阶选择控件。
- 视觉可以结合 `health` + `adult` 的产品语境，但不需要通过 tone 开关成人模式。
- 选中态、未选中态、hover / press、disabled / readOnly 要明确。
- 动画服务选择反馈，不制造布局跳动。

### API 方向

支持 `density`：

```ts
density?: 'compact' | 'comfortable';
```

- `comfortable`：完整编辑场景，显示等级、主标签、副标签和较长说明。
- `compact`：快速记录场景，只显示等级和短标签，不显示长句，避免手机上挤。

支持只读：

```ts
readOnly?: boolean;
```

- 用于 Dashboard、历史记录和复盘视图。
- 只读状态只展示结果，不允许误触修改。

建议接口方向：

```ts
interface HardnessSelectorProps {
  value: number;
  onChange?: (value: number) => void;
  density?: 'compact' | 'comfortable';
  readOnly?: boolean;
  showDescription?: boolean;
}
```

`showDescription` 默认按 density 决定：

- `comfortable` 默认 `true`。
- `compact` 默认 `false`。

### 使用规则

- 完整编辑：使用 `comfortable`，显示较完整说明。
- 快速记录：使用 `compact`，不显示长描述。
- Dashboard / 历史复盘：使用 `readOnly`。
- 不新增成人模式开关；`HardnessSelector` 默认就是成人健康核心控件。

### 不做

0.2.1 不做：

- 修改 1-5 存储值。
- 增加 0、6 或小数等级。
- 增加新的硬度数据模型。
- 把旧历史数据重新解释为新等级。
- 做挑逗式文案或娱乐化情色动效。

## 已定 Welcome v2 方向

Welcome v2 需要等品牌命名拍板后再做。

原因：

- Welcome 是新用户第一眼看到的产品定位页，产品名、slogan、PWA 展示名和首屏文案强相关。
- 如果命名未定就重做 Welcome，后续很容易二次返工。
- 0.2.1 可以先推进组件和交互系统；Welcome v2 放在命名同步之后或同一刀内完成。

### 信息表达

Welcome v2 直接说产品内容，不做过度含蓄包装。

需要明确表达：

- 成人男性健康。
- 阴茎硬度 / 勃起质量。
- 性行为记录。
- 自慰记录。
- 色情使用相关记录或复盘。
- 睡眠、酒精、运动、压力等健康因素与性功能状态的关联。

不需要单独做“成人自用”提示。整个产品默认就是本地个人成人健康工具，不需要像内容平台一样加成人入口或免责声明。

### 结构

Welcome v2 保持单屏，不做 2-3 步 onboarding。

原因：

- 当前产品是本地工具，不需要教育复杂账号/权限流程。
- 手机 Chrome 是主场景，首次进入应尽快开始使用。
- 0.2.1 不新增业务功能，Welcome 的职责是定位和建立信任，不是做完整引导。

单屏必须强调：

- 本地存储。
- 无账号。
- 不上传。
- 用户自己掌控数据。

### 功能展示

Welcome v2 展示核心模块，但保持首屏密度可控。

建议展示：

- 硬度 / 勃起质量。
- 自慰。
- 性爱。
- 色情使用。
- 睡眠 / 酒精 / 运动等影响因素。
- 趋势和复盘。

这些模块可以用短标签、图标、数据芯片或小型预览表达，不需要长段说明。

### 视觉方向

Welcome v2 走更强品牌 / 成人视觉，而不是通用健康工具介绍页。

方向：

- 可以更直接、更成人、更有产品个性。
- 视觉要承接 0.2.0 的深色基底和青绿点缀，但不局限于低调。
- 首屏要有品牌记忆点，而不是普通图标 + 三个说明卡片。
- 仍然保持数据工具的清晰度，不做营销站式长页。

### 命名未定时的处理

如果 0.2.1 组件系统已经完成，但品牌命名仍未拍板：

- Welcome v2 可以先使用占位产品名和占位 slogan。
- 占位文案必须集中，方便命名拍板后一刀替换。
- 不在全应用铺开大量临时品牌词。
- 不因为命名未定而阻塞 Overlay、Toast、Switch、DataCard、HardnessSelector 等组件工作。

## 已定图标与动效方向

0.2.1 保留 `lucide-react` 作为通用操作图标库，不做整库替换。

`lucide-react` 继续用于：

- 关闭、返回、更多。
- 编辑、删除、保存。
- 下载、上传、导入、导出。
- 设置、搜索、日历、图表。
- 警告、信息、成功、失败。
- 其他通用工具动作。

原因：

- 现有项目已使用它，迁移成本低。
- 通用操作图标足够稳定。
- 0.2.1 的问题不是通用图标库不够好，而是成人男性健康核心语义需要更强识别。

### 定制图标

成人 / 性健康核心模块允许定制少量本地 SVG React 图标。

优先覆盖：

- 硬度 / 勃起质量。
- 性爱。
- 自淫 / 自慰。
- 色情使用。
- 射精。
- 伴侣。
- 睡眠影响、酒精 / 咖啡因影响、趋势复盘如有必要可后置。

规则：

- 使用本地 SVG React 组件。
- 建议放在 `shared/ui/icons/` 或同等 shared UI 图标目录。
- 不使用远程图片。
- 不引入新图标库。
- 不用 emoji 作为正式图标。
- 风格要和 0.2.0 视觉系统协调：深色基底、青绿点缀、线性或半填充，不混用多套风格。
- 图标可以更成人、更直白，但不做写实色情插画，不做表情包化素材。
- 图标服务快速识别，不抢正文；露骨程度主要由文案承担。

### 动效 cookbook

0.2.1 建立组件级动效 cookbook，不只是套用 duration token。

需要覆盖：

- Overlay / Modal / BottomSheet。
- Toast。
- Switch。
- Checkbox。
- DataCard / RecordCard。
- HardnessSelector。
- Button press。
- Danger confirm。

必须有动效的地方：

- 弹层进入 / 退出，让层级变化清楚。
- BottomSheet 上滑 / 下滑，符合手机手势预期。
- Toast 进入 / 退出，短反馈不突兀。
- Switch 切换，状态变化明确。
- Checkbox 勾选，轻量反馈。
- HardnessSelector 选择，当前等级有确认感。
- DataCard 按压，手机端点按有反馈。
- 危险确认可以更稳、更慢一点，强调不可逆。

克制或禁止动效的地方：

- 长列表滚动项不要逐个飞入。
- 表单输入时不要布局动画。
- 统计图不要每次切 tab 大幅重绘动画。
- 隐私模式切换不要做夸张动画。
- 数据导入 / 导出不要用花哨动效掩盖状态。
- 卡片 hover 不作为手机端主要反馈。
- 不做持续闪烁、呼吸光、大面积背景动效。
- 不做情色挑逗型动效。

建议动效规则：

- 按压反馈：`scale(0.98)` 或轻微背景变化，不猛缩。
- 普通进入：150-200ms。
- BottomSheet：200-300ms。
- 危险确认：250-300ms。
- Toast：进场 180-220ms，退场 150-180ms。
- HardnessSelector：选中反馈 200-300ms，但不能导致布局跳。
- easing 使用 0.2.0 token，不散写 cubic-bezier。

### 文档输出

0.2.1 新增：

- `docs/completed/ui-interaction-system.md`

内容包括：

- 图标使用规则。
- `lucide-react` 使用范围。
- 定制图标范围和目录。
- 成人图标边界。
- 动效 token 使用。
- 各组件动效规则。
- 禁止动效清单。
- 手机 Chrome 验收点。

不把这部分塞进 `docs/completed/visual-system.md`。`visual-system.md` 管视觉 token 和语义用途，`ui-interaction-system.md` 管交互、图标、动效。

## 0.2.1 的产品目标

- 让共享组件具备稳定 API，后续 feature 不再各自手写弹窗、卡片、开关和动作区。
- 让动效从“局部好看”变成“可预测”：进入、退出、按压、选择、危险确认等行为有统一节奏。
- 让 Welcome 首屏符合产品定位：成人自用、男性健康、私密本地数据、健康与性行为/色情使用记录联动，而不是通用健康工具介绍。
- 让高频表单控件更适合移动端反复记录，减少视觉噪声和文本挤压。
- 为品牌命名、PWA 展示名、图标资产留出清晰插刀点。

## 非目标

- 不改数据库 schema。
- 不改导出 JSON 字段名。
- 不重做统计模型、洞察算法、标签系统或备份逻辑。
- 不引入后端、账号、云同步。
- 不把全部页面重设计成完成态品牌 VI。
- 不同时推进大规模架构迁移和产品功能新增。

## 当前继承范围

来自 `docs/completed/plan-0.2.0.md` 的推迟项：

- 通用组件接口重塑：`Modal`、`Toast`、`RecordCard`、`HardnessSelector` 等。
- 组件级动效语言：spring、scale、进退场设计。
- `toggle-checkbox` 抽成 React 组件。
- Welcome 屏构图重设。
- 图标库评估与可能切换。
- 命名同步刀：如果 0.2.0 末未完成，则落在 0.2.1 头或作为平行插刀。

## 初步现状观察

### 共享组件

- `shared/ui/Modal.tsx` 和 `shared/ui/BottomSheet.tsx` 结构相近，但接口未统一。两者都自行处理 ESC、body scroll lock、backdrop、header、footer 和 motion variants。
- `shared/ui/Toast.tsx` 已有 stack，但 toast 样式、duration、progress 和语义强度还比较固定。
- `shared/ui/RecordCard.tsx` 当前是 slot API 雏形，但 tone 仍是 `blue/pink/amber/emerald/violet/slate` 这种色相命名，不是语义命名。
- `shared/ui/HardnessSelector.tsx` 仍带有强表现形态和硬编码等级文案，作为领域控件合理，但后续需要更稳定的 size / density / label 策略。
- `shared/ui/FormControls.tsx` 存在 `any` 参数和强业务感常量，后续可拆出更类型安全的基础控件。

### 页面接入

- `Modal` 使用范围较广，改接口风险最高，需要兼容层或分刀迁移。
- `toggle-checkbox` 目前在 `LogForm`、`SleepSection`、`NapRecordModal`、`MasturbationRecordModal` 等高频记录流程里出现，抽组件后应优先覆盖这些位置。
- `HardnessSelector` 出现在晨间记录和午休相关记录，属于高频核心体验，视觉和文案调整需要谨慎。
- Welcome 是低耦合文件，适合作为独立刀，但其文案和品牌命名高度相关。

## 建议拆法

0.2.1 按“审计 → 共享组件 contract → 高频记录接入 → 领域核心控件 → 图标/动效文档 → 品牌/Welcome 插刀 → 收口”的顺序推进，而不是按页面全量重刷。

刀序原则：

- 先做审计，避免直接改爆高频界面。
- 先抽底层交互基础，再迁移调用点。
- 手机 Chrome golden path 优先于桌面完整漂亮。
- 命名同步 / Welcome v2 等品牌拍板后插入，不阻塞组件主线。
- 0.2.1 最终定稿必须等 0.2.0 完成后，根据实际代码状态校准。

### 刀 32 — 0.2.1 接口审计

形态：产文档，不改代码。

输出：

- `docs/completed/ui-component-audit-0.2.1.md`
- 列出 `Modal`、`BottomSheet`、`Toast`、`RecordCard`、`HardnessSelector`、`FormControls`、`toggle-checkbox` 的所有调用点。
- 标记每个调用点需要的能力：标题、描述、关闭策略、footer 对齐、危险动作、滚动区域、移动端高度、是否需要 bottom sheet。
- 给出 v1 API 草案和迁移顺序。

不做：

- 不直接改组件。
- 不顺手修页面样式。

### 刀 33 — Overlay contract

范围：

- 统一 `Modal` / `BottomSheet` 的公共行为：ESC、backdrop click、body scroll lock、header/footer、danger footer、motion variants。
- 抽底层 `OverlayPrimitive`，公开保留 `Modal` 和 `BottomSheet`。
- 设计一个小而稳定的 overlay API，例如 `size`、`variant`、`description`、`footerAlign`、`closeOnBackdrop`。
- 保留老 `Modal` 用法，必要时通过兼容 props 过渡，避免一次性改爆全项目。

验收重点：

- 现有所有弹窗仍可打开、滚动、关闭。
- 移动端高度不溢出，footer 不遮挡内容。
- 危险确认弹窗和普通编辑弹窗视觉层级清楚。

### 刀 34 — Toast / Confirm feedback contract

范围：

- 重塑 `Toast` 的语义：`success`、`error`、`info`、`warning`。
- 统一 toast 的进入/退出、进度条、可关闭按钮、移动端安全区域。
- 明确短消息长度策略，避免 toast 在窄屏挤爆。
- 将 `ConfirmModal` 接入 Overlay tone 和风险分级。
- 高风险操作默认禁止 backdrop 关闭。

### 刀 35 — Selection controls

范围：

- 新增 `Switch` 和 `Checkbox`。
- 抽 `Switch` 组件替代 `toggle-checkbox` class。
- 梳理 checkbox / switch 的语义边界：即时开关用 `Switch`，多选项用原生 checkbox 或未来 `Checkbox`。
- 高频记录流程优先接入：`LogForm`、`SleepSection`、`NapRecordModal`、`MasturbationRecordModal`。
- 修掉 `FormControls` 中最明显的类型问题，避免继续扩散 `any`。

不做：

- 不把所有 checkbox 一次性改完。伴侣资料、导出选项、备份设置可以按风险决定是否顺手迁移。

### 刀 36 — RecordCard / data card contract

范围：

- 建立 `DataCard` / `RecordCard` 边界。
- 把 `RecordCardTone` 从色相命名转为语义命名。
- 明确卡片 slot：leading icon、title、meta、description、badges、actions。
- 统一 edit/delete/icon button 的尺寸、hover、disabled 和 aria-label。
- 优先覆盖日记编辑和 Dashboard history 中重复记录卡片。

风险：

- 卡片会影响多页面视觉密度。不要同时做数据结构调整。

### 刀 37 — HardnessSelector v2

范围：

- 保留 1-5 等级业务语义，不改存储值。
- 主标签替换为直白成人医学 / 功能表达，旧隐喻降级为副标签。
- 重做为更稳的分段 / 刻度视觉。
- 重新设计选中、未选中、hover/press、说明文案和小屏布局。
- 支持必要的 props：`density`、是否显示长描述、是否只读。
- 文案要同时服务“快速记录”和“完整编辑”，避免在紧凑位置显示过长句子。

风险：

- 这是核心领域控件，变化需要实机验证。不能为了视觉改掉用户对等级的理解。

### 刀 38 — Custom icons + interaction cookbook

范围：

- 保留 `lucide-react` 作为通用操作图标库。
- 第一批定制成人 / 性健康核心 SVG React 图标。
- 新增 `docs/completed/ui-interaction-system.md`。
- 沉淀图标范围、成人图标边界、组件级动效 cookbook、禁止动效清单、手机 Chrome 验收点。

不做：

- 不整库替换图标库。
- 不做写实色情插画。
- 不做所有模块图标一次性定制。

### 插刀 A — 命名同步 / Welcome v2

时机：

- 品牌命名拍板后插入。
- 如果 0.2.1 组件主线已接近完成但命名仍未定，可用集中占位先做 Welcome v2，后续一刀替换。

范围：

- 重设首屏构图和文案。
- 单屏，直接说成人男性健康、硬度 / 勃起质量、性爱、自淫 / 自慰、色情使用和健康因素关联。
- 强调本地存储、无账号、不上传。
- 如果品牌命名已拍板，同步产品名、slogan、PWA title、README 展示名。
- 如果未拍板，使用集中占位，不在全应用铺开临时品牌词。

不做：

- 不做营销站式 landing page。
- 不引入网络图片依赖。
- 不把 Welcome 做成品牌 VI 完成态。

### 刀 39 — 0.2.1 收口

范围：

- 全应用 golden path。
- dark/light、隐私模式、移动端、PWA 安装态检查。
- 更新 CHANGELOG、版本号、tag 前检查清单。

验收标准：

- `npm run build`
- `npm run test`
- `npm run typecheck`
- 手机 Chrome golden path：
  - 首次进入 / Welcome。
  - 完整日记编辑。
  - 快速记录。
  - 性爱 / 自淫 / 自慰相关编辑。
  - Dashboard 历史记录。
  - 设置 / 备份 / 导入导出。
  - 弹层滚动、footer、安全区域、关闭行为。
  - Toast 顶部安全区显示。
  - dark/light 和隐私模式。

## 命名同步插刀

命名同步不强绑 0.2.1，但建议在 Welcome v2 前拍板，否则会发生两次文案和 manifest 改动。

若命名已定，插刀范围：

- `app` title / Welcome 文案。
- PWA manifest name / short_name。
- 应用图标和截图中的展示名。
- README 用户可见名称。
- CHANGELOG 版本说明。

若命名未定：

- 0.2.1 仍可推进组件和交互。
- Welcome v2 文案应保持轻品牌化，避免之后大面积返工。

## 待拍板问题

1. 0.2.1 是否严格限定为应用层视觉与交互，不加入新业务功能？
2. `Modal` 与 `BottomSheet` 是保留两个组件、共享底层 primitive，还是合成一个 `Overlay` 组件？
3. `RecordCardTone` 是否从色相命名改成语义命名？如果改，第一批语义名怎么定？
4. `HardnessSelector` 的文案是否继续使用当前隐喻体系，还是转为更医学/数据化表达？
5. 命名是否必须在 Welcome v2 前完成？
6. `Switch` 是否只覆盖现有 `toggle-checkbox`，还是同步建立 `Checkbox` / `SegmentedControl` 等表单 primitive？

## 验收基线

- `npm run build`
- `npm run test`
- `npm run typecheck`
- 移动端窄屏检查：Welcome、完整日记、快速记录、弹窗、toast、设置页。
- dark/light 检查：所有新组件必须在两种模式可读。
- 隐私模式检查：blur + saturate + opacity 后，主要布局不能错位。
- PWA 检查：安装提示、更新提示、manifest 展示名不回退。

## 研究结论（当前暂定）

- 0.2.1 应先做 shared/ui contract，再做页面接入。
- 最高风险是 `Modal`，应先审计再兼容迁移。
- `Switch` 是低风险高收益，可以早做。
- Welcome v2 最好等命名结论；如果命名迟迟未定，也可以轻品牌化先落。
- 图标库默认保留 `lucide-react`，把精力放在图标使用规则，而不是库切换。
