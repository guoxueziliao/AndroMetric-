# 0.2.20 一致性审计 2026-05-31

## 审计结论

0.2.20 已收口为视觉系统收尾与固化 v1，状态为执行草案 / 待实现。范围与当前代码基线一致。

## 用户确认

- 主题为视觉系统，且已确认改名为「收尾与固化 v1」，承认代码已有 token 系统。
- 只做同义替换，不引入新视觉风格。

## 与代码基线对齐（2026-05-31 实测）

- 活跃 token 定义在 `index.css`，由 `tailwind.config.ts` 映射，亮 / 暗成对：一致。
- 暗色模式已落地（`darkMode: 'class'` + `useThemeMode.ts`）：本版不改，只保不破。
- `brand-*` 31 处、`pastel-*/palette-*` 为 0：迁移范围以实测为准。
- `styles/theme.css` 无引用、用旧 `--color-*`：判定为死文件，待删。
- `theme-purple` 等多主题无切换代码：本版不激活，随死文件处理。

## 与前序版本关系

- 接在 0.2.19 个人指标自定义与权重之后，是队列新尾。
- 不依赖 0.2.15 - 0.2.19 的产品能力；与 0.2.15 导航整理无冲突（一个改入口结构，一个改视觉 token）。
- 复用 0.2.16 / 0.2.18 的开发前代码校准流程。

## 文档一致性

- `plan-0.2.20.md`：定位、范围、不做项一致。
- `scope-and-boundaries.md`：只做收尾与固化一致。
- `token-inventory.md`：token 与别名清单与实测一致。
- `css-variable-consolidation.md`：唯一事实来源与死文件清理一致。
- `component-token-adoption.md`：31 处迁移映射与文件分布一致。
- `acceptance-and-handoff.md` / `implementation-handoff.md`：停线项一致。

## not doing 一致性

未恢复任何已否决方向：

- 不做品牌命名 / PWA 资产（与 0.2.15 边界一致）。
- 不做隐私模糊。
- 不新增 schema / migration。
- 不做新视觉风格、无障碍专项、多主题激活。

## 停线一致性

以下情况必须停下来重谈：

- 运行时动态依赖 `brand-*` 或 `theme.css`。
- 必须调色才能保持效果。
- 需要新增主题、schema / migration、无障碍专项或品牌资产改动。
