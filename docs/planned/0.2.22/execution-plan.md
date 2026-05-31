# 0.2.22 执行计划

## 目标

在不改字段、不动存储、不拆组件的前提下，整理「设置与数据」面板的分区分组、统一标题与项样式、明确每项归属。开发完成后：设置分区清晰稳定、标题样式统一、每项归属明确，且所有设置项功能与读写行为完全不变。

## 进入开发前校准

先读这些文件：

- `features/profile/MyView.tsx`（877 行）：设置 Modal（title「设置与数据」，约 328 行起）、各分区标题、标签管理 / 回测实验室 / 数据快照 / 迁移与备份卡片、危险操作 Modal。
- `domain/types/settings.ts`：`AppSettings`（8 字段，本版只读不改）。
- `app/appConfig.ts`：`defaultSettings`（不改）。
- `app/AppContent.tsx`：settings 持有与 `onUpdateSettings`（数据流，不改）。
- `features/profile/model/useProfileMaintenance.ts`：备份 / 快照 / 导入导出逻辑（行为不改）。

## 校准事实（2026-05-31 实测）

- `AppSettings` 仅：theme / enableNotifications / notificationTime / hiddenFields / lastExportAt / appLock / backupRetention / backupSchedule。结构克制，**不需要改字段**。
- 设置 Modal 内分区：外观 / 隐私 / 3 个备份相关分区（自动备份调度、备份保留策略等）/ 迁移与备份。
- 独立卡片散落：标签管理、虚拟回测实验室、数据快照。
- 标题两套样式：`text-xs ... text-text-muted uppercase tracking-wider`（设置分区）与 `font-bold text-sm text-text-primary`（卡片）。
- 危险操作（清除全部数据）在独立 Modal。

## 实现切片

### 切片 1：目标分组落地

按 `settings-grouping-contract.md`，把现有项收束为稳定分组（建议）：

- 外观与通知：theme、enableNotifications、notificationTime。
- 隐私与安全：appLock、hiddenFields 相关入口。
- 数据与备份：备份调度、备份保留、数据快照、迁移与备份、导入导出。
- 数据管理：标签管理、（回测实验室按归属决定保留位置）。
- 危险操作：清除全部数据，保持独立、显著、需确认。

每项只归一个分区，不重复出现。

### 切片 2：标题与项样式统一

- 选定一套分区标题样式（建议沿用 `text-xs ... text-text-muted uppercase`），所有分区统一。
- 设置项行样式（标签 + 控件）统一间距与对齐。
- 只复用现有 token，不引入新颜色 / 新视觉。

### 切片 3：命名校准

- 分区与项命名表达用户意图，消除语义不清或重复标题（见 `entry-and-naming.md`）。
- 不出现两个含义重叠的分区标题。

### 切片 4：行为等价回归

- 逐项确认：每个设置项的功能、读写、默认值、确认弹窗与整理前一致。
- 备份 / 快照 / 导入导出 / 清除数据等动作行为不变。

## 实现顺序

1. 代码校准：列出设置 Modal 现有全部分区与项，标注当前归属与标题样式。
2. 定稿目标分组（切片 1）。
3. 重排 JSX 到目标分组，保持每项原有 props / handler 不变。
4. 统一标题与项样式（切片 2）。
5. 校准命名（切片 3）。
6. 行为等价回归（切片 4）。

## 验收步骤

- 设置面板分区与 `settings-grouping-contract.md` 一致。
- 所有分区标题使用同一套样式。
- 每个设置项只出现在一个分区。
- 所有设置项功能、读写、默认值与整理前一致（行为等价）。
- `AppSettings` 字段、`defaultSettings`、数据流未改动。
- 危险操作仍独立、显著、需确认。

## 检查命令

```bash
rg -n "AppSettings|defaultSettings|onUpdateSettings" domain app features
rg -n "uppercase tracking-wider|font-bold text-sm text-text-primary" features/profile/MyView.tsx
git diff -- domain/types/settings.ts app/appConfig.ts
npx tsc --noEmit
npm run build
```

期望：`settings.ts` 与 `appConfig.ts` 的 `git diff` 为空（字段 / 默认值未改）。

## 测试建议

- 手动：逐项点开每个设置项，确认开关 / 选择 / 弹窗行为不变。
- 手动：亮 / 暗下分区标题样式一致，无错位。
- 回归：备份调度、保留策略、快照还原、导入导出、清除数据流程不变。
- `git diff` 确认字段与默认值零改动。

## 停线项

- 整理无法在不拆 `MyView.tsx` 的情况下完成（升级到 B，需用户确认）。
- 整理需要改 `AppSettings` 字段或存储（升级到 C / 需 schema，需用户确认）。
- 需要新增设置项或新功能。
- 需要引入新视觉风格而非复用现有 token。
- 需要改备份 / 导出的用户可见字段或 JSON 字段名。
