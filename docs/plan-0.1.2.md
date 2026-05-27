# 0.1.2 计划（C 组消化 + 版本号管理）

> 本文档是 0.1.2 全部刀数（刀 11 - 刀 19）的开发依据。讨论于 2026-05-20 定稿。
> 后续若有新增/变更，**直接更新本文件**，不开新文档。

## 背景

两条主线一起做：

1. **C 组消化**：0.1.1 推迟来的 C1-C5（备份自检 / 自动备份 / 字段级 merge / 选择性导出 / 保留策略）。原打算"等真痛点再加"，但发现这些是"出问题前感觉不到痛、出问题就晚了"的稳定性项，不能纯被动等。
2. **版本号管理**：当前版本号在三处漂移——`package.json.version = "0.0.7"`（落后 4 版）、`app/appConfig.ts:3 APP_VERSION = '0.0.9'`（落后 2 版）、git tag 只到 v0.0.9（v0.1.0 / v0.1.1 缺）；CHANGELOG.md 不存在；PWA 是 autoUpdate 用户无感。借这版一次性收口。

体量比 0.1.1 翻倍，9 刀。

## 范围

按顺序：

1. **刀 11** — 版本号单一来源（构建注入）
2. **刀 12** — 用户可见版本号 + About modal
3. **刀 13** — 导出文件 schema 契约校准
4. **刀 14** — PWA 升级提示（autoUpdate → prompt）
5. **刀 15** — CHANGELOG.md 启动 + 反向补 0.0.7-0.1.1
6. **刀 16** — C1 备份可读性自检（写后读回校验）
7. **刀 17** — C2 自动备份 idle 触发
8. **刀 18** — C3 字段级 merge 冲突解决
9. **刀 19** — C4 选择性导出 + C5 用户可配保留策略（合刀，强相关）

完成后打 v0.1.2 tag。

## 显式不做

- 自动化 changelog（changesets / release-please）：项目体量配不上
- 应用内编辑 CHANGELOG：永远手写
- service worker periodicSync：浏览器支持差
- 交互式 merge 冲突 modal：体量过大
- OT/CRDT：离线优先项目用不上
- 按容量保留 / 按 tag 选择性导出 / 升级强制刷新：均超 0.1.2 范围

## 软件版本管理约定（不算刀，全版本生效）

### Semver 约定

项目仍在 0.x，semver 在 0.x 段落里有歧义，明确一下：

| 升幅 | 触发条件 |
|---|---|
| **patch (0.1.x → 0.1.x+1)** | 不改 db schema、不改导出 JSON 字段、不改 dataVersion、不动既有领域规则；仅修 bug、加测试、加非破坏性 UI、纯重构 |
| **minor (0.x.y → 0.x+1.0)** | 引入新功能模块、db schema 变更（dataVersion bump）、新增导出字段、调整既有 UX 流程但保持数据兼容 |
| **major (0.x.y → 1.0.0)** | 见"主版本进升依据" |

**重要兼容契约**：在 0.x 阶段，**导出文件向旧版本兼容**——v0.1.5 导出的文件，v0.1.0 必须能读（`importPreview` 容忍未知字段，老版读到新字段忽略而不是报错）。这是这条约定唯一的硬约束。

参照已发版本的 patch / minor 切分：
- 0.0.7 → 0.0.8：B+C 数据可信度，**minor**（引入 quality state、touchedPaths 等新字段）
- 0.0.8 → 0.0.9：A 数据洞察，**minor**（StatsEngine 新模块、Toast queue 新基础设施）
- 0.0.9 → 0.1.0：D+F 隐私+PWA，**minor**（appLock 新模块）
- 0.1.0 → 0.1.1：G 数据生态，**minor**（snapshot 格式统一是 dataVersion 变更）
- 0.1.1 → 0.1.2：本版本，**minor**（C 组功能引入 + 版本号管理）

### Tag 节奏与格式

- **格式**：`vX.Y.Z`，全小写 v 前缀。不带语义后缀（无 `-rc.x` / `-beta.x`，0.x 阶段整个项目就是 beta，没必要再分）。
- **打 tag 时机**：所有刀 merge 到 main + 浏览器跑完 golden path + `npx tsc --noEmit` 和 `npm run test` 全绿之后，**手动**打 tag，不自动化。
- **tag 与 package.json/APP_VERSION 必须一致**——刀 11 之后这三者由构建注入保证同步，打 tag 前若不一致就是 bug。
- 漂掉的 tag（v0.1.0 / v0.1.1 当前缺）**不补打**。git tag 是事实记录不是审计账本，缺就缺，CHANGELOG 里说清楚。

