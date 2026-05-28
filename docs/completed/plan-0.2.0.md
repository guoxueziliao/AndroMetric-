# 0.2.0 计划（视觉系统骨架）

> 本文档是 0.2.0 全部刀数（刀 25 - 刀 31）的开发依据。讨论于 2026-05-20 定稿。
> 后续若有新增/变更，**直接更新本文件**，不开新文档。
> 软件版本管理约定（Semver / Tag / CHANGELOG / 主版本进升）见 [docs/completed/plan-0.1.2.md](../completed/plan-0.1.2.md)。

## 背景

0.2.0 = roadmap 中的"视觉重塑"，是 0.x 阶段第一个跨大方向的 minor。理念来自用户原话——"关注男性健康，主要聚焦健康和色情使用方面"，对照物接近男性 DTC 健康品牌（Hims/Roman）的调性，而不是性别中性的运动追踪（Oura/Whoop）。

0.2.0 是**骨架阶段**：建立视觉系统的 token 体系、Tailwind 构建化、深色基底 + 青绿点缀的色板 tokens、字体阶、圆角/间距/阴影/动效 token、隐私态设计、图标资产管理。**不**做组件接口重塑、不做品牌 VI 完成态、不做动效语言重设——这些是 0.2.1 应用层的事。

### 现状证据（讨论时挖出的问题）

- Tailwind 走 CDN（`<script src="https://cdn.tailwindcss.com">`），自定义 token 全写在 `index.html` `<script>` 里，无 tree-shake、无插件、production 性能差
- `brand-bg / brand-card / brand-text / brand-muted / brand-accent` 5 个 token 被 43 个文件引用；其余靠 `slate-*` / `blue-*` 直接写
- `index.html` 的 `<style>` 块里 `glass-effect` 和 `dark-card` 两个 class **0 引用**（死代码）
- `manifest.json`（仓库根）和 `vite.config.ts` 里 `VitePWA` 的 manifest 配置**双轨打架**——前者 icons 引用 8 种尺寸，后者引用 2 种；实际文件系统只有 192/512 两种存在；剩下 6 种 PWA install 时 404
- `public/icon-192x192.png` / `icon-512x512.png` / `icon.png` / `public/icons/icon-{192,512}.png` **5 份完全相同的 4.5MB PNG 拷贝**
- `manifest.json` 引用的 `screenshots/mobile-home.png` 和 `mobile-stats.png` **不存在**
- 11 个文件用 framer-motion，duration 散落手写值（0.18 / 0.2 / 0.28 / 0.3），无规律
- pastel 7 色（hardness 等级、心情、强度等状态色）只有 light 版色值，深色基底下完全不能用

体量比 0.1.2 / 0.1.3 略大，7 刀 + 2 平行 track。

## 范围

按顺序：

1. **刀 25** — token 审计（产 doc，不动代码）
2. **刀 26** — Tailwind 构建化 + token 体系骨架 + hook 接口
3. **刀 27** — shared/ui 重映射 + shared/ui 完成后整体 golden path
4. **刀 28** — features 重映射 第一批（dashboard / daily-log / quick-actions）
5. **刀 29** — features 重映射 第二批（stats / sex-life / state / tags / backup / pwa / profile / reproductive / simulation-lab，含 useChartColors 接入）
6. **刀 30** — app/根/index.html 收尾 + manifest 单源化 + 图标整理 + 末刀整体 golden path + screenshots 截图
7. **刀 31** — docs/completed/visual-system.md（语义化用途 + 反例）

平行 track（不在主线刀序里）：
- branding-exploration.md（全套 VI 候选 + 全 AI 草图）
- 命名拍板插刀（时机不绑版本，到了就插一刀同步 manifest+title+icon，可能落 0.2.0 也可能落 0.2.1）

完成后打 v0.2.0 tag。

## 显式不做

