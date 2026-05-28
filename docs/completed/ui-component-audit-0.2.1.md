# UI Component Audit — 0.2.1

> 刀 32 产出。本文保留开发前审计、调用点、问题和 API 草案，作为 0.2.1 实施依据。
> 0.2.1 已完成并归档；最终实现以代码和 `docs/completed/plan-0.2.1.md` 的完成结果为准。

## 完成后校准

- `OverlayPrimitive`、`Modal`、`BottomSheet` 已落地，共享 ESC、backdrop、scroll lock、safe area 和 motion 基础行为。
- `Toast` 已支持 `warning` 与分类型时长。
- `ConfirmModal` 已支持 severity 与 `requireText`。
- `Switch` / `Checkbox` 已进入 `shared/ui`，旧 `.toggle-checkbox` CSS 已移除。
- `DataCard` / `RecordCard` 已支持语义 tone；日记编辑中的性活动记录已改用 `kind` 映射。
- `HardnessSelector` 已完成 v2 文案/视觉/API 收口。
- 审计中列出的旧 `vh` 高度热点已按手机 Chrome 主场景改为 `dvh` / `min(...)` 约束。

## 1. Modal (23 个直接调用点 + 5 个 ConfirmModal 间接调用)

### 1.1 组件现状

| 项目 | 现状 |
|------|------|
| 最大宽度 | `max-w-md` (448px)，无 size 变体 |
| 高度 | `max-h-[90vh]`，无 `dvh`/`svh` |
| 关闭策略 | backdrop click 始终关闭，无 `closeOnBackdrop` |
| 滚动锁 | `document.body.style.overflow = 'hidden'`，嵌套弹窗会冲突 |
| footer | 可选 `ReactNode`，无统一 padding/border/safe-area |
| variant/tone | 无 |
| aria | `aria-modal` 未设置 |

### 1.2 调用点清单

#### shared/ui（3）

| 组件 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `SafeDeleteModal.tsx:35` | 危险删除两步确认 | children 内按钮 | 是 | 需输入"删除"确认 |
| `ConfirmModal.tsx:36` | 通用确认包装器 | 是（取消+确认） | 条件（tone prop） | 包装 Modal |
| `DateTimePicker.tsx:103` | 日期时间选择 | 是（取消+确认） | 否 | 子组件 |

#### features/dashboard（3）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `Dashboard.tsx:333` | 磁贴详情 | 是（删除+编辑） | 是（删除按钮） | title="" 空标题，min-h-[500px] 小屏可能溢出 |
| `Dashboard.tsx:665` | 确认取消计时 | 是（保留+丢弃） | 是（丢弃按钮） | 简单确认 |
| `Dashboard.tsx:293` | BottomSheet 磁贴面板 | 条件 | 否 | max-h-[65vh]，唯一 BottomSheet |

#### features/daily-log（5）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `ExerciseRecordModal.tsx:129` | 运动记录表单 | 是（单按钮） | 否 | 搜索+分类+强度选择器 |
| `BeverageModal.tsx:167` | 饮品记录 | children 内按钮 | 否 | `h-[75vh]` + 负 margin，内有 `<style>` 标签 |
| `AlcoholRecordModal.tsx:113` | 酒精清单向导 | 是（多按钮步骤导航） | 否 | `h-[75vh]` + 负 margin，两步向导 |
| `NapRecordModal.tsx:150` | 午休记录表单 | 是（保存） | 否 | 含硬度选择器、梦境记录 |
| `LogForm.tsx` | ConfirmModal 间接调用 | - | 条件 | 删除确认 |

#### features/sex-life（4）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `PartnerManager.tsx:110` | 伴侣管理（列表/详情/编辑） | footer={null} | 否 | `h-[70vh]`，内嵌 ConfirmModal，嵌套弹窗 |
| `MasturbationRecordModal.tsx:230` | 自慰记录表单 | 是（保存） | 否 | 长表单，内嵌 ContentItemEditor |
| `MasturbationContentItemEditor.tsx:58` | 素材详情编辑 | children 内按钮 | 否 | `h-[75vh]` + 负 margin，内嵌 TagManager |
| `SexRecordModal.tsx:842` | ConfirmModal 删除阶段 | - | 是 | 间接调用 |

