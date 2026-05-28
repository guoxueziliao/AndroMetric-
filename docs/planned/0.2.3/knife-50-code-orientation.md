# 0.2.3 刀 50 代码入口校准清单

> 本文只规划刀 50：代码状态与统计边界校准。它不要求当前规划窗口实现代码。

## 目标

刀 50 是 0.2.3 实现前的代码入口校准刀。

完成后必须知道：

- 0.2.2 三类成人行为事件在代码里是否已经完成。
- 现有 stats / insights / chart / export 入口在哪里。
- adult behavior review engine 应放在哪里。
- 哪些 helper 可以复用，哪些必须新建。
- 0.2.3 是否仍然不需要 schema / migration。

## 实现前必须检查

基础状态：

- `git status --short`
- `package.json`
- `app/`
- `features/`
- `core/storage/`
- `domain/`
- `shared/`

统计与洞察：

- `features/stats/`
- 现有 StatsEngine 或 stats model。
- 现有 chart data builder。
- 现有时间窗口 helper。
- 现有 Dashboard / stats page / insights page 入口。

0.2.2 数据闭环：

- Porn use event domain type。
- Masturbation event domain type。
- Sex event domain type。
- 三类事件 repository / storage read path。
- JSON export / import read path。
- snapshot integrity read path。

健康日志数据：

- LogEntry type。
- morning hardness 字段来源。
- sleep 字段来源。
- alcohol / exercise / mood / stress / fatigue 字段来源。
- 生理日 03:00 helper。

导出：

- 现有 Markdown export。
- 现有 CSV export。
- 现有加密导出入口。
- 导出前 confirm / warning pattern。

## 需要回答的问题

### StatsEngine 边界

- 现有 StatsEngine 是否存在清晰输入 / 输出边界。
- 现有 StatsEngine 是否可以复用窗口聚合 helper。
- adult behavior review engine 是否应放在 `features/stats/model/`。
- 是否需要单独文件 `adultBehaviorReview.ts`。
- 是否需要拆 adapter / facts / insights / report 四个文件。

### UI 入口

- 当前统计页是否有 tab。
- 当前洞察区域是否已有 section。
- Dashboard 是否已有轻提示入口 pattern。
- 手机 Chrome 上统计页布局是否能容纳复盘入口。

### 数据读取

- 调用层如何一次读取三类成人行为事件和 logs。
- 是否已有按日期范围读取 logs 的 helper。
- 是否已有按 `targetDate` 读取成人行为事件的 helper。
- 是否需要在 0.2.3 新增只读 selector，但不改 schema。

### 时间窗口

- 现有代码是否已有 rolling 7 / 14 / 30 天窗口。
- 现有代码是否已有自然周 / 自然月 helper。
- 是否已有统一生理日计算 helper。
- 如果没有，应在 shared lib 还是 stats model 内补纯函数。

### 导出

- Markdown export 当前是否支持表格。
- 导出前是否已有风险确认 pattern。
- 文件名生成在哪里。
- 是否能复用 0.1.1 / 0.1.3 的导出测试形态。

## 刀 50 输出

刀 50 结束时，应在实现记录或 PR 描述中明确：

- adult behavior review engine 文件位置。
- review input adapter 文件位置。
- facts / timeline / insight 文件拆分。
- UI 入口位置。
- Markdown report export 入口位置。
- 需要新增或复用的测试文件。
- 确认无需 schema / migration。

## 刀 50 不做

- 不实现 review engine。
- 不实现 UI。
- 不新增统计 insight。
- 不新增 schema / migration。
- 不改导出内容。
- 不迁移数据。

## 交接

- 刀 51 根据代码入口校准结果实现 `AdultBehaviorReviewInput` adapter。
- 刀 52 根据 [`review-input-and-timeline.md`](./review-input-and-timeline.md) 实现 facts 和 timeline。
- 刀 54 根据 [`weak-correlation-insights.md`](./weak-correlation-insights.md) 实现第一批弱相关观察。