- **0.2.1 应用层职责**：通用组件接口重塑（Modal/Toast/RecordCard/HardnessSelector...）、组件级动效语言重设（spring/scale/进退场）、Welcome 屏构图重设、toggle-checkbox 抽成 React 组件、图标库切换或自绘——全部推 0.2.1
- **品牌 VI 落地**：名字/slogan/logomark/字标/隐私名拍板及替换。命名走平行 track，何时拍板插一刀同步，不阻塞 0.2.0 主线
- **完整品牌 VI 全套手作**：探索阶段全 AI 草图，不外部设计师、不手画 logomark
- **light 模式重设计**：light 是兜底不是产品身份，token 跟随 dark 派生（CSS variable 双值），accent 在 light 下手动加深一档（lightness -10）
- **使用 Tailwind v4**：v4 是 2025 新版 CSS-first config，骨架阶段就上是赌；用 v3 稳定路径
- **字体文件引入**：Inter + 系统中文回退，不打包字体文件，PWA 包不撇大
- **写"token 全表" doc**：长期 doc 容易滞后于代码；docs/completed/visual-system.md 只写"语义化用途 + 反例"，token 全值在 tailwind.config / index.css 中
- **codemod 脚本批量替换 token**：手动 + doc 对照表足够，codemod 工程成本不抵收益
- **feature flag 切回旧视觉**：违反"single source of truth"骨架原则，0.2.x 不开

---

## 软件理念基线（0.2.x 全程引用）

> 用户原话："这款软件关注男性健康，并且主要聚焦于健康和色情使用方面。整体就是为了健康数据的动态监控，以及各种约炮，做爱服务，你看里面的做爱跟自慰模块就知道了，这个主打就是健康和色情需求。"

由此派生的视觉判断锚点：

- **男性主题 + 私密坦诚 + 数据驱动**——不走中性运动追踪路径
- **深色基底 + 青绿点缀**——深色显隐私/夜间使用，青绿（teal 系）显冷静理性，符合医学/数据感而不滑入冷漠
- **同 token 体系内通过点缀色饱和度区分性事 vs 健康模块**——性事用 `accent-vivid`（高饱和青绿，跳/欲望张力），健康用 `accent-muted`（低饱和青绿，冷静/医学）。**不**用双色相（青+暖）方案
- **dark 主，light 兜底**——dark 是产品身份，light 是白天/无障碍/隐私需求弱时的兜底；新装用户首启默认 dark
- **隐私态视觉**——从 `blur-md grayscale opacity-50` 改为"高斯模糊 + 降饱和不灰"，深色下 grayscale 看起来发死

## 视觉系统骨架决策（0.2.x 全程引用）

### Tailwind

- **v3 + 构建化**：`tailwindcss` + `postcss` + `autoprefixer` 装本地依赖；新建 `tailwind.config.ts`；新建 `index.css` 含 `@tailwind base/components/utilities` + 项目自定义 layer
- **CDN 退出**：`index.html` 删除 `<script src="https://cdn.tailwindcss.com">`，删除内嵌 `<script>tailwind.config = ...</script>`
- **darkMode: 'class'** 保留

### token 双值机制（CSS variable）

token 名一份，值两套，集中写在 `index.css`：

```css
:root {
  --surface-base: 245 247 250;     /* light: #F5F7FA */
  --accent: 15 118 110;            /* light: #0F766E (teal-700, lightness -10 from dark) */
  /* ... */
}
.dark {
  --surface-base: 15 17 21;        /* dark: #0F1115 */
  --accent: 20 184 166;            /* dark: #14B8A6 (teal-500) */
  /* ... */
}
```

`tailwind.config.ts` 注册：

```ts
colors: {
  'surface-base': 'rgb(var(--surface-base) / <alpha-value>)',
  'accent': 'rgb(var(--accent) / <alpha-value>)',
  // ...
}
```

调用方写 `bg-surface-base text-accent`，dark/light 两种模式自动切换。

### 状态色板

pastel 7 色（red/orange/yellow/green/blue/purple/pink）现有 `pastel-*` 和 `pastel-*-text` 两套——**全部深色版重做**。dark 下用低饱和度暗背景 + 中等饱和度文本；light 下沿用现有亮 pastel 背景 + 深文本。同样走 CSS variable 双值机制。

具体色值在刀 26 实施时定，不预先定 hex——讨论阶段刻意不锁数字。

### 字体

- 保留 Inter + 系统中文回退（`-apple-system, BlinkMacSystemFont, 'Segoe UI', PingFang SC, Microsoft YaHei, sans-serif`）
- 不引入字体文件
- 字体阶（type scale）在刀 26 token 化：`text-xs/sm/base/lg/xl/2xl/3xl` 走 Tailwind 默认，必要时通过 `theme.extend.fontSize` 微调行高/字重

### 间距 / 圆角 / 阴影

- 间距：Tailwind 默认 4px 基线，不改
- 圆角：保留现有 `rounded-3xl` (1.5rem) / `rounded-4xl` (2rem) / `rounded-card` (1.75rem) 自定义值，迁移到 tailwind.config.ts
- 阴影：dark 下原 `shadow-soft` / `shadow-glow` / `shadow-dark-glow` 重新校准（深色下 box-shadow 视觉效果不同），CSS variable 化