#### features/tags（1）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `TagManager.tsx:108` | 标签选择/管理 | 无 | 否 | `h-[75vh]`，可能被嵌套在其他 Modal 内 |

#### features/profile（6）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `ExportOptionsModal.tsx:76` | 导出选项 | 是（取消+确认） | 否 | 表单 |
| `PinSetupModal.tsx:114` | PIN 设置 | 无 | 否 | 多步 PIN 流程 |
| `AboutModal.tsx:50` | 关于 | 是（关闭） | 否 | 可能嵌套第二个 Modal |
| `AboutModal.tsx:121` | 完整更新历史 | 是（返回） | 否 | 与父 Modal 同时打开，滚动锁冲突 |
| `ImportPreviewModal.tsx:65` | 导入预览 | 是（取消+确认） | 否 | 版本警告、策略选择 |
| `MyView.tsx:327` | 设置与数据 | footer={null} | 否 | 大型滚动表单 |
| `MyView.tsx:796` | 虚拟回测实验室 | footer={null} | 否 | 懒加载 SimulationLabPanel |
| `MyView.tsx:847` | 清空数据确认 | 是（两按钮） | 是 | 需输入"删除"，危险操作 |

#### app（1）

| 位置 | 用途 | footer | danger | 备注 |
|------|------|--------|--------|------|
| `AppContent.tsx:181` | 未保存更改提示 | 是（继续+丢弃） | 是（丢弃按钮） | 导航守卫 |

### 1.3 关键问题

1. **嵌套弹窗滚动锁冲突** — 3 处嵌套场景（AboutModal 双层、PartnerManager + ConfirmModal、MasturbationRecordModal > ContentItemEditor > TagManager 三层）
2. **`h-[75vh]` 移动端溢出** — 5 处 children 使用 `vh` 高度，iOS Safari 地址栏导致 `100vh` 超出实际视口
3. **无 size prop** — 所有弹窗 448px，内容密集型（TagManager、BeverageModal、AlcoholRecordModal）需要更宽
4. **无 closeOnBackdrop** — 含未保存状态的弹窗无法阻止意外关闭
5. **空 title 浪费空间** — Dashboard.tsx:333 传 `title=""` 仍渲染空 header
6. **负 margin 溢出** — 4 处使用 `-mx-4 -mt-4` 逃逸 padding，可能被圆角裁切

### 1.4 迁移优先级

**第一批（刀 33 直接改）：**
- OverlayPrimitive 提取（ESC、backdrop、scroll lock、safe area）
- Modal 内部重构，兼容现有 props
- 新增 `size`、`variant`、`closeOnBackdrop`、`description` props

**第二批（刀 33 兼容迁移）：**
- ConfirmModal 接入 variant/tone
- SafeDeleteModal 接入 danger variant
- 含未保存状态的弹窗启用 `closeOnBackdrop={false}`

**第三批（后续刀）：**
- 移动端高度问题（`75vh` → `dvh`/flex 自适应）
- 嵌套弹窗滚动锁改为 ref 计数

---

## 2. BottomSheet（1 个调用点）

| 位置 | 用途 | footer | 备注 |
|------|------|--------|------|
| `Dashboard.tsx:293` | 磁贴详情面板 | 条件（编辑按钮 / null） | max-h-[65vh]，唯一使用点 |

现状：独立实现，与 Modal 共享 ESC/backdrop/scroll lock 逻辑但代码不共享。

迁移方向：与 Modal 共用 OverlayPrimitive，保留独立语义组件。

---

## 3. Toast（47 个调用点，8 个消费文件）

### 3.1 组件现状

