# 0.2.7 实现交接摘要

> 本文是 0.2.7 进入实现窗口前的短交接单。它不替代刀 1 - 刀 8，也不声明当前代码已经实现这些能力。

## 版本范围

0.2.7 只做关系上下文与女性性健康关怀系统 v1。

已定边界：

- 不做完整关系管理系统。
- 不做伴侣评分 / 排名。
- 不做关系图谱。
- 不做医疗诊断、怀孕结论或排卵确定性判断。
- 不用周期状态催促或安排性生活。
- 不做分享给伴侣。
- 不做云端或外部 AI。

## 数据流

候选数据流：

```text
sex record / adult behavior event
  -> relationship context v1
  -> cycle / sexual-health care context
  -> 关系上下文摘要
  -> 成人行为复盘 / 训练历史
  -> Safety / Privacy 审计
```

长期来源：

```text
PartnerProfile
  -> 长期偏好 / 边界 / 沟通背景
  -> 生殖目标 / 周期关怀背景
  -> 仅作为上下文补充
```

周期来源：

```text
ReproductiveProfile / CycleEvent / PregnancyEvent / MenstrualDailySummary
  -> 经期 / 预计窗口期 / 不适 / 备孕或避孕目标 / 恢复背景
  -> 只作为关怀和沟通提示
  -> 不生成医学结论或性生活任务
```

引用契约：

```text
stable partner id
  -> 新流程优先使用

legacy partner name
  -> 兼容读取
  -> 不自动合并
  -> 可提示用户手动关联
```

## 文件候选

实现前优先检查：

- `domain/types/partner.ts`
- `domain/types/sex.ts`
- `domain/types/adultBehavior.ts`
- `domain/types/reproductive.ts`
- `features/reproductive/model/p4Derivations.ts`
- `features/reproductive/ReproductivePanel.tsx`
- `features/sex-life/PartnerManager.tsx`
- `features/sex-life/PartnerDetail.tsx`
- `features/sex-life/PartnerEditForm.tsx`
- `features/sex-life/model/partnerManagerData.ts`
- sex record / adult behavior event 创建与编辑入口。
- `features/stats/`
- `core/storage/StorageService.ts`
- `features/profile/model/csvExport.ts`
- `features/profile/model/importPreview.ts`
- `core/storage/snapshotIntegrity.ts`

最终文件名以实现时真实代码为准。

## 刀序交接

- 刀 1：代码状态与伴侣数据校准。
- 刀 2：关系上下文 v1 模型定稿。
- 刀 3：女性性健康关怀与周期性生活规划。
- 刀 4：记录入口与采集体验。
- 刀 5：伴侣身份引用契约。
- 刀 6：复盘 / 训练使用规则。
- 刀 7：伴侣详情工作台整理。
- 刀 8：Safety / Privacy 审计。

## 验证底线

实现完成后至少验证：

```bash
npm run test
npm run typecheck
git diff --check
```

如果触达 UI 或导出入口，也应跑：

```bash
npm run build
```

## 停下来重谈

如果实现中发现以下情况，停止扩张：

- 需要自动合并伴侣。
- 需要重写历史 sex record。
- 需要新增完整关系管理模型。
- 需要把关系上下文字段做成必填。
- 需要评分、排名、匹配度或伴侣比较。
- 需要用周期窗口自动安排性生活。
- 需要女性健康诊断、怀孕结论或排卵确定性。
- 需要把伴侣私密备注放进可读导出。

## 交接结论

0.2.7 已收口为执行草案。实现窗口必须从刀 1 开始，以真实代码状态决定关系上下文和周期关怀上下文落在哪个数据结构；不得凭规划文档假设伴侣引用已经完全稳定，也不得把关系上下文扩成关系管理系统或女性健康诊断系统。
