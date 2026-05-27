# 0.1.1 收尾计划（G 数据生态）

> 本文档是 0.1.1 剩余刀数（刀 6 - 刀 10）的开发依据。讨论于 2026-05-20 定稿，已落地的刀 1-5 不再回溯。
> 后续若有新增/变更，**直接更新本文件**，不开新文档。

## 背景

0.1.1 = roadmap 中的 "G 数据生态"，核心承诺是 **CSV / Markdown 导出**。已完成 5 刀（snapshot 统一、import preview、FS 备份列表恢复、加密导入、测试覆盖），但 roadmap 主线（CSV/Markdown）尚未兑现，且已落地的 5 刀有几个一致性/可信度收尾。

## 范围

5 刀，按顺序：

1. **刀 6** — A1 CSV 导出（多份 CSV + zip 打包，仅 logs 维度）
2. **刀 7** — A2 Markdown 导出（按天日记体，含 7 日轴趋势）
3. **刀 8** — B1 FS 备份列表恢复走 import preview
4. **刀 9** — B2 import dataVersion 守卫
5. **刀 10** — B3 安全快照打标签 + 自动清理

完成后打 v0.1.1 tag。

## 显式不做（推迟到 0.1.2 或之后）

- B4 生态卡的提示项变成可点 action → **并到 0.2.0 视觉重塑**
- C1 备份可读性自检（写后读回校验）
- C2 自动备份 idle/scheduled 触发
- C3 字段级 merge 冲突解决
- C4 选择性导出（日期区间 / 按表勾选）
- C5 用户可配置的保留策略

C 组整体留 0.1.2，**不预先做**，等用户用过程发现真痛点再加。

---

## 刀 6 — A1 CSV 导出

### 形态

- **粒度**：多份 CSV，每份对应一个数据维度。
- **打包**：zip 一次下载，文件名 `hardness-diary-csv-YYYYMMDD.zip`。
- **范围**：仅围绕 logs 数据展开。partners / cycle_events / pregnancy_events / tags 等关系型/小体量数据继续走 JSON，不进 CSV。

### CSV 文件清单

| 文件 | 粒度 | 列 |
|---|---|---|
| `days.csv` | 1 行 / 天（生理日） | `date, status, morning_woke_with_erection, morning_hardness, morning_retention, sleep_start, sleep_end, sleep_hours, sleep_quality, sex_count, masturbation_count, exercise_minutes_total, alcohol_grams_total, caffeine_total_count, mood, stress_level, location, weather, notes` |
| `sex.csv` | 1 行 / 性事件 | 来自 `LogEntry.sex[]`，含 date/timestamp/hardness/duration/orgasm/partner_id/位置等 |
| `masturbation.csv` | 1 行 / 自慰事件 | 来自 `LogEntry.masturbation[]` |
| `exercise.csv` | 1 行 / 运动事件 | 来自 `LogEntry.exercise[]`，含 type/duration/intensity/feeling |
| `alcohol.csv` | 1 行 / 饮酒事件 | 来自 `LogEntry.alcoholRecords[]`，展开到 item 级别（每杯一行） |

具体列以 `domain/types/log.ts` 现有字段为准，**不新增字段**。表情/枚举值（如 mood/intensity）直接写枚举字符串，不翻译为中文，避免 i18n 漂移。

### 入口

profile MyView 数据生态卡新增按钮："导出 CSV"，与"导出 JSON""加密导出"并列。

### 实现位置

- 转换逻辑：`features/profile/model/csvExport.ts`（新文件，纯函数，无 DOM）
- zip 打包：用浏览器原生 `CompressionStream` + `application/zip` 手卷，**不引入 jszip**（避免 30KB 依赖；如果手卷复杂度过高再回退到 jszip，此时需明确记录）
- UI 触发：`useProfileMaintenance.ts` 增加 `handleCsvExportClick`

### 不做

- 不导出 changeHistory（属于审计数据，CSV 表达成本高且无分析价值）
- 不导出 dataQuality / touchedPaths（meta 字段）
- 不做日期区间筛选（C4 推迟）

---

## 刀 7 — A2 Markdown 导出

### 形态

- 单文件 `hardness-diary-YYYYMMDD.md`
- 按天倒序（最近的在前），每天一段
- 每段包含：当日各维度汇总 + 紧跟一段"轴趋势"

### 单段模板

```markdown
## 2026/05/20 周三

- **晨勃**：硬度 4，时长 ~10 分钟
- **睡眠**：23:30 - 07:00 (7.5h)
- **性事**：1 次（伴侣：A）
- **运动**：跑步 30min
- **饮酒**：无
- **情绪**：稳定

**近 7 日趋势**：晨勃硬度均值 3.8（↑0.2），睡眠均值 7.2h（↓0.1），运动 5/7 天

> 备注：今天状态很好
```

### 轴趋势字段

近 7 日（含当天）：
- 晨勃硬度均值 + 与上一周期 7 日的差值
- 睡眠时长均值 + 差值
- 运动天数 / 7
- 性事 + 自慰合计次数

