# 0.2.9 开发刀序与验收

> 本文定义 0.2.9 的候选实现顺序、版本验收和停下来重谈条件。

## 候选刀序

### 刀 1：代码校准与依赖版本确认

目标：
- 确认 0.2.8 `PersonalNormalResult` 是否真实落地。
- 确认 0.2.3 review facts、StatsEngine 和 adult events 可复用范围。
- 确认 0.2.5 / 0.2.7 只在真实落地后读取。
- 按 [刀 1 代码校准清单](./knife-1-code-calibration.md) 输出校准结果。

验收：
- 明确可进入 v1 的上下文来源。
- 明确默认不新增 schema。
- 若 0.2.8 未落地，应停止 0.2.9 实现。

### 刀 2：上下文窗口构建

目标：
- 按变化指标和窗口构建上下文 facts。
- 输出样本量、缺口和 limitations。
- 按 [刀 2 上下文窗口构建](./knife-2-context-window-builder.md) 处理隐藏规则。

验收：
- 不读取不存在的依赖版本数据。
- 不读取敏感全文。
- 样本不足只展示事实。

### 刀 3：解释卡片引擎

目标：
- 生成 `ContextExplanationCard`。
- 按 [刀 3 解释卡片引擎](./knife-3-explanation-cards.md) 控制排序、confidence 和文案。

验收：
- 不输出 high confidence。
- 不输出因果、诊断或强行动建议。
- 每张卡片带窗口、样本和 limitations。

### 刀 4：UI 与 Dashboard

目标：
- 在 0.2.8 个人常态 / 长期趋势详情中展示解释卡片。
- Dashboard 只做“有变化可回看”的轻提示和跳转。
- 按 [刀 4 UI 与 Dashboard](./knife-4-ui-dashboard.md) 落地。

验收：
- 不新增顶级导航。
- 不新增独立解释层工作台。
- Dashboard 不展示敏感上下文。
- 详情层不自动创建目标。

### 刀 5：Safety / Privacy 审计

目标：
- 按 [刀 5 Safety / Privacy 审计](./knife-5-safety-privacy-audit.md) 检查文案、隐私和导出边界。

验收：
- 禁词清除。
- 不新增可读导出。
- JSON backup 地位不变。

## 版本验收

- 用户能看到变化附近的上下文解释卡片。
- 卡片不写成原因或诊断。
- 未落地数据源被隐藏。
- 所有卡片保留 sampleSize、confidence、limitations。
- 不新增 schema、store、cache 或导出字段。

## 停下来重谈

- 需要新字段。
- 需要因果排序。
- 需要医学解释。
- 需要自动生成目标。
- 需要外部 AI。
