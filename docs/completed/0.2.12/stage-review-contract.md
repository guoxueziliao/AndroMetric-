# 0.2.12 阶段回顾契约

> 本文定义阶段回顾的窗口、章节和输出结构。0.2.12 只做只读派生，不新增 schema。

## 窗口

默认：

- 自然月。

可选：

- 自然季度。

不做：

- 年度总结。
- 任意自定义超长窗口。

## 建议结构

```ts
interface StageReview {
  periodType: 'month' | 'quarter';
  startDate: string;
  endDate: string;
  sections: StageReviewSection[];
  limitations: string[];
}
```

章节：

- personal_normal。
- context_explanations。
- observation_plans。
- experience_cards。
- record_gaps。

## 只读边界

阶段回顾：

- 不写入 IndexedDB。
- 不进入 JSON backup。
- 不默认进入 CSV。
- 不生成可分享报告。

如果需要持久化，应回到规划重谈。

## 输出边界

允许：

- 事实摘要。
- 样本量。
- 记录缺口。
- 用户经验卡引用。
- limitations。

不允许：

- 健康评分。
- 阶段评级。
- 成功 / 失败。
- 医学结论。
