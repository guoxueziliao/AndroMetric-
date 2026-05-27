# 0.2.0 状态记录

记录日期：2026-05-26

## 版本目标

0.2.0 进入视觉系统骨架阶段：

- Tailwind 从 CDN 切到本地构建。
- 建立 CSS variable 双值 token 体系。
- 保留旧 token 别名，支持分批迁移。
- 梳理 PWA manifest / 图标 / screenshots 单源化问题。
- 后续按 shared/ui、features、app/root 分批重映射视觉 token。

## 已落地

### 刀 25：token 审计

- 新增 `docs/visual-token-audit.md`。
- 审计 `brand-*`、`pastel-*`、默认 Tailwind 色、硬编码 hex、`index.html` inline CSS、PWA manifest 与 public icon 资产。
- 当前事实：
  - `brand-*` 实际覆盖 48 个文件。
  - `pastel-*` 当前只在旧 CDN config 定义，源码未直接调用。
  - 默认 Tailwind 色覆盖 66 个文件。
  - 根 `manifest.json` 与 `VitePWA.manifest` 仍是双源。
  - 5 份 icon PNG 都是 4.46MB，且实际只有 192 / 512 尺寸存在。

### 刀 26：Tailwind 构建化 + token 骨架

- 新增 `tailwind.config.ts`，启用 `darkMode: 'class'` 与本地 content 扫描。
- 新增 `postcss.config.js`。
- 新增 `index.css`：
  - `@tailwind base/components/utilities`
  - `:root` / `.dark` CSS variable 双值 token
  - `toggle-checkbox`、`scrollbar-hide`、`custom-scrollbar`、`safe-area-*`、`status-bar-bg`
  - 删除旧 `glass-effect` / `dark-card` 死代码
- `index.tsx` 引入 `index.css`。
- `index.html` 删除 Tailwind CDN script、内嵌 Tailwind config 和 inline style。
- 安装 `tailwindcss@^3`、`postcss`、`autoprefixer`。
- `defaultSettings.theme` 从 `system` 改为 `dark`；老用户本地 settings 仍由存储值覆盖默认值。
- `useThemeMode` 返回 `{ isDarkMode, effectiveMode }`，并派发 `app-theme-change` 事件。
- 新增 `app/useChartColors.ts` hook 框架；实际 Chart.js 接入留到刀 29。
- 新增 `shared/ui/tokens.ts`，导出 token 名称类型。
- `vite.config.ts` 删除 `cdn.tailwindcss.com` runtime cache；`aistudiocdn` legacy cache 暂留。

### 刀 27：shared/ui 重映射

- `shared/ui/*` 从旧 `brand-*` / `slate-*` / `blue-*` / `red-*` 等颜色迁移到新 token。
- 新增 `shared/ui/motionTokens.ts`，把 shared/ui 中 framer-motion 的常用 duration / easing 集中。
- Modal / BottomSheet 遮罩新增 `overlay-scrim` token，不再直接写 `bg-black/*`。
- `RecordCard` 保持原 tone API，只把 tone 内部映射改为 `state-*`、`accent-vivid`、`chart-tertiary`、`surface-*`。
- `HardnessSelector` 保持 1-5 存储值和现有文案，仅迁移颜色 / duration / easing。
- 顶层隐私态已从 `blur-md grayscale opacity-50` 改为 `blur-md saturate-50 opacity-60`。
- 未抽 `Switch` / `Checkbox` React 组件，仍留 0.2.1。

### 刀 28：features 重映射第一批

- `features/quick-actions/` 已迁移到 `surface-*`、`text-*`、`state-*`、`accent-*` token。
- `features/dashboard/` 已迁移：
  - `TodayGrid`、`WeekOverview`、`DiffRow`、`ImpactFindings`、`TrendsPanel`、`DashboardDayView`、`LogHistory`、`GlobalTimeline`、`DashboardMonthView`。
  - `CalendarHeatmap` 的热力图状态色已改为 `state-*` / `accent-*` / `chart-*`。
  - `Dashboard` 的空状态、进行中横幅、BottomSheet、日记摘要 Modal 已完成 token 重映射。
  - dashboard 范围的 framer-motion `duration: 0.3` 已改为 `motionDuration.slow`。
- `features/daily-log/` 已迁移：
  - `QualityScoreRing`、`MorningSection`、`SleepSection`。
  - `NapRecordModal`、`ExerciseRecordModal`、`AlcoholRecordModal`、`BeverageModal`。
  - `LogForm` 的顶部卡片、分组 tab、性活动/生活/环境/健康/备注区和底部保存栏。
- 刀 28 范围扫描已无旧 `brand/slate/blue/red/emerald/amber/orange/purple/pink/white/black` 等直接色类、硬编码 hex、裸 `duration-*` 或 `duration: 0.x` 残留。
- 未重塑 daily-log / dashboard / quick-actions 的组件接口，符合刀 28 不做范围。

## 验证

- 已通过：
  - `npm run typecheck`
  - `npm run test`（16 files / 76 tests）
  - `npm run build`
  - `git diff --check`
- 刀 28 范围扫描：
  - `features/dashboard`
  - `features/daily-log`
  - `features/quick-actions`
- Dev server：
  - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `curl -I http://127.0.0.1:5173/` 返回 200。

## 已知噪声 / 限制

- `npm install` 后提示 11 个 audit vulnerabilities（8 moderate，3 high），本轮未跑 `npm audit fix`，避免无关依赖树变动。
- Vitest 仍有 IndexedDB / localStorage 测试环境 warning，属于既有噪声。
- 浏览器 golden path 还未人工跑；刀 26 / 27 要重点看 dark / light / system 主题切换、Modal / BottomSheet / Toast / RecordCard / HardnessSelector。
- `index.html` 仍有手写 `<link rel="manifest" href="/manifest.json">`，这是刀 30 manifest 单源化范围。
- 根 `manifest.json`、icon 压缩、screenshots 补齐仍未执行，留刀 30。

## 下一刀

刀 29：features 重映射第二批 + Chart.js 接入。

- `features/stats/`（含 `useChartColors` 实际接入）
- `features/sex-life/`
- `features/state/`
- `features/tags/`
- `features/backup/`
- `features/pwa/`
- `features/profile/`
- `features/reproductive/`
- `features/simulation-lab/`
