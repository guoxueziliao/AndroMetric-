# Docs Index

> `docs/` 按状态分层：已完成、当前开发、未来计划、路线图。架构说明保留在根目录，避免破坏 `CLAUDE.md` 和其他入口的稳定引用。

## Reference

- [architecture.md](./architecture.md)：项目分层架构、依赖方向、迁移边界。

## Completed

已完成或已发布的版本计划：

- [completed/plan-0.1.1.md](./completed/plan-0.1.1.md)：G 数据生态收尾。
- [completed/plan-0.1.2.md](./completed/plan-0.1.2.md)：C 组消化 + 版本号管理。
- [completed/plan-0.1.3.md](./completed/plan-0.1.3.md)：C 组消化收尾 + 数据安全闭环。
- [completed/plan-0.2.0.md](./completed/plan-0.2.0.md)：视觉系统骨架。
- [completed/visual-token-audit.md](./completed/visual-token-audit.md)：0.2.0 token 审计。
- [completed/visual-system.md](./completed/visual-system.md)：0.2.0 视觉系统语义文档。
- [completed/plan-0.2.1.md](./completed/plan-0.2.1.md)：应用层视觉与交互。
- [completed/ui-component-audit-0.2.1.md](./completed/ui-component-audit-0.2.1.md)：0.2.1 UI component audit。
- [completed/ui-interaction-system.md](./completed/ui-interaction-system.md)：0.2.1 图标与动效规则。

## Active

当前开发线：

- 暂无实现中的版本计划。下一条开发线是 0.2.2，但进入代码前必须先完成数据模型文档。

## Planned

已讨论或正在讨论、待后续执行的版本计划：

- [planned/plan-0.2.2.md](./planned/plan-0.2.2.md)：成人行为与色情使用记录闭环。
- [planned/adult-behavior-data-model-0.2.2.md](./planned/adult-behavior-data-model-0.2.2.md)：0.2.2 开发前置数据模型文档（待产出）。
- [planned/plan-0.2.3.md](./planned/plan-0.2.3.md)：洞察与复盘增强。
- [planned/plan-0.2.4.md](./planned/plan-0.2.4.md)：养成系与关系/表现训练。
- [planned/training-data-model-0.2.4.md](./planned/training-data-model-0.2.4.md)：0.2.4 训练与轻目标数据模型。

## Roadmap

- [roadmap/roadmap.md](./roadmap/roadmap.md)：总路线图，记录每个版本做了什么、计划做什么、明确不做什么。
- [roadmap/future-development.md](./roadmap/future-development.md)：后续讨论流水和决策记录。

## Maintenance Rules

- 已发布或确认完成的版本计划放 `completed/`。
- 当前正在实现的版本计划放 `active/`。
- 后续已定但未开发的版本计划放 `planned/`。
- 长期路线、状态、讨论流水放 `roadmap/`。
- `architecture.md` 留在根目录，除非同步更新所有外部入口引用。
