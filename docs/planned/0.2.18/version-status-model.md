# 0.2.18 版本状态模型

## 状态

- discussion：正在讨论，尚未收口。
- planned：执行草案 / 待实现。
- active：当前开发线。
- completed：实现完成，进入 completed 摘要。
- rejected：方向已否决，不占用版本号或不得恢复。
- archived：历史细节已归档，只保留摘要。

## 转换

- discussion -> planned：用户确认范围和停线项。
- planned -> active：开发会话开始实现。
- active -> completed：开发完成、验证通过、文档同步。
- discussion -> rejected：用户否决方向。
- completed -> archived：详细文档不再维护，只保留摘要。

## 必填信息

每个 planned 版本应有：

- 版本主题。
- 状态。
- 入口文档。
- 专题索引。
- 实现交接摘要。
- 停下来重谈条件。
- 与前序版本关系。

## 不恢复规则

已明确否决的方向进入 rejected / not doing，不在后续版本中无提示恢复。
