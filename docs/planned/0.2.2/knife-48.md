# 0.2.2 刀 48 执行拆解

> 本文只规划刀 48：Basic review loop。它承接刀 47 的事件关联 UI，只做同一生理日的事实回看，不做 0.2.3 review engine。

## 状态

- 所属版本：0.2.2。
- 当前阶段：已完成。
- 前置：刀 41 - 47 数据、模型、storage、UI、事件关联。
- 实现边界：建立基础复盘视图，让用户能回看同一生理日内 Porn use / Masturbation / Sex 事件和关联链路。

## 必读文档

实现前按顺序读：

1. [`plan-0.2.2.md`](../plan-0.2.2.md)
2. [`knife-47.md`](./knife-47.md)
3. [`adult-behavior-data-model-types.md`](./adult-behavior-data-model-types.md)
4. [`adult-behavior-data-model-links.md`](./adult-behavior-data-model-links.md)
5. [`../0.2.3/review-center-and-reports.md`](../0.2.3/review-center-and-reports.md)
6. [`../0.2.3/confidence-rules.md`](../0.2.3/confidence-rules.md)
7. [`../completed/plan-0.2.1.md`](../../completed/plan-0.2.1.md)
8. [`../completed/ui-interaction-system.md`](../../completed/ui-interaction-system.md)

实现前还必须检查：

- `git status --short`
- 现有 stats / review / dashboard 入口。
- 三类事件按 `targetDate` 和 `startedAt` 查询能力。
- 刀 47 的 linked ids UI 和 storage 行为。
- 现有 RecordCard / DataCard / adult tone 实际 API。
- 手机 Chrome 下列表和长内容滚动表现。

## 刀 48 目标

完成后应具备：

- 用户能查看同一生理日内三类成人行为事件。
- 事件按 `startedAt` 排序形成事实时间线。
- 每类事件显示关键字段摘要。
- 已关联事件能展示链路。
- 样本不足时只展示事实，不输出判断。
- 不做趋势、相关性、报告、建议或医学解释。

## 与 0.2.3 的边界

刀 48 不是 0.2.3 review engine。

刀 48 允许：

- 同一生理日事实回看。
- 单日事件时间线。
- 单条事件关键字段摘要。
- 事件关联链路展示。
- 数据缺口提示。

刀 48 不做：

- 7 / 14 / 30 天趋势。
- 自然周 / 自然月报告。
- sampleSize / confidence 洞察结构。
- 弱相关观察。
- 行为因素关联分析。
- Markdown 报告导出。
- 训练建议或轻目标。

这些进入 0.2.3+。

## 实现顺序

### 1. Review entry

入口候选：

- 日记编辑页的成人行为区块。
- 当日详情 / 历史记录中的成人行为摘要。
- Stats / Dashboard 中的轻入口。

规则：

- 刀 48 只需要一个稳定入口。
- 入口命名可以使用“成人行为复盘”或“成人行为时间线”。
- 不把入口做成 0.2.3 综合复盘中心。
- 不新增独立报告页面。

### 2. Day timeline

要落地：

- 按 `targetDate` 读取同一生理日三类事件。
- 按 `startedAt` 排序。
- 按事件类型使用 adult tone 或现有 RecordCard / DataCard 语义。
- 空状态显示短句，例如“这一天还没有成人行为事件”。

展示规则：

- 事实优先。
- 不把 Porn use 放成主轴统计器。
- 不展示色情内容 URL、缩略图、图片、视频或演员名。
- 不展示伴侣评分或排名。

### 3. Key fields summary

Porn use 摘要：

- 开始时间。
- 时长。
- content / source 类型。
- 兴奋强度。
- 是否进入自慰。
- 是否射精。
- 使用后状态。

Masturbation 摘要：

- 开始时间。
- 时长。
- 是否射精。
- 高潮 / 射精强度。
- 边缘控制。
- 硬度。
- 兴奋强度。
- 满意度 / 事后状态。

