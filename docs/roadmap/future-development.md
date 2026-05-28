# 后续开发方向

> 本文档用于沉淀 0.2.0 之后或当前开发窗口之外的产品方向、功能内容、技术债和待决策事项。
> 另一个窗口进行实现时，本窗口只讨论和整理后续内容，避免和正在开发的代码改动冲突。

## 使用约定

- 已定稿、可直接开发的内容，整理到对应版本计划或本文的“已定方向”。
- 尚未拍板的想法，先放在“候选方向”或“待决策问题”。
- 涉及数据库 schema、迁移、隐私、安全、PWA 行为的事项，需要显式标注风险。
- 不在本文直接记录实现细节到文件级别，除非该信息会影响后续拆刀或验收。

## 当前基线

- 项目定位：隐私优先、本地优先的男性健康与性健康数据 PWA。
- 架构基线：遵循 `docs/architecture.md` 的分层边界。
- 近期主线：0.2.2 代码实现已完成，当前 Claude 开发线是 0.2.3 洞察与复盘增强。
- 生理日规则：03:00 前事件归属前一天，后续功能必须保持一致。
- 存储约束：无后端；IndexedDB schema 改动必须配套 migration。

## 已定方向

### 0.2.1 已完成

- 文档：[`docs/completed/plan-0.2.1.md`](../completed/plan-0.2.1.md)
- 当前状态：开发完成并归档，剩余只保留品牌命名插刀可能带来的文案/资产同步。
- 已完成方向：应用层视觉与交互，包括 overlay、反馈、布尔控件、DataCard / RecordCard、HardnessSelector、图标与动效规则。

### 0.2.2 实现完成

- 文档：[`docs/planned/plan-0.2.2.md`](../planned/plan-0.2.2.md)
- 专题索引：[`docs/planned/0.2.2/README.md`](../planned/0.2.2/README.md)
- 当前状态：代码实现完成，待发布 / 归档。
- 主方向：把成人行为和色情使用记录补成可复盘的健康数据闭环。
- 候选支线：洞察与复盘增强、数据安全/备份/恢复约束、品牌命名与产品身份落地。
- 2026-05-28：0.2.2 刀 41 - 刀 49 代码实现完成；后续不再扩 0.2.2 范围，发布后按 docs 维护规则迁移到 `completed/`。

### 0.2.3 当前开发线

- 文档：[`docs/planned/plan-0.2.3.md`](../planned/plan-0.2.3.md)
- 专题索引：[`docs/planned/0.2.3/README.md`](../planned/0.2.3/README.md)
- 当前状态：当前开发线 / Claude 正在实现。
- 主方向：洞察与复盘增强。
- 暂定基调：让成人行为、色情使用和健康状态形成可解释的复盘系统。
- 2026-05-28：为避免单个计划文档过长，0.2.3 已拆分为短入口和多个专题文档。
- 2026-05-28：0.2.3 开始执行层规划，已定先事实时间线和窗口聚合，再弱相关洞察；入口嵌入现有统计 / 洞察区域，不新增顶级导航；不新增 schema / migration；开发刀序为刀 50 - 刀 58。
- 2026-05-28：新增 `docs/planned/0.2.3/review-input-and-timeline.md`，定下刀 51 - 刀 52 的 `AdultBehaviorReviewInput`、时间窗口、事实 timeline、窗口聚合和 missing data 契约。
- 2026-05-28：新增 `docs/planned/0.2.3/report-markdown-template.md`，定下周报 / 月报 Markdown 的文件名、导出前敏感数据提示、章节结构、默认不包含 notes / 平台名 / 内容本体的边界。
- 2026-05-28：新增 `docs/planned/0.2.3/review-home-information-architecture.md` 和 `docs/planned/0.2.3/weak-correlation-insights.md`，定下复盘首屏信息层级、移动端优先级、第一批弱相关观察指标组合和样本量门槛。
- 2026-05-28：新增 `docs/planned/0.2.3/knife-50-code-orientation.md`，定下 0.2.3 实现前的代码入口校准清单，覆盖 StatsEngine、UI 入口、数据读取、时间窗口和导出入口。
- 2026-05-28：完成 0.2.3 全文一致性审计，修正 roadmap 中“轻量养成 v0”仍挂在 0.2.3 的范围冲突；完整训练建议和轻目标系统归 0.2.4。
- 2026-05-28：补齐 0.2.3 刀 51 - 刀 58 逐刀执行拆解文档，覆盖 review input adapter、timeline/window facts、confidence gating、weak insights、review home UI、reports/Markdown、安全文案审计和版本收口。
- 2026-05-28：补充 0.2.3 实现交接摘要，作为实现窗口的一页交接单；真实代码入口、最终文件名和具体 UI 组件拆分仍留给刀 50 根据当前代码确认。
- 2026-05-28：0.2.2 实现完成后，0.2.3 进入 Claude 开发窗口；规划窗口只维护文档状态和后续范围，不直接修改产品代码。

