# 0.2.9 刀 2 上下文窗口构建

> 本文定义如何围绕 0.2.8 的变化窗口构建上下文 facts。

## 前置条件

- 刀 1 已确认 0.2.8 结果可读。
- 可用上下文来源已列出。
- 未落地依赖已隐藏。

## 输入

- changed metric id。
- current window：14 / 30 天。
- 0.2.8 state / confidence / limitations。
- 可用上下文 series 或 facts。

## 输出

建议结构：

```ts
interface ContextWindowFact {
  contextType: string;
  windowDays: 14 | 30;
  sampleSize: number;
  missingDays: number;
  summary: string;
  confidence: 'none' | 'low' | 'medium';
  limitations: string[];
}
```

## 构建规则

- 与变化指标使用同一个 current window。
- 不单独扩大窗口制造结论。
- 样本不足时只输出事实。
- 上下文缺失时输出 record gap。
- 不计算因果强度。

## 缺口类型

- missing_log。
- missing_field。
- missing_event_detail。
- dependency_not_available。
- legacy_value_unclear。

## 验收

- 每个 fact 都有 sampleSize。
- 每个 fact 都有 limitations。
- 不读取敏感全文。
- 不生成原因排序。

## 停下来重谈

- 需要跨 180 天解释。
- 需要计算因果强度。
- 需要外部基准。
- 需要新字段。
