# 0.2.8 开发刀序与验收

> 本文负责 0.2.8 的候选开发顺序、版本验收和停下来重谈条件。

## 候选刀序

### 刀 1：统计、复盘数据与指标口径校准

目标：
- 确认 StatsEngine、0.2.3 review facts 和 adult behavior events 可复用范围。
- 确认 0.2.5 / 0.2.7 数据只在真实落地后读取。
- 按 [刀 1 代码校准清单](./knife-1-code-calibration.md) 输出校准结果。

验收：
- 输出真实代码入口清单，并明确默认不新增 schema。
- 明确哪些指标能进入第一版基线。
- 第一版指标限定为硬度 / 晨勃、恢复 / 疲劳、睡眠 / 压力和性负荷。
- 输出指标口径清单，不允许用伪数据补齐。
- 若 0.2.5 / 0.2.7 未真实落地，相关指标必须禁用或隐藏。

### 刀 2：个人基线派生模型

目标：
- 实现 30 / 60 / 90 / 180 天窗口派生。
- 默认使用 90 天 baseline 和 14 / 30 天 current window。
- 输出个人中位数、个人范围、当前窗口值、sampleSize、missingDays、confidence、limitations、dataSource 和 aggregation。
- 按 [刀 2 基线派生模型](./knife-2-baseline-derivation.md) 执行窗口、范围和缺口计算。
- 按 [派生数据契约](./derived-data-contract.md) 输出只读结果。
- 按 [状态判定规则](./state-decision-rules.md) 映射三类状态。

验收：
- 样本不足只输出事实。
- baseline range 明确是个人历史范围。
- 不持久化 baseline cache。
- 不把派生结果写入 JSON backup 或 CSV 导出。
- 用户可见输出只映射为三类状态。
- 用户可见 confidence 最高为 medium。

### 刀 3：个人常态工作台

目标：
- 按 [工作台信息架构](./workbench-information-architecture.md) 建立 Stats 内二级入口。
- 按 [刀 3 个人常态工作台](./knife-3-workbench-ui.md) 落地首屏、详情层和 Dashboard 轻提示。
- 第一屏优先展示第一层指标、记录缺口和限制说明。
- Dashboard 只做轻提示和跳转。

验收：
- 不新增顶级导航。
- 不展示人群标准。
- 不展示医学异常。
- 不在 Dashboard 展示敏感指标值或偏离方向。

### 刀 4：偏离提示与记录缺口

目标：
- 对当前窗口 vs 个人基线输出温和提示。
- 按 [刀 4 偏离提示与记录缺口](./knife-4-shift-and-gaps.md) 限制状态文案。
- 缺失数据多时降级为记录缺口，并显示样本量和 confidence。

验收：
- 不输出诊断或强因果。
- 不使用“异常”“风险等级”“达标”等词。
- 不把变化归因到伴侣。

### 刀 5：Safety / Privacy 审计

目标：
- 按 [刀 5 Safety / Privacy 审计](./knife-5-safety-privacy-audit.md) 审计长期趋势、Dashboard、导出、空状态和所有偏离提示。

验收：
- 禁止文案全部清除。
- 可读导出默认不含敏感全文。
- JSON backup 地位不变。

## 版本验收标准

0.2.8 完成时必须满足：

- 用户能看到个人长期常态范围。
- 用户能比较最近窗口和个人历史。
- 默认基线为 90 天，最近窗口为 14 / 30 天。
- 样本不足和缺失数据被明确展示。
- 所有趋势保留 sampleSize、confidence 和 limitations。
- 不输出医学诊断、人群比较、异常判定或未来预测。
- 不新增持久化 baseline cache。

## 停下来重谈

出现以下情况，应停止实现并回到规划：

- 需要新增长期 cache store。
- 需要外部人群基准。
- 需要医学阈值或诊断标签。
- 需要预测未来表现。
- 需要复杂模型或外部 AI。
- 需要把偏离提示写成风险等级。

一句话验收：0.2.8 让用户理解自己的长期常态，而不是被系统评价是否正常。
