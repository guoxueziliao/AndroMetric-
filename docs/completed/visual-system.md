# Visual System

> 0.2.0 视觉系统语义文档。token 的具体数值以 `tailwind.config.ts` 和 `index.css` 为单源；本文只记录语义用途和使用边界。

## Token Sources

- `index.css`：CSS variable 双值体系，包含 light / dark 的 surface、text、accent、state、chart、shadow、easing。
- `tailwind.config.ts`：把 CSS variables 映射为 Tailwind token，并保留 0.2.0 迁移 alias。
- `shared/ui/motionTokens.ts`：组件动效可复用 duration / easing。
- `shared/ui/tokens.ts`：TypeScript 侧 token 名称集合。

## Surface

- `surface-base`：应用底色。
- `surface-card`：主要内容容器、弹层、卡片。
- `surface-muted`：次级背景、分组区、弱强调块。
- `surface-border`：边框、分隔线、滚动条。
- `surface-elevated`：更高层级容器。
- `surface-inverted`：反色强调按钮或强对比文本面。
- `overlay-scrim`：弹层遮罩。

避免直接写 `slate-*`、`gray-*`、`black/*` 作为主要结构色；需要结构色时先用 `surface-*`。

## Text

- `text-primary`：主要标题和关键数值。
- `text-secondary`：正文和次级信息。
- `text-muted`：说明、辅助标签、空状态。
- `text-inverted`：反色面上的文本。
- `text-on-accent`：accent / state 实色背景上的文本。

避免在深色主界面中混用大量 Tailwind 默认文本色，保持深浅模式由 token 控制。

## Accent

- `accent`：通用主操作和稳定品牌强调。
- `accent-muted`：健康、医学、冷静分析语义。
- `accent-vivid`：成人/性相关记录、欲望张力、核心性健康语义。

成人语境是产品默认语境，不通过开关启用；视觉上用 `accent-vivid` 和语义组件表达，不引入成人内容过滤态。

## State

- `state-success-*`：成功、良好、已完成。
- `state-info-*`：中性提示、普通信息、活动状态。
- `state-warning-*`：注意、负荷、刺激物、配额接近等非失败状态。
- `state-danger-*`：删除、清空、覆盖、失败和不可逆操作。

破坏性操作优先使用 `danger`，即使对象本身是成人内容。

## Chart

- `chart-primary`、`chart-secondary`、`chart-tertiary`、`chart-quaternary` 供 Chart.js 和轻量可视化使用。
- Chart.js 颜色应通过 `useChartColors` 从 CSS variable 读取，避免硬编码 hex 和深浅模式漂移。

## Motion

- `duration-fast` / `motionDuration.fast`：短反馈、轻量切换。
- `duration-normal` / `motionDuration.normal`：常规进入/状态变化。
- `duration-slow` / `motionDuration.slow`：弹层、重点卡片、较重状态变化。
- `easing-standard`：普通过渡。
- `easing-emphasized`：选中、弹层、需要确认感的动作。

组件级动效规则见 [`ui-interaction-system.md`](./ui-interaction-system.md)。

## Privacy Visual

隐私模式保留应用层模糊和弱化：`blur-md saturate-50 opacity-60`。不要恢复 grayscale；深色模式下 grayscale 会让界面发死。

## Migration Aliases

`brand-*`、`pastel-*`、`palette-*` 仍在 `tailwind.config.ts` 中作为迁移 alias 保留。新代码应优先使用 `surface-*`、`text-*`、`accent-*`、`state-*`、`chart-*`。

## Anti-Patterns

- 新增页面直接使用大面积 `slate-*` / `blue-*` / `gray-*`。
- 在组件内手写 hex 作为主题色。
- 为 light / dark 分别写两套 class，而不是走 CSS variable token。
- 用 `accent-vivid` 表示错误或删除。
- 用 `state-danger-*` 表示普通成人内容。
- 把 `brand-*` alias 当成新代码的主 token。