### 0.2.4 执行草案

- 文档：[`docs/planned/plan-0.2.4.md`](../planned/plan-0.2.4.md)
- 专题索引：[`docs/planned/0.2.4/README.md`](../planned/0.2.4/README.md)
- 当前状态：执行草案 / 待实现。
- 主方向：养成系与关系/表现训练。
- 暂定基调：从复盘走向养成，让性健康、做爱表现、恢复和关系质量形成可持续改进路径。
- 2026-05-28：为避免单个计划文档过长，0.2.4 已拆分为短入口和范围/模型、性表现/关系、建议/轻目标、Safety Rails、刀序验收、入口/UI、候选归档 7 个专题文档。
- 2026-05-28：完成 0.2.4 文档一致性审计，当时确认 0.2.4 已形成研究草案；随后继续推进刀 1 数据模型最终审计。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-1-data-model-final-audit.md`，把刀 1 拆成 schema / migration 前的字段、状态转换、导入导出、snapshot integrity、runtime allowlist 和 Safety Rails 绕过点审计清单。
- 2026-05-28：完成 0.2.4 刀 1 模型定稿决策，0.2.4 推进为执行草案 / 待实现；未知或禁用 category、非法周期跳过目标并产生 warning，orphan check-in 保留并产生 warning，pause / complete 同步目标状态，adjust 不自动创建新目标。后续若进入 0.2.4 实现，从刀 2 schema / migration / import-export 开始。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-2-schema-migration-import-export.md`，定下刀 2 持久化闭环：`training_goals` / `goal_checkins` store、空表 migration、JSON `trainingGoals` / `goalCheckins`、import normalize warning、snapshot integrity 和验证样本。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-3-rule-based-suggestions.md`，定下刀 3 本地规则建议边界：不叫 AI、不持久化 `TrainingSuggestion`、不自动创建目标；输出 1 - 3 条建议和候选轻目标，并通过 Safety Rails 过滤。
- 2026-05-28：补齐 0.2.4 刀 4 - 刀 7 执行文档和实现交接摘要，覆盖轻目标创建/check-in、训练视图、关系上下文、Safety Rails 审计、实现数据流、文件候选和停下来重谈条件。0.2.4 规划可作为后续实现草案，真正实现前仍需核对当前代码状态和 0.2.3 复盘入口实际形态。

### 0.2.5 执行草案

- 文档：[`docs/planned/plan-0.2.5.md`](../planned/plan-0.2.5.md)
- 专题索引：[`docs/planned/0.2.5/README.md`](../planned/0.2.5/README.md)
- 当前状态：执行草案 / 待实现。
- 主方向：训练中心与长期目标历史。
- 基调：把轻目标变成可回看的长期自我管理系统，但不做训练游戏、课程平台或 AI 教练。
- 2026-05-28：新增 0.2.5 短入口和专题文档，范围包括 Training Center 条件、目标历史、跨周期反馈、默认不新增 schema、入口导航、Safety / Privacy Rails、候选刀序和归档候选能力。
- 2026-05-28：完成 0.2.5 第一轮一致性审计，确认默认不新增 schema；Training Center 先作为复盘 / 统计区域内的二级工作台或 tab，不新增顶级导航；长期反馈只做事实、稳定性和缺口提示，不做评分、排名、打卡压力或诊断。
- 2026-05-28：补齐 0.2.5 刀 1 - 刀 5 执行文档和实现交接摘要，覆盖代码状态与数据校准、目标历史工作台、跨周期进度反馈、入口 UI / Dashboard、Safety / Privacy 审计。0.2.5 实现必须先完成刀 1；若 0.2.4 训练目标数据尚未真实落地，应停止 0.2.5 实现，回到 0.2.4 或重新规划。

### 0.2.6 执行草案

- 文档：[`docs/planned/plan-0.2.6.md`](../planned/plan-0.2.6.md)
- 专题索引：[`docs/planned/0.2.6/README.md`](../planned/0.2.6/README.md)
- 当前状态：执行草案 / 待实现。
- 主方向：数据安全与长期数据承诺。
- 基调：让复杂本地数据长期可信、可检查、可恢复。
- 2026-05-28：新增 0.2.6 短入口和专题文档，范围包括 JSON backup 完整契约、dataVersion、import preview、snapshot integrity、linked ids / orphan / one-way relation、真实落地后的 training goal / check-in 完整性、只读恢复预检、CSV 可读导出边界、Markdown 导出移除和 Safety / Privacy Rails。
- 2026-05-28：补齐 0.2.6 刀 1 - 刀 6 执行文档和实现交接摘要，覆盖数据契约审计、Import Preview 风险矩阵、Snapshot Integrity 扩展、只读恢复预检、CSV 可读导出与 Markdown 移除边界、Safety / Privacy 审计。0.2.6 实现必须先完成刀 1；如果 0.2.2 - 0.2.5 数据尚未真实落地，应按真实代码状态缩小范围。
- 2026-05-28：用户确认 Markdown 导出没有实际价值，0.2.6 决策为移除或隐藏 Markdown 导出入口；JSON backup 仍是完整迁移格式，CSV 是唯一保留可读导出。
- 2026-05-28：纳入用户反馈插刀：导出默认必须是全部导出，日期区间只是可选筛选；数据生态提示“一键修复”时必须闭合到按钮或下一步动作；数据健康问题不能只跳转当天表单，必须展示具体字段 / 子项定位。
- 2026-05-28：将用户反馈升级为 0.2.6 插刀 0，优先于数据契约审计执行；候选代码入口包括导出选项弹窗、export options model、profile maintenance、MyView 和 data health check。
- 2026-05-28：补齐刀 5 当前 CSV 导出矩阵，确认当前代码仍有 Markdown 入口 / model / 测试残留，CSV 默认 notes 存在敏感全文风险；training CSV 只在真实 store / 类型落地后出现。

## 候选方向

### 0.2.1 应用层视觉与交互

来源：`docs/completed/plan-0.2.0.md` 中明确推迟到 0.2.1 的范围。
完成记录见 [`docs/completed/plan-0.2.1.md`](../completed/plan-0.2.1.md)。

- 通用组件接口重塑：`Modal`、`Toast`、`RecordCard`、`HardnessSelector` 等。
- 组件级动效语言重设：spring、scale、进退场、状态切换。
- Welcome 屏构图重设。
- `toggle-checkbox` 抽成 React 组件。
- 评估图标库策略，默认保留 `lucide-react`，除非有明确收益。

### 品牌与命名

来源：`docs/completed/plan-0.2.0.md` 的平行 track。

- 产品命名拍板。
- slogan / 隐私名 / manifest title / PWA 展示名同步。
- logomark 与字标探索。
- 应用图标和 PWA 安装资产统一。

### 数据洞察增强

待展开。

### 性健康与色情使用相关模块增强

待展开。

### 备份、恢复与数据安全

待展开。

## 待决策问题

- 0.2.1 是否紧接 0.2.0 做视觉应用层，还是先插入品牌命名与 PWA 资产统一？
- 品牌命名是否需要在 0.2.1 前拍板，避免后续重复改 manifest、title、icon 和文案？
- 后续“色情使用”相关记录是作为现有自慰/性生活模块的扩展，还是独立成更明确的使用行为模块？
- 是否需要建立更清晰的“健康数据导出格式”承诺，避免后续字段变更破坏用户历史数据可读性？

## 风险与约束

- 数据隐私是产品底线；任何分享、导出、截图、PWA 通知相关功能都要默认保守。
- 不引入后端同步，除非产品方向明确发生变化。
- 不为了重构修改用户可见字段名或导出的 JSON 字段名。
- 不混合架构迁移和产品功能大改，避免回归范围失控。

## 待整理记录

- 2026-05-22：开始 0.2.1 讨论研究，新增 `docs/completed/plan-0.2.1.md`。初步结论是 0.2.1 不按页面全量重刷，而按 shared/ui contract、selection controls、RecordCard、HardnessSelector、Welcome、interaction docs 的顺序研究。
- 2026-05-22：定下 0.2.1 核心基调：“私密男性健康操作台的应用层定调”。“私密”定义为本地封闭、用户主权、无审查、不羞耻化，不等于低调保守；允许成人、露骨、色情内容作为健康记录的一部分，但产品表达仍以健康监控和自我管理为主。
- 2026-05-22：定下 0.2.1 范围边界：严格限定为应用层视觉与交互，不加入新业务功能。允许改变已有功能的呈现、操作、反馈、成人表达和组件 API；不新增记录类型、统计模型、schema、后端、分享或导出语义。
- 2026-05-22：定下 0.2.1 使用场景与 Overlay 方向：以手机 Chrome 浏览器为主；抽底层 `OverlayPrimitive`，公开保留 `Modal` 和 `BottomSheet`；不做移动端自动切换；`closeOnBackdrop` 按风险区分；footer 由组件统一负责；引入 `variant: default | danger | adult | quiet` 和 `size: sm | md | lg | full`；focus trap 不引新依赖，列后续增强。
- 2026-05-22：定下 0.2.1 反馈体系：采用“Toast 轻量状态反馈，Confirm 负责风险确认”。Toast 支持 `success | error | info | warning`，顶部安全区下方显示，自动消失且可关闭，不做 action/undo；危险操作统一进入 `ConfirmModal`，按 `low | medium | high | critical` 分级，成人内容编辑可用 `adult` tone，破坏性操作优先 `danger`。
- 2026-05-22：定下 Selection controls 边界：成人内容不需要单独开关。产品是本地个人使用工具，且几乎所有核心内容都与成人、露骨、色情、性健康相关，这不是可选模式；不做“成人内容启用/禁用”“露骨内容过滤”“安全模式”这类总开关。
- 2026-05-22：定下 Selection controls 方向：0.2.1 做 `Switch` + `Checkbox`，只优先迁移高频和低风险位置，不做完整 `SegmentedControl` / `RadioGroup` / `PillSelector` / `IconToggleGroup` 体系。`Switch` 暂不需要 `adult` tone，成人语境由整体产品、页面、弹层、卡片和文案承担。
- 2026-05-22：定下 DataCard / RecordCard 方向：从色相 tone 改成语义 tone，并采用收敛版方案 C。`DataCard` 作为通用纯 UI data card，负责布局、tone、density、actions；`RecordCard` 作为记录条目 wrapper，把记录类型映射到 `DataCard` tone。0.2.1 优先覆盖日记编辑和 Dashboard 历史记录，不做全项目卡片统一。
- 2026-05-22：定下 HardnessSelector v2 方向：保留 1-5 等级和历史数据语义；主标签改成直白成人医学/功能表达，旧“豆腐/剥皮/带皮/冻瓜/铁棒”隐喻保留为副标签；视觉保留硬度增长方向但重做成更稳的分段/刻度；支持 `density` 和 `readOnly`；完整编辑显示长描述，快速记录不显示长句。
- 2026-05-26：定下 Welcome v2 方向：需要等品牌命名拍板后再做；单屏，不做多步 onboarding；直接说成人男性健康、硬度/勃起质量、性爱、自淫/自慰、色情使用和健康因素关联；强调本地存储、无账号、不上传；不需要单独成人自用提示；视觉走更强品牌/成人方向；命名未定时先用集中占位，避免全应用返工。
- 2026-05-26：定下图标与动效方向：保留 `lucide-react` 作为通用操作图标库；成人/性健康核心模块允许少量本地 SVG React 定制图标，优先覆盖硬度/勃起质量、性爱、自淫/自慰、色情使用、射精、伴侣；不做写实色情插画或表情包化素材。0.2.1 新增 `docs/completed/ui-interaction-system.md`，沉淀图标范围、成人图标边界、组件级动效 cookbook、禁止动效清单和手机 Chrome 验收点。
- 2026-05-26：定下 0.2.1 刀序：刀 32 接口审计；刀 33 OverlayPrimitive + Modal/BottomSheet contract；刀 34 Toast/Confirm feedback；刀 35 Switch/Checkbox；刀 36 DataCard/RecordCard；刀 37 HardnessSelector v2；刀 38 custom icons + interaction cookbook；命名同步/Welcome v2 作为插刀 A；刀 39 版本收口。0.2.1 最终定稿等 0.2.0 完成后按实际代码校准。
- 2026-05-26：将 `docs/completed/plan-0.2.1.md` 从研究草案推进为执行草案，并新增决策清单。剩余动作不是继续发散讨论，而是在 0.2.0 完成后做代码状态校准和具体审计文档。
- 2026-05-26：0.2.1 文档收尾，标记为方向讨论完成；新增 `docs/planned/plan-0.2.2.md` 作为下一个版本研究入口。
- 2026-05-26：0.2.2 主方向确定为“把成人行为和色情使用记录补成可复盘的健康数据闭环”，文档从研究入口推进为研究草案。下一步优先讨论是否允许 schema/migration，以及色情使用记录是独立模块还是自慰/性行为扩展。
- 2026-05-26：定下 0.2.2 数据模型边界：允许 schema / migration，但必须先产 `docs/planned/0.2.2/adult-behavior-data-model.md`，再写代码；任何 schema 改动必须同步 Dexie version、migration、导入/导出、快照完整性和测试；不重命名已有字段，不破坏旧数据读取。
- 2026-05-26：基于公开资料调研，定下色情使用建模方向：色情使用作为独立事件建模，同时允许被自慰/性行为记录引用为刺激源或上下文。原因是色情使用可以独立发生，不一定伴随自慰；自慰也可以不伴随色情；性行为也可能伴随色情内容。0.2.2 倾向支持多事件，而不是每天一个简单字段。
- 2026-05-26：定下 Porn Use Event 字段方向：围绕健康复盘闭环设计，不做内容收藏。MVP 包括开始时间、时长、内容类型、来源类型、兴奋强度、是否进入自慰、是否射精、使用后状态；可选增强包括动机、控制感、超时、边缘控制、高潮强度、疲劳、满意度、睡眠影响、标签、备注和事件关联；明确不记录 URL、缩略图、图片/视频本体、演员名、成瘾布尔、非法内容审核字段或成人内容启用字段。
- 2026-05-26：定下 Masturbation Event 字段方向：规范自慰事件并支持多次自慰事件。MVP 包括开始时间、时长、是否射精、高潮/射精强度、边缘控制、硬度、兴奋强度、刺激源、事后状态和满意度；可选增强包括疲劳、睡眠影响、控制感、超时、次数、射精次数、关联色情使用/性行为、标签和备注。现有自慰内容 item/editor 暂不强行推翻，先通过 tags/notes/关联能力兼容。
- 2026-05-26：定下 Sex Event 字段方向：规范性行为事件，但不全面重做 SexRecord 体验。Sex event 与 Porn/Masturbation 对齐，支持多事件、硬度、射精、满意度、事后状态、疲劳、睡眠影响和事件关联；重点新增 `pornInvolved`、`pornUseContext`、`linkedPornUseEventIds`，用于记录性交前/中/后色情刺激或伴侣共同观看。现有 SexRecord 主体结构保留，通过 adapter 或字段映射接入新闭环。
- 2026-05-26：将 0.2.2 推进为执行草案，并定下事件关系模型：Porn use、Masturbation、Sex event 全部使用稳定独立事件 ID，允许多对多关联；不用通用 `relatedEventIds` 作为主方案，采用类型化 linked ids；支持创建流程内自动关联和用户手动关联；不做级联删除、复杂自动推断或云端同步。第一刀必须产 `docs/planned/0.2.2/adult-behavior-data-model.md`，把产品决策转成 TypeScript 类型、Dexie schema、migration、导入导出、快照完整性和测试清单。
- 2026-05-26：定下 0.2.2 刀序：刀 40 数据模型文档；刀 41 schema/migration/domain types；刀 42 storage/import/export/snapshot integrity；刀 43 Porn use event model；刀 44 Masturbation event alignment；刀 45 Sex event mapping/adapter；刀 46 UI entry points + minimal forms；刀 47 Event linking UI；刀 48 Basic review loop；刀 49 golden path + docs + version close。
- 2026-05-26：0.2.2 文档收尾，新增收尾结论和决策清单，进入可接手执行草案状态。后续不再扩展 0.2.2 产品范围，新想法进入 0.2.3+；下一步从刀 40 的数据模型文档开始。
- 2026-05-28：刀 40 数据模型文档集完成，`docs/planned/0.2.2/adult-behavior-data-model.md` 从占位推进为实现入口，并拆分为类型字段、schema/migration、导入导出与完整性、事件关联、测试验收 5 个专题文档。已定三张独立事件表 `porn_use_events` / `masturbation_events` / `sex_events`、共同基础字段、PornUseEvent / MasturbationEvent / SexEvent 类型草案、Dexie schema v7、migration 方案、导入导出和 snapshot integrity 策略、事件关联策略与测试清单。新增 `docs/planned/0.2.2/knife-41.md` 作为刀 41 执行拆解。
- 2026-05-28：0.2.2 刀 41 - 刀 49 均已拆出独立执行文档，覆盖 schema/migration/domain types、storage/import-export/snapshot integrity、三类事件模型、最小 UI、事件关联 UI、基础复盘和版本收口；后续实际代码实现也已完成。
- 2026-05-28：0.2.2 随后完成刀 41 - 刀 49 代码实现；以上条目保留为历史过程，当前状态以“代码实现完成，待发布 / 归档”为准。
- 2026-05-26：新增 `docs/planned/plan-0.2.3.md`，主方向定为洞察与复盘增强。0.2.3 承接 0.2.2 的成人行为与色情使用结构化数据，目标是让硬度、性行为、自淫/自慰、色情使用、射精、睡眠、酒精、运动、压力、疲劳和满意度形成可解释复盘系统。
- 2026-05-26：定下 0.2.3 统计模型边界：允许新增轻量 `adult behavior review engine`，用于时间关系、趋势、共现、样本量和弱相关观察；不做医学诊断、成瘾判定、道德判断、强因果结论、云端模型或复杂黑箱模型。
- 2026-05-26：定下 0.2.3 复盘中心：做综合“成人行为复盘”入口，但首屏主指标围绕硬度/勃起质量和恢复。色情使用、自淫/自慰、性行为、射精、边缘控制等作为解释健康状态的关键上下文，不把产品做成单纯色情使用统计器。
- 2026-05-27：定下 0.2.3 周报/月报方向：做滚动 7/14/30 天复盘、自然周周报和自然月月报；报告包含本期摘要、成人行为摘要、硬度与恢复、可能关联、样本不足提示和记录缺口；当时曾允许本地 Markdown 导出，但 2026-05-28 已由 0.2.6 决策取消；永远不做分享图。
- 2026-05-27：定下 0.2.3 样本量与可信度规则：所有洞察必须带 `sampleSize` 和 `confidence: none | low | medium | high`；样本不足只展示事实；0.2.3 默认最多输出到 medium；禁止医学诊断、成瘾判定、强因果结论、道德化评价、羞辱语言和样本不足时包装洞察。
- 2026-05-27：新增 `docs/planned/plan-0.2.4.md`，主方向暂定为养成系与关系/表现训练。已定养成范围：先做“训练建议 + 进度反馈 + 轻目标”，不做完整游戏化等级系统；允许目标集中在记录质量、恢复、表现稳定性、射精控制观察和关系沟通，禁止多伴侣/性次数/射精次数/色情使用时长挑战。