### 动效

- 0.2.0 token 化范围：`duration` + `easing` 两个 token
  - `duration.fast = 150ms`
  - `duration.normal = 200ms`
  - `duration.slow = 300ms`
  - `easing.standard = cubic-bezier(0.4, 0, 0.2, 1)`
  - `easing.emphasized = cubic-bezier(0.34, 1.56, 0.64, 1)`（保留现 toggle-checkbox 的 spring）
- 现有 11 个文件散落 `duration: 0.18 / 0.2 / 0.28 / 0.3` 替换到 token 引用——0.18 → fast, 0.2/0.28 → normal, 0.3 → slow
- **不做组件级动效语言重设**（spring/scale/进退场设计推 0.2.1）
- 替换工作**顺手做**：折叠到 E1 的 per-folder 视觉迁移刀里，不单独起刀

### 图标库

- lucide-react 保留，不动；评估推 0.2.1

### 隐私模式

- `settings.privacyMode` 当前 `blur-md grayscale opacity-50`
- 改为：高斯模糊（保留 `blur-md`）+ 降饱和（`saturate-50`）+ 透明度（`opacity-60`）
- 删除 grayscale——深色下 grayscale 看起来发死
- 具体 class 组合在刀 27 改 shared/ui 时落地

### Welcome 屏

- 0.2.0：仅换底色 + 字体阶
- 构图重设推 0.2.1

### 主题模式 UX

- `defaultSettings.theme: 'dark'`（从 'system' 改为 'dark'）
- 老用户 settings 已有 theme 字段的保留原值（不被默认值覆盖）
- settings UI 三选 system/light/dark 保留
- 不做首次启动引导提示

---

## 刀 25 — token 审计

### 形态

- 产 `docs/completed/visual-token-audit.md`，不动代码
- 列对照表：现有用法（含文件路径 + 行号 + 原值）→ 新 token 名

### 审计覆盖范围

- 所有 `brand-*` token 引用（43 个文件）
- 所有 `pastel-*` 引用（pastel-red/orange/yellow/green/blue/purple/pink + 对应 -text）
- 所有硬编码 `slate-*` / `blue-*` / `gray-*` 等 Tailwind 默认色（grep `text-slate-` / `bg-slate-` / `border-slate-` 等）
- 所有硬编码 hex（grep `#[0-9A-Fa-f]{3,6}`，过滤 chart 配色单独成段）
- `index.html` `<style>` 块所有自定义 CSS 类（glass-effect / dark-card / status-bar-bg / safe-area-* / toggle-checkbox / scrollbar-hide / custom-scrollbar）
- `vite.config.ts` 中的 `theme_color` / `background_color`
- `index.html` 中的 `<meta name="theme-color">` 两条

### 输出 doc 结构

```markdown
# Visual Token Audit (0.2.0)

## brand-bg → surface-base
- features/dashboard/Dashboard.tsx:42
- features/dashboard/Dashboard.tsx:118
- shared/ui/Modal.tsx:23
- ...

## pastel-red-text → state-danger-text
- ...

## 散落 hex (按文件)
- shared/ui/HardnessSelector.tsx:67  #FEF2F2  → state-danger-bg
- features/stats/StatsView.tsx:128  #3B82F6  → chart-primary
- ...

## index.html <style> 内联 CSS 去向
- glass-effect → 删（0 引用，死代码）
- dark-card → 删（0 引用，死代码）
- status-bar-bg → index.css @layer utilities，颜色用 var(--surface-base)
- safe-area-* → index.css @layer utilities，无颜色
- toggle-checkbox → index.css 暂留（0.2.1 抽成 React 组件），颜色 var(--surface-muted) / var(--accent)
- scrollbar-hide / custom-scrollbar → index.css @layer utilities，颜色 var(--surface-border)
```

### 实现位置

- `docs/completed/visual-token-audit.md`（新文件）
- 不动代码、不动 tailwind config、不动 vite.config.ts

### 不做

- 不做"按 token 类型切大刀"的子拆分（维度已定按文件夹 i）
- 不写 codemod 脚本（已在显式不做段定）
- 不预先定新 token 的具体 hex 值（刀 26 实施时定）
- 不在审计 doc 里做"应该这样设计"的主观建议——审计是事实记录，建议留 docs/completed/visual-system.md

---

## 刀 26 — Tailwind 构建化 + token 体系骨架 + hook 接口

### 形态

