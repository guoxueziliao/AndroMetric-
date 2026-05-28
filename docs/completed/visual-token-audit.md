# Visual Token Audit (0.2.0)

记录日期：2026-05-26

本审计对应 `docs/completed/plan-0.2.0.md` 刀 25。它只记录当前事实和迁移目标，不直接改代码。

## 审计命令

```bash
rg -n "brand-[A-Za-z0-9_-]+" app features shared contexts hooks services utils index.html
rg -n "pastel-[A-Za-z0-9_-]+" app features shared contexts hooks services utils index.html
rg -n "#[0-9A-Fa-f]{3,8}" app features shared contexts hooks services utils index.html vite.config.ts manifest.json
rg -n "safe-area|toggle-checkbox|scrollbar-hide|custom-scrollbar|status-bar-bg" app features shared index.html
find public -maxdepth 3 -type f -printf '%p %s bytes\n' | sort
```

## 总览

- `brand-*`：实际覆盖 48 个文件，比 0.2.0 讨论时更多。
- `pastel-*`：只在 `index.html` Tailwind CDN config 中定义，当前源码调用未扫到。
- 默认 Tailwind 色：覆盖 66 个文件，集中在 `features/profile`、`features/sex-life`、`features/daily-log`、`features/dashboard`、`features/stats`、`shared/ui`。
- 硬编码 hex：覆盖 9 个文件，分为 Tailwind CDN config、Chart.js 配色、深色 surface、PWA meta/manifest 色。
- `index.html` `<style>` 内存在可迁移 utilities；`glass-effect` / `dark-card` 只有定义，无源码调用。
- PWA manifest 仍是双源：根目录 `manifest.json` 与 `vite.config.ts` 的 `VitePWA.manifest` 同时存在。

## brand-* 迁移表

| 当前 token | 当前语义 | 新 token |
| --- | --- | --- |
| `brand-bg` | 页面底色 | `surface-base` |
| `brand-card` | 卡片底色 | `surface-card` |
| `brand-text` | 主文本 | `text-primary` |
| `brand-muted` | 辅助文本 | `text-muted` |
| `brand-accent` | 主点缀 | `accent` |
| `brand-accent-hover` | 未定义 hover token | `accent` + opacity / hover 派生 |
| `brand-primary` | 未定义浅底 token | `surface-muted` |
| `brand-secondary` | 未定义次级 token | `surface-elevated` 或 `surface-muted`，按调用点确认 |

### 高频调用点

- `features/profile/MyView.tsx`：`brand-text` 28 次，`brand-accent` 20 次，`brand-muted` 17 次。
- `features/sex-life/SexRecordModal.tsx`：`brand-accent` 24 次，`brand-text` 13 次，另有 `brand-bg` / `brand-accent-hover`。
- `features/sex-life/MasturbationRecordModal.tsx`：`brand-accent` 20 次。
- `features/sex-life/PartnerEditForm.tsx`：`brand-muted` 20 次，`brand-text` 5 次，另有 `brand-accent-hover`。
- `features/daily-log/LogForm.tsx`：`brand-accent` 14 次。
- `features/stats/StatsView.tsx`：`brand-text` / `brand-muted` 各 7 次，另有未定义 `brand-primary`。
- `shared/ui/DateTimePicker.tsx`：`brand-accent` 8 次，另有 `brand-accent-hover`。
- `shared/ui/Modal.tsx` / `BottomSheet.tsx` / `ConfirmModal.tsx` / `FormControls.tsx` / `HardnessSelector.tsx` / `AnimatedButton.tsx`：shared/ui 层需要刀 27 全量清理。

### 未定义 token

- `brand-accent-hover`
  - `app/Welcome.tsx`
  - `shared/ui/ConfirmModal.tsx`
  - `shared/ui/DateTimePicker.tsx`
  - `features/sex-life/PartnerList.tsx`
  - `features/sex-life/PartnerEditForm.tsx`
  - `features/sex-life/SexRecordModal.tsx`
- `brand-primary`
  - `features/state/StateView.tsx`
  - `features/tags/TagHealthCheck.tsx`
  - `features/stats/StatsView.tsx`
- `brand-secondary`
  - `features/sex-life/SexLifeView.tsx`
- `palette-*`
  - `features/profile/MyView.tsx` 使用 `from-palette-ice to-palette-pink`，当前 Tailwind config 未定义。

刀 26 双轨期需要临时保留这些别名，刀 27-30 再按语义替换并在刀 30 删除别名。

## pastel-* 去向

当前 `pastel-*` 只在 `index.html` Tailwind config 中定义：