| 项目 | 现状 |
|------|------|
| 类型 | `success \| error \| info`（缺少 `warning`） |
| 自动消失 | 固定 3000ms，不按类型区分 |
| 位置 | 固定顶部 |
| 可关闭 | 有关闭按钮 |
| 进度条 | 有动画进度条 |
| safe area | 未处理 |
| 最大宽度 | 未限制，长文案可能溢出 |

### 3.2 调用点分布

| 文件 | 调用数 | 类型分布 | 主要用途 |
|------|--------|----------|----------|
| `useProfileMaintenance.ts` | 27 | 12 success, 13 error, 2 info | 导出/导入/备份/修复/清空 |
| `useTagManagerController.ts` | 6 | 3 success, 2 error, 1 info | 标签 CRUD |
| `ReproductivePanel.tsx` | 10 | 3 success, 5 error, 2 info | 生殖/周期/怀孕事件 |
| `QuickRecordController.tsx` | 4 | 3 success, 1 error | 快速记录 |
| `useDashboardController.ts` | 3 | 1 success, 1 error, 1 info | 删除/取消 |
| `useStorageQuotaMonitor.ts` | 2 | 1 error, 1 info | 存储配额 |
| `PartnerManager.tsx` | 1 | 1 error | 伴侣名字验证 |
| `useLogEditor.ts` | 2 | 1 success, 1 error | 日记保存 |
| `useMasturbationTagTools.ts` | 1 | 1 error | XP 标签验证 |

### 3.3 关键问题

1. **缺少 `warning` 类型** — 存储配额、版本较旧等场景用 `error` 代替
2. **固定 3000ms** — error/warning 应更长（4500ms），info 可保持
3. **无 safe area** — 手机顶部刘海/状态栏可能遮挡
4. **无最大宽度** — 长文案在宽屏上横跨全屏
5. **useProfileMaintenance 过度依赖 toast** — 27 个调用点，部分复杂状态（健康检查分数）用 toast 展示不合理

### 3.4 迁移方向（刀 34）

- 新增 `warning` 类型
- 按类型区分自动消失时长：`success: 2200ms`, `info: 2600ms`, `warning: 3600ms`, `error: 4500ms`
- 顶部 safe area 适配
- 最大宽度限制（`max-w-sm`）
- 进出场动效：进场 180-220ms，退场 150-180ms

---

## 4. RecordCard（2 个调用点）

### 4.1 组件现状

| 项目 | 现状 |
|------|------|
| tone | `blue \| pink \| amber \| emerald \| violet \| slate`（色相命名） |
| slots | `icon`, `title`, `meta`, `subline`, `onEdit`, `onDelete` |
| density | 无 |
| actions | 编辑/删除，固定位置 |

### 4.2 调用点

| 位置 | tone | title | meta | subline |
|------|------|-------|------|---------|
| `LogForm.tsx:358` | blue | "自慰记录" | 时间 + 时长 | 素材类型列表 |
| `LogForm.tsx:370` | pink | 伴侣名/ "性爱记录" | 时间 + 时长 | 阶段数 |

### 4.3 关键问题

1. **色相命名 → 语义命名** — `blue`/`pink` 不表达业务含义
2. **4 个 tone 未使用** — amber、emerald、violet、slate 从未调用
3. **无 density** — 紧凑/舒适两种场景无法区分
4. **调用点少** — Dashboard 历史记录列表应该也用 RecordCard 但目前没有

### 4.4 迁移方向（刀 36）

语义 tone 映射：

| 旧 tone | 新 tone | 含义 |
|---------|---------|------|
| blue | adult | 自慰、性行为 |
| pink | adult | 性行为（合并） |
| amber | stimulant | 酒精、咖啡因 |
| emerald | health | 晨勃、健康指标 |
| violet | recovery | 睡眠、午休 |
| slate | quiet | 设置、辅助 |

新增 RecordKind 自动映射：`morning→health`, `sex/masturbation→adult`, `sleep/nap→recovery`, `exercise→activity`, `alcohol/caffeine→stimulant`。

---

## 5. HardnessSelector（2 个调用点）

