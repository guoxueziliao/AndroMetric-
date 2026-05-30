# 0.2.12 开发刀序与验收

> 本文定义 0.2.12 的候选实现顺序、验收和停线条件。

## 候选刀序

### 刀 1：代码校准与来源确认

执行文档：[`knife-1-code-source-calibration.md`](./knife-1-code-source-calibration.md)。

目标：
- 确认 0.2.8 - 0.2.11 来源是否真实落地。
- 确认默认不新增 schema。

验收：
- 输出可读取来源清单。
- 未落地来源必须隐藏。

### 刀 2：阶段回顾契约与章节构建

执行文档：[`knife-2-stage-review-builder.md`](./knife-2-stage-review-builder.md)。

目标：
- 按 [阶段回顾契约](./stage-review-contract.md) 构建月度回顾。
- 按 [来源与章节](./sources-and-sections.md) 控制章节。

验收：
- 不持久化回顾结果。
- 不生成评分或评级。

### 刀 3：回顾 UI 与导航

执行文档：[`knife-3-review-ui-navigation.md`](./knife-3-review-ui-navigation.md)。

目标：
- 在 Stats / 历史附近展示阶段回顾。
- 不新增顶级导航。

验收：
- 章节可折叠或分区。
- 空状态不制造失败感。

### 刀 4：记录缺口与限制说明

执行文档：[`knife-4-record-gaps-limitations.md`](./knife-4-record-gaps-limitations.md)。

目标：
- 展示缺失记录和隐藏章节原因。
- 保留 limitations。

验收：
- 不写成诊断准确率。
- 不评价用户记录好坏。

### 刀 5：Safety / Privacy 审计

执行文档：[`knife-5-safety-privacy-audit.md`](./knife-5-safety-privacy-audit.md)。

目标：
- 审计文案、隐私和导出边界。

验收：
- 禁词清除。
- 不新增分享或导出。

## 版本验收

- 用户能查看月度阶段回顾。
- 回顾由既有数据只读生成。
- 未落地来源被隐藏。
- 不输出评分、诊断、预测或分享报告。

## 停下来重谈

- 需要年度报告。
- 需要导出。
- 需要 AI 总结。
- 需要持久化回顾。
