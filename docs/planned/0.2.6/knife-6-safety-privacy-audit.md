# 0.2.6 刀 6 Safety / Privacy 审计

> 本文只规划刀 6：0.2.6 收口前的数据安全、隐私、文案和 repair 审计。它不新增产品能力。

## 状态

- 所属版本：0.2.6。
- 当前阶段：待刀 5 完成后执行。
- 前置：[`knife-5-readable-export-boundary.md`](./knife-5-readable-export-boundary.md)。
- 实现边界：导入、导出、preview、integrity、repair、预检和错误文案审计。

## 审计范围

必须审计：

- JSON backup 入口。
- encrypted backup 入口。
- CSV export。
- Markdown export。
- import preview。
- FS 备份恢复。
- snapshot integrity。
- repair confirm。
- read-only preflight。
- warning / blocker 文案。
- 空状态。
- toast。

## 隐私禁止项

不得出现：

- 云同步引导。
- 账号注册引导。
- 分享图。
- 社交传播。
- 外部 AI 分析。
- 自动上传备份。
- 医生报告自动生成。

## 文案禁止项

不得出现：

- “绝对安全。”
- “永远不会丢。”
- “系统已自动修复所有问题。”
- “分享给伴侣看看你的表现。”
- “上传以获得更完整分析。”
- “数据错误说明你记录失败。”

## Repair 审计

必须确认：

- repair 前有确认。
- repair 说明影响范围。
- repair 不自动创建业务事实。
- repair 不静默删除 notes。
- repair 不静默删除成人行为历史。
- repair 不静默删除训练目标历史。

## 验收输出

刀 6 完成时应在实现记录中列出：

- 审计范围。
- 发现的问题。
- 修正方式。
- 剩余风险。
- 验证命令。

## 验证命令

刀 6 完成时至少跑：

```bash
npm run test
npm run typecheck
npm run build
git diff --check
```

## 版本收口

刀 6 通过后，0.2.6 才能进入版本收口：

- 更新 CHANGELOG。
- 更新 roadmap。
- 移动 planned / completed 状态。
- 确认没有新增后端、账号、云同步或外部 API。
- 确认没有新增 schema / migration，除非此前重新规划过。
