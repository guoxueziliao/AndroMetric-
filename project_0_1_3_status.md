# 0.1.3 状态记录

记录日期：2026-05-26

## 版本目标

0.1.3 继续收口 C 组数据安全闭环：

- 自动备份用户可控。
- 本地存储用量可见并可预警。
- 自动安全快照支持按容量保留。
- 导出支持按 tag 过滤日志。
- periodicSync 作为条件性增强评估。

## 已落地

### 刀 20：自动备份用户可配

- `backupSchedule.enabled` 控制 idle 自动备份是否运行，默认开启。
- `backupSchedule.intervalHours` 支持 6 / 12 / 24 / 48，默认 24。
- `useAutoBackup` 改为从 settings 接收配置，关闭后跳过 idle 检查。
- 修复、导入和文件系统恢复前的 imperative 安全快照不受开关影响。
- 设置页显示上次 idle 自动备份时间。

### 刀 21：quota 监控

- 新增 `core/storage/storageEstimate.ts`，包装 `navigator.storage.estimate()`。
- 冷启动 5 秒后、snapshot 写入后、logs 写入后触发用量检查。
- 80% 以上给出 24 小时去重提示。
- 95% 以上给出红色警告，并拒绝创建新 snapshot。
- About modal 展示本地存储用量、容量和百分比；不支持 API 时静默降级。

### 刀 22：按容量保留策略

- `backupRetention` 升级为 union：按个数或按容量。
- 按个数保留继续支持 3 / 7 / 15 / 30，默认 7。
- 按容量保留支持 5 / 20 / 50 / 100 MB。
- `Snapshot` 新增可选 `sizeBytes`；旧快照读取时即算即缓存。
- 自动安全快照清理按所选策略执行，手动快照仍不限数量。

### 刀 23：按 tag 导出

- `ExportOptions` 新增 `tagFilter`。
- ExportOptionsModal 新增按标签筛选区，按日志使用频次排序。
- tagFilter 只影响 logs 维度；partners / tags / cycleEvents / pregnancyEvents / snapshots 不受影响。
- 多 tag 使用 OR 语义。
- 导出文件名追加 `tags-N` 后缀。

### 刀 24：periodicSync 评估

- 当前 PWA 仍使用 vite-plugin-pwa `generateSW` 模式。
- 真正处理 `periodicsync` 事件需要切换到 `injectManifest` 并维护自定义 service worker。
- 按文档降级条件，本刀推迟，不在 0.1.3 落地。

## 验证

- 已通过：
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `git diff --check`
  - `npm run lint`（0 errors，仍有既有 warnings）
- 本轮补充收口：
  - 移除设置页主题切换处新增的 `any`。
  - 补跑 `npm run typecheck` 通过。
- 尚需真机 / 浏览器手动验证：
  - 刀 20 / 21 / 22 / 23 的设置页、导出弹窗、About modal golden path。
  - 刀 21 的 quota 阈值响应需要人为构造高用量场景。

## 已知测试噪声

- Vitest 中仍可能出现 Dexie IndexedDB missing / localStorage warning，属于当前测试环境已有噪声。
- ESLint 仍有大量历史 warning（`any`、hooks deps、Fast Refresh export），本轮未做横向清理。

## 推迟到 0.1.4+ / PWA 整顿

- Service Worker periodicSync 自动备份。
- 切换 vite-plugin-pwa 到 injectManifest。
- periodic-background-sync 权限申请与 Chrome PWA 真实设备验证。
- 数组元素级 merge。
- 逐字段交互式冲突选择。
- 按时间保留策略。
