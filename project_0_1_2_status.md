# 0.1.2 状态记录

记录日期：2026-05-26

## 版本目标

0.1.2 完成两条主线：

- C 组数据可信度消化：备份自检、idle 自动备份、字段级 merge、选择性导出、可配保留策略。
- 版本号管理收口：`package.json.version` 作为唯一来源，用户可见版本、导出元信息、PWA 更新提示和 CHANGELOG 统一。

## 已落地

### 版本与更新

- `package.json.version` 升至 `0.1.2`，Vite 通过 `__APP_VERSION__` 注入应用版本。
- `APP_VERSION` 改为构建注入值，设置里不再保存版本号。
- 新增 `CHANGELOG.md`，补齐 0.0.7 到 0.1.2 的用户可见变化。
- 新增 About modal，展示应用版本、数据版本、隐私声明和更新历史。
- PWA 更新从无感 auto update 改为 prompt 提示，用户点击后刷新。

### 备份与恢复

- 快照创建后执行写后读回校验，校验失败会删除半成品快照并抛错。
- 自动安全快照使用 `kind: 'auto-safety'` 标识。
- idle 自动备份在有日志、超过 24 小时未自动备份、浏览器空闲时触发。
- 自动安全快照保留数支持 3 / 7 / 15 / 30，默认 7；下调后立即清理旧自动快照。
- 手动快照不限数量。

### 导入合并

- 导入预览支持版本守卫：`dataVersion` 决定兼容性，`appVersion` 仅展示。
- merge 模式下检测字段级冲突。
- 冲突 UI 支持全局选择“全部保留当前”或“全部使用导入”。
- 数组字段按整个字段比较，不下钻元素。
- 文件系统备份恢复复用导入预览与冲突策略。

### 导出

- 新增 JSON / CSV / Markdown 统一导出选项弹窗。
- 支持日期区间筛选。
- 支持维度勾选：logs、partners、tags、cycleEvents、pregnancyEvents、snapshots。
- CSV 导出包支持按维度生成文件，并附带 `meta.json`。
- Markdown 导出应用日期筛选，但只导出日志维度。
- JSON 导出可包含内部快照；导入时追加为新快照，避免覆盖本机快照 ID。

## 验证

- `npm run typecheck` 通过。
- `npm run test` 通过：15 个测试文件，58 个测试。
- `npm run build` 通过。
- `npm run lint` 通过，无 error；仍有既有 warning。
- `git diff --check` 通过。

## 已知测试噪声

- Vitest 中仍会出现 Dexie IndexedDB missing / localStorage warning，属于当前测试环境已有噪声。

## 推迟到 0.1.3+

- 数组元素级 merge。
- 逐字段交互式冲突选择。
- 按 tag 选择性导出。
- 按容量或存储配额的保留策略。
- Service Worker periodicSync 自动备份。
- 强制刷新升级、OT / CRDT、按时间戳自动取新。