- `pastel-red` / `pastel-red-text` -> `state-danger-bg` / `state-danger-text`
- `pastel-orange` / `pastel-orange-text` -> `state-warning-bg` / `state-warning-text`
- `pastel-yellow` / `pastel-yellow-text` -> `state-warning-bg` / `state-warning-text`，必要时在具体组件用 opacity 区分
- `pastel-green` / `pastel-green-text` -> `state-success-bg` / `state-success-text`
- `pastel-blue` / `pastel-blue-text` -> `state-info-bg` / `state-info-text`
- `pastel-purple` / `pastel-purple-text` -> `chart-tertiary` 或后续语义 tone
- `pastel-pink` / `pastel-pink-text` -> `accent-vivid` 派生，性事模块优先

因为当前源码没有直接调用 `pastel-*`，刀 26 迁移 config 时保留别名即可；后续如果新增调用，不再使用 `pastel-*`。

## 默认 Tailwind 色迁移方向

当前默认色类覆盖 66 个文件，数量最大。按刀序分批处理：

- 刀 27：`shared/ui/*`
- 刀 28：`features/dashboard/*`、`features/daily-log/*`、`features/quick-actions/*`
- 刀 29：`features/stats/*`、`features/sex-life/*`、`features/state/*`、`features/tags/*`、`features/backup/*`、`features/pwa/*`、`features/profile/*`、`features/reproductive/*`、`features/simulation-lab/*`
- 刀 30：`app/*` 与根入口

迁移原则：

- `bg-slate-950` / `dark:bg-slate-950` -> `surface-base`
- `bg-white` / `dark:bg-slate-900` / `dark:bg-[#0f172a]` -> `surface-card`
- `bg-slate-50` / `dark:bg-slate-800` / `dark:bg-slate-950` 的次级区域 -> `surface-muted`
- `border-slate-*` / `dark:border-slate-*` / `dark:border-white/5` -> `surface-border`
- `text-slate-900` / `text-slate-800` / `dark:text-slate-100` -> `text-primary`
- `text-slate-600` / `text-slate-500` / `dark:text-slate-300` -> `text-secondary`
- `text-slate-400` / placeholder / disabled -> `text-muted`
- `bg-blue-*` / `text-blue-*` 表主操作或选择态 -> `accent`
- `green` / `emerald` 表成功 -> `state-success-*`
- `red` 表错误或破坏性操作 -> `state-danger-*`
- `orange` / `amber` / `yellow` 表警告或注意 -> `state-warning-*`
- `pink` / `purple` / `indigo` 在性事、偏好、XP 上下文中优先映射到 `accent-vivid` 或 `chart-*`，不要继续作为任意装饰色扩散。

## 硬编码 hex

### 根入口 / PWA

- `index.html:11` dark theme-color `#020617` -> 新 dark `surface-base` 实际 hex。
- `index.html:12` light theme-color `#F5F7FA` -> 新 light `surface-base` 实际 hex。
- `index.html:21` `msapplication-TileColor #020617` -> 与 dark `surface-base` 同步。
- `vite.config.ts:86-87` `background_color` / `theme_color #020617` -> 与 dark `surface-base` 同步。
- `manifest.json:7-8` 同步项，但刀 30 计划删除根 `manifest.json`，保留 `vite.config.ts` 为单源。

### Tailwind CDN config

- `index.html:33-37` `brand-*` 定义 -> 迁移到 `tailwind.config.ts` + `index.css` CSS variables。
- `index.html:40-53` `pastel-*` 定义 -> 迁移为 state / chart / accent-vivid token 别名。

### index.html style

- `index.html:82` `#E2E8F0` toggle off -> `surface-muted`
- `index.html:90` `#1E293B` dark toggle off -> `surface-muted`
- `index.html:93` `#3B82F6` toggle on -> `accent`
- `index.html:126` `#CBD5E1` scrollbar thumb -> `surface-border`
- `index.html:130` `#334155` dark scrollbar thumb -> `surface-border`
- `index.html:169` `#F5F7FA` status-bar light -> `surface-base`
- `index.html:174` `#020617` status-bar dark -> `surface-base`

### 组件硬编码

- `shared/ui/Modal.tsx:91/94/112` `dark:bg-[#0f172a]` -> `surface-card` / `surface-elevated`
- `features/dashboard/Dashboard.tsx:137` `dark:bg-[#111827]` -> `surface-card`
- `features/dashboard/GlobalTimeline.tsx:197` `dark:border-[#020617]` -> `surface-base`
- `features/daily-log/AlcoholRecordModal.tsx` 多处 `#0a0f1d` / `#111827` / `#0f172a` / `#1e293b` -> `surface-base` / `surface-card` / `surface-muted`
- `features/tags/TagManager.tsx:172` `dark:bg-[#0f172a]/80` -> `surface-card` with opacity
- `features/stats/StatsView.tsx:167-169` Chart.js grid/text/primary -> 刀 29 接 `useChartColors`
- `features/stats/StatsView.tsx:330/354/429/520` Chart.js dataset colors -> `chart-*`