Sex 摘要：

- 开始时间。
- 时长。
- 伴侣上下文摘要，如可用。
- 硬度。
- 是否射精。
- 满意度。
- 色情内容是否参与。
- 事后状态 / 恢复相关字段。

规则：

- 缺失字段显示“未记录”或省略，按现有 UI 风格决定。
- 不把缺失字段表达成失败。
- 不因为样本少输出解释。

### 4. Linked chain display

要落地：

- 展示 Porn use -> Masturbation。
- 展示 Porn use -> Sex。
- 展示 Masturbation -> Sex。
- 支持从链路项跳到对应事件详情或编辑入口，如已有入口可用。
- Orphan linked id 显示为“关联事件已不存在”，并提供进入刀 47 的清理能力。

规则：

- 链路展示只表达“有关联”，不表达因果。
- 不说“Porn use 导致自慰 / 性表现变化”。
- 不说“某伴侣导致表现好 / 差”。
- 不自动修复关联，修复交给刀 47 / integrity 能力。

### 5. Data gaps

允许提示：

- “这一天没有硬度记录。”
- “这次事件未记录时长。”
- “这次性行为未记录是否有色情内容参与。”
- “存在关联事件已不存在。”

禁止提示：

- “你记录得不够好。”
- “样本不足但仍给出结论。”
- “色情导致硬度下降。”
- “你射精过度。”
- “这个伴侣影响你的表现。”

### 6. Mobile acceptance

手机 Chrome 必查：

- 时间线在 320px 宽度不水平溢出。
- 卡片 action 按钮最小 36px。
- 长时间线滚动顺畅。
- 链路展示不挤压关键字段。
- Toast / BottomSheet / Modal 不遮挡底部导航和键盘。
- 成人 tone 在深色模式下对比度足够。

## 非目标

刀 48 不做：

- 0.2.3 adult behavior review engine。
- 周报 / 月报。
- Markdown 报告导出。
- 趋势图。
- 相关性分析。
- sampleSize / confidence 洞察。
- 医学诊断。
- 成瘾判定。
- 强因果结论。
- 训练建议。
- 轻目标。
- 伴侣评分 / 排名。
- 分享图。

这些属于 0.2.3+、0.2.4+ 或明确不做范围。

## Tests

优先新增或扩展 review UI / model selector tests，具体形式按现有测试栈决定。

必须覆盖：

- 按 `targetDate` 读取同一生理日三类事件。
- 按 `startedAt` 排序。
- Porn use 摘要展示关键字段。
- Masturbation 摘要展示关键字段。
- Sex 摘要展示关键字段。
- linked chain 展示 Porn use <-> Masturbation。
- linked chain 展示 Porn use <-> Sex。
- linked chain 展示 Masturbation <-> Sex。
- Orphan linked id 展示缺失状态。
- 缺字段时不输出判断性文案。
- 不出现强因果、诊断、成瘾或伴侣评分文案。

## 验收

刀 48 完成时至少跑：

```bash
npm run typecheck
npm run test
```

如果改动 dashboard / stats / route / bundle，建议同时跑：

```bash
npm run build
```

还应做手机 Chrome 手动验收：

- 查看有 Porn use / Masturbation / Sex 的同一生理日。
- 查看无成人行为事件的空状态。
- 查看有关联链路的事件。
- 查看 orphan linked id。
- 从链路跳转到事件详情或编辑入口，如该入口可用。

验收标准：

- typecheck 通过。
- review loop 相关测试通过。
- 同一生理日时间线可用。
- 关键字段事实展示清楚。
- 关联链路展示不表达因果。
- 无 0.2.3 复盘引擎范围蔓延。

## 交接给刀 49

刀 48 完成后，刀 49 接：

- Golden path。
- 旧数据升级验证。
- 新事件创建 / 编辑 / 删除 / 导入 / 导出 / 快照验证。
- 手机 Chrome 验证。
- 版本文档和收口。
