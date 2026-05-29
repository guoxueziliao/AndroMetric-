# 0.2.4 实现完成记录（养成系与关系/表现训练）

> 本文是 0.2.4 的短入口。详细讨论已拆到专题文档，避免单个计划文件过长。

## 当前状态

- 状态：代码实现完成，已归档。
- 刀 2 - 刀 7 全部完成（400 tests）。代码实现已收口。
- 规划前置：0.2.2 成人行为事件模型已完成；0.2.3 洞察与复盘增强已完成并推送。
- 实现前置：0.2.3 复盘引擎已可用，训练系统基于复盘结果生成建议。
- 版本号：0.2.4。
- 目录索引：[`0.2.4/README.md`](./0.2.4/README.md)。
- 暂定主方向：养成系正式化、关系与伴侣维度深化、性表现训练、恢复训练。
- 已定：养成范围先做“训练建议 + 进度反馈 + 轻目标”，不做完整游戏化等级系统。
- 已定：允许新增最小数据模型，但必须先完成训练数据模型文档，再开发 schema / migration。
- 已定：做轻量规则型建议系统，不叫 AI，不做复杂引擎；只要 AI 不能本地部署，AI 功能就不做。
- 已定：轻目标采用“系统推荐，用户手动确认”，不自动创建目标。
- 已定：建立 Safety Rails，从目标类型、建议规则、文案、指标展示四层避免养成系统诱导高风险性行为。
- 已定：开发刀序和验收标准；刀 2 - 刀 7 是当前开发与验收对照。
- 已定：刀 1 数据模型最终审计完成，`TrainingGoal` / `GoalCheckin` 字段、allowlist、状态转换、导入导出和 integrity warning 规则已定。
- 当前关注：0.2.4 开发只按本文档集收口，不扩大到 0.2.5 训练中心或 0.2.6 数据安全重构。

## 文档拆分

- [范围与数据模型](./0.2.4/scope-and-model.md)
  - 核心基调。
  - 养成范围。
  - 数据模型边界。
  - 已定模型细节。
- [性表现训练与关系维度](./0.2.4/performance-and-relationship.md)
  - 硬度稳定、事后恢复、射精控制观察、做爱时长、满意度。
  - 关系上下文、沟通 / 反馈、表现影响观察。
- [建议系统与轻目标](./0.2.4/suggestions-and-goals.md)
  - 本地规则型建议系统。
  - 轻目标候选、用户确认、目标周期和用户控制。
- [Safety Rails](./0.2.4/safety-rails.md)
  - 目标类型、建议规则、文案、指标展示四层限制。
- [开发刀序与验收](./0.2.4/slices-and-acceptance.md)
  - 刀 1 - 刀 7。
  - 版本完成验收标准。
- [刀 1 数据模型最终审计清单](./0.2.4/knife-1-data-model-final-audit.md)
  - 字段、状态转换、导入导出、runtime 校验和 Safety Rails 绕过点。
- [刀 2 Schema / Migration / Import-Export](./0.2.4/knife-2-schema-migration-import-export.md)
  - `training_goals` / `goal_checkins` store、migration、JSON import/export、snapshot integrity 和测试样本。
- [刀 3 规则型建议系统](./0.2.4/knife-3-rule-based-suggestions.md)
  - 本地即时建议、候选轻目标、规则优先级和 Safety Rails 过滤。
- [刀 4 轻目标创建与 Check-in](./0.2.4/knife-4-goal-creation-checkin.md)
  - 用户确认创建目标、周期回顾和状态转换。
- [刀 5 性表现训练视图](./0.2.4/knife-5-training-view.md)
  - 复盘后训练区、Dashboard 轻提示和表现指标展示边界。
- [刀 6 关系上下文接入](./0.2.4/knife-6-relationship-context.md)
  - 关系上下文、沟通反馈和中性表达边界。
- [刀 7 Safety Rails 审计](./0.2.4/knife-7-safety-rails-audit.md)
  - 目标、建议、文案、指标和导入 warning 的最终审计。
