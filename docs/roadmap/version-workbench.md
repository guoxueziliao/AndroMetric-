# Version Workbench

> 0.2.18 固化的版本执行工作台。开发会话先读这里，再进入具体版本计划。

## Current

| Version | State | Theme | Entry |
|---|---|---|---|
| - | - | 暂无 active 版本 | - |

## Planned Queue

| Order | Version | State | Theme | Entry |
|---|---|---|---|---|
| - | - | - | 暂无后续 planned 版本 | - |

## Completed

Completed versions keep only the short summary in [`../completed/README.md`](../completed/README.md). Detailed completed-version planning files are not maintained.

Current completed line: 0.1.1 - 0.2.22.

## State Model

Use only these states in roadmap and planning docs:

- discussion: direction under discussion, not ready for implementation.
- planned: scoped and waiting for implementation.
- active: current implementation line.
- code-review: implementation done, waiting for review fixes or final acceptance.
- completed: implemented and summarized in completed docs.
- rejected: explicitly declined direction.
- archived: historical details removed or retained only as summary.

Each version should have one state in [`roadmap.md`](./roadmap.md). If a planned document disagrees with roadmap, roadmap wins and the stale document should be updated.

## Before Implementation

For any active version:

- Read [`roadmap.md`](./roadmap.md), [`../planned/README.md`](../planned/README.md), and the target version plan.
- Run the checklist in [`../process/pre-implementation-calibration.md`](../process/pre-implementation-calibration.md).
- Confirm whether schema / migration, import/export, privacy, or backup behavior is touched.
- Check not-doing items before restoring any previously rejected direction.

## Completion Flow

When an active version is done:

1. Update [`roadmap.md`](./roadmap.md): set the version to completed and promote the next version to active only when development actually starts.
2. Update [`../completed/README.md`](../completed/README.md): add the short completed summary and inherited contract.
3. Remove or archive detailed completed-version docs if the summary is enough.
4. Update [`../planned/README.md`](../planned/README.md): remove completed versions from the active/planned queue.
5. Update [`future-development.md`](./future-development.md) only with short status changes.
6. Add a changelog entry and bump `package.json` when the product/docs release is ready to close.

## Stop Conditions

Stop and ask before continuing if the work requires:

- product UI for the workbench.
- GitHub issue, PR, release, tag, push, or deploy automation.
- account system, cloud sync, or multi-user permissions.
- schema / migration not covered by the target version.
- restoring privacy blur, global search, full-text search, or other rejected directions.
