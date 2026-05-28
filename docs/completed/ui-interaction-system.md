# UI Interaction System

> 0.2.1 刀 38 产出。沉淀图标范围、组件级动效 cookbook、禁止动效清单和手机 Chrome 验收点。
> 0.2.1 已完成并归档；本文作为后续交互与动效维护基线。

## 1. 图标体系

### 1.1 lucide-react 使用范围

通用操作图标继续使用 `lucide-react`：

| 类别 | 图标 |
|------|------|
| 导航 | ArrowLeft, ChevronLeft, ChevronRight, X |
| 操作 | Edit3, Trash2, Plus, Minus, Check, Search |
| 状态 | CheckCircle, XCircle, AlertTriangle, Info, Loader2 |
| 数据 | Calendar, Clock, BarChart3, TrendingUp |
| 工具 | Settings, Download, Upload, RefreshCw |
| 媒体 | Play, Pause, StopCircle |

### 1.2 定制图标

成人/性健康核心语义允许少量本地 SVG React 组件，放在 `shared/ui/icons/`。

第一批（刀 38 产出）：

| 图标 | 语义 | 用于 |
|------|------|------|
| `IconErection` | 硬度/勃起质量 | 晨勃记录、硬度选择器标题 |
| `IconSex` | 性行为 | 性爱记录卡片、快速记录 |
| `IconMasturbation` | 自慰 | 自慰记录卡片、快速记录 |
| `IconOrgasm` | 射精/高潮 | 记录详情 |

规则：

- 本地 SVG React 组件，不使用远程图片。
- 风格与 0.2.0 视觉系统协调：线性或半填充，深色基底，青绿点缀。
- 可以成人、直白，但不做写实色情插画。
- 不用 emoji 作为正式图标。
- 图标服务快速识别，不抢正文。

### 1.3 成人图标边界

- 允许：勃起/硬度（柱体+刻度）、性爱（交合抽象）、自慰（手+柱体抽象）、射精（流体抽象）。
- 不允许：写实生殖器官、色情场景、挑逗姿态、表情包化素材。
- 图标尺寸统一 24px（默认）或 18px（紧凑），与 lucide-react 尺寸对齐。

## 2. 动效 Token

### 2.1 基础 Token（来源：`shared/ui/motionTokens.ts`）

```ts
motionDuration.fast   = 0.15s
motionDuration.normal = 0.2s
motionDuration.slow   = 0.3s

motionEase.standard   = [0.4, 0, 0.2, 1]
motionEase.emphasized = [0.34, 1.56, 0.64, 1]
```

### 2.2 组件级动效规则

| 组件 | 行为 | 时长 | easing | 备注 |
|------|------|------|--------|------|
| Overlay/Modal | 进场（scale+fade） | 300ms | emphasized | 退场 200ms, standard |
| BottomSheet | 进场（slideUp） | 300ms | [0.22, 1, 0.36, 1] | 退场 150ms |
| Toast | 进场 | 200ms | standard | 退场 160ms |
| Switch | 切换（spring） | - | stiffness 500, damping 30 | layout animation |
| Checkbox | 勾选 | 150ms | standard | scale feedback |
| HardnessSelector | 选中反馈 | spring | stiffness 400, damping 25 | 不能导致布局跳 |
| DataCard | 按压 | - | active:scale-95 | 手机端触摸反馈 |
| Button press | 按压 | - | whileTap scale 0.95 | framer-motion |
| Danger confirm | 进场 | 250-300ms | emphasized | 更稳、更慢 |

### 2.3 禁止动效清单

- 长列表滚动项不要逐个飞入。
- 表单输入时不要布局动画。
- 统计图不要每次切 tab 大幅重绘。
- 隐私模式切换不要夸张动画。
- 数据导入/导出不用花哨动效。
- 卡片 hover 不作为手机端主要反馈。
- 不做持续闪烁、呼吸光、大面积背景动效。
- 不做挑逗式动效。

## 3. 手机 Chrome 验收点

### 3.1 弹层

- [ ] Modal 打开时 body 不可滚动
- [ ] 嵌套 Modal 关闭内层不恢复 body scroll
- [ ] BottomSheet 从底部滑入，不遮挡底部导航
- [ ] ESC / backdrop click 关闭行为符合 closeOnBackdrop 设置
- [ ] 长内容弹窗可滚动，footer 不遮挡内容
- [ ] safe area 刘海/状态栏不遮挡 Toast

### 3.2 表单控件

- [ ] Switch 最小触控区 44px
- [ ] SwitchField 整行可点
- [ ] HardnessSelector 在 320px 屏幕上不溢出
- [ ] FormControls 在键盘弹出时不被遮挡

### 3.3 卡片

- [ ] RecordCard action 按钮最小 36px
- [ ] DataCard compact 在历史列表中不挤压
- [ ] 成人 tone 卡片在深色模式下对比度足够

### 3.4 反馈

- [ ] Toast 在顶部安全区下方显示
- [ ] Toast 不遮挡底部导航、FAB、键盘
- [ ] warning/error Toast 显示时长足够（3.6s/4.5s）
- [ ] ConfirmModal critical 操作需输入确认文本
