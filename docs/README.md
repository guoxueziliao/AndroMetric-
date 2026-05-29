# Docs Index

> `docs/` 按状态分层：已完成、当前开发、未来计划、路线图。架构说明保留在根目录，避免破坏 `CLAUDE.md` 和其他入口的稳定引用。

## Reference

- [architecture.md](./architecture.md)：项目分层架构、依赖方向、迁移边界。

## Completed

已完成或已发布的历史文档，默认低频查阅，不参与日常规划维护：

- [completed/README.md](./completed/README.md)：0.2.5 及以前的完成版本索引。

## Active

当前无活跃开发线。下一条候选线是 0.2.6。

## Planned

正在开发、review 或仍有规划价值的版本计划：

- [planned/README.md](./planned/README.md)：当前 planned 文档索引，覆盖 0.2.6 - 0.2.12 和 0.2.14 待讨论入口。

## Roadmap

- [roadmap/README.md](./roadmap/README.md)：路线图和后续讨论索引。

## Maintenance Rules

- 已发布或确认完成的版本计划放 `completed/`，默认不参与日常规划维护。
- 当前正在实现、review 或仍需规划的版本计划放 `planned/`。
- `planned/` 默认只保留活跃规划线；完成后迁移到 `completed/`。
- 长期路线、状态、讨论流水放 `roadmap/`。
- `architecture.md` 留在根目录，除非同步更新所有外部入口引用。
