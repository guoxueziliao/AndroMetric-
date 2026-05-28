# 0.2.4 刀 3 规则型建议系统

> 本文只规划刀 3：基于 0.2.3 复盘结果和 0.2.4 目标模型，生成本地规则型建议与候选轻目标。它不实现 UI，也不自动创建目标。

## 状态

- 所属版本：0.2.4。
- 当前阶段：待刀 2 完成后执行。
- 前置：[`knife-2-schema-migration-import-export.md`](./knife-2-schema-migration-import-export.md)。
- 实现边界：本地规则、建议输出结构、候选轻目标和 Safety Rails。

## 目标

刀 3 完成后，系统可以根据成人行为复盘、样本量、可信度、恢复状态和记录缺口即时生成建议。

必须满足：

- 不叫 AI。
- 不调用外部 API。
- 不上传成人行为、色情使用、性表现或伴侣关系数据。
- 不持久化 `TrainingSuggestion`。
- 不自动创建 `TrainingGoal`。
- 每条建议都有触发原因、适用维度、样本量 / 可信度和下一步。
- 高负荷 / 低恢复时只推荐恢复或记录质量。

## 输入来源

刀 3 的输入应来自调用层整理后的纯数据，不直接读 Dexie。

允许输入：

- 0.2.3 review facts。
- 0.2.3 review insights。
- `sampleSize` / `confidence` / `limitations`。
- missing data。
- active / paused goal 摘要。
- 近期 check-in 摘要。

不允许输入：

- notes 全文用于自动判断。
- 伴侣私密备注全文用于自动判断。
- 图片、视频、URL 或色情内容本体。
- 云端模型输出。

## 输出结构

建议输出候选：

```ts
interface TrainingSuggestion {
  id: string;
  dimension: TrainingSuggestionDimension;
  trigger: string;
  confidence: 'none' | 'low' | 'medium';
  message: string;
  nextAction: TrainingSuggestionAction;
  suggestedGoal?: TrainingGoalDraft;
  limitations: string[];
}
```

维度候选：

- `record_quality`
- `recovery`
- `hardness_stability`
- `sex_performance_stability`
- `ejaculation_control_observation`
- `relationship_communication`

动作候选：

- `keep_recording`
- `start_goal_candidate`
- `review_missing_data`
- `prioritize_recovery`
- `review_relationship_context`

规则：

- `TrainingSuggestion` 不入库。
- `suggestedGoal` 只是草案，不是已创建目标。
- `suggestedGoal.category` 必须来自刀 1 allowlist。
- `suggestedGoal.targetWindowDays` 只能是 7 / 14。
- UI 层必须由用户点击“开始”后，才创建 `TrainingGoal`。

## 首批规则

### 1. 样本不足

触发：

- 核心 insight `confidence = none`。
- 硬度、睡眠、疲劳或成人行为样本不足。

输出：

- 建议继续记录。
- 可候选 `record_quality` 目标。

禁止：

- 不输出趋势判断。
- 不包装成洞察。
- 不创建目标。

### 2. 高负荷 / 低恢复

触发：

- 疲劳偏高。
- 睡眠不足。
- 事后恢复偏慢。
- 色情使用、自慰、性行为负荷连续偏高。
- 硬度下降但样本不足。

输出：

- 优先推荐 `recovery`。
- 可提示暂停追求表现数据。
- 可候选 7 天恢复观察。

禁止：

- 不推荐表现提升。
- 不推荐做爱时长目标。
- 不推荐射精控制挑战。
- 不推荐更多性行为或更多色情使用。

### 3. 硬度稳定性

触发：

- 硬度样本初步可看。
- 硬度波动与疲劳、睡眠或行为负荷同时出现。

输出：

- 候选 `hardness_stability`。
- 建议继续同时记录睡眠、疲劳和相关行为。

禁止：

- 不说某行为导致硬度变化。
- 不说硬度越高越好。
- 不做医学诊断。

### 4. 射精控制观察

触发：

- 射精控制、边缘控制、满意度或疲劳样本初步可看。
- 射精控制波动较大。

输出：

- 候选 `ejaculation_control_observation`。
- 强调同时看疲劳、满意度和恢复。

禁止：

- 不挑战更久。
- 不鼓励提高射精次数。
- 不把控制表现做成能力评分。

### 5. 关系沟通

触发：

- 满意度低但关系 / 沟通 / 伴侣反馈记录不足。
- 伴侣反馈与自我满意度不一致。
- 关系上下文样本不足影响解释。

输出：

- 候选 `relationship_communication`。
- 建议补充沟通、边界、偏好或事后反馈记录。

禁止：

- 不评价伴侣。
- 不排名伴侣。
- 不判断某个伴侣导致表现好或差。

### 6. 做爱时长稳定性

触发：

- 做爱时长波动大。
- 满意度、硬度或恢复样本能支撑一起看。

输出：

- 只作为 `sex_performance_stability` 的一部分。
- 强调时长需要和满意度、硬度、恢复一起看。

禁止：

- 不做最长时长目标。
- 不说越久越好。
- 不做挑战文案。

## 推荐优先级

候选建议默认排序：

1. 恢复。
2. 记录质量。
3. 硬度稳定。
4. 射精控制观察。
5. 关系沟通。
6. 做爱时长稳定性。

高负荷 / 低恢复时，只允许输出恢复、记录质量或暂停追求表现数据的观察提示。

每次最多输出：

- 1 - 3 条建议。
- 1 - 3 个候选轻目标。

## Safety Rails

刀 3 必须在建议输出前做 Safety Rails 过滤。

过滤必须拦截：

- 禁止 category。
- 性次数、射精次数、伴侣数量、色情使用时长或刺激强度目标。
- 伴侣评分、伴侣排名或伴侣优劣判断。
- 医学诊断、成瘾判定或强因果结论。
- 羞辱、焦虑、竞争、征服感文案。
- 高负荷 / 低恢复时的表现提升建议。

被拦截的建议不降级为其他建议；直接不输出，并可记录开发期 warning。

## 测试边界

必须覆盖：

- 样本不足只输出继续记录或记录质量。
- 高负荷 / 低恢复只输出恢复或记录质量。
- 禁止 category 无法出现在 `suggestedGoal`。
- `targetWindowDays` 只能是 7 / 14。
- 不输出 AI 命名。
- 不输出诊断、成瘾、强因果或伴侣排名文案。
- 不持久化 `TrainingSuggestion`。
- 不自动创建 `TrainingGoal`。

## 非目标

- 不实现轻目标创建 UI。
- 不实现 check-in UI。
- 不写入 `TrainingSuggestion` 表。
- 不新增云端 AI / 外部 API。
- 不做完整训练计划。
- 不做技巧库或训练课程。

## 交接给刀 4

刀 4 才负责把候选轻目标接入创建与 check-in 流程。

刀 4 可依赖：

- 刀 3 输出 1 - 3 条建议。
- 每条建议有触发原因、可信度和限制说明。
- 候选轻目标已经通过 Safety Rails。
- 候选轻目标仍未持久化，必须等待用户确认。
