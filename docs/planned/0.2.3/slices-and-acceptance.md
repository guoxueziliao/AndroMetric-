# 0.2.3 开发刀序与验收

> 本文从 0.2.3 入口拆出，负责开发顺序、版本验收和实现边界。它不替代 Review Engine、复盘中心和可信度规则专题文档。

## 当前结论

0.2.3 从“洞察与复盘增强”进入执行草案时，先定三条原则：

- 先做事实时间线和窗口聚合，再做弱相关洞察。
- 入口嵌入现有统计 / 洞察区域，不新增顶级导航。
- 新增轻量 `adult behavior review engine`，但不新增数据库 schema。

## 刀序

0.2.3 接在 0.2.2 刀 49 之后，建议使用刀 50 - 刀 58。

### 刀 50：代码状态与统计边界校准

目标：

- 重新检查当前代码、dirty worktree 和 0.2.2 实际完成状态。
- 找出现有 StatsEngine / stats model / charts / export 入口。
- 确认 0.2.3 不需要 schema / migration。
- 确认成人行为事件、日志、睡眠、酒精、运动、压力、心情、硬度数据的读取来源。
- 校准清单以 [`knife-50-code-orientation.md`](./knife-50-code-orientation.md) 为准。

验收：

- 有清晰实现入口清单。
- 明确哪些现有统计能力可复用。
- 明确哪些能力由 adult behavior review engine 独立实现。
- 没有在刀 50 改业务逻辑。

### 刀 51：Review input adapter

执行拆解：[`knife-51-review-input-adapter.md`](./knife-51-review-input-adapter.md)

目标：

- 建立成人行为复盘输入数据结构。
- 把 Porn use / Masturbation / Sex / LogEntry / hardness / sleep / alcohol / exercise / mood / stress 等数据整理成纯输入。
- 支持滚动 7 / 14 / 30 天、自然周、自然月窗口。
- 输入契约以 [`review-input-and-timeline.md`](./review-input-and-timeline.md) 为准。

验收：

- adapter 不直接写 UI。
- adapter 不生成结论。
- adapter 不直接读 Dexie，Dexie 读取留在调用层。
- 时间窗口和 03:00 生理日规则一致。

### 刀 52：事实时间线与窗口聚合

执行拆解：[`knife-52-timeline-and-window-facts.md`](./knife-52-timeline-and-window-facts.md)

目标：

- 先输出事实时间线。
- 计算窗口内事件数量、时长、射精次数、边缘控制次数、硬度均值、睡眠缺口、疲劳和满意度。
- 支持同一生理日内事件链路展示。
- timeline 和聚合输出以 [`review-input-and-timeline.md`](./review-input-and-timeline.md) 为准。

验收：

- 可以展示滚动 7 / 14 / 30 天事实摘要。
- 可以展示自然周 / 自然月事实摘要。
- 时间线按 `targetDate` 分组、按 `startedAt` 排序。
- 不输出相关性或判断。

### 刀 53：样本量与可信度守门

执行拆解：[`knife-53-confidence-gating.md`](./knife-53-confidence-gating.md)

目标：

- 实现 `ReviewConfidence`。
- 建立样本不足时的降级规则。
- 所有 insight 输出都携带 `sampleSize`、`confidence`、`limitations`。

验收：

- 样本不足时只展示事实。
- 0.2.3 默认最多输出到 `medium` confidence。
- UI 无法绕过 confidence / limitations。
- 禁止医学诊断、成瘾判定、强因果和道德化语言。

### 刀 54：弱相关观察

执行拆解：[`knife-54-weak-correlation-insights.md`](./knife-54-weak-correlation-insights.md)

目标：

- 在已有事实聚合基础上做轻量共现和窗口比较。
- 覆盖硬度 / 恢复主轴，以及 Porn use、Masturbation、Sex、射精、睡眠、疲劳等上下文。
- 第一批指标组合以 [`weak-correlation-insights.md`](./weak-correlation-insights.md) 为准。

