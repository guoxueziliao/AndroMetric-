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