**复用 `features/stats` 现有 StatsEngine 的聚合函数**，不重写聚合逻辑。如果 StatsEngine 的现有 API 不直接覆盖"近 N 日均值"，写薄包装函数，不动 StatsEngine 内部。

### 入口

profile MyView 数据生态卡新增按钮："导出 Markdown"。

### 实现位置

- 渲染逻辑：`features/profile/model/markdownExport.ts`（新文件，纯函数）
- 趋势聚合：`features/profile/model/markdownExport.ts` 内的辅助函数，调用 stats 层的聚合

### 不做

- 不展开原始 log（"汇总+轴趋势"形态已选定，不加可折叠 details）
- 不做月报/周报独立文档（只一份按天倒序的总文件）
- 空白天（无任何记录）跳过，不输出空段

---

## 刀 8 — B1 FS 备份列表恢复走 import preview

### 现状问题

`features/backup/model/useBackupSettings.ts:135-157` 的 `handleRestoreBackup` 直接 confirm + safetySnapshot + restoreSnapshot（默认 overwrite），**绕过了 import preview**。

JSON 文件导入走 `useProfileMaintenance.ts` 的完整 preview 流程。两者 UX 不一致。

### 改法

`handleRestoreBackup` 读到文件内容后，**复用 `buildImportPreview`**（`features/profile/model/importPreview.ts`），打开同一个 ImportPreviewModal，让用户看到 dataVersion / 各表条目数 / merge|overwrite 选择，再确认。

### 实现位置

- ImportPreviewModal 从 `features/profile/MyView.tsx` 抽到独立组件文件（如果还没抽）
- `useBackupSettings.ts` 调用同一个 modal + preview 函数

### 不做

- 不改 preview 的字段（已经覆盖了）
- 不合并 useBackupSettings 与 useProfileMaintenance（两者职责不同）

---

## 刀 9 — B2 import dataVersion 守卫

### 规则

- 导入文件 `dataVersion < 当前 db 版本` → preview 中显示 info 级别提示："将自动从 v{N} 迁移到 v{M}"，**仍允许导入**
- 导入文件 `dataVersion > 当前 db 版本` → **拒绝导入**，提示"此文件来自更新版本的应用，请升级后再试"
- 导入文件 `dataVersion === 当前` → 当前行为不变

### 实现位置

- `features/profile/model/importPreview.ts` 增加 `versionStatus: 'match' | 'older' | 'newer'` 字段
- ImportPreviewModal 根据 `versionStatus` 渲染不同提示条
- 高版本时 preview 仍显示（让用户知道这是什么文件），但确认按钮 disable

### 不做

- 不实现版本回滚（高版本拒绝即可，不尝试降级）
- 不做"强制导入"逃生口（破坏 dataVersion 契约的口子，不开）

---

## 刀 10 — B3 安全快照打标签 + 自动清理

### 改 1：snapshot 类型加可选字段

```ts
// domain/types/snapshot.ts
interface Snapshot {
  // ... 现有字段
  kind?: 'manual' | 'auto-safety';  // 新增可选
}
```

- **不改 db schema、不加 migration**。Dexie 表存为普通 JSON 字段。
- 旧快照读出后 `kind === undefined`，业务侧默认按 `'manual'` 处理。

### 改 2：三处自动快照写入打标

- `useProfileMaintenance.ts:128`（pre-repair）
- `useProfileMaintenance.ts:319`（pre-import）
- `useBackupSettings.ts:147`（pre-FS-restore）

三处都在 `snapshots.create()` 调用里加上 `kind: 'auto-safety'`，并在 description 里保留语义信息（"导入前自动快照"等），保持向后兼容。

### 改 3：保留策略

- **保留最近 7 个 auto-safety 快照**，超过的在新快照创建后立即清理。
- 手动快照（`kind === 'manual'` 或 undefined）**不动**。
- 清理逻辑放 `core/storage/StorageService.ts` 内的 snapshots 模块，作为 `snapshots.create()` 的副作用。

### 改 4：UI 区分（可选，只做 1 件）

snapshots 列表里 auto-safety 快照加一个浅色标记（"自动"小字标签）。**不做更多**——隔离 UX 改造留 0.2.0。

### 不做

- 不加 db migration
- 不做用户可配置保留数（"保留 7 个"硬编码常量，未来需要再开放）
- 不做 auto-safety 快照的批量删除按钮

---

## 验证清单（每刀完成时）

按 CLAUDE.md：
- `npx tsc --noEmit` 通过
- `npm run test` 通过
- 涉及 UI 的刀（6/7/8/10）必须在浏览器跑一遍 golden path

测试覆盖：
- 刀 6：CSV 转换函数加单测（空 logs、单事件、多事件、字段缺失）
- 刀 7：Markdown 渲染加单测（空白天跳过、轴趋势计算）
- 刀 9：versionStatus 计算加单测（older / newer / match）
- 刀 10：snapshots.create 副作用加单测（保留 7 个上限、不影响 manual）

## 完成定义

5 刀全部 merge + 浏览器验证 + tag v0.1.1。

记忆里的 `project_0_0_9_status.md` 模式同步建一份 `project_0_1_1_status.md`，记录最终落地内容 + 推迟到 0.1.2 的清单（C1-C5 + B4）。
