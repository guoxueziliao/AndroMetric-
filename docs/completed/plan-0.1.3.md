# 0.1.3 计划（C 组消化收尾 + 数据安全闭环）

> 本文档是 0.1.3 全部刀数（刀 20 - 刀 24）的开发依据。讨论于 2026-05-20 定稿。
> 后续若有新增/变更，**直接更新本文件**，不开新文档。
> 软件版本管理约定（Semver / Tag / CHANGELOG / 主版本进升）已在 [docs/completed/plan-0.1.2.md](../completed/plan-0.1.2.md) 锁定，本版本继续遵守。

## 背景

0.1.2 把 C 组（数据可信度）打了一半，剩下几项原本是"被动等真痛点再加"。0.1.3 主动把这条线收完——理由是这几项属于"出问题前感觉不到痛、出问题就晚了"的稳定性项：数据写满、备份用户不可控、清理策略与设备能力脱钩，等真出问题再补就来不及。

5 刀，分两类：
- **数据安全闭环**：刀 20-22（C2 用户可配 + quota 监控 + 容量保留）三件事强相关，共同构成"用户对本地存储有完全可见性和控制权"的闭环
- **小项消化**：刀 23-24（C4 by-tag 导出 + periodicSync）独立项，刀 24 浏览器支持差，作为最低优先级，做不动可降级到 0.1.4

体量与 0.1.2 相近（5 刀 vs 9 刀），但单刀复杂度更高（quota / SW 都涉及浏览器 API 边界）。

## 范围

按顺序：

1. **刀 20** — C2 自动备份用户可配（开关 + 间隔）
2. **刀 21** — IndexedDB quota 监控 + 预警
3. **刀 22** — C5 按容量保留策略
4. **刀 23** — C4 按 tag 选择性导出
5. **刀 24** — SW periodicSync 自动备份（条件性，可降级）

完成后打 v0.1.3 tag。

## 显式不做

- **C3 数组元素级 merge**：单设备使用为主，多设备 merge 是低频场景。需要为所有数组记录验证稳定 id，工程量过大；0.1.2 刀 18 的"数组按引用比较"在主流场景下够用。等真有用户反馈再做。
- **C3 逐字段交互式选择**：每条 log 都让用户选 → 数百条体验崩坏。0.1.2 刀 18 的"全保留 / 全使用"已是良好折中。
- **按时间保留策略**（"保留最近 30 天"）：与按个数 / 按容量正交，加第三种维度 UI 过载。
- **OT/CRDT、强制刷新升级、自动生成 changelog、自动按时间戳更新者优先**：已在 0.1.2 文档显式不做段列出，0.1.3 不解封。

## 刀 20 — C2 自动备份用户可配（开关 + 间隔）

### 现状问题

0.1.2 刀 17 引入 idle 触发自动备份，**24 小时硬编码、不可关闭、不可调间隔**。当时刻意"先内置不开放"，等用户用过看是否舒服。

实际预期：
- 频繁记录的用户希望间隔短（数据增长快、出错恢复点要近）
- 轻量用户希望间隔长甚至关闭（避免 snapshot 表占空间）
- 部分用户对"应用自动写入"本身敏感，希望显式 opt-out

### 改法

settings 加新区块"备份偏好"（与刀 19 的 `backupRetention` 合并展示，不分散）：

| 设置 | 类型 | 默认 | 选项 |
|---|---|---|---|
| `backupSchedule.enabled` | boolean | `true` | 开 / 关 |
| `backupSchedule.intervalHours` | number | `24` | `6` / `12` / `24` / `48` |
| `backupSchedule.lastTriggeredAt` | number | `0` | （只读，仅展示"上次自动备份：N 小时前"） |

- 开关关闭后，`useAutoBackup` 的 idle callback 检查 `enabled` 立即跳过；不卸载 hook（避免重新 enable 后还要等下次冷启动）
- 间隔变更立即生效——下次 idle 检查就用新阈值
- imperative 自动备份（pre-repair / pre-import / pre-fs-restore）**不受此开关影响**——这是数据安全兜底，不开放给用户关
- "上次自动备份：N 小时前"展示用 `meta.lastAutoBackupAt`（0.1.2 刀 17 已有）

### 实现位置

- `domain/types/settings.ts`：增加 `backupSchedule: { enabled: boolean; intervalHours: 6 | 12 | 24 | 48 }`
- `app/appConfig.ts`：`defaultSettings.backupSchedule = { enabled: true, intervalHours: 24 }`
- `features/backup/model/useAutoBackup.ts`：读 settings 决定是否触发、用什么阈值
- `features/profile/MyView.tsx` 数据生态卡 / 设置区：备份偏好 UI（与 `backupRetention` 同区块）

