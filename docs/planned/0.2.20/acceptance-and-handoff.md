# 0.2.20 验收与交接

## 推荐实现顺序

1. 代码校准：复核 31 处 `brand-*`（7 文件）与 `styles/theme.css` 引用现状。
2. 组件迁移：按 `component-token-adoption.md` 顺序逐文件替换，逐个亮 / 暗回归。
3. 删除别名：确认引用为 0 后删 `tailwind.config.ts` 的 migration aliases 段，重建验证。
4. 删除死文件：确认无引用后删 `styles/theme.css`。
5. 固化约定：写明「组件只用语义 token」，更正 `CLAUDE.md` 的 CDN 说明。
6. 全页走查：亮 / 暗下走查所有主页面与锁屏 / 欢迎 / 初始化屏。

## 验收底线

- `brand-* / pastel-* / palette-*` 引用全部为 0。
- `tailwind.config.ts` 不再含 migration aliases。
- `styles/theme.css` 已删除，全仓无引用，且无 `--color-*` 残留。
- 亮 / 暗色下所有页面视觉与改动前一致（同义替换，不应有可见差异）。
- 构建通过，无 Tailwind 未知 utility 警告。
- `CLAUDE.md` 视觉说明与代码一致（非 CDN）。

## 停下来重谈

- 删除别名后发现运行时仍依赖 `brand-*`（动态 class 拼接）。
- `styles/theme.css` 实际被动态加载。
- 需要调色才能保持视觉效果（说明非同义别名）。
- 需要新增主题、新增 schema / migration。
- 需要做无障碍对比度调整或新视觉风格。
- 需要改品牌命名 / PWA 资产 / 应用图标。
