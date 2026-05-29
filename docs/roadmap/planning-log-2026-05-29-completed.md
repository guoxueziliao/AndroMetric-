# 规划流水 2026-05-29：已完成版本

> 本文保存从 `future-development.md` 拆出的 0.2.1 - 0.2.5 完成版本记录。索引见 [`planning-log-2026-05-29.md`](./planning-log-2026-05-29.md)。

## 0.2.1 已完成

- 文档：[`docs/completed/plan-0.2.1.md`](../completed/plan-0.2.1.md)
- 当前状态：开发完成并归档，剩余只保留品牌命名插刀可能带来的文案/资产同步。
- 已完成方向：应用层视觉与交互，包括 overlay、反馈、布尔控件、DataCard / RecordCard、HardnessSelector、图标与动效规则。

## 0.2.2 实现完成

- 文档：[`docs/completed/plan-0.2.2.md`](../completed/plan-0.2.2.md)
- 专题索引：[`docs/completed/0.2.2/README.md`](../completed/0.2.2/README.md)
- 当前状态：代码实现完成，已归入低频完成文档。
- 主方向：把成人行为和色情使用记录补成可复盘的健康数据闭环。
- 结果摘要：三类成人行为事件独立建模，完成 schema / migration、导入导出、snapshot integrity、最小记录入口、事件关联 UI 和基础复盘。
- 维护规则：后续不再扩 0.2.2 范围；需要细节时查 `docs/completed/0.2.2/`。
- 2026-05-29：0.2.2 文档迁移到 `docs/completed/`，不再占用 `planned/` 维护面。

## 0.2.3 实现完成

- 文档：[`docs/completed/plan-0.2.3.md`](../completed/plan-0.2.3.md)
- 专题索引：[`docs/completed/0.2.3/README.md`](../completed/0.2.3/README.md)
- 当前状态：代码实现完成并已推送。
- 主方向：洞察与复盘增强。
- 结果摘要：完成 review input adapter、事实时间线、窗口聚合、confidence gating、弱相关观察、复盘入口 UI、周报 / 月报导出和安全文案审计。
- 维护规则：后续规划默认只继承 0.2.3 的复盘事实、样本量和可信度规则；需要细节时查 `docs/completed/0.2.3/`。
- 2026-05-29：0.2.3 刀 50 - 刀 58 代码实现完成并推送。
- 2026-05-29：0.2.3 文档迁移到 `docs/completed/`，后续规划默认只查 0.2.4+。

## 0.2.4 实现完成

- 文档：[`docs/completed/plan-0.2.4.md`](../completed/plan-0.2.4.md)
- 专题索引：[`docs/completed/0.2.4/README.md`](../completed/0.2.4/README.md)
- 当前状态：代码实现完成，已归档。
- 主方向：养成系与关系/表现训练。
- 结果摘要：完成 schema / migration（Dexie v8，training_goals + goal_checkins）、导入导出与 snapshot integrity、本地规则型建议系统（6 条规则 + Safety Rails 过滤）、轻目标创建与签到（完整生命周期）、训练视图嵌入复盘页、Dashboard 轻提示、关系上下文接入和 Safety Rails 最终审计。
- 维护规则：后续规划默认继承 0.2.4 的训练目标和签到模型；需要细节时查 `docs/completed/0.2.4/`。
- 2026-05-29：0.2.4 刀 2 - 刀 7 代码实现完成并推送（400 tests）。
- 2026-05-29：0.2.4 文档迁移到 `docs/completed/`，后续规划默认只查 0.2.5+。

## 0.2.5 实现完成

- 文档：[`docs/completed/plan-0.2.5.md`](../completed/plan-0.2.5.md)
- 专题索引：[`docs/completed/0.2.5/README.md`](../completed/0.2.5/README.md)
- 当前状态：代码实现完成，已归档。
- 主方向：训练中心与长期目标历史。
- 结果摘要：完成代码状态校准、目标历史工作台（状态/分类筛选、签到历史、归档/恢复、orphan 提示）、跨周期进度反馈（阶段摘要、近期关注、稳定性提示、样本限制）、Dashboard 轻入口导航和 Safety/Privacy 审计。未新增 schema / migration。
- 维护规则：后续规划默认继承 0.2.5 的目标历史工作台；需要细节时查 `docs/completed/0.2.5/`。
- 2026-05-29：0.2.5 刀 1 - 刀 5 代码实现完成（418 tests）。
- 2026-05-29：0.2.5 文档迁移到 `docs/completed/`，后续规划默认只查 0.2.6+。