### 不做

- 不做"自定义间隔"输入框（4 档够覆盖；自定义增加边界 case）
- 不做"立即备份一次"按钮——manual 快照功能已经在
- 不做"低电量时跳过自动备份"（idle callback 已隐含此语义）
- 不做用户关闭 imperative 自动备份的开关（数据安全底线，不让退）

---

## 刀 21 — IndexedDB quota 监控 + 预警

### 现状问题

IndexedDB 写入失败的常见原因是 quota 满，但应用**没有预警机制**——用户只会在写入时看到"备份失败"或"日志保存失败"的 toast，但完全不知道空间满了、不知道该清什么。

0.1.2 刀 16 的"备份可读性自检"能抓写后读回长度异常，但**抓不到"快写满了"的预兆**——它只在写入失败后告警。

C 组（数据可信度）需要这一步才闭环。

### 改法

引入 quota 巡检：

- **检测**：`navigator.storage.estimate()` 返回 `{ usage, quota }`；用 `usage / quota` 计算占用率
- **触发时机**：
  - 应用冷启动后 5 秒
  - 每次成功创建 snapshot 后
  - 每次成功写入 logs 后（防抖 60 秒，避免高频写入触发太多检查）
- **阈值与响应**：

  | 占用率 | 响应 |
  |---|---|
  | < 80% | 静默 |
  | 80% ~ 95% | toast 提醒一次（24h dedup，localStorage 记 timestamp）："本地存储已用 N%，建议导出后清理旧快照" |
  | ≥ 95% | toast 红色警告（无 dedup）+ 拒绝创建新 snapshot（logs 写入仍允许，但提示"空间已满，请尽快导出后清理"） |

- **降级**：浏览器不支持 `navigator.storage.estimate`（旧 Firefox / 部分 WebView）→ 静默跳过，不报错
- **AboutModal**（0.1.2 刀 12）添加一行展示当前用量："本地存储：23 MB / 1 GB"

### 实现位置

- `core/storage/storageEstimate.ts`（新文件，纯函数 + 缓存层）：`estimateStorage(): Promise<{ usage, quota, ratio } | null>`
- `features/backup/model/useStorageQuotaMonitor.ts`（新 hook）：在 AppProviders 挂载，订阅冷启动 + snapshot 写入事件
- 复用 0.1.2 刀 14 的 Toast queue
- AboutModal（0.1.2 刀 12）追加用量行

### 验证场景

- 浏览器 quota API 不存在：hook 不抛错、不打 toast
- usage = 0：不触发任何提示
- 79% → 81%：触发一次 80% toast
- 81% → 82%（24h 内）：不再触发（dedup）
- 96%：触发警告 + `snapshots.create()` 直接拒绝
- usage 之后跌回 70%：dedup 状态清空，再次跨 80% 触发

### 不做

- 不做"quota 满了自动删旧 snapshot"——破坏数据所有权，用户可能依赖那条快照
- 不做 quota 详细分布图（每个 table 占用多少）——浏览器 API 不直接给，估算不准
- 不做 PWA 持久化存储申请（`navigator.storage.persist()`）——独立话题，留 0.1.4 或 0.2.0 看
- 不做后台周期巡检（除上述三个时机外）——多余

---

## 刀 22 — C5 按容量保留策略

### 现状问题

0.1.2 刀 19 给了"保留 N 个 auto-safety snapshot"（默认 7，可改 3/7/15/30）。但：
- "N 个"不直观：用户可能不知道一个 snapshot 多大，3 个是 3 MB 还是 30 MB
- 单个 snapshot 体积**随 logs 累积线性增长**——同样保留 7 个，半年后体积是现在 3-5 倍
- 与刀 21 的 quota 监控配套——quota 是约束，保留策略是手段；只有按个数没法精确响应"接近满了"

之前 0.1.2 文档里我判定"按容量难解释"是错的，刀 21 的 quota 用量条出现后，用户对"MB"反而比"个"更直观（看得到当前用量）。

### 改法

settings 的 `backupRetention` 字段从单一字段升级为 union：

```ts
type BackupRetention =
  | { mode: 'count'; autoSafetyMaxCount: number }
  | { mode: 'size'; autoSafetyMaxMB: number };
```