- [实现交接摘要](./0.2.4/implementation-handoff.md)
  - 数据流、文件候选、停下来重谈条件和验证底线。
- [入口、UI 与待定项](./0.2.4/ui-and-open-questions.md)
  - 成人行为复盘主入口。
  - Dashboard 轻提示。
  - 轻目标与 Check-in UI 细节。
  - 剩余待定和暂不做事项。
- [全文一致性审计](./0.2.4/consistency-audit-2026-05-28.md)
  - 当前文档一致性结论。
  - 刀 1 前置事项。
- [候选方向归档](./0.2.4/archive.md)
  - 养成系正式化、性表现训练、恢复训练、关系与伴侣维度深化的早期候选内容。
- [目录索引](./0.2.4/README.md)
  - 0.2.4 专题文档入口。

## 核心决策

- 0.2.4 的核心基调：从复盘走向养成，让性健康、做爱表现、恢复和关系质量形成可持续改进路径。
- 0.2.4 不做完整游戏化等级系统、成就徽章、每日任务、连续挑战或排行榜。
- 允许目标类型：记录质量、恢复、表现稳定性、射精控制观察、关系沟通。
- 禁止目标类型：多伴侣、性次数、射精次数、色情使用时长、更高色情刺激、伴侣比较或排名。
- `TrainingGoal` / `GoalCheckin` 是优先允许的最小持久化概念。
- `TrainingSuggestion` 默认由规则即时生成，不优先持久化。
- 刀 1 数据模型最终审计已定稿；进入实现时从刀 2 schema / migration / import-export 开始。
- 刀 2 执行文档已明确 schema、migration、JSON import/export、normalize warning 和 snapshot integrity。
- 刀 3 执行文档已明确本地规则建议、候选轻目标、输出结构、推荐优先级和 Safety Rails 过滤。
- 刀 4 - 刀 7 执行文档已补齐，覆盖轻目标创建、check-in、训练视图、关系上下文和 Safety Rails 审计。
- 0.2.4 实现交接摘要已补齐；当前开发需重点核对 schema / migration、import/export、snapshot integrity、Safety Rails 和 0.2.3 复盘入口接入。
- 性表现训练首批覆盖硬度稳定、做爱时长、射精控制观察、满意度、事后恢复，但展示优先级不同。
- 关系与伴侣维度进入主线，但只做“关系上下文 + 沟通/反馈 + 表现影响观察”。
- 建议系统只做本地规则，不叫 AI，不调用外部 API，不上传隐私数据。
- 轻目标由系统推荐、用户手动确认；系统不能自动创建目标。
- 入口形态：成人行为复盘作为主入口，Dashboard 做轻提示，不单独做 Training 页面。

## 开发顺序

0.2.4 已按"数据模型审计 → schema/migration → 规则建议 → 轻目标/签到 → 训练视图 → 关系上下文 → Safety Rails 审计"的顺序完成实现。

1. 刀 1：数据模型最终审计，已完成。
2. 刀 2：Schema / Migration / Import-Export，已完成。
3. 刀 3：规则型建议系统，已完成。
4. 刀 4：轻目标创建与 Check-in，已完成。
5. 刀 5：性表现训练视图，已完成。
6. 刀 6：关系上下文接入，已完成。
7. 刀 7：Safety Rails 审计，已完成。

## 明确不做

- 完整游戏化等级系统、成就徽章、每日任务、连续挑战或排行榜。
- AI 功能（只要不能本地部署）。
- 系统自动创建目标。
- 伴侣评分 / 排名。
- 多伴侣、性次数、射精次数、色情使用时长等诱导性目标类型。

## 当前开发线

0.2.4 代码实现已全部完成并推送（提交 `767d24f`，刀 2 - 刀 7，400 tests）。待版本发布与文档归档至 `docs/completed/`。

## 下一步

0.2.4 已完成。下一条实现线是 0.2.5，见 [`plan-0.2.5.md`](../planned/plan-0.2.5.md)。
