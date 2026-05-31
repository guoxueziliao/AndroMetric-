# 0.2.20 实现交接摘要

## 版本定位

0.2.20 是视觉系统收尾与固化 v1。

视觉 token 系统已存在；本版只清理 0.2.0 迁移遗留，让 token 体系成为唯一事实来源。不引入新风格，不改产品能力。

## 已确认决策

- 改名为「视觉系统收尾与固化 v1」，承认代码已有 token 系统。
- 只做同义替换，不调色、不改风格。
- 删除 `brand-* / pastel-* / palette-*` 迁移别名。
- 删除死文件 `styles/theme.css`。
- `index.css` 为 token 唯一事实来源。
- 默认不新增 schema / migration、不新增主题。

## 推荐实现顺序

1. 真实代码校准：复核 31 处 `brand-*`（7 文件）与 `theme.css` 引用。
2. 逐文件迁移 `brand-*` 到语义 token。
3. 删除 `tailwind.config.ts` 的迁移别名段。
4. 删除 `styles/theme.css`。
5. 固化 token 约定，更正 `CLAUDE.md` 的 CDN 说明。
6. 亮 / 暗全页走查。

## 停线项

- 运行时动态拼接依赖 `brand-*`。
- `theme.css` 仍被动态加载。
- 必须调色才能保持效果。
- 需要新增主题或 schema / migration。
- 需要无障碍对比度专项或新视觉风格。
- 需要改品牌资产。

## 验收底线

- `brand-* / pastel-* / palette-*` 引用为 0。
- 迁移别名与 `theme.css` 已删，无残留引用。
- 亮 / 暗视觉与改动前一致。
- 构建无未知 utility 警告。
- `CLAUDE.md` 不再声称 Tailwind 走 CDN。