- UI 切换：备份保留区块新增 radio "按个数 / 按容量"
- 按个数：沿用刀 19 的逻辑（3 / 7 / 15 / 30）
- 按容量：选项 5 MB / 20 MB / 50 MB / 100 MB；清理时从最旧 auto-safety 开始删，直到 `Σ size(snapshot.data) <= maxMB`
- 默认值：`{ mode: 'count', autoSafetyMaxCount: 7 }`（不改默认行为，仅开放选项）
- 老 settings 没有 mode 字段 → 视为 `count`，沿用刀 19 默认值；不写 db migration

### 体积计算

- snapshot 写入时把 `JSON.stringify(snapshot.data).length` 缓存到 `snapshot.sizeBytes`（新可选字段，不改 db schema）
- 旧 snapshot 没有 sizeBytes → 读出时即算即缓存（首次读取代价一次）
- 清理时按 sizeBytes 累加比对

### 实现位置

- `domain/types/settings.ts`：BackupRetention union
- `domain/types/snapshot.ts`：`sizeBytes?: number` 可选字段（不算 db migration——Dexie 表 schema 不变，只是 JSON 字段多了一项）
- `core/storage/StorageService.ts` snapshots 模块：清理逻辑分支化
- `features/profile/MyView.tsx` 备份偏好区块：增加 mode 切换

### 不做

- 不做"按时间保留"（"保留最近 30 天"）——加第三维度 UI 过载
- 不做用户自定义容量（5/20/50/100 四档够；自定义需校验下限以防误清空）
- 不做手动 snapshot 的容量限制——仍然是"无限保留"
- 不做"接近上限时自动清理"（清理仍由"创建新 snapshot 时触发"驱动，不开后台清理）
- 不做切换 mode 时的迁移确认 modal（切换即清理，简单粗暴；用户能再调回去）

---

## 刀 23 — C4 按 tag 选择性导出

### 现状问题

0.1.2 刀 19 给了 ExportOptionsModal 三个维度（日期 / 数据维度 / 格式），但**没法按 tag 筛**。重度用户用 tags 标记"训练日 / 旅行 / 病期"等场景，希望导出特定标签的 logs 单独审视。

为什么这版做：UI 入口（ExportOptionsModal）已经在；增量加一个筛选条比单开一个 modal 自然。

### 改法

ExportOptionsModal 第四个区块"按标签筛选"：

- 列出所有现存 tags（从 `tags` 表读，按使用频次倒序）
- 多选，默认空（= 不筛 = 全部导出）
- 选中后，logs 维度只导出 `Σ log.tags ∩ selectedTags ≠ ∅` 的条目
- partners / cycle_events / pregnancy_events / snapshots 等不受 tag 筛选影响（这些数据没有 tag 字段）
- 文件名追加后缀 `-tags-{N}` 表示按 N 个 tag 筛过（避免与全量导出文件混淆）

### 实现位置

- `features/profile/ExportOptionsModal.tsx`：增加 tag 多选区
- `features/profile/model/exportOptions.ts`：`ExportOptions` 类型增加 `tagFilter?: string[]`
- 各 export 函数（json / csv / markdown）应用 tag 过滤
- 文件名生成函数追加后缀

### 不做

- 不做"按 tag 反选"（"导出除某 tag 外的全部"）——加运算符让 UI 复杂
- 不做 tag 组合的 AND / OR 切换（默认 OR，够用）
- 不做导出预览（"按当前筛选会导出 N 条 log"实时计算）——估算成本不抵收益，导出后看就行
- partners / cycle_events 不参与 tag 筛选（它们没有 tag 字段，强加映射会让语义混乱）

---

## 刀 24 — SW periodicSync 自动备份（条件性）

### 现状问题

0.1.2 刀 17 的 `useAutoBackup` 只在**应用打开**时触发——用户长时间不开应用就没自动备份。SW 的 `periodicSync` 能在应用关闭时由浏览器后台触发。

但这事浏览器支持差：
- Chrome / Edge：支持，但需用户**安装为 PWA** + 浏览器自行决定触发频率
- Safari / Firefox：不支持
- 即使 Chrome，需要用户授予 `periodic-background-sync` 权限

### 改法（先做 feature detection，再决定动多少）

实现分两步：

**Step A**（必做）：能力检测 + 注册路径
- 应用启动检测 `'periodicSync' in registration`，能力可用且应用是 standalone 模式才注册
- 注册 `tag: 'auto-backup'`、`minInterval: 24 * 60 * 60 * 1000`
- service worker 收到 sync 事件后调用与 `useAutoBackup` 同样的备份逻辑（**抽到一个共享函数 `runAutoBackup()`**，前台 hook 与 SW handler 共用）
- 不抢占 idle 触发——两路并存（去重靠 `meta.lastAutoBackupAt` 阈值）