### 5.1 组件现状

| 项目 | 现状 |
|------|------|
| 等级 | 1-5 |
| 文案 | 隐喻体系（豆腐/剥皮/带皮/冻瓜/铁棒） |
| density | 无 |
| readOnly | 无 |
| 视觉 | 倾斜柱体，选中态直立+发光 |

### 5.2 调用点

| 位置 | 默认值 | 条件显示 |
|------|--------|----------|
| `MorningSection.tsx:122` | 3 | wokeWithErection === true |
| `NapRecordModal.tsx:264` | 3 | hasErection === true |

### 5.3 关键问题

1. **无 readOnly** — Dashboard 历史复盘场景无法展示
2. **无 density** — 快速记录和完整编辑用同一布局
3. **隐喻文案** — 用户需记忆才能理解，不适合作为主标签

### 5.4 迁移方向（刀 37）

- 主标签改为成人医学/功能表达
- 旧隐喻降级为副标签或 tooltip
- 新增 `density: 'compact' | 'comfortable'`
- 新增 `readOnly: boolean`
- `showDescription` 默认按 density 决定
- 视觉从卡通柱体改为分段刻度

建议文案：

| 等级 | 主标签 | 副标签 |
|------|--------|--------|
| 1 | 疲软 | 豆腐 |
| 2 | 轻度勃起 | 剥皮 |
| 3 | 半勃起，勉强插入 | 带皮 |
| 4 | 充分勃起，可稳定插入 | 冻瓜 |
| 5 | 完全勃起，高硬度 | 铁棒 |

---

## 6. FormControls（3 组件 + 2 常量，4 个调用文件）

### 6.1 组件现状

| 组件 | 调用文件 | any 数量 |
|------|----------|----------|
| `IconToggleButton` | MorningSection, NapRecordModal | 3 |
| `RangeSlider` | NapRecordModal, SleepSection | 整个 props 为 any |
| `FaceSelector` | LogForm | 3 |
| `MOOD_FACES` | LogForm | - |
| `STRESS_FACES` | LogForm | - |

所有调用集中在 `features/daily-log/`。

### 6.2 关键问题

1. **RangeSlider 整个 props 为 any** — 零类型安全
2. **IconToggleButton/FaceSelector 使用 any** — 已有 Mood/StressLevel 类型但未用于 props
3. **无通用表单原语** — 无 Input/Select/Textarea/Checkbox 包装器
4. **~93 个原生表单元素** — 散落在 19 个 feature 文件中，重复样式代码

### 6.3 迁移方向（刀 35）

- 为现有 3 组件补充泛型类型
- 新增 `Switch` 组件替代 `toggle-checkbox` CSS class
- 新增 `Checkbox` 组件用于多选/确认场景
- 不做完整表单体系（Input/Select/Textarea 暂缓）

---

## 7. toggle-checkbox（5 个调用点，4 个文件）

### 7.1 CSS 定义

`index.css:97-134` — iOS 风格滑动开关，appearance: none，pill 形态，::before 伪元素圆点。

### 7.2 调用点

| 位置 | 用途 | 尺寸 |
|------|------|------|
| `NapRecordModal.tsx:256` | "醒来有勃起吗？" | 默认 (3rem × 1.6rem) |
| `NapRecordModal.tsx:276` | "梦境探测" | 小型 (h-4 w-8) |
| `SleepSection.tsx:190` | "梦境记录" | 小型 (h-4 w-8) |
| `LogForm.tsx:636` | "身体不适" | 默认 |
| `MasturbationRecordModal.tsx:419` | "中途被打断" | 默认 |

### 7.3 迁移方向（刀 35）

替换为 `<Switch>` 组件：

```tsx
<Switch
  checked={value}
  onCheckedChange={onChange}
  size="md"        // 'sm' | 'md'
  tone="default"   // 'default' | 'danger' | 'quiet'
/>
```