骨架阶段最重的一刀。建立 token 体系的全部基础设施。

### 内容

**Tailwind 构建化**

- 装依赖：`tailwindcss@^3` / `postcss` / `autoprefixer`
- 新建 `tailwind.config.ts`（迁移现有 `index.html` 内嵌配置 + 扩展）
- 新建 `postcss.config.js`
- 新建 `src/index.css` 或 `index.css`（位置根据 vite + tailwind 标准做法定）含 `@tailwind base/components/utilities` + `:root` / `.dark` CSS variable 块
- `index.html` 删除 `<script src="https://cdn.tailwindcss.com">` 和内嵌 `<script>tailwind.config = ...</script>`
- `index.html` 入口处 `<link>` 引入构建后的 CSS（vite 自动处理）

**token 体系**

- `surface-*`（base / card / muted / border / inverted / elevated）
- `text-*`（primary / secondary / muted / inverted / on-accent）
- `accent` / `accent-vivid`（性事）/ `accent-muted`（健康）
- `state-*`（danger / warning / success / info — bg / text 两组）
- `chart-*`（primary / secondary / tertiary / quaternary，给 useChartColors 用）
- `duration-fast / normal / slow`
- `easing-standard / emphasized`
- 圆角：`rounded-card / 3xl / 4xl` 迁移
- 阴影：`shadow-soft / glow / dark-glow` 重新校准 CSS variable 化

具体 hex 值在本刀实施时挑——讨论阶段刻意不锁。

**hook 接口**

- `useThemeMode` 扩展：现在只读 settings.theme，扩展返回 `effectiveMode: 'light' | 'dark'`（解析 'system' 为当前 prefers-color-scheme）
- `useChartColors`：读 `getComputedStyle(document.documentElement).getPropertyValue('--chart-primary')` 等，转 hex 给 Chart.js options 用；订阅 theme 切换事件触发 `chart.update()`；本刀只建 hook 框架，实际接入在刀 29
- token 类型导出：CSS variable 名以 TypeScript 常量形式导出，避免硬编码字符串

**默认主题变更**

- `app/appConfig.ts` 改 `defaultSettings.theme = 'dark'`
- 老用户 settings 已有 theme 字段不被覆盖（settings 加载逻辑用 `{ ...defaultSettings, ...storedSettings }` 合并即可，storedSettings.theme 优先）

**散落 CSS 晃搬**

- `index.html` `<style>` 内容晃搬到 `index.css`，按 layer 分类
- 删除 glass-effect / dark-card（死代码，0 引用）
- 保留 status-bar-bg / safe-area-* / toggle-checkbox / scrollbar-hide / custom-scrollbar，颜色硬编码替换为 CSS variable
- toggle-checkbox 仅 token 化，**不**抽 React 组件（推 0.2.1）

**双轨过渡**

- 旧 `brand-bg` / `brand-text` 等 token 在 tailwind.config.ts 暂时**保留为别名**指向新 token：`'brand-bg': 'rgb(var(--surface-base) / <alpha-value>)'`
- 双轨在刀 27-30 期间存在，便于增量迁移
- 刀 30 收尾时删除别名

### 实现位置

- `tailwind.config.ts`（新文件）
- `postcss.config.js`（新文件）
- `index.css`（新文件，位置看 vite 标准）
- `index.html`（删 CDN 和内嵌 config）
- `app/useThemeMode.ts`（扩展 effectiveMode）
- `app/useChartColors.ts`（新文件，本刀建框架）
- `shared/ui/tokens.ts` 或类似（新文件，TypeScript token 类型导出）
- `app/appConfig.ts`（改 defaultSettings.theme）

### 验证

- `npm run dev` 跑起来（构建化 Tailwind 不挂）
- `npx tsc --noEmit` 通过
- `npm run test` 通过
- 浏览器手动验证：dark/light 切换 + system 跟随都能工作；当前应用视觉**应该和刀 25 之前完全一致**（双轨别名机制保证）

### 不做

- 不接入 Chart.js（实际接入推刀 29）
- 不抽 toggle 组件（推 0.2.1）
- 不重设计 light 模式 token（CSS variable 双值机制 + 加深一档算法即决定）
- 不预设字体文件加载逻辑

---

## 刀 27 — shared/ui 重映射 + 整体 golden path

### 形态

shared/ui 是被引用最广的层（43 文件中绝大多数依赖它）。本刀触碰所有 shared/ui 文件，把双轨别名替换为新 token，同时顺手做动效 duration token 化（E4 子项：折叠到 per-folder 视觉迁移）。