### CHANGELOG 约定

- **格式**：[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的简化版（不引依赖、不强制工具链）。
- **粒度**：一个版本一个条目，**不一刀一条**。读者关心"这版做了什么"而不是"内部怎么切的"。
- **写法**：人写。**禁止**从 commit 自动生成（项目已经用了 `0.1.1 刀 5` 这种内部切分语义，把它们灌进 CHANGELOG 是噪音）。
- **分组**：`Added` / `Changed` / `Fixed` / `Deprecated` / `Removed` 五个标题，按需出现。
- **未发布段**：`## [Unreleased]` 段落留 placeholder。每个刀 merge 时**顺手往里加一行**，避免发版时凭记忆写。
- **位置**：仓库根目录 `CHANGELOG.md`。

### 主版本进升依据

0.x → 1.0 的判定**不**与功能完整度挂钩，与**数据契约稳定性**挂钩：

进入 1.0 的硬条件（全部满足）：
1. dataVersion ≥ 当前版本至少 6 个月未升过（schema 稳定）
2. 导出 JSON 字段名 ≥ 6 个月未删/未改语义（向后读契约稳固）
3. 主流程（晨勃 / 睡眠 / 性事 / 自慰 / 运动 / 饮酒 / 备份恢复）全部经过浏览器 golden path 验证
4. 至少一次 0.x → 0.x+1 的 import 真实跑通（不是单测，是用真实老版导出文件）

不进入 1.0 的"非"条件（**这些都不构成进升压力**）：
- 视觉重塑完不完整（那是 0.2.0 的事）
- 用户量
- 测试覆盖率数字
- 是否上架某个 store

0.1.x 到 0.2.0 的进升（视觉重塑）**不**走以上判定，按 roadmap 直接推进。

## 刀 11 — 版本号单一来源（构建注入）

### 现状问题

三处版本号各自漂移：
- `package.json:4 "version": "0.0.7"`（落后 4 版）
- `app/appConfig.ts:3 APP_VERSION = '0.0.9'`（落后 2 版）
- git tag 最新 `v0.0.9`（缺 v0.1.0、v0.1.1）

`MyView.tsx:295,668` 用 `settings.version` 显示给用户，settings 又来自 `defaultSettings.version = APP_VERSION`，所以"用户看到的版本"目前是 0.0.9。导出文件里 `appVersion` 字段也是这个值。

### 改法

**`package.json.version` 是唯一真相源**，其他位置全部从它派生。

- `vite.config.ts` 增加 `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`，从 `package.json` 读
- `app/appConfig.ts` 改为 `export const APP_VERSION = __APP_VERSION__;`，删硬编码字符串
- 加 `vite-env.d.ts` 全局声明 `declare const __APP_VERSION__: string;`
- 发版流程文档化（写在 README 或本文件末尾）：发版时改 `package.json.version` → 同步更新 `CHANGELOG.md` → 跑测试 → merge → 打 tag。**只此一处改版本号**。

### 实现位置

- `vite.config.ts`（添加 define + 顶部 import package.json）
- `app/appConfig.ts`（改为引用 build 注入常量）
- `vite-env.d.ts`（新文件或追加全局声明）

### 不做

- 不接 `git describe` 生成自动版本号（增加构建复杂度，离线打包反而更乱）
- 不在 settings 里存版本号（settings 是用户配置，版本号是构建产物，混存导致老 settings 卡住老版本号）—— `defaultSettings.version` 字段直接删掉
- 不引入 release-please / changesets

---

## 刀 12 — 用户可见版本号 + About modal

### 现状问题

- 现在版本号埋在 `MyView.tsx` 两处文本里（"查看更新与新功能 (v0.0.9)"、"Hardness Diary v0.0.9 • Local Storage"），没有专门的 About 入口
- 用户不知道当前是哪版、上一版改了什么

### 改法

profile MyView 数据生态卡 / 设置区底部新增 "关于" 入口，点击打开 AboutModal：

- 应用名 + 版本号（v{APP_VERSION}）
- 当前 dataVersion（来自 db.verno）
- 本版更新摘要（**复用 CHANGELOG 当前版本段，不重写**）
- "查看完整更新历史" 链接 → 二级 modal 渲染整份 CHANGELOG.md
- 隐私声明一句话："所有数据保存在本设备，不上传任何服务器"

### 实现位置

- `features/profile/AboutModal.tsx`（新组件）
- CHANGELOG 渲染：`marked` 已在依赖里，复用即可
- profile 入口：`features/profile/MyView.tsx` 数据生态卡新增按钮

### 不做

- 不做"检查更新"按钮（PWA autoUpdate 自己处理，刀 14 加提示就够）
- 不做"反馈 / 联系我们"入口
- About modal 不要做成全屏路由

---

## 刀 13 — 导出文件 schema 契约校准

### 现状问题

刀 11 后 `appVersion` 不再硬编码，但导出文件里现在同时有 `appVersion` 和 `dataVersion` 两个字段，语义边界不清——`importPreview` 既校验 dataVersion 也读 appVersion，但**真正决定能否导入的只有 dataVersion**。

### 改法

明确语义并写进 `domain/types/snapshot.ts` 的注释里：

| 字段 | 类型 | 决定什么 | 读取规则 |
|---|---|---|---|
| `dataVersion` | number | 能否导入（兼容性） | 0.1.1 刀 9 已实现守卫 |
| `appVersion` | string | 仅展示（"这是从哪个版本导出的"） | 决不参与导入决策 |

- `importPreview.ts:38-42` 的 fallback 逻辑（`dataVersion` 缺失时退回 `data.version`）保留——老文件兼容
- 在导出函数里**始终写入两个字段**：`dataVersion: db.verno`、`appVersion: APP_VERSION`
- ImportPreviewModal 的 UI 把 `appVersion` 显示成"导出自 v0.1.0"这种纯信息文案，跟 dataVersion 守卫提示视觉分离

CSV 导出（0.1.1 刀 6 引入）多份 zip 内附带一个 `meta.json`，写 `{ appVersion, dataVersion, exportedAt }`，理由同上。

### 实现位置

- `domain/types/snapshot.ts`（注释 + 字段语义）
- `features/profile/model/importPreview.ts`（视图字段保留 appVersion，文案校准）
- `features/profile/MyView.tsx:728`（appVersion 展示文案）
- `features/profile/model/csvExport.ts`（如果 0.1.1 刀 6 已落地，加 meta.json）

### 不做

- 不引入新的版本字段（`schemaVersion` / `formatVersion` 等）
- 不做 dataVersion 与 appVersion 的强一致校验（appVersion 错了也能导入，本来就不该参与决策）

---

## 刀 14 — PWA 升级提示

### 现状问题

`vite.config.ts` 的 `vite-plugin-pwa` 当前是 `registerType: 'autoUpdate'`——新 SW 后台更新但**用户无感**，可能继续在老 tab 里跑老代码，直到下次冷启动。0.1.1 刀 9 加了 dataVersion 守卫之后，老 tab 跑老代码 + 用户在新 tab 操作产生新 dataVersion 数据，会触发"高版本拒绝"在自己设备上误伤。

### 改法

切换到 `registerType: 'prompt'` + 自定义提示 UI：

- 检测到新 SW 安装完成时，应用底部弹一个 toast："新版本已就绪，刷新使用"，带"刷新"按钮
- 用户点"刷新"才 reload；不点就继续跑老版（不强制）
- 24 小时内只提示一次（localStorage 记 timestamp，避免缠人）

### 实现位置

- `vite.config.ts`：`registerType: 'prompt'`
- `features/pwa/`（已有 feature 模块）：增加 `useRegisterSW` hook 包装 + `UpdatePromptToast` 组件
- 复用 0.0.9 引入的 Toast queue

### 不做

- 不强制刷新（用户正在写日记中途被踢出极差体验）
- 不实现"延迟提示"复杂策略（24 小时去重够）
- 不做"新版有什么改动"内嵌展示（点关于 modal 看 CHANGELOG，不重复）

---

## 刀 15 — CHANGELOG.md 启动 + 反向补 0.0.7-0.1.1

### 形态

仓库根新增 `CHANGELOG.md`，结构（Keep a Changelog 简化）：

```markdown
# Changelog

所有显著变更记录于此文件。

## [Unreleased]

### Added
- (待补)

## [0.1.2] - 2026-MM-DD

### Added
- C1 备份可读性自检
- C2 idle 时段自动备份
- ...

## [0.1.1] - 2026-MM-DD
...
```

### 反向补条目的依据

不依赖 git log（commit 信息夹带 "刀 X" 是内部切分），依赖**已有的 memory 文件**：
- `project_0_0_7_status.md`
- `project_0_0_8_status.md`
- `project_0_0_9_status.md`
- 0.1.0 / 0.1.1 凭 git log + 当前 docs/plan-0.1.1.md 现状反推

每版条目控制在 5-10 行，写"用户能感知的变化"而不是"重构了哪个模块"。

### 实现位置

- 仓库根 `CHANGELOG.md`
- AboutModal（刀 12）已经声明会渲染本文件

### 不做

- **0.0.7 之前不补**（不存在 v0.0.6 tag，那段是史前期）
- 不写"重构 components/ 到 features/"这种纯架构条目
- 不做中英双语，只写中文

---

## 刀 16 — C1 备份可读性自检（写后读回校验）

### 现状问题

`StorageService.snapshots.create()` 写完 Dexie 就返回成功，**没读回验证**。如果 Dexie 序列化出错或 IndexedDB quota 满了写入截断，用户得到"备份成功"的假象。

### 改法

`snapshots.create()` 写完立即 `snapshots.get(id)` 读回，并：
1. 验证 `snapshot.id` 一致
2. 验证 `JSON.stringify(snapshot.data).length >= expectedLength * 0.95`（容忍 5% 序列化抖动，但能抓到截断）
3. 验证关键字段（logs/partners 数量）与写入前一致

任一失败 → 删除这条快照 + 抛错（让上层 toast 告诉用户失败而不是默默成功）。

### 实现位置

- `core/storage/StorageService.ts` 的 snapshots 模块
- 单测：写入正常路径 + 模拟读回返回 null + 模拟读回长度异常

### 不做

- 不做 checksum / 哈希（小项目本地存储，CRC32 都过度）
- 不做后台周期巡检已有快照（C2 触发自动备份时连带新快照自检即可）
- 不做 IndexedDB quota 监控（这不是 C1 的范围，是另一件事）

---

## 刀 17 — C2 自动备份 idle 触发

### 现状问题

目前自动备份只在三个 imperative 时机产生（pre-repair / pre-import / pre-fs-restore，刀 10 已打 auto-safety 标）。**用户长期不主动备份就没有最近备份**——一旦数据损坏，最远只能恢复到上一次"修复/导入"前。

### 改法

新增 idle 触发的自动备份：

- 触发条件：连续 24 小时未产生 auto-safety 快照 + 浏览器 `requestIdleCallback` 闲置 + IndexedDB 内有 logs 数据（空库不备）
- 标记：复用 `kind: 'auto-safety'`（0.1.1 刀 10 引入）；description 写"24 小时定期自动备份"
- 保留策略：进刀 19 的统一保留逻辑（先用刀 10 的 7 个上限兜底）
- 写入完成调用刀 16 的自检

### 实现位置

- `features/backup/model/useAutoBackup.ts`（新 hook）
- 在 `app/AppProviders.tsx` 挂载（应用启动时启动 idle 监听）
- 时间记录：`meta` 表加 `lastAutoBackupAt: number`

### 不做

- 不做用户可配置间隔（24 小时硬编码，刀 19 开放后再说）
- 不接 Page Visibility API 做"切回 tab 时检查"（idle callback 已经能盖住）
- 不做 service worker `periodicSync`（浏览器支持差，PWA 装机率低）
- 不做用户可关闭 idle 备份的开关（先内置不开放）

---

## 刀 18 — C3 字段级 merge 冲突解决

### 现状问题

`importPreview` 当前提供 `merge | overwrite` 两个粗粒度模式：
- `overwrite` 覆盖整条 log
- `merge` 整条对象按字段浅合并，**冲突字段（导入文件和现有 log 都有值且不一致）以导入文件为准**

第二条对用户不透明——可能默默丢弃今早刚写的笔记。

### 改法

merge 模式下增加冲突展示：

1. 实际执行 merge **前**，扫描所有 logs，找出"两边都有值且不等"的字段
2. ImportPreviewModal 加一个折叠区"冲突字段（N 处）"
3. 列出形如：`2026-05-15 mood：当前="happy" / 导入="neutral"`
4. 提供两个全局按钮：**"全部保留当前"** / **"全部使用导入"**
5. 用户确认后再执行实际 merge

### 实现位置

- `features/profile/model/importPreview.ts` 增加 `conflicts: ConflictField[]` 字段
- 冲突计算函数 `computeConflicts(currentLogs, incomingLogs): ConflictField[]`
- ImportPreviewModal 渲染冲突区
- 单测：无冲突 / 单字段冲突 / 多 log 多字段冲突 / 数组类字段（exercise[] 等）按引用比较

### 数组类字段处理

`exercise / sex / masturbation / alcoholRecords` 这些数组字段**按整个数组比较**——任一元素不同就标冲突，不下钻到 element 级别。下钻到元素需要稳定 id 匹配，工程量过大不在 0.1.2 范围。

### 不做

- 不做逐字段交互式选择（每条都让用户选 → 数百条 log 体验崩坏）
- 不做数组元素级冲突（下钻成本超出收益）
- 不做"自动按时间戳更新者优先"（dataQuality 时间戳不可信，多设备情况下漂移）

---

## 刀 19 — C4 选择性导出 + C5 用户可配保留策略

C4 和 C5 都是"导出/保留"的用户控制项，UI 入口都在数据生态卡，强相关，**合刀**。

### C4 选择性导出

ImportPreviewModal 的对偶：导出前打开一个 **ExportOptionsModal**：

- **日期区间**：开始 / 结束日期（默认全部）
- **数据维度勾选**：logs / partners / cycle_events / pregnancy_events / tags / snapshots（默认全选）
- **格式**：JSON / CSV / Markdown（沿用 0.1.1 刀 6/7）
- 三类格式各自尊重日期区间和维度勾选；CSV 多文件 zip 也跟随勾选

### C5 用户可配保留策略

settings 加新区块"备份保留"：

- 自动安全快照保留数（默认 7，可改 3 / 7 / 15 / 30）
- 手动快照不限数量，保持现状
- 设置项实时生效：保留数下调 → 立即清理超出部分（清理逻辑已在刀 10 落地，扩展使用 settings 值即可）

### 实现位置

- `features/profile/ExportOptionsModal.tsx`（新组件）
- `features/profile/model/exportOptions.ts`（导出条件构建 + 应用到 logs/partners/...）
- 各 export 函数（json / csv / markdown）增加 `options: ExportOptions` 参数
- `domain/types/settings.ts` 增加 `backupRetention: { autoSafetyMaxCount: number }`
- `core/storage/StorageService.ts` 的 snapshots 清理逻辑读 settings

### 不做

- 不做按 tag 选择性导出（标签维度筛选 UI 太复杂）
- 不做按容量保留策略（"保留 50MB"难解释）
- 不做"导出后自动清理超过 N 天的旧 log"（破坏数据所有权感）
- ExportOptionsModal 不做导入（导入路径已经被 importPreview 占了）

---

## 验证清单（每刀完成时）

按 CLAUDE.md：
- `npx tsc --noEmit` 通过
- `npm run test` 通过
- 涉及 UI 的刀（12 / 14 / 18 / 19）必须在浏览器跑一遍 golden path

测试覆盖：
- 刀 11：constants 注入后 `import { APP_VERSION }` 在测试环境能解析（vitest 也读 vite define）
- 刀 13：importPreview 处理"只有 dataVersion 没 appVersion"的老文件 / "appVersion 与 dataVersion 不匹配"的导出文件
- 刀 16：snapshots.create 写后读回失败时回滚（删除半成品快照 + 抛错）
- 刀 17：useAutoBackup 在 24 小时阈值下不重复触发；空 logs 库不触发
- 刀 18：computeConflicts 在无冲突 / 单字段 / 数组字段 / 多 log 场景的输出
- 刀 19：导出 options 变化时 logs/partners 输出条数符合筛选；retention 调整后 snapshots 立即收敛

## 完成定义

9 刀全部 merge + 浏览器验证 + tag v0.1.2。

`CHANGELOG.md` 的 `[Unreleased]` 段提升为 `[0.1.2] - YYYY-MM-DD`，下方留新的 `[Unreleased]` 占位。

记忆里同步建一份 `project_0_1_2_status.md`，记录最终落地内容 + 推迟到 0.1.3+ 的清单（数组元素级 merge / 按 tag 导出 / 容量保留 / SW periodicSync 等已在"显式不做"段列出的项）。

