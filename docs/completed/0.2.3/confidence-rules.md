# 0.2.3 样本量与可信度规则

> 本文从 0.2.3 入口拆出，保存样本量、可信度、允许输出和禁止输出规则。

## 已定样本量与可信度规则

0.2.3 所有洞察必须带样本量和可信度。

规则：

- 所有洞察必须包含 `sampleSize`。
- 所有洞察必须包含 `confidence`。
- 样本不足时只展示事实，不输出判断。
- 0.2.3 默认最多输出到 `medium` confidence，除非后续算法和样本量足够支撑。

### Confidence 等级

```ts
type ReviewConfidence = 'none' | 'low' | 'medium' | 'high';
```

含义：

- `none`：样本不足，只展示事实和记录缺口。
- `low`：样本少或波动大，只做轻提示。
- `medium`：样本初步可看，可以输出弱相关观察。
- `high`：样本较多且趋势稳定，但仍不输出强因果结论。

0.2.3 默认不主动追求 `high`，避免复盘系统过度自信。

### 允许输出

允许：

- “在你的记录里，A 和 B 经常同日出现。”
- “高色情使用时长窗口的次日硬度均值更低，但样本有限，仅供观察。”
- “近 14 天射精次数较上个窗口增加，疲劳自评也更高。”
- “睡眠不足后的硬度记录偏低。”
- “当前样本不足，建议继续记录 14 天后再看。”
- “本期缺少睡眠记录，相关复盘可信度较低。”

### 禁止输出

禁止：

- 医学诊断，例如“你有性功能障碍”。
- 成瘾判定，例如“你色情成瘾”。
- 强因果结论，例如“色情导致你硬度下降”。
- 道德化评价，例如“你射精过度”“你应该克制”。
- 羞辱性或训诫式语言。
- 样本不足时包装成洞察。
- 将用户的成人偏好评为好/坏。

### 输出结构

review engine 输出建议包含：

```ts
interface ReviewInsight {
  id: string;
  metric: string;
  window: '7d' | '14d' | '30d' | 'week' | 'month';
  sampleSize: number;
  confidence: ReviewConfidence;
  direction?: 'up' | 'down' | 'mixed' | 'flat';
  summary: string;
  supportingFacts: string[];
  limitations: string[];
}
```

UI 文案可以更自然，但不得删除样本量和限制说明。

第一批弱相关观察的指标组合和样本量门槛见 [`weak-correlation-insights.md`](./weak-correlation-insights.md)。
