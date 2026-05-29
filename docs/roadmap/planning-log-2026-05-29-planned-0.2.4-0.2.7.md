# 规划流水 2026-05-29：0.2.4 - 0.2.7

> 本文保存从 `future-development.md` 拆出的 0.2.4 - 0.2.7 planned 流水。索引见 [`planning-log-2026-05-29.md`](./planning-log-2026-05-29.md)。

## 0.2.4 已完成

- 文档：[`docs/completed/plan-0.2.4.md`](../completed/plan-0.2.4.md)
- 专题索引：[`docs/completed/0.2.4/README.md`](../completed/0.2.4/README.md)
- 当前状态：代码实现完成，已归档。
- 主方向：养成系与关系/表现训练。
- 暂定基调：从复盘走向养成，让性健康、做爱表现、恢复和关系质量形成可持续改进路径。
- 2026-05-28：为避免单个计划文档过长，0.2.4 已拆分为短入口和范围/模型、性表现/关系、建议/轻目标、Safety Rails、刀序验收、入口/UI、候选归档 7 个专题文档。
- 2026-05-28：完成 0.2.4 文档一致性审计，当时确认 0.2.4 已形成研究草案；随后继续推进刀 1 数据模型最终审计。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-1-data-model-final-audit.md`，把刀 1 拆成 schema / migration 前的字段、状态转换、导入导出、snapshot integrity、runtime allowlist 和 Safety Rails 绕过点审计清单。
- 2026-05-28：完成 0.2.4 刀 1 模型定稿决策，0.2.4 推进为执行草案 / 待实现；未知或禁用 category、非法周期跳过目标并产生 warning，orphan check-in 保留并产生 warning，pause / complete 同步目标状态，adjust 不自动创建新目标。后续若进入 0.2.4 实现，从刀 2 schema / migration / import-export 开始。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-2-schema-migration-import-export.md`，定下刀 2 持久化闭环：`training_goals` / `goal_checkins` store、空表 migration、JSON `trainingGoals` / `goalCheckins`、import normalize warning、snapshot integrity 和验证样本。
- 2026-05-28：新增 `docs/planned/0.2.4/knife-3-rule-based-suggestions.md`，定下刀 3 本地规则建议边界：不叫 AI、不持久化 `TrainingSuggestion`、不自动创建目标；输出 1 - 3 条建议和候选轻目标，并通过 Safety Rails 过滤。
- 2026-05-28：补齐 0.2.4 刀 4 - 刀 7 执行文档和实现交接摘要，覆盖轻目标创建/check-in、训练视图、关系上下文、Safety Rails 审计、实现数据流、文件候选和停下来重谈条件。0.2.4 规划可作为后续实现草案，真正实现前仍需核对当前代码状态和 0.2.3 复盘入口实际形态。
- 2026-05-29：0.2.4 正在开发；重点是 schema / migration、JSON import/export、snapshot integrity、规则建议、轻目标创建、训练视图、关系上下文和 Safety Rails。

## 0.2.5 已完成

- 文档：[`docs/completed/plan-0.2.5.md`](../completed/plan-0.2.5.md)
- 专题索引：[`docs/completed/0.2.5/README.md`](../completed/0.2.5/README.md)
- 当前状态：代码实现完成，已归档。
- 主方向：训练中心与长期目标历史。
- 结果摘要：完成代码状态校准、目标历史工作台（状态/分类筛选、签到历史、归档/恢复、orphan 提示）、跨周期进度反馈（阶段摘要、近期关注、稳定性提示、样本限制）、Dashboard 轻入口导航和 Safety/Privacy 审计。未新增 schema / migration。
- 基调：把轻目标变成可回看的长期自我管理系统，但不做训练游戏、课程平台或 AI 教练。
- 2026-05-28：新增 0.2.5 短入口和专题文档，范围包括 Training Center 条件、目标历史、跨周期反馈、默认不新增 schema、入口导航、Safety / Privacy Rails、候选刀序和归档候选能力。
- 2026-05-28：完成 0.2.5 第一轮一致性审计，确认默认不新增 schema；Training Center 先作为复盘 / 统计区域内的二级工作台或 tab，不新增顶级导航；长期反馈只做事实、稳定性和缺口提示，不做评分、排名、打卡压力或诊断。
- 2026-05-28：补齐 0.2.5 刀 1 - 刀 5 执行文档和实现交接摘要，覆盖代码状态与数据校准、目标历史工作台、跨周期进度反馈、入口 UI / Dashboard、Safety / Privacy 审计。0.2.5 实现必须先完成刀 1；若 0.2.4 训练目标数据尚未真实落地，应停止 0.2.5 实现，回到 0.2.4 或重新规划。