- 3 个默认尺寸 → `<Switch size="md">`
- 2 个小型尺寸 → `<Switch size="sm">`
- "身体不适" 使用 `<Switch tone="danger">`
- `SwitchField` 包装器提供 label + description + 点击整行

---

## 8. v1 API 草案

### 8.1 OverlayPrimitive

```tsx
interface OverlayPrimitiveProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;          // 默认 true
  closeOnEsc?: boolean;               // 默认 true
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

内部处理：fixed layer / z-index / backdrop / ESC / body scroll lock（ref 计数）/ safe area / motion。

### 8.2 Modal v1

```tsx
type ModalVariant = 'default' | 'danger' | 'adult' | 'quiet';
type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps extends OverlayPrimitiveProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: ModalVariant;             // 默认 'default'
  size?: ModalSize;                   // 默认 'md'
  closeOnBackdrop?: boolean;          // 覆盖，默认按 variant 决定
}
```

size 映射：`sm: max-w-sm`, `md: max-w-md`, `lg: max-w-lg`, `full: max-w-xl`。

variant 默认 closeOnBackdrop：`default: true`, `danger: false`, `adult: true`, `quiet: true`。

### 8.3 BottomSheet v1

```tsx
interface BottomSheetProps extends OverlayPrimitiveProps {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;                 // 默认 '65vh'
}
```

### 8.4 Toast v1

```tsx
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;                  // 按 type 默认值
}
```

默认时长：`success: 2200`, `info: 2600`, `warning: 3600`, `error: 4500`。

### 8.5 ConfirmModal v1

```tsx
type ConfirmSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;             // 继承 Modal
  severity?: ConfirmSeverity;         // 默认 'medium'
  requireText?: string;               // critical 时需要输入确认
}
```

### 8.6 Switch

```tsx
type SwitchTone = 'default' | 'danger' | 'quiet';
type SwitchSize = 'sm' | 'md';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: SwitchTone;                  // 默认 'default'
  size?: SwitchSize;                  // 默认 'md'
  'aria-label'?: string;
}

interface SwitchFieldProps extends SwitchProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}
```

最小触控区 44px，整行可点。

### 8.7 DataCard / RecordCard v1

```tsx
type DataCardTone = 'default' | 'health' | 'adult' | 'recovery'
  | 'stimulant' | 'activity' | 'warning' | 'danger' | 'quiet';
type DataCardDensity = 'compact' | 'comfortable';

interface DataCardProps {
  tone?: DataCardTone;                // 默认 'default'
  density?: DataCardDensity;          // 默认 'comfortable'
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}

type RecordKind = 'morning' | 'sex' | 'masturbation' | 'sleep' | 'nap'
  | 'exercise' | 'alcohol' | 'caffeine' | 'mood' | 'health' | 'note';

interface RecordCardProps extends Omit<DataCardProps, 'tone'> {
  kind: RecordKind;                   // 自动映射到 DataCardTone
  icon?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

### 8.8 HardnessSelector v2

```tsx
interface HardnessSelectorProps {
  value: number;
  onChange?: (value: number) => void;
  density?: 'compact' | 'comfortable'; // 默认 'comfortable'
  readOnly?: boolean;                   // 默认 false
  showDescription?: boolean;            // 按 density 默认
}
```

---

## 9. 迁移总览

| 刀 | 内容 | 风险 |
|----|------|------|
| 33 | OverlayPrimitive + Modal/BottomSheet 重构 | 高（23 个调用点） |
| 34 | Toast 语义化 + Confirm severity | 中（47 个调用点，但接口兼容） |
| 35 | Switch + Checkbox + FormControls 类型修复 | 低（5 个 toggle-checkbox） |
| 36 | DataCard/RecordCard 语义化 | 低（2 个调用点） |
| 37 | HardnessSelector v2 | 中（核心领域控件，需实机验证） |
| 38 | 定制图标 + 动效 cookbook 文档 | 低（新增文件，不改现有） |
| A | Welcome v2 + 命名同步 | 低（单文件，等命名拍板） |
| 39 | 收口验收 | - |
