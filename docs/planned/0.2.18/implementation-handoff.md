# 0.2.18 实现交接摘要

## 版本定位

0.2.18 是长期维护与版本执行工作台 v1。

它服务规划和开发会话，不是普通用户健康功能。

## 已确认决策

- 先作为 docs 工作台。
- 不做应用内 UI。
- 不接 GitHub issue / PR。
- 不读取 PR 状态。
- 不自动 tag / release / push。
- 不自动发版。
- 默认不新增 schema / migration。

## 推荐实现顺序

1. 盘点 roadmap / planned / completed 的真实状态。
2. 固化版本状态模型：discussion / planned / active / completed / rejected / archived。
3. 固化开发前校准流程。
4. 固化完成后归档流程。
5. 更新索引和维护规则。
6. 一致性审计。

## 停线项

- 需要应用内 UI。
- 需要账号、云同步或 GitHub 集成。
- 需要自动创建 issue / PR。
- 需要自动 tag / release / push。
- 需要新增数据库表。
- 需要自动生成代码或自动发版。

## 验收底线

- 能看出当前 active / planned / completed 队列。
- 每个 planned 版本有清晰入口。
- 开发前知道要做代码校准。
- 完成后知道如何归档文档。
- 已否决方向不会被无意恢复。
