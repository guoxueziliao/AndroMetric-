# 0.2.20 Token 清单与现状

> 本文记录 2026-05-31 实测的 token 现状，作为收尾依据。token 值见 `index.css`，类型清单见 `shared/ui/tokens.ts`。

## 活跃语义 token（保留）

定义在 `index.css`，由 `tailwind.config.ts` 经 `rgb(var(--x) / <alpha-value>)` 映射，亮 / 暗成对。

| 分组 | token |
|---|---|
| surface | `surface-base` `surface-card` `surface-muted` `surface-border` `surface-inverted` `surface-elevated` `overlay-scrim` |
| text | `text-primary` `text-secondary` `text-muted` `text-inverted` `text-on-accent` |
| accent | `accent` `accent-hover` `accent-vivid` `accent-muted` |
| state | `state-danger-bg/text` `state-warning-bg/text` `state-success-bg/text` `state-info-bg/text` |
| chart | `chart-primary` `chart-secondary` `chart-tertiary` `chart-quaternary` |
| motion / shape | `shadow-soft/glow/dark-glow`、`easing-standard/emphasized`、`duration fast/normal/slow`、`borderRadius card/3xl/4xl` |

## 迁移别名（待删）

定义在 `tailwind.config.ts` 的「0.2.0 migration aliases」段，注释「Remove after 刀 30」。

| 别名 | 当前映射 | 仍被引用 |
|---|---|---|
| `brand-bg` | `--surface-base` | 是（4） |
| `brand-card` | `--surface-card` | 否 |
| `brand-primary` | `--surface-muted` | 否 |
| `brand-secondary` | `--surface-elevated` | 否 |
| `brand-text` | `--text-primary` | 是（6） |
| `brand-muted` | `--text-muted` | 是（5） |
| `brand-accent` | `--accent` | 是（18） |
| `brand-accent-hover` | `--accent-hover` | 是（1） |
| `palette-*` | 各 surface / accent | 否（0） |
| `pastel-*` | 各 state / chart / accent | 否（0） |

收尾后整段删除。

## 死文件（待删）

- `styles/theme.css`：使用旧 `--color-*`（`--color-bg` `--color-text` `--color-primary*` 等），无任何 import / link 引用，且与 `index.css` 命名体系冲突。直接删除。

## 多主题死块（待决）

- `styles/theme.css` 内含 `.theme-purple` 等块，但全仓无切换 class 的代码。随 `theme.css` 一并删除；如未来要做主题切换，另起版本，不在本版保留半成品。

## token 读取入口

- `shared/ui/tokens.ts`：`VISUAL_TOKENS` 常量 + 类型。
- `shared/ui/motionTokens.ts`：动效 token。
- `shared/ui/useChartColors.ts`：图表取色 hook。
- `app/useThemeMode.ts`：light / dark / system 切换。
