# 0.2.18 执行计划

## 目标

建立长期维护与版本执行工作台。第一版只做 docs 工作台，让规划、开发、完成归档有固定流程；不做应用内 UI，不接 GitHub，不自动发版。

## 进入执行前校准

先读这些文件：

- `docs/roadmap/roadmap.md`：版本状态总表。
- `docs/planned/README.md`：planned 入口。
- `docs/completed/README.md`：完成归档入口。
- `docs/roadmap/future-development.md`：后续方向短入口。
- `docs/roadmap/next-follow-up.md`：横向候选收口。
- `docs/planned/0.2.16/pre-implementation-calibration.md`：实现前校准流程。

## 文档工作台结构

建议维护这些固定区域：

- Current：当前 active / 正在 code review / 等待开发。
- Planned Queue：后续版本队列。
- Completed：已完成版本摘要入口。
- Rejected / Not Doing：明确不做的方向。
- Handoff Rules：开发前、开发中、完成后的文档动作。

## 实现切片

### 切片 1：状态模型落地

状态只使用这些词：discussion / planned / active / code-review / completed / rejected / archived。

每个版本在 roadmap 中只能有一个状态。planned 文档里如果有冲突，以 roadmap 为准并修正文档。

### 切片 2：开发前清单

每个 planned 版本进入开发前必须确认：

- 当前代码是否已部分实现。
- 是否需要 schema / migration。
- 是否触碰备份 / 导入 / 导出。
- 是否有用户已否决方向会被误恢复。
- 是否有停线项需要用户确认。

### 切片 3：完成后归档流程

完成后执行：

1. `roadmap.md` 状态改为 completed。
2. `docs/completed/README.md` 增加简短完成摘要。
3. planned 文档保留必要交接或移动到归档位置。
4. future-development 只保留短入口，不追加长流水。
5. 若发现后置反馈，放入反馈池，不插入已完成版本。

### 切片 4：一致性审计模板

新增或固化模板，至少包含：

- 范围是否与用户确认一致。
- 是否触碰 schema / migration。
- 是否触碰隐私 / 导出。
- 是否恢复了 not doing。
- 是否有下一版本依赖。

## 执行顺序

1. 盘点当前 roadmap / planned / completed 的真实状态。
2. 修正文档中明显过期的 active / completed 说法。
3. 固化状态模型和完成后归档流程。
4. 给 0.2.13 之后版本补执行文档入口。
5. 做一次 `rg` 一致性检查。

## 验收步骤

- 打开 roadmap 能看出每个版本状态。
- 打开 planned README 能找到每个待开发版本的 plan、README、execution-plan、implementation-handoff。
- 已否决方向在 not doing 或维护规则中能看到。
- 完成一个版本后，开发会话知道要更新哪些文档。
- 没有 GitHub issue / PR / 自动发版描述。

## 检查命令

```bash
rg -n "active|completed|planned|discussion|rejected|archived" docs/roadmap docs/planned docs/completed
rg -n "GitHub|PR|issue|release|tag|push|deploy" docs/planned/0.2.18 docs/roadmap
git diff --check -- docs
```

## 停线项

- 需要应用内 UI。
- 需要接 GitHub issue / PR。
- 需要自动 tag / release / push / deploy。
- 需要账号、云同步或多人协作。
- 需要自动生成代码。
