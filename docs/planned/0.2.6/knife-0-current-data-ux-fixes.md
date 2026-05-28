# 0.2.6 插刀 0 当前数据 UX 修复

> 本文只规划 0.2.6 的当前用户反馈小修。它优先处理已暴露的可用性问题，不改变数据模型。

## 状态

- 所属版本：0.2.6。
- 当前阶段：可优先实现。
- 来源：[`user-feedback-2026-05-28.md`](./user-feedback-2026-05-28.md)。
- 实现边界：导出范围表达、修复入口可发现、健康问题具体定位。

## 候选入口

- `features/profile/ExportOptionsModal.tsx`
- `features/profile/model/exportOptions.ts`
- `features/profile/model/useProfileMaintenance.ts`
- `features/profile/MyView.tsx`
- `utils/dataHealthCheck.ts`

## 目标 1：全部导出默认态

细节文档：[`knife-0a-export-range-ux.md`](./knife-0a-export-range-ux.md)

问题：

- 导出弹窗直接展示开始 / 结束日期。
- 用户会理解成必须选日期。

目标：

- 默认状态明确为全部导出。
- 日期筛选作为可选状态。
- 清空日期回到全部导出。

建议：

- 增加“全部 / 按日期”分段或开关。
- 默认选“全部”。
- 仅在“按日期”时显示或启用开始 / 结束日期。
- JSON / 加密 JSON 仍提示这是完整迁移格式。

- 打开导出选项默认显示“全部导出”。
- 不填日期也可导出全部数据。
- 切到日期筛选后，日期才影响导出。
- 回到全部时，日期筛选不再影响导出。

## 目标 2：修复入口可发现

细节文档：[`knife-0b-repair-entry-flow.md`](./knife-0b-repair-entry-flow.md)

问题：

- 数据生态区提示建议一键修复。
- 用户找不到按钮。
- 一键修复实际依赖数据健康检查结果。

目标：

- 数据生态提示和修复按钮形成闭环。
- 修复不可用时说明原因。
- 未体检时提示先体检。

建议：

- 数据生态提示旁增加动作。
- 未运行体检：显示“开始体检”。
- 已体检且 `canRepair=true`：显示“运行一键修复”或跳到数据健康修复按钮。
- 已体检但 `canRepair=false`：不显示“建议一键修复”。

- 出现修复建议时，用户有明确下一步。
- 不出现没有按钮的“一键修复”提示。
- 修复前仍创建安全快照并确认。
- 修复后刷新数据健康结果。

## 目标 3：健康问题具体定位

细节文档：[`knife-0c-health-issue-location.md`](./knife-0c-health-issue-location.md)

问题：

- 健康问题点击后只跳到当天表单。
- 用户不知道具体检查哪个字段或子项。

目标：

- 问题列表展示具体位置。
- 跳转后至少保留可读定位提示。
- 能把技术 path 转成业务文案。

路径文案示例：

- `masturbation[0].contentItems[1]` -> `自慰记录 1 / 素材 2`。
- `sex[0].partner` -> `性爱记录 1 / 伴侣`。
- `exercise[0]` -> `运动记录 1`。
- `sleep.startTime` -> `睡眠 / 开始时间`。

- issue 卡片显示日期、问题、严重程度、业务位置和建议动作。
- 点击问题后，用户知道应检查哪个表单区块。
- 无法自动聚焦时，也显示“需要检查：...”。
- 不只显示泛化消息和日期。

## 非目标

- 不新增 schema / migration。
- 不重写导出系统。
- 不重写健康检查模型。
- 不新增云端、账号或分享。
- 不自动修复业务事实。

## 验证

详细矩阵：[`knife-0-validation-matrix.md`](./knife-0-validation-matrix.md)

- 默认全部导出 JSON / CSV。
- 日期筛选导出 JSON / CSV。
- Markdown 导出入口移除或隐藏，不参与范围 UX 验收。
- 数据生态未体检、可修复、不可修复三种状态。
- 健康 issue path 展示。
- 点击 issue 后仍能打开对应日期，并保留具体定位提示。
