# 0.2.20 CSS 变量统一

## 现状

仓库里存在两套 CSS 变量命名：

- `index.css`：`--surface-* / --text-* / --accent-* / --state-* / --chart-*`，**活跃**，由 `tailwind.config.ts` 消费，亮 / 暗成对。
- `styles/theme.css`：`--color-bg / --color-text / --color-primary*` 等旧名，**无任何引用**，是迁移遗留的死文件。

`tailwind.config.ts` 只读 `index.css` 的变量，不读 `theme.css`。因此 `theme.css` 既不生效也制造混淆。

## 目标

`index.css` 成为 token 唯一事实来源：

- 所有 CSS 变量定义集中在 `index.css` 的 `:root` 与 `.dark`。
- `tailwind.config.ts` 只做「变量 → utility」映射，不定义颜色。
- 不再有第二套 `--color-*` 命名。

## 收尾动作

1. 确认 `styles/theme.css` 无 import / link / 动态加载引用（`rg "theme.css"`）。
2. 删除 `styles/theme.css` 整个文件。
3. 全仓搜索 `var(--color-` / `--color-primary` / `--color-bg` / `--color-text`，确认为 0；如有残留，先迁移到 `index.css` 对应语义变量。
4. 确认 `index.css` 的 `:root` 与 `.dark` 每个 token 成对存在，无暗色缺失。

## 验收

- `styles/theme.css` 不存在，全仓无对它的引用。
- 全仓无 `--color-*` 旧变量引用。
- 亮 / 暗切换下所有页面取色正常，无回退到浏览器默认色。

## 风险与停线

- 若发现 `theme.css` 被某入口动态加载（如运行时 `link` 注入），停下来确认加载逻辑，不可盲删。
- 若某处仍依赖 `--color-*`，必须先迁移再删，不能让变量悬空。
- 本动作只删死文件、统一命名，不调整任何 token 的颜色值。
