# 0.2.4 开发刀序与验收

> 本文从 0.2.4 入口拆出，保存开发刀序和版本验收标准。

## 已定开发刀序

0.2.4 的开发顺序按以下 7 刀推进。

### 刀 1：训练数据模型文档定稿

执行拆解：[`knife-1-data-model-final-audit.md`](./knife-1-data-model-final-audit.md)

状态：已完成规划定稿，进入实现时从刀 2 开始。

目标：

- 定稿 [training-data-model.md](./training-data-model.md)。
- 明确 `TrainingGoal` / `GoalCheckin` 字段。
- 明确目标状态、目标周期、check-in 状态。
- 落实 `targetDate` / `startDate` 使用生理日规则。
- 明确导入、导出、快照边界。

验收：

- 模型文档没有待定核心字段。
- 明确哪些概念持久化，哪些概念即时生成。
- 明确禁止 category。
- 明确旧数据迁移默认空表，不生成伪目标。
- 明确 unknown category、非法周期、orphan check-in、非法 cycleFeeling 和非法窗口范围的 integrity warning 规则。

### 刀 2：schema / migration / import-export

执行拆解：[`knife-2-schema-migration-import-export.md`](./knife-2-schema-migration-import-export.md)

目标：

- 在 `core/storage/db.ts` 新增最小 store。
- 在 `core/storage/migration.ts` 增加迁移步骤。
- 导入、导出、快照保留训练目标和 check-in 数据。
- 不破坏既有历史数据。

验收：

- 旧数据升级后可正常打开。
- 新表为空时 UI 不报错。
- 导出后再导入，`TrainingGoal` / `GoalCheckin` 数据完整保留。
- 删除或归档目标不删除历史成人行为事件、硬度记录或复盘数据。
- import normalize 对未知 enum、禁用 category、非法周期、orphan check-in、非法 cycleFeeling 和非法 window range 产生 warning。
- snapshot integrity 至少包含 training goal 和 goal check-in 总数。

### 刀 3：规则型建议系统

执行拆解：[`knife-3-rule-based-suggestions.md`](./knife-3-rule-based-suggestions.md)

目标：

- 实现本地规则建议。
- 不叫 AI，不调用外部 API。
- 默认不持久化 `TrainingSuggestion`。
- 每条建议包含触发原因、适用维度、样本量 / 可信度、可执行下一步。

验收：

- 样本不足时只提示继续记录。
- 高负荷 / 低恢复时只推荐恢复或记录质量。
- 色情使用相关建议只做观察窗口，不做强因果。
- 伴侣 / 关系相关建议只做沟通、反馈、边界和上下文补充。
- 所有建议通过 Safety Rails。
- 系统只输出候选轻目标，不自动创建 `TrainingGoal`。

### 刀 4：轻目标创建与 check-in

执行拆解：[`knife-4-goal-creation-checkin.md`](./knife-4-goal-creation-checkin.md)

目标：

- 复盘后展示 1-3 个候选轻目标。
- 用户确认后才创建 `TrainingGoal`。
- 支持开始、忽略、稍后。
- 到期后进入 `GoalCheckin`。
- 支持继续、暂停、完成、调整。

验收：

- 系统不会自动创建目标。
- 忽略或稍后的候选目标默认不保存。
- 用户可编辑标题、周期和备注。
- 目标暂停、完成、归档后状态清晰。
- 不存在失败惩罚、能力扣分或羞辱式提醒。

### 刀 5：性表现训练视图

执行拆解：[`knife-5-training-view.md`](./knife-5-training-view.md)

目标：

- 建立 0.2.4 的训练入口或复盘后训练区。
- 展示硬度稳定、事后恢复、射精控制观察、做爱时长、满意度。
- 展示优先级按已定顺序：硬度稳定 > 事后恢复 > 射精控制观察 > 做爱时长 > 满意度。
- 表现指标必须和恢复、满意度、样本量一起展示。

验收：

- 不展示最高做爱纪录。
- 不展示性次数挑战。
- 不展示射精次数成就。
- 不把做爱时长表达成越长越好。
- 低恢复时恢复提示优先于表现提升。

### 刀 6：关系上下文接入

执行拆解：[`knife-6-relationship-context.md`](./knife-6-relationship-context.md)

目标：

- 关系上下文进入性表现复盘和训练建议。
- 支持沟通、伴侣反馈、关系氛围、边界和偏好备注。
- 支持多伴侣、多性别伴侣、多关系形态的中性表达。
- 不做完整关系管理系统。

验收：

- 不做伴侣评分。
- 不做伴侣排名。
- 不判断某个伴侣导致表现好或差。
- 文案不默认异性恋、单偶或一男一女关系。
- 关系信息只用于上下文观察和沟通建议。

### 刀 7：Safety Rails 审计

执行拆解：[`knife-7-safety-rails-audit.md`](./knife-7-safety-rails-audit.md)

目标：

- 对 0.2.4 所有新增目标、建议、文案、卡片、指标、空状态、toast、confirm 做最终审计。
- 确认没有诱导更多性行为、更多射精、更高色情刺激、伴侣比较或忽视恢复。

验收：

- 四层限制全部通过：目标类型、建议规则、文案、指标展示。
- 不存在云端 AI / 外部大模型 API。
- 不存在医学诊断、成瘾判定或强因果结论。
- 不存在伴侣排名、评分或优劣判断。
- 不存在性次数、射精次数、色情使用时长、色情刺激强度挑战。

## 版本验收标准

0.2.4 完成时必须满足：

- 用户能从成人行为复盘进入训练建议。
- 建议由本地规则即时生成，不叫 AI，不调用外部服务。
- 用户能看到 1-3 个候选轻目标。
- 用户确认后才能创建目标。
- 用户能完成目标 check-in：继续、暂停、完成、调整。
- 性表现训练覆盖硬度稳定、事后恢复、射精控制观察、做爱时长、满意度。
- 关系上下文能进入复盘和建议，但不做完整关系管理。
- `TrainingGoal` / `GoalCheckin` 数据可导入、导出、快照保留。
- 所有新增内容通过 Safety Rails。

一句话验收：

> 能从复盘看到本地规则建议，用户确认后创建轻目标，到期后完成 check-in，并且所有建议和指标都通过 Safety Rails。
