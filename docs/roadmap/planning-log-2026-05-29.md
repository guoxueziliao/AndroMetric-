# 规划流水 2026-05-29

> 本文是 2026-05-29 规划流水索引。当前状态入口见 [`future-development.md`](./future-development.md)。

## 基线

- 项目定位：隐私优先、本地优先的男性健康与性健康数据 PWA。
- 架构基线：遵循 `docs/architecture.md` 的分层边界。
- 近期主线：0.2.6 为下一条候选线；0.2.5 及以前的完成版本不进入本轮规划维护。
- 生理日规则：03:00 前事件归属前一天，后续功能必须保持一致。
- 存储约束：无后端；IndexedDB schema 改动必须配套 migration。

## 流水拆分

- [已完成版本记录](./planning-log-2026-05-29-completed.md)：0.2.1 - 0.2.3 的归档状态和维护规则。
- [Planned 流水 0.2.4 - 0.2.7](./planning-log-2026-05-29-planned-0.2.4-0.2.7.md)：0.2.4 开发到 0.2.7 执行草案。
- [范围审计与横向候选](./planning-log-2026-05-29-scope-horizontal.md)：0.2.8 - 0.2.12 审计、品牌、性健康 / 色情使用增强和长期导出承诺。

## 当前结论

- 0.2.4：已完成，已归档至 `completed/`。
- 0.2.5：已完成，已归档至 `completed/`。
- 0.2.6 - 0.2.12：已定为后续实现链。
- 0.2.13：已删除。
- 0.2.14：前移为待讨论入口。
- 横向候选已收口：品牌延后；性健康 / 色情使用增强归入现有主线；长期健康数据导出承诺由 0.2.6 覆盖。

## 维护规则

- 本文只做索引，不追加长流水。
- 新的长讨论另开 `planning-log-YYYY-MM-DD*.md`。
- 已完成版本细节优先查 [`../completed/README.md`](../completed/README.md)。
- 当前 planned 细节优先查 [`../planned/README.md`](../planned/README.md)。