**Step B**（条件性）：用户提示
- 检测到能力可用但未授权 → AboutModal 加一行"启用后台备份（实验）"按钮，触发 `permissions.request({ name: 'periodic-background-sync' })`
- 不在常规 UI（数据生态卡、设置）露出——避免给非 PWA 用户错觉

### 失败降级

- API 不存在 → 静默跳过
- 注册失败 → 不打 toast，只 log（这条路本身是 best-effort 增强，不能让用户感觉"出错了"）
- 用户拒绝权限 → 记 localStorage，不再次询问

### 实现位置

- `features/backup/model/runAutoBackup.ts`（新文件，从 useAutoBackup 抽出）
- `features/pwa/periodicSync.ts`（新文件，注册逻辑）
- `dev-dist/sw.js` 或 vite-plugin-pwa 的 `injectManifest` 模式 SW 入口：处理 `periodicsync` 事件
- AboutModal 追加"启用后台备份"按钮

### 评估降级条件

如果 vite-plugin-pwa 当前 `generateSW` 模式不支持自定义 SW 事件 handler（实际很可能如此），切换到 `injectManifest` 模式成本过高时，**本刀降级为只保留前台 idle 备份**，将 periodicSync 推迟到 0.1.4 或合并到 0.2.0 视觉重塑前的 PWA 整顿。这种情况下：
- 0.1.3 总共 4 刀（20/21/22/23）
- 本刀的"不做" → 改为完全不做
- CHANGELOG 与 status memory 写明"periodicSync 因构建模式约束推迟"

### 不做

- 不做无 PWA 安装提示就强行注册（permission API 在浏览器 tab 里调用通常会失败）
- 不做"用户每月一次提醒未启用"——纠缠
- 不做与前台 idle 备份的优先级选择（两路并存 + 阈值去重）
- 不抢救 Safari/Firefox（写到 CHANGELOG"目前仅 Chrome 系 PWA 生效"即可）

---

## 验证清单（每刀完成时）

按 CLAUDE.md：
- `npx tsc --noEmit` 通过
- `npm run test` 通过
- 涉及 UI 的刀（20 / 21 / 22 / 23）必须在浏览器跑一遍 golden path

测试覆盖：
- 刀 20：`useAutoBackup` 在 enabled=false 时不触发；intervalHours 切换后下次检查应用新阈值
- 刀 21：`storageEstimate` 在 API 不存在时返回 null；80% 跨阈值触发一次 toast；24h dedup 行为；≥95% 拒绝 snapshots.create
- 刀 22：`count` 模式与 `size` 模式各自的清理行为；切换 mode 不丢已有 snapshot；老 snapshot 无 sizeBytes 时即算即缓存
- 刀 23：tagFilter 为空时不筛（全量导出）；多 tag OR 语义；非 logs 维度（partners 等）不受影响
- 刀 24：API 不存在时静默；register 失败不抛错；前台 idle + SW 两路并存的 dedup（同一 24h 窗口只产生一条 snapshot）

浏览器验证特别关注：
- 刀 21：人为造满 IndexedDB（开发者工具 → Application → Storage → 清除某个域之外的高用量），验证阈值响应
- 刀 24：实际 install PWA + 测试后台触发（Chrome DevTools → Application → Periodic Background Sync 面板可手动触发）

## 完成定义

5 刀全部 merge + 浏览器验证 + tag v0.1.3。

`CHANGELOG.md` 的 `[Unreleased]` 段提升为 `[0.1.3] - YYYY-MM-DD`，下方留新的 `[Unreleased]` 占位。

记忆里同步建一份 `project_0_1_3_status.md`，记录最终落地内容 + 推迟到 0.1.4+ 的清单。

如果刀 24 触发降级（vite-plugin-pwa 模式约束），status memory 写明降级原因 + periodicSync 推迟去向（0.1.4 或合并到 0.2.0 PWA 整顿）。

## 与 0.2.0 的衔接

完成 0.1.3 后，C 组（数据可信度）已闭环，0.x 阶段功能层稳定。下一版直接进 0.2.0 视觉重塑（按 [[project-multi-version-roadmap]] 既定路径），不再做 0.1.4——除非：
- 0.1.3 浏览器验证发现 C 组重大缺陷
- 刀 24 降级且必须在视觉重塑前补完
- 出现新的"非视觉但阻塞 0.2.0"的需求

否则 0.1.3 是 0.x 功能层的终点。

