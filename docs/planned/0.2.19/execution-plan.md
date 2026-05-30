# 0.2.19 执行计划

## 目标

实现个人指标自定义与权重 v1。第一版只做“重点关注 / 普通显示 / 弱化隐藏”三档，让用户调整首页、状态页、筛选回看和洞察提示的显示优先级。

## 进入开发前校准

先读这些入口：

- `domain/types/settings.ts`：`AppSettings` 当前已有 `hiddenFields`，可评估是否复用或扩展。
- `app/AppProviders.tsx`、`app/AppContent.tsx`：settings 读取与 `onUpdateSettings` 数据流。
- `features/profile/MyView.tsx`：设置入口。
- `features/dashboard/Dashboard.tsx`、`features/dashboard/model/p1Summary.ts`：首页摘要和指标呈现。
- `features/state/StateView.tsx`、`features/state/model/PersonalStateEngine.ts`：状态页和目标建议。
- `features/stats/ui/PersonalNormalSection.tsx`、`ExplanationLayerSection.tsx`、`ReviewSection.tsx`：长期指标和洞察。
- 0.2.17 的筛选模型：默认维度排序。

## 偏好模型切片

建议新增纯类型和 helper：

- `MetricPreferenceLevel`：`focus` / `normal` / `muted`。
- `MetricPreference`：`metricId`、`level`、`updatedAt?`。
- `MetricDefinition`：`id`、`label`、`module`、`defaultLevel`。
- helper：`getMetricLevel`、`sortMetricsByPreference`、`isMetricMuted`。

第一版优先放在设置中，不新增 Dexie 表。如果扩展 `AppSettings` 就同步默认值、导入导出和设置保存。

## 指标清单切片

不要发明新健康指标。先从现有模块列出稳定 id：

- 晨间硬度。
- 睡眠时长 / 睡眠质量。
- 情绪 / 压力。
- 训练 / 运动。
- 酒精 / 咖啡因。
- 色情使用 / 自慰 / 性生活。
- 关系上下文。
- 健康项目 / 补剂。
- 数据质量 / 记录完整度。

指标 id 必须稳定，不能直接用展示文案当 id。

## UI 切片

1. 我的页新增“关注指标”或“指标显示优先级”入口。
2. 列表按模块分组，每个指标用三档 segmented control。
3. 提供恢复默认。
4. 文案使用“关注重点 / 显示优先级”，避免“健康权重”。
5. 弱化隐藏旁边说明：不删除数据，只降低默认展示频率。

## 模块接入切片

- Dashboard：重点关注优先进入摘要；弱化隐藏从首屏摘要降级。
- StateView：状态卡和建议排序尊重重点关注。
- Stats / PersonalNormal：重点关注指标优先显示，普通指标随后，弱化指标折叠。
- 0.2.17 筛选回看：默认维度优先展示重点关注指标。

## 实现顺序

1. 校准 `AppSettings.hiddenFields` 是否可复用；如语义不合，新增 `metricPreferences`。
2. 写 domain 类型和纯 helper。
3. 接入设置保存、恢复默认、导入导出。
4. 做设置 UI。
5. 先接 Dashboard 和 StateView。
6. 再接 Stats / 0.2.17 筛选默认排序。
7. 补测试和文案审计。

## 验收步骤

- 用户能把指标设为重点关注、普通显示、弱化隐藏。
- 刷新后偏好仍保留。
- 恢复默认后所有指标回到普通显示或默认档。
- 首页 / 状态页至少各有一个明显排序变化。
- 弱化隐藏的数据仍可在完整记录和手动筛选中看到。
- 页面没有 1-100 权重输入。

## 测试建议

- helper 单测：排序、默认值、未知 id、muted 判断。
- settings 导入导出测试：没有偏好时使用默认值。
- 手动测试移动端 segmented control 文案不溢出。
- 用 `rg` 检查是否出现 `1-100`、`医学权重`、`风险评分` 等跑偏文案。

## 停线项

- 需要 1-100 精细权重。
- 需要医学风险评分。
- 需要 AI 自动判断重点指标。
- 需要新增数据库表。
- `AppSettings` 无法承载且必须 schema migration。