验收：

- 只输出弱相关观察，不输出强因果。
- 每条观察都有 supporting facts。
- 所有观察都通过样本量与可信度守门。
- 样本不足时不包装成洞察。

### 刀 55：成人行为复盘入口与总览 UI

执行拆解：[`knife-55-review-home-ui.md`](./knife-55-review-home-ui.md)

目标：

- 在现有统计 / 洞察区域加入“成人行为复盘”入口。
- 首屏围绕硬度、勃起质量、恢复、睡眠和行为负荷。
- 二级内容承载色情使用、自淫 / 自慰、性行为和事件链路。
- 首屏信息架构以 [`review-home-information-architecture.md`](./review-home-information-architecture.md) 为准。

验收：

- 不新增顶级导航。
- 不把首屏做成色情使用统计器。
- 关键信息在手机 Chrome 可读。
- 所有洞察展示 sampleSize / confidence / limitations。

### 刀 56：周报 / 月报与 Markdown 导出

执行拆解：[`knife-56-reports-and-markdown.md`](./knife-56-reports-and-markdown.md)

目标：

- 增加自然周周报和自然月月报。
- 保留滚动窗口复盘。
- 支持本地 Markdown 导出。
- 模板结构以 [`report-markdown-template.md`](./report-markdown-template.md) 为准。

验收：

- 导出前提示包含敏感成人健康数据。
- Markdown 不默认包含原始备注全文。
- Markdown 不默认包含具体平台名。
- 不做分享图。

### 刀 57：安全文案与隐私审计

执行拆解：[`knife-57-safety-copy-privacy-audit.md`](./knife-57-safety-copy-privacy-audit.md)

目标：

- 审计全部新增文案、空状态、toast、报告、导出提示和洞察模板。
- 确认表达是成人健康复盘，不是羞辱、训诫、医学诊断或成瘾判定。

验收：

- 无医学诊断。
- 无成瘾判定。
- 无强因果结论。
- 无道德化评价。
- 无分享导向。
- 无云端模型或联网分析。

### 刀 58：Golden path + docs + version close

执行拆解：[`knife-58-golden-path-version-close.md`](./knife-58-golden-path-version-close.md)

目标：

- 验证从记录数据到复盘、洞察、报告、Markdown 导出的完整路径。
- 更新 CHANGELOG、版本号和相关文档。
- 将 0.2.3 状态从 planned 推进到 completed 或 active 后归档。

验收：

- 旧数据可正常打开。
- 0.2.2 三类事件能进入复盘。
- 事实时间线、窗口摘要、弱相关观察、周报 / 月报可用。
- 样本不足时只展示事实。
- Markdown 导出隐私提示可用。
- `npm run test`、`npm run typecheck`、`npm run build` 通过。

## 版本完成标准

0.2.3 完成时必须满足：

- 用户能从现有统计 / 洞察区域进入成人行为复盘。
- 用户能查看滚动 7 / 14 / 30 天复盘。
- 用户能查看自然周 / 自然月报告。
- 用户能看到同一生理日成人行为事实时间线。
- 用户能看到硬度 / 恢复为主轴的窗口摘要。
- 用户能看到带 `sampleSize` 和 `confidence` 的弱相关观察。
- 样本不足时只展示事实和记录缺口。
- 用户能本地导出周报 / 月报 Markdown。
- 导出前有敏感成人健康数据提醒。
- 不新增 schema / migration。

一句话验收：

> 0.2.3 让 0.2.2 的成人行为结构化数据变成可解释的本地复盘系统，但不做诊断、成瘾判定、强因果或云端分析。

## 不做

- 新数据库表。
- 医学诊断。
- ED / 成瘾 / 性功能障碍判定。
- 强因果结论。
- 复杂黑箱模型。
- 云端模型或联网分析。
- 分享图。
- 完整训练建议或轻目标系统。

完整训练建议和轻目标进入 0.2.4。
