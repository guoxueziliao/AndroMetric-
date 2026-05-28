# Roadmap

> 总路线图负责记录：哪些功能已完成、哪些做了一部分、哪些计划做、哪些明确不做。
> 各版本的开发细节以对应 `plan-*.md` 为准；本文件只做总览和状态追踪。

## Status Legend

- `done`：已发布或已完成。
- `active`：当前开发线。
- `planned`：已定方向，待执行。
- `partial`：做了一部分，仍需后续版本补齐。
- `deferred`：明确推迟。
- `not doing`：长期明确不做。

## Version Map

| Version | State | Theme | Doc |
|---|---|---|---|
| 0.0.7 | done | 主流程成型 | CHANGELOG |
| 0.0.8 | done | 数据可信度 | CHANGELOG |
| 0.0.9 | done | 洞察增强 | CHANGELOG |
| 0.1.0 | done | 隐私与安装 | CHANGELOG |
| 0.1.1 | done | 数据生态 | [plan](../completed/plan-0.1.1.md) |
| 0.1.2 | done | C 组消化 + 版本治理 | [plan](../completed/plan-0.1.2.md) |
| 0.1.3 | done | 数据安全闭环 | [plan](../completed/plan-0.1.3.md) |
| 0.2.0 | done | 视觉系统骨架 | [plan](../completed/plan-0.2.0.md) |
| 0.2.1 | done | 应用层视觉与交互 | [plan](../completed/plan-0.2.1.md) |
| 0.2.2 | done | 成人行为与色情使用记录闭环 | [plan](../planned/plan-0.2.2.md) |
| 0.2.3 | planned | 洞察与复盘增强 | [plan](../planned/plan-0.2.3.md) |
| 0.2.4 | planned | 养成系与关系/表现训练 | [plan](../planned/plan-0.2.4.md) |
| 0.2.5 | planned | 训练中心与长期目标历史 | [plan](../planned/plan-0.2.5.md) |
| 0.2.6 | planned | 数据安全与长期数据承诺 | [plan](../planned/plan-0.2.6.md) |

## Done

### 0.0.7 - 0.0.9

- 主流程日记记录、统计视图、备份恢复、标签管理、伴侣管理。
- 数据质量、智能默认、周期 / 怀孕关联。
- Dashboard 趋势、影响因子、XP 维度、Toast stack、RecordCard 初步统一。

### 0.1.0

- PIN 应用锁。
- WebAuthn 解锁。
- 加密导出 / 导入。
- iOS 安装引导。

### 0.1.1

- CSV 导出。
- Markdown 导出。
- 导入预览。
- 安全快照和加密导入导出。

### 0.1.2

- 版本号单一来源。
- About modal。
- PWA 更新提示。
- CHANGELOG。
- 备份写后读自检。
- idle 自动备份。
- 字段级 merge 预览。
- 选择性导出。
- 按个数保留策略。

### 0.1.3

- 自动备份用户可配置。
- IndexedDB quota 监控。
- 按容量保留策略。
- 按 tag 选择性导出。

### 0.2.0

- Tailwind 构建化。
- token 单源。
- dark/light 双值机制。
- 动效 token。
- 隐私态视觉。
- manifest / 图标资产整理。
- 视觉 token 审计归档到 `docs/completed/visual-token-audit.md`，语义用途归档到 `docs/completed/visual-system.md`；长期 token 单源以 `tailwind.config.ts` / `index.css` 为准。

### 0.2.1

- `OverlayPrimitive` + `Modal` / `BottomSheet` contract。
- Toast / Confirm feedback contract。
- `Switch` + `Checkbox` 共享布尔控件。
- `DataCard` / `RecordCard` 语义 tone。
- `HardnessSelector v2`。
- 定制成人/性健康图标与 interaction cookbook。
- 移动端弹层高度收口，旧 `toggle-checkbox` CSS 移除。

## Active

当前暂无实现中的版本计划。下一条代码实现线是 0.2.2，开发应从刀 41 的 schema / migration / domain types 开始。

### 下一步：0.2.2 刀 41

状态：

- 0.2.2 产品方向和边界已定稿为执行草案。
- 刀 40 数据模型文档集已产出，入口：`docs/planned/0.2.2/adult-behavior-data-model.md`。
- 0.2.2 详细文档索引：[`docs/planned/0.2.2/README.md`](../planned/0.2.2/README.md)。

已完成：