### shared/ui 范围

按目录全清：
- `shared/ui/Modal.tsx`
- `shared/ui/Toast.tsx`
- `shared/ui/BottomSheet.tsx`
- `shared/ui/RecordCard.tsx`
- `shared/ui/SafeDeleteModal.tsx`
- `shared/ui/ConfirmModal.tsx`
- `shared/ui/HardnessSelector.tsx`
- `shared/ui/DateTimePicker.tsx`
- `shared/ui/AnimatedButton.tsx`
- `shared/ui/AnimatedPage.tsx`
- `shared/ui/NoticeSystem.tsx`
- `shared/ui/ErrorBoundary.tsx`
- `shared/ui/FormControls.tsx`
- 其余 shared/ui/* 文件

### 改动类型

按刀 25 审计 doc 对照逐个文件改：

- `brand-bg` / `brand-card` / `brand-text` / `brand-muted` / `brand-accent` → 新 token
- 散落 `slate-*` / `blue-*` / `gray-*` → 新 token（按审计 doc 决定语义）
- 硬编码 hex → 新 token
- `pastel-red-text` 等状态色 → `state-danger-text` 等
- 散落 framer-motion `duration: 0.x` 数值 → token 引用
- 隐私模式 class（在 `app/AppContent.tsx` 不在 shared/ui，但 D1 决议在此一并处理）：`blur-md grayscale opacity-50` → `blur-md saturate-50 opacity-60`

### 整体 golden path（F4 d 子项关键节点）

shared/ui 改完后做一次完整 golden path（12 项 checklist，见验证清单段）。这是 shared/ui 改完触发的关键验证节点——shared/ui 触碰最广，回归最容易在这里暴露。

### 实现位置

- shared/ui/* 全部文件
- `app/AppContent.tsx`（隐私模式 class，因为顶层包装）

### 不做

- 不抽 toggle 组件（推 0.2.1）
- 不重设计组件接口形状（推 0.2.1）
- 不动 features/* / app/*（除 AppContent.tsx 隐私模式外）

---

## 刀 28 — features 重映射 第一批

### 范围

按依赖深度第一批（依赖最浅、UI 主流程权重最高的三个）：

- `features/dashboard/`
- `features/daily-log/`
- `features/quick-actions/`

### 改动类型

同刀 27 改动类型：token 替换 + duration token 化 + 状态色重映射。按刀 25 审计 doc 对照。

### 验证

- 每个 feature 改完后浏览器跑该视图（F4 d 子项：每刀验自己范围）
- typecheck + test 通过

### 实现位置

- `features/dashboard/*`
- `features/daily-log/*`
- `features/quick-actions/*`

### 不做

- 不重塑组件接口
- 不动 stats / sex-life 等第二批

---

## 刀 29 — features 重映射 第二批 + Chart.js 接入

### 范围

剩余 8 个 feature 模块：

- `features/stats/`（含 useChartColors 实际接入）
- `features/sex-life/`
- `features/state/`
- `features/tags/`
- `features/backup/`
- `features/pwa/`
- `features/profile/`
- `features/reproductive/`
- `features/simulation-lab/`

### Chart.js 接入

`features/stats/StatsView.tsx` 及其依赖的图表：
- 从硬编码 hex 改为 `useChartColors()` hook 返回值
- 主题切换订阅：theme 变化时 `chart.update()`
- 数据集多色（如多条趋势线）走 `chart-primary / secondary / tertiary / quaternary`

### 验证

- 每个 feature 浏览器验证
- stats 视图特别验证：dark/light 切换时图表配色实时更新

### 实现位置

- features/stats / sex-life / state / tags / backup / pwa / profile / reproductive / simulation-lab 全部文件
- `app/useChartColors.ts`（实际接入逻辑落地）

### 不做

- 不重塑组件接口
- 不动 app/根/index.html（推刀 30）

---

## 刀 30 — app/根/index.html 收尾 + manifest 单源 + 图标整理 + 末刀整体 golden path

### 形态

骨架阶段最重的另一刀。app/根 + index.html + manifest + 图标资产 + 末刀整体验证 + screenshots 截图，全部收口。

### 内容

**app/根**

- `app/AppContent.tsx` / `app/AppProviders.tsx` / `app/MainViewRouter.tsx` / `app/BottomNav.tsx` / `app/SidebarNav.tsx` / `app/LockScreen.tsx` / `app/Welcome.tsx` 等 token 替换
- `app/Welcome.tsx`：仅换底色 + 字体阶（构图不动，推 0.2.1）

**index.html**

- `<style>` 块清空（内容已在刀 26 晃搬到 index.css）
- `<meta name="theme-color">` 两条更新：`(dark)` 改为新深色基底色值，`(light)` 改为新浅色底
- `<link rel="apple-touch-icon">` 路径改为 `/icons/icon-192x192.png`
- `<meta name="msapplication-TileImage">` 路径改为 `/icons/icon-192x192.png`
- 删 `<link rel="manifest" href="/manifest.json">`（vite-plugin-pwa 自动注入生成的 manifest.webmanifest）

**manifest 单源化**

- 删除根目录 `manifest.json`
- `vite.config.ts` 中 `VitePWA` 的 manifest 配置作为唯一源
- 同步更新 vite.config.ts 的 `theme_color` / `background_color` 为新深色色值
- 删除 vite.config.ts manifest icons 中不存在文件的引用（实际只引 192/512 是对的，不需要删；这条是 hint 给开发者，确认）
- 删除 vite.config.ts includeAssets 中不存在的 `mask-icon.svg`（grep 确认是否存在）

**图标整理**

- 把 `public/icon-192x192.png` / `icon-512x512.png` / `icon.png` / `public/icons/icon-192x192.png` / `public/icons/icon-512x512.png` 5 份相同的 4.5MB 拷贝合并
- 用工具（squoosh 或 sharp）压缩为 < 200KB 的 192/512 两个文件
- 只保留 `public/icons/icon-192x192.png` 和 `public/icons/icon-512x512.png`
- 删除根级 3 份冗余拷贝

**screenshots 补回**

- 0.2.0 骨架完工后，浏览器手动截图：
  - `mobile-home.png`（dashboard 主视图，深色基底 + 青绿点缀）
  - `mobile-stats.png`（stats 视图）
- 存到 `public/screenshots/`
- 更新 vite.config.ts manifest 的 `screenshots` 字段（如果没有就加）

**末刀整体 golden path**

12 项 checklist（见验证清单段）。

### 实现位置

- app/* 全部文件
- index.html
- vite.config.ts（manifest 字段 + theme_color/background_color）
- 删 manifest.json
- public/icons/* 整理 + public/icon*.png 删除
- public/screenshots/* 新建

### 不做

- 不动 features/*（已在 28-29 完成）
- 不动 shared/ui/*（已在 27 完成）
- 不替换占位图标本身（C 类品牌探索拍板后单独一刀替换）
- 不做命名变更（C 类拍板后单独插刀）

---

## 刀 31 — docs/completed/visual-system.md

### 形态

E6 c 决议落地：写"语义化用途 + 反例"，token 全值在代码里。

### 内容结构

```markdown
# Visual System (0.2.x)

## 语义化用途

### surface-*
- surface-base: 页面底色，全局唯一最底层
- surface-card: 卡片/模态/弹层背景
- surface-muted: 禁用/占位/次要区域
- surface-border: 1px 描边、分割线
- surface-inverted: 反色（深色基底里出现的"白底"提示）
- surface-elevated: 浮起层（FAB、Toast、tooltip 等）

### text-*
- text-primary: 主要正文
- text-secondary: 次要说明文字
- text-muted: 占位、禁用、辅助
- text-inverted: 反色文本（在 surface-inverted 上）
- text-on-accent: 在 accent 色上的对比文本

### accent
- accent: 全应用主点缀，不区分模块时用
- accent-vivid: 性事模块（高饱和青绿，跳/欲望张力）
- accent-muted: 健康模块（低饱和青绿，冷静/医学）

### state-*
- state-danger: 错误/破坏性操作（红）
- state-warning: 警告/需注意（橙）
- state-success: 成功/确认（绿）
- state-info: 信息/中性提示（蓝）

### chart-*
- chart-primary / secondary / tertiary / quaternary: Chart.js 多数据集色板，从主点缀派生

### duration / easing
- duration-fast (150ms): 微交互（hover、tap 反馈）
- duration-normal (200ms): 一般转场（modal 进退、toast 进入）
- duration-slow (300ms): 强调转场（页面切换、大块内容展开）
- easing-standard: 一般 cubic-bezier，适合大多数
- easing-emphasized: 弹簧曲线，适合强调元素（toggle 等）

## 反例（禁止做的事）

- 禁止在组件里硬编码 hex 色值——一律走 token
- 禁止在 shared/ui 里读 narrow context（已在 CLAUDE.md，重申）
- 禁止用 `dark:` 前缀写双值——双值在 CSS variable 层处理，组件层只写一份 token 名
- 禁止在 features 里直接 import Tailwind plugin 内部——只通过 token 系统
- 禁止把 accent-vivid 用到健康模块、accent-muted 用到性事模块（语义反了）
- 禁止用 grayscale + 过低 opacity 模拟"隐私态"——会发死，已废弃
- 禁止在新组件里加 framer-motion 散落 duration 数值——一律走 token

## 主题切换契约

- 所有视觉状态（包括隐私模式、Stats 图表、Welcome）必须在 dark/light 两种模式下都验证可读
- 切换主题时，Chart.js 需 `chart.update()`；其他 React 组件依赖 CSS variable 自动重渲

## 0.2.x 内的扩展

- 新加 token：先讨论是否能复用现有的；若必须新加，更新本文件 + 更新 tailwind.config.ts + 更新 index.css 双值
- 调整 token 值（hex 微调）：仅改 index.css 的 :root / .dark 块，本文件不改（语义不变）
```

### 实现位置

- `docs/completed/visual-system.md`（新文件）

### 不做

- 不写 token 全表（hex 在代码里）
- 不写 token 历史变更日志（git 已经是这个）
- 不做组件用法 cookbook（推 0.2.1 应用层时写）

---

## 平行 track A：branding-exploration.md

### 形态

`docs/branding-exploration.md`（新文件，平行 track，不在主线刀序）。

收集场，不是结论文档。装多个候选并行存在，看探索进度拍板。

### 范围

全套 VI（C1 决议）：

- 名字候选（中文名 + 英文中性名 + 隐私名候选）
- slogan 候选
- 调性语调描述（每个候选名搭配的"产品声音"）
- logomark 草图（AI 生成，多个方向）
- 字标方向（搭配名字的字体处理）
- 隐私名机制（桌面图标名 vs 应用名是否分开）

### 产出方式

C3 决议：全 AI 草图。
- 名字 / slogan / 调性 全 AI 生成多个候选
- logomark / 字标 全 AI 生成草图
- 你看着挑/调

### 拍板时机

C2 决议：不绑版本，看探索进度。

可能落点：
- 0.2.0 末（刀 30 之后，0.2.0 收尾插一刀同步 manifest+title+icon）
- 0.2.1 头（应用层重塑时一并处理）
- 0.2.x 内其他时点

拍板时单起一刀（"命名同步刀"），改：
- vite.config.ts manifest 的 short_name / name / description / theme_color
- index.html 的 `<title>` / `apple-mobile-web-app-title`
- 应用内所有显示应用名的位置（grep "硬度日记"）
- 替换 logomark/icon 资产

### 不做

- 不在主线刀序里强制留位置
- 不绑定特定版本拍板
- 不外部设计师
- 不手画 logomark

---

## 平行 track B：命名同步刀（拍板后插）

C2 + C3 决议拍板后单独一刀。范围在平行 track A 段已述。本段仅占位提示主线开发者：**当 branding-exploration.md 拍板时，插一刀同步**。该刀编号视落点而定（0.2.0 内则 32，0.2.1 内则跨版本）。

---

## 验证清单（每刀完成时）

按 CLAUDE.md：
- `npx tsc --noEmit` 通过
- `npm run test` 通过

每刀验证范围（F4 d 决议）：
- 刀 25：仅 doc，无代码改动；不需浏览器
- 刀 26：浏览器验证应用启动 + 主题切换 + 视觉与刀 25 之前完全一致（双轨别名生效）
- 刀 27：**整体 golden path（关键节点）**——shared/ui 是地基刀，触碰最广
- 刀 28-29：每刀验自己范围（dashboard / daily-log / quick-actions / stats / sex-life / ...）
- 刀 30：**末刀整体 golden path（关键节点）**——视觉重塑全部完成的最终验证
- 刀 31：仅 doc，不需浏览器

### 完整 golden path 12 项 checklist（刀 27 + 刀 30 跑）

主流程 7 项：
1. 晨勃记录：打开 dashboard → 点晨勃 → 填写 → 保存 → 验数据落库
2. 睡眠记录：dashboard → 睡眠 → 填写 → 保存
3. 性事记录：性事入口 → 新增 → 填写 → 保存（伴侣关联）
4. 自慰记录：快速操作 → 自慰 → 填写 → 保存
5. 运动记录：快速操作 → 运动 → 填写 → 保存
6. 饮酒记录：快速操作 → 饮酒 → 填写 → 保存
7. 备份恢复：profile → 导出 JSON → 删除部分数据 → 导入 → 验数据回滚

视觉特殊态 5 项：
8. 暗色 / 亮色切换：settings → theme 切换 system/light/dark → 全应用响应
9. 隐私模式开/关：privacy mode toggle → 验高斯模糊 + 降饱和 + 不灰
10. Stats 视图：打开 stats → 验图表配色与应用一致 + 主题切换时图表更新
11. Welcome 屏：清空 IndexedDB / 隐身窗口启动 → 验 Welcome 底色 + 字体阶
12. AboutModal（如 0.1.2 已落地）：profile → 关于 → 验渲染 + 主题切换响应

---

## 风险与回滚预案

F6 决议：c 优先 + b 兜底。

| 问题等级 | 触发条件 | 应对 |
|---|---|---|
| **色值/饱和度偏差**（最常见）| 主观判断 + 软指标：青绿不够沉稳、accent-vivid 在小字号下对比度不足、暗色基底略闷等 | 调 `index.css` 的 CSS variable 块 hex 值，**不算回滚，算末调**，无需新刀 |
| **某 feature 重映射后视觉错乱** | 该视图浏览器验证不通过 | revert 该刀；shared/ui 不动；其他 feature 刀保留；下次重做该 feature |
| **shared/ui 重映射出根本性问题** | 刀 27 整体 golden path 发现 ≥3 个核心视图调性失败 | revert shared/ui + 所有依赖它的 features 刀；0.2.0 进入"暂停 + 重新讨论调性"模式 |
| **整版本调性不对**（终极兜底） | 末刀整体 golden path 发现整体方向错了 | git revert 0.2.0 全部刀，回到 0.1.3；重新讨论理念锚点 |

判断标准：**主观 + 软指标**。不预设硬指标（WCAG AA 之类合规层面除外，这是基础线必过）。

---

## CHANGELOG 写法（F5 决议）

中等粒度 5-8 行，分组 Added/Changed/Fixed。包含隐性 bug 修复条目（manifest 双轨、icon 404）。

模板（实际值在刀 30 完成后填）：

```markdown
## [0.2.0] - 2026-MM-DD

### Changed
- 全应用视觉重塑：深色基底（默认）+ 青绿点缀，性事偏暖、健康偏冷的语义化点缀色机制
- 隐私模式：从灰度+模糊改为高斯模糊+降饱和，深色下视觉更舒适
- 状态色（硬度等级、心情、运动强度等）的色板深色版重做
- Tailwind 切换至构建化模式，运行时注入的 token 体系替代 CDN 配置

### Added
- 视觉系统语义文档（docs/completed/visual-system.md）
- 主题首次启动默认为深色（老用户设置保留）

### Fixed
- 修复 manifest.json 引用了不存在的图标尺寸导致 PWA install 部分图标 404
- 修复根目录 manifest.json 与 vite.config.ts 中 manifest 配置双轨打架
```

---

## 完成定义

7 刀（25-31）全部 merge + 浏览器验证（含刀 27 和刀 30 两次完整 golden path）+ tag v0.2.0。

`CHANGELOG.md` 的 `[Unreleased]` 段提升为 `[0.2.0] - YYYY-MM-DD`，下方留新的 `[Unreleased]` 占位。

记忆里同步建一份 `project_0_2_0_status.md`，记录最终落地内容 + 推迟到 0.2.1 的清单（组件接口重塑、动效语言重设、Welcome 构图、toggle 抽组件、图标库评估等已在显式不做段列出的项）。

平行 track 状态记录：branding-exploration.md 当前进度（候选名/slogan/logomark 草图收集到哪一步），命名同步刀是否已落（落 0.2.0 末或推 0.2.1 头）。

## 与 0.2.1 的衔接

0.2.0 完成后，视觉系统骨架就位：

- 全应用 token 体系单源
- dark/light 双值机制成熟
- 动效 token 化
- 隐私态视觉重设
- manifest / 图标资产整洁
- docs/completed/visual-system.md 作为长期参照

0.2.1 应用层将基于此骨架重塑：
- 通用组件接口重塑（Modal/Toast/RecordCard/HardnessSelector 等）
- 组件级动效语言（spring/scale/进退场设计）
- toggle-checkbox 抽成 React 组件
- Welcome 屏构图重设
- 图标库评估与可能切换
- 命名同步刀（如 0.2.0 末未落）

branding-exploration.md 继续平行推进，拍板时机决定命名同步刀的落点。

