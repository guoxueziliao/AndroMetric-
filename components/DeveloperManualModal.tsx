
import React from 'react';
import { marked } from 'marked';
import { X, Book } from 'lucide-react';

// Hardcoded content of DEVELOPER_MANUAL.md to avoid build system complexity
const MANUAL_CONTENT = `# 硬度日记 (Hardness Diary) - 核心开发架构与维护手册

**版本**: 0.0.6
**最后更新**: 2025-12-12
**重要性**: 🔴 高 (所有代码修改前必读)

---

## 1. 设计哲学与核心原则

本项目不仅仅是一个记录工具，更是一个**本地优先 (Local-First)** 的男性健康数据库。

### 1.1 核心原则 (不可动摇)
1.  **隐私绝对化**: 所有数据存储于 \`IndexedDB\` (Dexie.js)。严禁引入任何自动上传逻辑。
2.  **生理日逻辑**: 用户的“一天”是以**清醒周期**为单位的，而非时钟的 00:00。
3.  **数据完整性**: 即使是“快速记录”产生的碎片数据，在编辑时也必须通过“深度合并 (Deep Merge)”补全结构。
4.  **防退化 (No Regressions)**: 新功能添加不得破坏旧数据的读取（必须写 Migration）。

---

## 2. 项目目录结构 (Project Structure)

\`\`\`
.
├── components/          # UI 组件
│   ├── Dashboard.tsx    # 首页仪表盘
│   ├── LogForm.tsx      # 日记记录表单
│   ├── StatsView.tsx    # 统计分析视图
│   └── ...
├── contexts/            # 全局状态
├── hooks/               # 自定义 Hooks
├── services/            # 核心服务 (Storage, Logger)
├── utils/               # 工具库 (Migration, Stats)
├── types.ts             # 类型定义
└── db.ts                # 数据库配置
\`\`\`

---

## 3. 关键业务逻辑 (The Danger Zone)

### 3.1 日期判定逻辑 (Date Logic)
**这是系统中最容易出 Bug 的部分。** 请务必理解 \`hooks/useLogs.ts\` 中的判定规则。

#### 规则 A: 活动归档 (Activity Attribution)
适用于：性爱 (Sex)、自慰 (Masturbation)、饮酒等。
*   **设计意图**: 用户在凌晨 2 点进行的活动，心理上属于“昨晚”，而非“今天早上”。
*   **分割点 (Cutoff)**: **凌晨 03:00 (3 AM)**
*   **算法**:
    \`\`\`typescript
    // hooks/useLogs.ts -> getActivityTargetDate
    const currentHour = now.getHours();
    if (currentHour < 3) {
        now.setDate(now.getDate() - 1); // 归档到昨天
    }
    \`\`\`

#### 规则 B: 睡眠归档 (Sleep Attribution)
适用于：点击 FAB 按钮的“记录睡眠”。
*   **设计意图**: 无论用户是 23:00 睡还是次日 01:00 睡，这觉都是为了“明天”的日记准备的（记录的是 Wake Up Day 的状态）。
*   **分割点 (Cutoff)**: **中午 12:00 (12 PM)**
*   **算法**:
    \`\`\`typescript
    // hooks/useLogs.ts -> getSleepTargetDate
    const currentHour = now.getHours();
    // 下午/晚上点睡 -> 算明天的记录
    if (currentHour >= 12) {
        targetDate.setDate(now.getDate() + 1);
    }
    // 凌晨/上午点睡 -> 算今天的记录
    \`\`\`

### 3.2 数据存储与版本迁移 (Migration System)
*   **存储引擎**: Dexie.js (IndexedDB Wrapper)。
*   **迁移机制**: \`utils/migration.ts\`
    *   每次修改 \`LogEntry\` 结构，必须增加 \`LATEST_VERSION\`。
    *   **Data Version 34 (v0.0.6)**: 
        *   Masturbation v2: 增加 \`volumeForceLevel\` (量/力), \`postMood\` (贤者时间)。
        *   Lifestyle: 增加 \`caffeineRecord\` (咖啡因对象), \`alcoholRecord.time\`。
    *   **Data Version 33**: 初始化 v0.0.5 字段 (Environment, Dreams)。
    *   **Data Version 32**: 标准化 Schema v1.0。

---

## 4. 架构升级 v0.0.6 (Context & Quality)

### 4.1 全局时间轴 (Global Timeline)
v0.0.6 引入了 \`GlobalTimeline\` 组件，用于将碎片化的记录串联成一天的时间流。
*   **数据源**: 聚合 LogEntry 中的 \`sex\`, \`masturbation\`, \`exercise\`, \`sleep\`, \`alcoholRecord\`, \`caffeineRecord\`。
*   **排序**: 必须处理跨日逻辑（如 01:00 的夜宵应排在 23:00 的性爱之后，但在视图上属于同一“天”）。

### 4.2 数据质量评分 (Data Quality Score)
为了鼓励用户完整记录，引入了实时评分机制 \`calculateDataQuality\`。
*   **满分策略**: 基础分 (晨勃+睡眠) + 生活方式分 (天气/心情) + 活动加分。
*   **UI 反馈**: 在 LogForm 顶部显示实时分数，达到 80 分显示绿色高亮。

---

## 5. 数据模型详解 (Deep Dive)

### 5.1 自慰记录模型 V2 (Masturbation 2.0)
v0.0.6 进一步增强了自慰记录的生理维度。

**结构树**:
\`\`\`typescript
LogEntry
└── masturbation: MasturbationRecordDetails[]
    ├── volumeForceLevel: 1-5 (射精量与力度/纸巾测试)
    ├── postMood: string (贤者时间心理: 空虚/满足...)
    ├── fatigue: string (贤者时间生理: 秒睡/精神...)
    ├── assets: { ... } (XP素材来源)
    └── ... (基础字段)
\`\`\`

### 5.2 咖啡因记录 (Caffeine Record)
新增的独立模块，用于追踪兴奋剂摄入对睡眠的影响。
\`\`\`typescript
caffeineRecord: {
    totalMg: number;
    items: Array<{
        id: string;
        name: string; // e.g., '美式', '红牛'
        time: string; // HH:mm
        mg: number;
    }>
}
\`\`\`

---

## 6. 历史修复系统 (Historical Repair System)

0.0.4 版本引入了强大的数据修复管道，用于从 \`changeHistory\` 中恢复在迁移过程中可能丢失的数据。
该过程集成在 \`StorageService.repairData()\` 中，通过解析历史文本（如 "23:00"）并结合生理日逻辑，重构丢失的时间戳和枚举值。

---

## 7. UI/UX 规范 (Design System)

*   **颜色语义**:
    *   🟢 绿色: 晨勃/健康/正常/有益
    *   🔴 红色: 生病/高压/秒软/负面
    *   🔵 蓝色: 睡眠/自慰/冷静
    *   💗 粉色: 性爱/伴侣
    *   🟠 橙色: 警告/运动/午休/快速消退
    *   🟣 紫色: 梦境/看片/特殊XP
*   **图标系统**: 统一使用 \`lucide-react\`。
`;

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const DeveloperManualModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    // Parse markdown (simple sync usage)
    // Ensure marked is treated correctly whether it's an object or function in the environment
    const htmlContent = (typeof marked === 'function' ? (marked as any)(MANUAL_CONTENT) : (marked as any).parse(MANUAL_CONTENT)) as string;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                 {/* Header */}
                 <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <div className="flex items-center gap-2 text-brand-text dark:text-slate-200">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                            <Book size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight">开发者手册</h2>
                            <p className="text-xs text-brand-muted">Developer Manual v0.0.6</p>
                        </div>
                     </div>
                     <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                 </div>
                 
                 {/* Content */}
                 <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                     <article className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                         <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                     </article>
                 </div>
                 
                 {/* Footer */}
                 <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                     <button onClick={onClose} className="px-6 py-2 bg-brand-primary dark:bg-slate-800 text-brand-text dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                         关闭
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default DeveloperManualModal;
