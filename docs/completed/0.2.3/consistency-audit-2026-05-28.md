# 0.2.3 全文一致性审计（2026-05-28）

> 本文记录 0.2.3 进入实现前的一轮全文一致性审计。审计只覆盖规划文档，不代表代码已实现。

## 结论

本轮发现并修正 1 个范围冲突：路线图中仍把“轻量养成 v0”列入 0.2.3，但当前 0.2.3 文档已经明确训练建议和轻目标进入 0.2.4。修正后，0.2.3 文档集未发现硬冲突。

当前可按 [`knife-50-code-orientation.md`](./knife-50-code-orientation.md) 进入代码入口校准。

## 已确认一致

- 版本定位：0.2.3 是洞察与复盘增强，承接 0.2.2 的成人行为结构化数据。
- 数据边界：0.2.3 不新增 schema / migration，不新增数据库表，不持久化 review result。
- Engine 边界：新增轻量 adult behavior review engine；不把现有 StatsEngine 改成成人行为专用引擎。
- 输入边界：adapter 生成 `AdultBehaviorReviewInput`，只整理纯数据，不生成判断。
- 事实层边界：timeline 和 aggregation 只输出事实，不输出相关性、诊断、成瘾判断或行为建议。
- 时间线：按 `targetDate` 分组，成人行为事件按 `startedAt` 排序；linked ids 只展示链路，不推断因果。
- 入口形态：嵌入现有统计 / 洞察区域，不新增顶级导航；Dashboard 只放轻入口或摘要提示。
- 实现交接：交接摘要只给出数据流和文件拆分候选，最终代码入口仍由刀 50 按真实代码确认。
- 首屏主轴：硬度、勃起质量、恢复、睡眠和行为负荷；不把 Porn use 次数或时长做成首屏最大指标。
- 样本规则：所有 insight 必须带 `sampleSize`、`confidence`、`supportingFacts`、`limitations`。
- 样本门槛：`sampleSize < 3` 只展示事实；`3 <= sampleSize < 7` 为 low；`sampleSize >= 7` 才可考虑 medium。
- 可信度上限：0.2.3 默认不主动输出 high confidence。
- 弱相关观察：第一批只覆盖睡眠与晨间硬度、性活动负荷与疲劳、Porn use 与次日硬度、Masturbation、Sex、记录质量。
- 报告边界：周报 / 月报 Markdown 本地生成，导出前提醒包含敏感成人健康数据。
- Markdown 默认排除：notes 全文、具体平台名、URL、图片 / 视频 / 音频内容本体、伴侣隐私备注。
- 安全边界：不做医学诊断、成瘾判定、强因果、道德化评价、羞辱语言、云端模型、联网分析或分享图。
- 0.2.4 边界：完整训练建议、轻目标系统和养成路径不进入 0.2.3。

## 已修正

- `docs/roadmap/roadmap.md`：移除 0.2.3 “轻量养成 v0”，改为 0.2.3 不做完整训练建议或轻目标系统。
- `docs/roadmap/future-development.md`：把过期的“4 个专题文档”说法改成不依赖数量的“短入口和专题文档”。
- `docs/completed/0.2.3/implementation-handoff.md`：新增实现窗口短交接，明确 adapter -> facts -> confidence -> insights -> UI / report 的数据流和停下来重谈条件。

## 验证结果

- Markdown 相对链接：全部可解析。
- `git diff --check`：通过。
- 0.2.3 文档长度：当前最长专题文档约 210 行，未出现超长单文档。

## 下一步

后续继续规划时，可以选择：

1. 直接进入实现窗口，从刀 50 代码入口校准开始。
2. 进入实现前再做一次代码状态实际核对。
3. 如继续规划，优先讨论 0.2.4 与 0.2.3 的交界。