- 把 Porn use / Masturbation / Sex event 的产品决策转成 TypeScript 类型草案。
- 明确 Dexie schema、migration、旧数据兼容和默认值。
- 明确导入 / 导出 / 快照完整性策略。
- 明确事件关联策略和测试清单。

下一步：

- 按 [刀 41 执行拆解](../planned/0.2.2/knife-41.md) 进入 schema / migration / domain types。
- 刀 41 完成后，按 [刀 42 执行拆解](../planned/0.2.2/knife-42.md) 进入 storage / import-export / snapshot integrity。
- 刀 42 完成后，按 [刀 43 执行拆解](../planned/0.2.2/knife-43.md) 进入 Porn use event model + tests。
- 刀 43 完成后，按 [刀 44 执行拆解](../planned/0.2.2/knife-44.md) 进入 Masturbation event alignment。
- 刀 44 完成后，按 [刀 45 执行拆解](../planned/0.2.2/knife-45.md) 进入 Sex event mapping / adapter。
- 刀 45 完成后，按 [刀 46 执行拆解](../planned/0.2.2/knife-46.md) 进入 UI entry points + minimal forms。
- 刀 46 完成后，按 [刀 47 执行拆解](../planned/0.2.2/knife-47.md) 进入 Event linking UI。
- 刀 47 完成后，按 [刀 48 执行拆解](../planned/0.2.2/knife-48.md) 进入 Basic review loop。
- 刀 48 完成后，按 [刀 49 执行拆解](../planned/0.2.2/knife-49.md) 进入 golden path + docs + version close。
- 实现前重新检查当前代码状态、dirty worktree 和现有 migration / storage 入口。

不做：

- 越过 0.2.2 边界新增统计模型、云同步、分享或内容收藏能力。
- 成人内容开关。
- 全项目卡片统一。

## Planned

### 0.2.2 — 成人行为与色情使用记录闭环

计划做：

- `PornUseEvent`、`MasturbationEvent`、`SexEvent` 三类事件独立建模。
- schema / migration。
- stable event ids。
- typed linked ids。
- import/export/snapshot integrity。
- 最小记录入口、事件关联 UI、基础复盘。

不做：

- 内容收藏器。
- URL / 缩略图 / 图片 / 视频本体。
- 审核字段。
- 成瘾布尔。
- 云同步。

### 0.2.3 — 洞察与复盘增强

文档入口：[`docs/planned/plan-0.2.3.md`](../planned/plan-0.2.3.md)。专题索引：[`docs/planned/0.2.3/README.md`](../planned/0.2.3/README.md)。

状态：执行草案 / 待实现。

计划做：

- `adult behavior review engine`。
- 综合成人行为复盘入口。
- 硬度 / 恢复为首屏主轴。
- 事实时间线和窗口聚合。
- 刀 50 - 刀 58 的开发顺序。
- 周报 / 月报 / Markdown 导出。
- 样本量和可信度。
- 五个复盘维度：硬度与勃起质量、性行为表现、色情使用与自淫自慰、身体与生活因素、关系与伴侣。

不做：

- 医学诊断。
- 成瘾判定。
- 强因果结论。
- 分享图。
- 伴侣评分 / 排名。
- 新增 schema / migration。
- 完整训练建议或轻目标系统。

### 0.2.4 — 养成系与关系/表现训练

文档入口：[`docs/planned/plan-0.2.4.md`](../planned/plan-0.2.4.md)。专题索引：[`docs/planned/0.2.4/README.md`](../planned/0.2.4/README.md)。

状态：执行草案 / 待实现。

计划做：

- 最小训练数据模型，先完成模型文档，再开发 schema / migration。
- 轻量规则型训练建议，不叫 AI，不做复杂引擎。
- 进度反馈。
- 轻目标：系统推荐，用户手动确认，不自动创建。
- 性表现训练：硬度稳定、做爱时长、射精控制观察、满意度、事后恢复。
- 恢复训练。
- 关系与伴侣维度深化：关系上下文、沟通 / 反馈、表现影响观察。
- Safety Rails：目标类型、建议规则、文案、指标展示四层限制。
- 开发刀序：模型文档、schema / migration、规则建议、轻目标、训练视图、关系上下文、Safety Rails 审计。
- 刀 1 数据模型最终审计：字段、状态转换、导入导出、snapshot integrity、runtime allowlist 和 Safety Rails 绕过点。
- 刀 1 已定稿；实现从刀 2 schema / migration / import-export 开始。
- 刀 2 schema / migration / import-export 执行文档已拆出。
- 刀 3 规则型建议系统执行文档已拆出。
- 刀 4 - 刀 7 执行文档和实现交接摘要已拆出。
- 模型细节：生理日规则、可编辑标题、本周期感受、7 / 14 天周期、单来源 insight。
- 入口：成人行为复盘作为主入口，Dashboard 轻提示，不单独做 Training 页面。

