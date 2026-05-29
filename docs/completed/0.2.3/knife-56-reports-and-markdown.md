# 0.2.3 刀 56 执行拆解

> 本文只规划刀 56：周报 / 月报与 Markdown 导出。它承接刀 55 的复盘结构。

## 状态

- 所属版本：0.2.3。
- 当前阶段：待刀 55 完成后执行。
- 实现边界：本地周报 / 月报和 Markdown 导出。

## 必读文档

1. [`report-markdown-template.md`](./report-markdown-template.md)
2. [`review-center-and-reports.md`](./review-center-and-reports.md)
3. [`weak-correlation-insights.md`](./weak-correlation-insights.md)

## 目标

完成后应具备：

- 自然周报告。
- 自然月报告。
- Markdown 导出。
- 导出前敏感成人健康数据提醒。
- 文件名不包含露骨词。

## 导出边界

- 本地生成。
- 不上传。
- 不做分享图。
- 不默认打开系统分享。
- 默认不包含 notes 全文、具体平台名、URL 或内容本体。

## Tests

必须覆盖：

- 周报文件名。
- 月报文件名。
- Markdown 包含 sampleSize / confidence / limitations。
- Markdown 不默认包含 notes 全文。
- Markdown 不默认包含具体平台名。
- 导出前确认可见。

## 非目标

- 不做分享图。
- 不实现 notes 显式选择导出。
- 不做云同步。
- 不新增 schema / migration。

## 交接给刀 57

刀 57 审计报告、导出提示、空状态和 insight 文案。
