# 0.2.4 全文一致性审计（2026-05-28）

> 本文记录 0.2.4 继续规划时的一轮文档一致性审计。审计只覆盖规划文档，不代表代码已实现。

## 结论

0.2.4 文档集当前已经形成执行草案：主方向、数据模型边界、建议系统、轻目标、Safety Rails、入口形态、刀序和刀 1 数据模型最终审计均已明确。

短期实现线仍是 0.2.2。若后续进入 0.2.4 实现，应从刀 2 schema / migration / import-export 开始，并严格沿用刀 1 定稿的 allowlist、导入 normalize、状态转换和 integrity warning 规则。

## 已确认一致

- 版本定位：0.2.4 承接 0.2.3 复盘结果，从复盘走向训练建议、进度反馈和轻目标。
- 数据边界：允许新增最小数据模型，但必须先定稿训练数据模型，再做 schema / migration。
- 持久化边界：优先持久化 `TrainingGoal` 和 `GoalCheckin`；`TrainingSuggestion` 默认即时生成，不优先持久化。
- AI 边界：建议系统只做本地规则，不叫 AI，不调用外部 API，不上传成人行为、性表现或关系数据。
- 轻目标边界：系统只推荐候选目标，用户手动确认后才创建；系统不自动创建目标。
- 目标周期：0.2.4 默认只做 7 / 14 天；30 天作为后续增强候选。
- 目标类型：允许记录质量、恢复、硬度稳定、性表现稳定性观察、射精控制观察和关系沟通。
- 禁止目标：性次数、射精次数、伴侣数量、色情使用时长、色情刺激强度、最长做爱、伴侣评分或排名。
- 表现训练：首批覆盖硬度稳定、事后恢复、射精控制观察、做爱时长和满意度，但不做技巧库或训练课程。
- 关系维度：只做关系上下文、沟通 / 反馈和表现影响观察；不做完整关系管理系统。
- 入口形态：成人行为复盘作为主入口，Dashboard 只做轻提示；0.2.4 不新增独立 Training 页面。
- Safety Rails：目标类型、建议规则、文案和指标展示四层限制是验收条件。
- 刀 1 定稿：未知 / 禁用 category 和非法目标周期跳过目标并产生 warning；orphan check-in 保留并产生 warning；pause / complete 同步目标状态；adjust 不自动创建新目标。

## 已修正

- `training-data-model.md`：早前状态曾从“讨论中”改为“模型草案 / 待最终审计”，本轮进一步推进为“模型草案 / 刀 1 已定稿”。
- `scope-and-model.md`：移除“0.2.3 已经有轻量养成 v0”的表述，改为 0.2.4 承接 0.2.3 复盘和弱相关观察。
- `archive.md`：将早期“轻量养成 v0”表述改为承接 0.2.3 复盘和弱相关观察，避免暗示 0.2.3 已实现训练系统。
- `knife-1-data-model-final-audit.md`：新增刀 1 最终审计清单，覆盖字段、allowlist、状态转换、导入导出、snapshot integrity 和 Safety Rails 绕过点。
- `training-data-model.md`：补充刀 1 最终决策和 schema 候选，状态推进为“模型草案 / 刀 1 已定稿”。
- `knife-2-schema-migration-import-export.md`：新增刀 2 执行文档，明确 schema / migration / JSON import-export / snapshot integrity / import normalize warning 和验证样本。
- `knife-3-rule-based-suggestions.md`：新增刀 3 执行文档，明确本地规则建议、候选轻目标、输出结构、推荐优先级和 Safety Rails 过滤。
- `knife-4-goal-creation-checkin.md`：新增刀 4 执行文档，明确用户确认创建目标、周期回顾、状态转换和 check-in 边界。
- `knife-5-training-view.md`：新增刀 5 执行文档，明确复盘后训练区、Dashboard 轻提示和表现指标展示限制。
- `knife-6-relationship-context.md`：新增刀 6 执行文档，明确关系上下文、沟通反馈和中性表达边界。
- `knife-7-safety-rails-audit.md`：新增刀 7 执行文档，明确目标、建议、文案、指标和导入 warning 的最终审计。
- `implementation-handoff.md`：新增 0.2.4 实现交接摘要，集中数据流、文件候选、停下来重谈条件和验证底线。

## 已由刀 1 定稿

- `TrainingGoal.category` 需要 allowlist helper。
- 未知或禁用 `category` 跳过目标并产生 integrity warning。
- `targetWindowDays` 只允许 7 / 14；其他周期跳过目标并产生 integrity warning。
- `GoalCheckin.goalId` orphan 时保留 check-in 并产生 integrity warning。
- `cycleFeeling` 非 1 - 5 时置空并产生 integrity warning。
- `windowStartDate` 晚于 `windowEndDate` 时两个窗口字段置空并产生 integrity warning。
- check-in `pause` / `complete` 同步目标状态；`adjust` 只进入编辑流程，不自动创建新目标。
- JSON export / import 包含 `trainingGoals` 和 `goalCheckins`；Markdown / CSV 默认不包含训练目标和 check-in 数据。

## 文档长度

0.2.4 当前最长专题文档约 260 行，未出现超长单文档。若后续补刀 1 细节，优先新建短文档或继续拆分，不把 `training-data-model.md` 扩到长文。

## 下一步

后续继续规划时，建议优先做：

1. 若进入 0.2.4 实现，从刀 2 开始，不越过导入导出和 Safety Rails。
2. 实现前重新检查真实代码状态、dirty worktree 和 0.2.3 复盘入口实际形态。
3. 任何完整训练中心、长期目标历史、技巧库或关系管理扩展都进入 0.2.5+ 讨论。
