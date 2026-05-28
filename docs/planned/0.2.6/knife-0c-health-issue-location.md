# 0.2.6 插刀 0C 健康问题定位

> 本文只规划数据健康 issue 的可读定位。目标是让用户知道具体检查哪里。

## 现状

- issue 点击后只跳到当天表单。
- issue 有时带 `path`，但 UI 未展示成可理解位置。
- 用户不知道该检查哪条记录、哪个字段或哪个子项。

## 目标

- issue 列表展示业务位置。
- 点击后仍打开对应日期。
- 无法自动聚焦时，仍显示人工检查路径。

## Issue 卡片信息

每条问题至少展示：

- 日期。
- 严重程度。
- 问题类型。
- 问题说明。
- 业务位置。
- 建议动作。

业务位置可以来自：

- `path`
- `hintAction`
- issue type
- message fallback

## Path 文案映射

建议映射：

- `masturbation[n]` -> `自慰记录 n+1`
- `masturbation[n].contentItems[m]` -> `自慰记录 n+1 / 素材 m+1`
- `masturbation[n].contentItems[m].type` -> `自慰记录 n+1 / 素材 m+1 / 素材类型`
- `masturbation[n].contentItems[m].platform` -> `自慰记录 n+1 / 素材 m+1 / 来源平台`
- `sex[n]` -> `性爱记录 n+1`
- `sex[n].partner` -> `性爱记录 n+1 / 伴侣`
- `exercise[n]` -> `运动记录 n+1`
- `sleep.startTime` -> `睡眠 / 开始时间`
- `sleep.endTime` -> `睡眠 / 结束时间`
- `morning.hardness` -> `晨间状态 / 硬度`

无法识别时：

- 展示原始 path。
- 追加“请在当天表单中手动检查该位置”。

## 跳转行为

最低要求：

- 点击 issue 仍打开对应日期。
- 打开后保留一条临时提示，例如“需要检查：自慰记录 1 / 素材 2 / 来源平台”。

增强可选：

- 滚动到对应区块。
- 高亮对应区块。
- 自动展开折叠区。

增强项不是插刀 0C 的必要前提。

## 验收

- issue 卡片不只显示日期和泛化消息。
- 已知 path 能转成用户可读位置。
- 未知 path 仍显示人工检查路径。
- 点击 issue 后用户知道检查哪个区块。
- 不新增复杂表单路由系统。