## index.html <style> 内联 CSS 去向

- `body` tap highlight / font-family -> `index.css` base layer。
- `toggle-checkbox` -> `index.css @layer components` 暂留；颜色改 CSS variable。0.2.1 再抽 React `Switch`。
- `scrollbar-hide` -> `index.css @layer utilities`。
- `custom-scrollbar` -> `index.css @layer utilities`，thumb 改 `surface-border`。
- `safe-area-*` -> `index.css @layer utilities`。
- `status-bar-bg` -> `index.css @layer utilities`，颜色改 `surface-base`。
- `glass-effect` -> 删除。源码调用数为 0，只有 `index.html` 定义。
- `dark-card` -> 删除。源码调用数为 0，只有 `index.html` 定义。
- `* { -webkit-overflow-scrolling: touch; }` -> `index.css` base layer。

实际调用：

- `toggle-checkbox`：`features/sex-life/MasturbationRecordModal.tsx`、`features/daily-log/LogForm.tsx`、`features/daily-log/SleepSection.tsx`、`features/daily-log/NapRecordModal.tsx`
- `scrollbar-hide`：stats tab、dashboard filters、sex modal 横向滚动等。
- `custom-scrollbar`：Modal、SexRecordModal、MasturbationContentItemEditor、daily-log modal、dashboard、profile 等。
- `safe-area-*`：`app/AppContent.tsx`、`app/LockScreen.tsx`、`app/BottomNav.tsx`

## PWA manifest / asset 审计

### 双源

- 根 `manifest.json`：引用 72 / 96 / 128 / 144 / 152 / 192 / 384 / 512 多尺寸 icons，并引用 `/screenshots/mobile-home.png` 与 `/screenshots/mobile-stats.png`。
- `vite.config.ts`：`VitePWA.manifest` 只引用 `/icon-192x192.png` 与 `/icon-512x512.png`。
- `index.html` 显式 `<link rel="manifest" href="/manifest.json">`，与 vite-plugin-pwa 生成的 manifest 存在职责重叠。

### 当前 public 资产

```text
public/icon-192x192.png        4463077 bytes
public/icon-512x512.png        4463077 bytes
public/icon.png                4463077 bytes
public/icons/icon-192x192.png  4463077 bytes
public/icons/icon-512x512.png  4463077 bytes
public/sw.js                   3465 bytes
```

实际只有 192 / 512 两种路径存在，且 5 份 icon 文件大小相同。`manifest.json` 引用的 72 / 96 / 128 / 144 / 152 / 384 不存在；screenshots 目录也不存在。

### 刀 30 去向

- 删除根 `manifest.json`，以 `vite.config.ts` 的 `VitePWA.manifest` 为单源。
- `index.html` 删除手写 manifest link，由 vite-plugin-pwa 注入。
- 只保留 `public/icons/icon-192x192.png` 与 `public/icons/icon-512x512.png`。
- 压缩 icon 到合理体积。
- 补 `public/screenshots/mobile-home.png` 与 `public/screenshots/mobile-stats.png`。
- 删除 `vite.config.ts includeAssets` 中不存在的 `mask-icon.svg` 等项。

## 动效散点

刀 26 建 token；刀 27-30 随目录迁移替换。

- Framer Motion 数值：`shared/ui/BottomSheet.tsx`、`shared/ui/Modal.tsx`、`shared/ui/Toast.tsx`、`shared/ui/AnimatedPage.tsx`、`app/SidebarNav.tsx`、`app/LockScreen.tsx`、`features/profile/PinSetupModal.tsx`、`features/dashboard/DashboardDayView.tsx`。
- Tailwind duration：大量 `duration-200` / `duration-300` / `duration-500`，集中在 daily-log、dashboard、sex-life、profile。
- 特殊 easing：`shared/ui/HardnessSelector.tsx` 与 `index.html` toggle 使用 `cubic-bezier(0.34,1.56,0.64,1)`，对应 `easing-emphasized`。

## 刀 26 准入结论

可以进入刀 26。需要特别注意：

- Tailwind 构建化时必须保留旧 token 别名，否则当前 48 个文件会立即断样式。
- `brand-accent-hover`、`brand-primary`、`brand-secondary`、`palette-ice`、`palette-pink` 是实际存在的未定义调用，双轨期也要补别名。
- `index.html` 的死 CSS 只删 `glass-effect` / `dark-card`；其它 utilities 要搬到 `index.css`。
- Chart.js hex 暂不在刀 26 接入，只建立 `useChartColors` 框架。
