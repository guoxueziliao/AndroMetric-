# 0.2.8 状态判定规则

> 本文收口 0.2.8 的三类状态映射。目标是让提示温和、可解释，并避免把个人波动写成诊断。

## 输入

每个指标至少需要：

- currentValue：14 / 30 天当前窗口聚合值。
- baselineRange：90 天个人常态核心范围。
- baselineMedian：90 天个人中位数。
- currentSampleSize：当前窗口可用样本。
- baselineSampleSize：baseline window 可用样本。
- missingDays：窗口内缺失天数。
- coverage：可用样本 / 应有样本。
- limitations：缺失、来源和口径限制。

这些字段由 [派生数据契约](./derived-data-contract.md) 统一输出。

`baselineRange` 第一版优先使用 P25 - P75。若分布过稀、取值过少或实现工具不足，可以退回 median +/- MAD，并在 limitations 中说明。

## 数据不足

输出 `insufficient_data` 的条件：

- currentValue 为空。
- baselineRange 为空。
- currentSampleSize < 5。
- baselineSampleSize < 15。
- current coverage < 50%。
- baseline coverage < 50%。
- 指标来源只有低质量迁移值，无法确认真实记录含义。

次数 / 负荷类指标例外：如果某一天有可信日记记录，且没有 sex / masturbation / porn event，该天可以计为 0；如果整天没有日记记录，则仍是缺失。

## 仍在个人常态内

输出 `within_personal_normal` 的条件：

- currentValue 落在 baselineRange 内。
- 或 14 天窗口偏离，但 30 天窗口仍在 baselineRange 内。
- 或 14 / 30 天方向相互矛盾，无法形成稳定变化。

允许文案：

- “当前仍在你的个人常态范围内。”
- “最近 14 天有波动，但 30 天窗口仍接近你的个人常态。”

不写成：

- “正常。”
- “健康。”
- “没有问题。”

## 偏离但样本有限

输出 `shift_with_limited_confidence` 的条件：

- currentValue 高于或低于 baselineRange。
- currentSampleSize >= 5。
- baselineSampleSize >= 15。
- current / baseline coverage 都 >= 50%。
- limitations 不包含会直接改变指标含义的阻断项。

所有偏离都必须保留“样本有限”语气。即使样本较多，也不能升级为异常、风险或强结论。

允许文案：

- “最近 14 天低于你的 90 天个人常态范围，但样本有限。”
- “最近性负荷高于你的个人常态，建议结合恢复、睡眠和压力一起看。”

## Confidence 上限

0.2.8 v1 用户可见 confidence 只允许：

- `none`：数据不足，只展示事实。
- `low`：达到最低样本，但样本、覆盖率或来源限制较多。
- `medium`：baselineSampleSize >= 30、currentSampleSize >= 15，且 coverage 都 >= 70%。

不输出 `high`。若内部工具得到 high，应在 0.2.8 v1 映射为 medium。

## 缺失数据降级

缺失数据优先级高于偏离提示：

- coverage < 50%：直接 `insufficient_data`。
- coverage 50% - 69%：最多 `low` confidence。
- coverage >= 70%：可到 `medium` confidence。

如果缺失集中在当前窗口后半段，文案应强调“近期记录缺口”，不制造趋势判断。
