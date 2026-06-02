# 0.2.17 执行计划

## 目标

实现高级筛选与自定义回看。开发完成后，用户可以按时间、行为、关系、健康项目和数据质量组合筛选长期记录，并查看只读回看结果。

## 进入开发前校准

先读这些入口：

- `features/stats/StatsView.tsx`：统计页入口和 tabs。
- `features/stats/ui/ReviewSection.tsx`：成人行为复盘数据流。
- `features/stats/model/adultBehaviorReviewFacts.ts`、`adultBehaviorReviewInsights.ts`：复盘事实和洞察。
- `features/stats/ui/PersonalNormalSection.tsx`、`StageReviewSection.tsx`、`ExperienceCardSection.tsx`：长期回看可复用 UI。
- `features/sex-life/model/*Event*.ts`、`domain/types/adultBehavior.ts`：成人行为事件字段。
- `domain/types/relationshipContext.ts`：关系上下文字段和隐私备注边界。
- 0.2.13 实现后的健康项目类型和记录表。

## 筛选模型切片

建议新增纯模型文件，例如 `features/stats/model/advancedReviewFilter.ts`。

最小类型：

- `ReviewFilterDraft`：UI 草稿。
- `ReviewFilter`：已规范化条件。
- `ReviewFilterResult`：命中记录、命中事件、摘要、缺口。
- `ReviewFilterDimension`：time / behavior / relationship / healthProject / dataQuality。

组合规则：

- 维度之间默认 AND。
- 同一维度内多选默认 OR。
- 时间范围必须有上限，避免一次渲染过多。
- 默认不保存筛选视图。

## UI 切片

1. 筛选面板：时间、行为、关系、健康项目、数据质量。
2. 当前条件摘要：用短 chips 展示，支持一键清空。
3. 结果摘要：命中天数、事件数、样本限制。
4. 结果列表：按日期或事件分组，只读展示。
5. 跳转：可跳到对应日期记录或相关复盘区域。

## 数据边界

- 不做全文搜索。
- 不搜索备注全文。
- 不保存自定义筛选视图。
- 不新增 schema / migration。
- 健康项目维度只有在 0.2.13 已实现后接入；否则显示为未启用或先不展示。

## 实现顺序

1. 写筛选纯函数和类型。
2. 给纯函数补单元测试。
3. 在 StatsView 或状态页合适位置挂载筛选回看入口。
4. 接入结果摘要和只读列表。
5. 接入跳转到日期 / 复盘。
6. 做隐私和性能检查。

## 验收步骤

- 可以筛选最近 30 天内有色情使用的记录。
- 可以筛选含关系上下文的性事件，但不展示私密备注全文。
- 可以筛选数据质量不足的日期。
- 清空条件后回到默认结果。
- 刷新页面后筛选条件不保留。
- 不出现全局搜索输入框。

## 测试建议

- 单测覆盖 AND / OR 组合。
- 单测覆盖空结果、无时间范围、非法日期。
- 单测覆盖 relationship 私密字段不进入摘要。
- 手动测试 1 年数据量下页面不卡死。

## 停线项

- 用户要求保存筛选视图。
- 需要全文搜索或搜索备注正文。
- 需要新增数据库索引 / schema。
- 需要 AI 问答或报表中心。
