# 0.2.20 视觉系统收尾与固化 v1

> 0.2.20 不是从零做视觉系统。代码里已有一套基于 CSS 变量的语义 token、暗色模式和图表 / 动效 token；0.2.20 只把这套已存在但未收尾的视觉系统清干净、统一命名、删除迁移别名，并固化成稳定约定。它不改产品能力，不改健康算法，不引入新视觉风格。

## 当前状态

- 状态：执行草案 / 待实现。
- 前置：0.2.15 导航与信息架构整理 v1 正在开发；0.2.16 - 0.2.19 已收口为执行草案。
- 当前实现线：0.2.15 正在开发。
- 主方向：收尾 0.2.0 视觉迁移遗留，让 token 体系成为唯一事实来源。
- 实现前代码校准结论（2026-05-31 实测）：
  - 活跃 token 定义在 `index.css`（`--surface-* / --text-* / --accent-* / --state-* / --chart-*`），由 `tailwind.config.ts` 通过 `rgb(var(--x) / <alpha-value>)` 消费。
  - 暗色模式已落地：`darkMode: 'class'` + `app/useThemeMode.ts`（light / dark / system）。
  - `shared/ui/tokens.ts`、`motionTokens.ts`、`useChartColors.ts` 已建立 token 清单与读取入口。
  - 遗留债务一：`tailwind.config.ts` 仍保留一批 `brand-* / pastel-* / palette-*` 迁移别名，注释标注「Remove after 刀 30」。`pastel-* / palette-*` 引用已为 0，`brand-*` 仍有 31 处。
  - 遗留债务二：`styles/theme.css` 使用旧 `--color-*` 命名，且已无任何 import / link 引用，是死文件。

## 文档拆分

- [目录索引](./0.2.20/README.md)
  - 0.2.20 专题文档入口。
- [执行计划](./0.2.20/execution-plan.md)
  - 真实代码校准、收尾切片、实现顺序、验收步骤、检查命令和停线项。
- [范围与边界](./0.2.20/scope-and-boundaries.md)
  - 只做收尾与固化，不做新视觉风格、不改品牌资产。
- [Token 清单与现状](./0.2.20/token-inventory.md)
  - 现有 surface / text / accent / state / chart / motion token 与遗留别名对照。
- [CSS 变量统一](./0.2.20/css-variable-consolidation.md)
  - `index.css` 为唯一事实来源，删除死文件 `styles/theme.css` 与旧 `--color-*`。
- [组件 token 接入](./0.2.20/component-token-adoption.md)
  - 31 处 `brand-*` 的迁移映射与组件落地顺序。
- [验收与交接](./0.2.20/acceptance-and-handoff.md)
  - 实现顺序、验收底线和停下来重谈条件。
- [实现交接摘要](./0.2.20/implementation-handoff.md)
  - 给开发会话的一页入口。
- [一致性审计](./0.2.20/consistency-audit-2026-05-31.md)
  - 与已定边界、not doing 列表和当前代码基线对齐。

## 初步范围

- 把 `brand-* / pastel-* / palette-*` 迁移别名从 `tailwind.config.ts` 删除。
- 把 31 处 `brand-*` 引用迁移到语义 token（`brand-accent → accent` 等）。
- 删除死文件 `styles/theme.css` 与旧 `--color-*` 命名。
- 确认 `index.css` 是 token 唯一事实来源，亮 / 暗两套值完整对应。
- 固化 token 使用约定：组件只能用语义 token，不能写死颜色或 hex。
- 把约定补进 `CLAUDE.md` 视觉相关说明（CDN 已不再使用，应更正）。

## 明确不做

- 不引入新视觉风格、新配色方案或新品牌色。
- 不改品牌命名、PWA 名称、应用图标或启动画面资产。
- 不新增第三套主题（如 `theme-purple` 当前无切换入口，本版不激活，只决定删或留）。
- 不新增 schema / migration。
- 不改任何健康算法、统计算法或复盘逻辑。
- 不做组件库重写或设计稿对齐工程。
- 不做无障碍对比度专项（可在后续版本单列）。

## 已定边界

- 0.2.20 是收尾与固化层，不是新设计版本。
- `index.css` 的 CSS 变量是 token 唯一事实来源，`tailwind.config.ts` 只做映射。
- 迁移别名删除后，构建与 `rg` 检查必须证明无残留引用。
- 暗色 / 亮色每个 token 必须成对存在；删除别名不得破坏暗色表现。
- 删除 `styles/theme.css` 前必须确认无 import / link / 动态加载引用。
- 任何视觉改动只允许是「同义替换」，不允许借机调色或改风格。

## 暂不做

- 不在本规划窗口改产品代码。
- 不恢复隐私模糊 / 屏幕遮挡。
- 不把品牌与命名提前为独立版本。
- 不把无障碍对比度并入本版。
