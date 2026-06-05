# Docs Index

> `docs/` 按状态分层：已完成、当前开发、未来计划、路线图。已过期的规划流水和旧状态快照已删除；历史实现默认查完成摘要与当前代码。

## Reference

- [architecture.md](./architecture.md)：项目分层架构、依赖方向、迁移边界。

## Completed

已完成或已发布的历史文档，默认低频查阅，不参与日常规划维护：

- [completed/README.md](./completed/README.md)：0.1.1 - 0.2.22 的完成版本摘要。

## Active

- 当前活跃开发线：暂无 active 版本。
- 执行入口：[roadmap/version-workbench.md](./roadmap/version-workbench.md)。

## Planned

当前 active / planned 或仍有规划价值的版本计划：

- [planned/README.md](./planned/README.md)：当前 active / planned 文档索引。

## Roadmap

- [roadmap/README.md](./roadmap/README.md)：路线图和后续讨论索引。

## Maintenance Rules

- 已发布或确认完成的版本计划放 `completed/`，默认不参与日常规划维护。
- 当前正在实现、review 或仍需规划的版本计划放 `planned/`，状态以 `roadmap/roadmap.md` 和 `roadmap/version-workbench.md` 为准。
- `planned/` 默认只保留活跃规划线；完成后迁移到 `completed/`。
- 长期路线和当前状态放 `roadmap/`；过期讨论流水不保留。
- `architecture.md` 留在根目录，除非同步更新所有外部入口引用。
