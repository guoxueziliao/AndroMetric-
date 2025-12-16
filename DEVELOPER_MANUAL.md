# 🛠️ 开发者技术文档 (Developer Documentation)

**版本**: 0.0.6
**最后更新**: 2025-12-12

## 1. 技术栈
*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **State/Storage**: Dexie.js (IndexedDB wrapper) - **Local First Architecture**
*   **Visualization**: Chart.js / React-Chartjs-2
*   **Icons**: Lucide React
*   **PWA**: Vite PWA Plugin

## 2. 项目结构 (Project Structure)

```
.
├── components/          # UI 组件 (页面与通用组件)
│   ├── Dashboard.tsx    # 首页仪表盘
│   ├── LogForm.tsx      # 日记记录表单
│   ├── CalendarHeatmap.tsx # 日历热力图
│   ├── StatsView.tsx    # 统计分析视图
│   ├── SexLifeView.tsx  # 性生活与伴侣管理
│   ├── MyView.tsx       # 设置与数据管理
│   └── ... (Modals, Sections, Controls)
├── contexts/            # 全局状态 (React Context)
│   ├── DataContext.tsx  # 核心数据访问层
│   └── ToastContext.tsx # 消息提示
├── hooks/               # 自定义 Hooks
│   ├── useLogs.ts       # 封装数据 CRUD 操作
│   └── useLocalStorage.ts
├── services/            # 核心服务层
│   ├── StorageService.ts # IndexedDB 数据库操作封装 (核心)
│   ├── LoggerService.ts  # 内部日志/遥测
│   └── PluginManager.ts  # 插件系统管理器
├── utils/               # 工具函数库
│   ├── migration.ts     # 数据库版本迁移脚本 (Critical)
│   ├── StatsEngine.ts   # 数据统计分析引擎
│   ├── dataHealthCheck.ts # 数据健康检查
│   ├── hydrateLog.ts    # 数据模型 Hydration
│   └── validators.ts    # 输入校验
├── plugins/             # 扩展插件
│   └── CoreAnalysis.ts  # 核心分析插件
├── types.ts             # TypeScript 类型定义 (Data Schema)
├── db.ts                # Dexie 数据库实例配置
├── App.tsx              # 应用根组件 (路由与布局)
└── index.tsx            # 入口文件
```

## 3. 核心数据模型

### 3.1 LogEntry (核心日志)
应用以“生理日”为单位，每天一条 `LogEntry`。
*   **Date Logic**: 凌晨 03:00 前的活动（性爱/饮酒）归档至前一天；中午 12:00 后的睡眠归档至次日（Wake-up Day）。
*   **Structure**: 详见 `types.ts` 中的 `LogEntry` 接口。

### 3.2 数据库迁移 (Migrations)
文件：`utils/migration.ts`
由于是本地存储应用，数据结构更新必须严格编写迁移脚本。
*   `LATEST_VERSION`: 当前数据库版本号。
*   `runMigrations()`: 在 `StorageService.init()` 时调用，自动将旧版本数据转换为新结构。

## 4. 关键服务

### 4.1 StorageService
所有对 IndexedDB 的读写操作入口。
*   **Health Check**: `runHealthCheck()` 扫描数据完整性。
*   **Repair**: `repairData()` 尝试通过 `changeHistory` 恢复损坏的数据字段。
*   **Snapshot**: 创建全量数据的 JSON 快照用于备份。

### 4.2 StatsEngine
文件：`utils/StatsEngine.ts`
*   将碎片化的 `LogEntry` 扁平化为 `UnifiedEvent` 流。
*   计算 SMA（简单移动平均线）。
*   执行相关性分析（例如：高压力组 vs 低压力组的晨勃硬度差异）。

## 5. 开发指南

### 启动项目
```bash
npm install
npm run dev
```

### 添加新功能流程
1.  在 `types.ts` 中修改 `LogEntry` 接口。
2.  在 `utils/migration.ts` 中增加 `LATEST_VERSION` 并编写迁移函数（如 `migrateV35toV36`）。
3.  更新 `StorageService.ts` 中的 hydration 逻辑。
4.  更新 UI 组件 (`LogForm.tsx`, etc.)。

---

# 6. 数据稳定化 & 长期抗熵规范 (Data Constitution)

**适用版本**: v0.0.6 → v0.1.x+  
**状态**: Final (P0)

## 6.1 核心目标
本规范旨在建立系统的长期边界，确保用户事实数据的绝对可信，降低维护负担。

## 6.2 数据分级模型

### 用户事实数据 (User Fact)
*   **定义**: 用户主动输入、选择、确认的数据（即使主观、错误或矛盾）。
*   **权限**: 
    *   ❌ 系统**不得**自动修改、推断补全或在迁移时“合理化”。
    *   ✅ 系统仅允许展示、分析、冲突提示、用户主动编辑。

### 系统派生数据 (System Derived)
*   **定义**: 由系统根据用户事实计算得出的结果（如摘要、评分、缓存）。
*   **权限**: 
    *   ✅ 可删、可重算。
    *   ❌ 不得回写为用户事实。

## 6.3 迁移与数据演化规范

### 允许的行为
*   新增字段 (optional) 或结构层级。
*   字段重命名 (保持值不变)。
*   默认值补齐 (仅限字段不存在)。
*   派生数据重算。

### 明确禁止的行为
*   改变旧字段语义。
*   将“缺失”解释为“否”。
*   根据常识或统计推断历史行为。
*   自动纠正“明显填错”的用户输入 (如 `start > end`)。

### 冲突处理
*   若发现逻辑矛盾 (如时间重叠)，系统只能**标记**、**提示**或**记录问题**，❌ **不得修改原始数据**。

## 6.4 Tag Manager 长期约束
*   **重命名**: 允许 (不改变语义)。
*   **合并**: 必须需用户确认 (Explicit Confirmation)。
*   **禁止**: 静默合并、物理删除被引用的 Tag、自动语义纠正。

## 6.5 数据修复工具边界
*   数据修复是外科手术，不是日常维护。
*   ❌ 禁止后台自动修复 (无感知修复)。
*   ✅ 真实修改必须：用户确认、可追溯、可回滚。

## 6.6 结语
**数据主权在用户。系统必须诚实、克制、可解释。**
当功能需求与数据可信性发生冲突时，**数据可信性永远优先**。