不做：

- 完整游戏化等级系统。
- 成就徽章体系。
- 每日任务列表。
- 性次数 / 射精次数 / 伴侣数量挑战。
- 色情使用时长挑战。
- 完整关系管理系统。
- 独立 Training 页面。
- 伴侣评分 / 排名。
- 云端 AI / 外部大模型 API。
- 诱导更多性行为、更多射精、更高色情刺激或忽视恢复的养成机制。

### 0.2.5 — 训练中心与长期目标历史

文档入口：[`docs/planned/plan-0.2.5.md`](../planned/plan-0.2.5.md)。专题索引：[`docs/planned/0.2.5/README.md`](../planned/0.2.5/README.md)。

状态：执行草案 / 待实现。

计划做：

- 训练中心或复盘内目标历史视图。
- active / paused / completed / archived 目标历史。
- 目标筛选、归档和恢复边界。
- 跨周期 check-in 历史。
- 长期进度反馈。
- 目标 category 分布和缺失数据提示。
- Dashboard 轻提示延续。
- 默认复用 0.2.4 `TrainingGoal` / `GoalCheckin`。
- Training Center 优先作为复盘 / 统计区域内的二级工作台或 tab，不新增顶级导航。
- 开发刀序：代码状态与数据校准、目标历史工作台、跨周期进度反馈、入口 UI / Dashboard、Safety / Privacy 审计。

不做：

- AI 教练。
- 云端模型或外部 API。
- 完整技巧库。
- 系统训练课程。
- 完整游戏化等级、徽章、连续打卡。
- 性次数 / 射精次数 / 伴侣数量挑战。
- 色情使用时长挑战。
- 伴侣评分 / 排名。
- 医学诊断、成瘾判定、强因果结论。
- 分享图或社交传播。

### 0.2.6 — 数据安全与长期数据承诺

文档入口：[`docs/planned/plan-0.2.6.md`](../planned/plan-0.2.6.md)。专题索引：[`docs/planned/0.2.6/README.md`](../planned/0.2.6/README.md)。

状态：执行草案 / 待实现。

计划做：

- JSON backup 完整契约审计。
- dataVersion 兼容规则收口。
- import preview 扩展。
- snapshot integrity 扩展。
- 成人行为事件 linked ids / orphan / one-way relation 检查。
- training goal / goal check-in 完整性检查。
- 只读恢复预检。
- 备份写后读信心反馈。
- CSV / Markdown 可读导出边界整理。
- 全部导出默认态：日期区间只是可选筛选。
- 数据生态修复提示闭合到可执行按钮或下一步动作。
- 数据健康问题定位到具体字段 / 子项。
- 开发刀序：当前数据 UX 修复、数据契约审计、Import Preview 风险矩阵、Snapshot Integrity 扩展、只读恢复预检、CSV / Markdown 可读导出边界、Safety / Privacy 审计。

不做：

- 后端同步。
- 账号系统。
- 云端备份。
- 多设备实时合并。
- CRDT / OT。
- 外部 AI 分析。
- 自动内容识别。
- 自动修复业务事实。
- 分享图或社交传播。

## Partial / Deferred

- Service Worker periodicSync 自动备份：因浏览器支持和当前 PWA 构建模式推迟。
- 完整关系管理系统：推 0.2.4+。
- 多伴侣关系图谱：推 0.2.4+。
- 性技巧训练计划：推 0.2.4+。
- 大型养成系统：推 0.2.4+。

## Not Doing

长期明确不做：

- 后端同步。
- 账号系统。
- 社区 / 公开内容流。
- 分享图。
- 色情内容收藏器。
- 自动内容识别。
- 云端模型。
- 医学诊断。
- 成瘾判定。
- 道德化成人偏好评价。
- 强因果结论。

## Maintenance

- 版本完成后，把对应计划从 `planned/` 或 `active/` 移到 `completed/`。
- 当前实现版本只保留在 `active/`。
- 新增未来版本时，先创建 `planned/plan-X.Y.Z.md`，再更新本文件。
- 讨论流水继续写入 [future-development.md](./future-development.md)。
