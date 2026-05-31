# 0.2.20 执行计划

## 目标

收尾 0.2.0 视觉迁移遗留，把已存在的语义 token 系统固化为唯一事实来源。开发完成后：迁移别名全部删除、`brand-*` 引用清零、死文件 `styles/theme.css` 移除、亮 / 暗色表现不变，且 `CLAUDE.md` 的视觉说明与代码一致。

## 进入开发前校准

先读这些文件：

- `index.css`：当前 token 唯一事实来源（`--surface-* / --text-* / --accent-* / --state-* / --chart-*`，亮 / 暗成对）。
- `tailwind.config.ts`：token → utility 映射，含待删的 `brand-* / pastel-* / palette-*` 迁移别名。
- `shared/ui/tokens.ts`：`VISUAL_TOKENS` 清单与类型。
- `shared/ui/motionTokens.ts`、`shared/ui/useChartColors.ts`：动效与图表 token 读取入口。
- `app/useThemeMode.ts`：light / dark / system 切换与 `dark` class。
- `styles/theme.css`：使用旧 `--color-*`，无任何引用，待删。

## 校准事实（2026-05-31 实测）

- `brand-*` 引用 31 处，分布在 7 个文件：`app/MainViewRouter.tsx`、`app/Welcome.tsx`、`app/InitializationScreen.tsx`、`app/SidebarNav.tsx`、`app/BottomNav.tsx`、`app/LockScreen.tsx`、`features/sex-life/SexRecordModal.tsx`。
- 具体别名：`brand-accent` ×18、`brand-text` ×6、`brand-muted` ×5、`brand-bg` ×4、`brand-accent-hover` ×1。
- `pastel-*` / `palette-*` 引用已为 0。
- `--color-*` 旧变量无人引用；`theme-purple` 等多主题 class 无切换代码。

## 实现切片

### 切片 1：组件 brand-* 迁移

按 `component-token-adoption.md` 映射表，把 7 个文件里的 31 处 `brand-*` 替换为语义 token：

- `brand-bg → surface-base`
- `brand-card → surface-card`
- `brand-text → text-primary`
- `brand-muted → text-muted`
- `brand-accent → accent`
- `brand-accent-hover → accent-hover`（注意：utility 是 `*-accent-hover`，hover 态写 `hover:bg-accent-hover` 等）

只做同义替换，不调色、不改布局。

### 切片 2：删除迁移别名

确认切片 1 后 `brand-* / pastel-* / palette-*` 引用全部为 0，再从 `tailwind.config.ts` 删除整段「0.2.0 migration aliases」。删除后重新构建，确保无 Tailwind 未知类警告。

### 切片 3：删除死文件 theme.css

确认 `styles/theme.css` 无 import / link / 动态加载引用后删除整个文件。`index.css` 保持为唯一 token 来源。如发现仍有引用，停下来按停线项处理。

### 切片 4：固化 token 约定与文档

- 在 `shared/ui/tokens.ts` 或就近 README 写明：组件只用语义 token，不写 hex / rgb 字面色。
- 更正 `CLAUDE.md`：Tailwind 已是本地构建（`tailwind.config.ts` + `postcss.config.js` + `index.css`），不再是 CDN；brand token 段落更新为语义 token 段落。
- 决定 `theme-purple` 等无切换入口的多主题块：本版不激活，明确删或留，不留半成品开关。

## 实现顺序

1. 代码校准：复核 31 处 `brand-*` 与 `theme.css` 引用现状。
2. 先迁移组件（切片 1），保持每次替换可视觉回归。
3. 再删别名（切片 2），构建验证。
4. 再删死文件（切片 3）。
5. 固化约定与更正文档（切片 4）。
6. 亮 / 暗色全页走查。

## 验收步骤

- `rg "brand-|pastel-|palette-" --type ts --type tsx`（排除注释）结果为 0。
- `tailwind.config.ts` 不再含 migration aliases 段。
- `styles/theme.css` 已删除，且全仓无对它的引用。
- 亮色与暗色下，首页 / 状态 / 性生活 / 我的 / 锁屏 / 欢迎页视觉与改动前一致。
- `CLAUDE.md` 不再声称 Tailwind 走 CDN。
- 构建无未知 utility class 警告。

## 检查命令

```bash
rg -n "brand-|pastel-|palette-" app features shared core domain --type-add 'tsx:*.tsx' -t ts -t tsx
rg -n "theme\.css" --type-add 'tsx:*.tsx' -t ts -t tsx -t html -t css
rg -n "migration aliases|Remove after" tailwind.config.ts
rg -n "CDN|cdn.tailwind" index.html CLAUDE.md
npm run build
git diff --check
```

## 测试建议

- 构建通过且无 Tailwind 未知类警告。
- 手动切换 light / dark / system，确认锁屏、欢迎页、初始化屏、底部 / 侧边导航无掉色。
- `useChartColors` 在亮 / 暗下取色正常，图表四色不变。

## 停线项

- 删除别名后发现仍有运行时依赖 `brand-*`（如动态拼接 class）。
- `styles/theme.css` 实际仍被某处加载。
- 替换过程中发现必须调色才能保持效果（说明不是同义别名，需重谈）。
- 需要新增第三套主题或新增 schema / migration。
- 需要做无障碍对比度调整（超出本版范围）。