## 0.2.6 执行草案

- 文档：[`docs/planned/plan-0.2.6.md`](../planned/plan-0.2.6.md)
- 专题索引：[`docs/planned/0.2.6/README.md`](../planned/0.2.6/README.md)
- 当前状态：执行草案 / 待实现。
- 主方向：数据安全与长期数据承诺。
- 基调：让复杂本地数据长期可信、可检查、可恢复。
- 2026-05-28：新增 0.2.6 短入口和专题文档，范围包括 JSON backup 完整契约、dataVersion、import preview、snapshot integrity、linked ids / orphan / one-way relation、真实落地后的 training goal / check-in 完整性、只读恢复预检、CSV 可读导出边界、Markdown 导出移除和 Safety / Privacy Rails。
- 2026-05-28：补齐 0.2.6 刀 1 - 刀 6 执行文档和实现交接摘要，覆盖数据契约审计、Import Preview 风险矩阵、Snapshot Integrity 扩展、只读恢复预检、CSV 可读导出与 Markdown 移除边界、Safety / Privacy 审计。0.2.6 实现必须先完成刀 1；如果 0.2.2 - 0.2.5 数据尚未真实落地，应按真实代码状态缩小范围。
- 2026-05-28：用户确认 Markdown 导出没有实际价值，0.2.6 决策为移除或隐藏 Markdown 导出入口；JSON backup 仍是完整迁移格式，CSV 是唯一保留可读导出。
- 2026-05-28：纳入用户反馈插刀：导出默认必须是全部导出，日期区间只是可选筛选；数据生态提示“一键修复”时必须闭合到按钮或下一步动作；数据健康问题不能只跳转当天表单，必须展示具体字段 / 子项定位。
- 2026-05-28：将用户反馈升级为 0.2.6 插刀 0，优先于数据契约审计执行；候选代码入口包括导出选项弹窗、export options model、profile maintenance、MyView 和 data health check。
- 2026-05-28：补齐刀 5 当前 CSV 导出矩阵，确认当前代码仍有 Markdown 入口 / model / 测试残留，CSV 默认 notes 存在敏感全文风险；training CSV 只在真实 store / 类型落地后出现。

## 0.2.7 执行草案

- 文档：[`docs/planned/plan-0.2.7.md`](../planned/plan-0.2.7.md)
- 专题索引：[`docs/planned/0.2.7/README.md`](../planned/0.2.7/README.md)
- 当前状态：执行草案 / 待实现。
- 主方向：关系上下文与女性性健康关怀系统 v1。
- 基调：记录关系情境，帮助男性用户关怀女性伴侣的周期状态、性生活体验、沟通边界和恢复需求；不评价伴侣，不诊断关系，不做医疗判断。
- 2026-05-29：新增 0.2.7 短入口和专题文档，范围包括伴侣资料信息架构、stable partner id 与 legacy name 兼容、关系上下文工作台、Safety / Privacy Rails、候选刀序和归档候选能力。
- 2026-05-29：初步边界定为不做完整关系管理系统、不做伴侣评分 / 排名、不做关系图谱、不做分享给伴侣；新流程优先使用 stable partner id，legacy name 只兼容读取，不自动合并。
- 2026-05-29：用户确认 0.2.7 应升级为“关系上下文系统 v1”；新增关系上下文模型、记录入口与采集体验、复盘与训练使用规则三份专题。伴侣资料降级为长期上下文来源之一，单次记录也必须能填写本次关系情境。
- 2026-05-29：用户进一步确认 0.2.7 要面向“男性对女性伴侣性健康和性生活的关怀、管理、规划”，并复用当前已经存在的月经 / 生殖健康内容；文档重新定位为“关系上下文与女性性健康关怀系统 v1”，新增周期性生活规划边界，明确不做控制、催促、排卵 / 怀孕结论或医疗诊断。
- 2026-05-29：0.2.7 规划收口为执行草案；后续实现必须从刀 1 真实代码与数据契约校准开始，新想法进入 0.2.8+ 或候选归档。
