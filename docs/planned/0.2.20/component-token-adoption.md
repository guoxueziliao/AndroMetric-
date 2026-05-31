# 0.2.20 组件 token 接入

## 目标

把 7 个文件里的 31 处 `brand-*` 引用迁移到语义 token，使删除别名后无残留。只做同义替换。

## 迁移映射

| 旧别名 | 语义 token utility | 备注 |
|---|---|---|
| `brand-bg` | `surface-base` | 背景 |
| `brand-card` | `surface-card` | 卡片背景（当前组件未用，保留映射备查） |
| `brand-text` | `text-primary` | 主文本 |
| `brand-muted` | `text-muted` | 次要 / 弱化文本 |
| `brand-accent` | `accent` | 主强调色 |
| `brand-accent-hover` | `accent-hover` | hover 态，写 `hover:bg-accent-hover` / `hover:text-accent-hover` |

替换时保持前缀语义不变：`bg-brand-accent → bg-accent`、`text-brand-text → text-text-primary`、`border-brand-muted → border-text-muted` 等，按原 utility 类型对应。

## 文件落地顺序

按引用密度从低到高，便于逐个视觉回归：

1. `features/sex-life/SexRecordModal.tsx`
2. `app/InitializationScreen.tsx`
3. `app/Welcome.tsx`
4. `app/LockScreen.tsx`
5. `app/BottomNav.tsx`
6. `app/SidebarNav.tsx`
7. `app/MainViewRouter.tsx`

每改一个文件，亮 / 暗各看一遍对应界面再继续。

## 约束

- 只替换 class 名，不改结构、不改布局、不调色。
- 不顺手「优化」其他样式；视觉收尾版本只做同义替换。
- 若某处 `brand-*` 通过字符串拼接动态生成 class，停下来按停线项处理，不可机械替换。

## 验收

- 7 个文件中 `brand-*` 引用为 0。
- 对应界面亮 / 暗视觉与改动前一致。
- 替换后可安全删除 `tailwind.config.ts` 的别名段。
