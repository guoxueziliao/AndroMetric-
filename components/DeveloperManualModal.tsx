
import React from 'react';
import { marked } from 'marked';
import { X, Book } from 'lucide-react';

// Hardcoded content of DEVELOPER_MANUAL.md to avoid build system complexity
const MANUAL_CONTENT = `# 硬度日记 (Hardness Diary) - 核心开发架构与维护手册

**版本**: 0.0.5
**最后更新**: 2025-06-12
**重要性**: 🔴 高 (所有代码修改前必读)

---

## 1. 设计哲学与核心原则

本项目不仅仅是一个记录工具，更是一个**本地优先 (Local-First)** 的男性健康数据库。

### 1.1 核心原则 (不可动摇)
1.  **隐私绝对化**: 所有数据存储于 \`localStorage\` (未来迁移至 IndexedDB)。严禁引入任何自动上传逻辑。
2.  **生理日逻辑**: 用户的“一天”是以**清醒周期**为单位的，而非时钟的 00:00。
3.  **数据完整性**: 即使是“快速记录”产生的碎片数据，在编辑时也必须通过“深度合并 (Deep Merge)”补全结构，防止 UI 报错。
4.  **防退化 (No Regressions)**: 新功能添加不得破坏旧数据的读取（必须写 Migration）。

---

## 2. 关键业务逻辑 (The Danger Zone)

### 2.1 日期判定逻辑 (Date Logic)
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

### 2.2 数据存储与版本迁移 (Migration System)
*   **存储键值**: \`morningWoodLogs\` (日志数组), \`sexPartners\` (伴侣档案), \`appSettings\` (全局设置)。
*   **迁移机制**: \`utils/migration.ts\`
    *   每次修改 \`LogEntry\` 结构，必须增加 \`LATEST_VERSION\`。
    *   必须编写对应的 \`migrateV{Old}toV{New}\` 函数。
    *   \`useLogs\` 初始化时会自动运行迁移。
    *   **Data Version 23**: 将 LogEntry.exercise 从对象迁移为数组结构，支持多次记录。
    *   **Data Version 25**: 迁移 Lifestyle (酒/片) 数据逻辑，强制对齐生理日。
    *   **Data Version 26**: 增加了 **Nap (午休)** 记录支持 (Array of NapRecord)。
    *   **Data Version 28**: 增加了 **Alcohol (饮酒)** 精确记录 (AlcoholRecord)。
    *   **Data Version 29**: 增加了 **Masturbation V2 (自慰 2.0)** 结构，引入 \`assets\`, \`edging\`, \`lubricant\` 字段。

---

## 3. Log Schema v1.0 (Standardization)

为了保证长期维护性，v0.0.4 引入了 Schema v1.0 标准。所有新数据必须严格遵守以下规范。

### 3.1 基础字段规范
*   **Optional Fields**: 所有可选字段在缺失时，建议在 DB 层面存储为 \`null\` 而非 \`undefined\`，以表明“已知无数据”状态（Though strict JSON may drop undefined, UI should handle both）。
*   **ID Strategy**: 所有子记录（Sub-records）必须拥有唯一的 \`id\` 字符串。

### 3.2 Health Object (Standardized)
历史数据中 \`health\` 字段可能缺失或不完整。Schema v1.0 强制 \`health\` 对象结构如下：
\`\`\`typescript
interface Health {
    isSick: boolean;          // 必需, default: false
    illnessType: string | null; // 可选: 'cold' | 'fever' | 'headache' | 'other'
    medicationTaken: boolean | null;
    medicationName: string | null;
}
\`\`\`

### 3.3 Domain Objects
*   **ExerciseEntry**: 必须包含 \`type\`, \`startTime\`, \`duration\`。
*   **MasturbationEntry**: 必须包含 \`tools\` (array), \`assets\` (object), \`edging\` (enum)。
*   **NapEntry**: 必须包含 \`startTime\`, \`duration\`, \`ongoing\`。

---

## 4. 历史修复系统 (Historical Repair System)

0.0.4 版本引入了强大的数据修复管道，用于从 \`changeHistory\` 中恢复在迁移过程中可能丢失的数据。

### 4.1 修复逻辑
文件: \`utils/historyRepair.ts\`

系统会遍历每个日志的修改历史，寻找曾经记录过但当前为空的关键字段：
*   **睡眠时间 (Sleep Times)**: 通过解析历史文本（如 "23:00"）并结合生理日逻辑，重构 ISO 时间戳。
*   **睡眠质量 (Sleep Quality)**: 将 "3星" 等文本描述还原为数字评分。
*   **压力与健康**: 将 "还好", "生病" 等描述映射回枚举值。

### 4.2 运行机制
该修复过程集成在 \`StorageService.repairData()\` 中。
*   **Step 1**: Hydrate (标准化结构)。
*   **Step 2**: Historical Repair (基于证据链恢复)。
*   **Step 3**: Logical Fix (数值范围修正、ID补全)。
*   **Step 4**: Orphan Link Fix (自动恢复丢失的伴侣档案)。

此过程确保了即使在数据结构剧烈变化后，用户的历史记录也能最大程度地被保留和修复。

---

## 5. 数据模型详解 (Deep Dive)

### 5.1 自慰记录模型 V2 (Masturbation 2.0)
为了支持 XP 雷达图和更细致的记录，自慰数据结构进行了大幅扩展。

**结构树**:
\`\`\`typescript
LogEntry
└── masturbation: MasturbationRecordDetails[]
    ├── id, startTime, duration
    ├── tools: string[] (物理工具: 手, 飞机杯...)
    ├── assets: { // 新增: 内容资产
    │   ├── sources: string[] (来源: 视频, 幻想...)
    │   ├── platforms: string[] (平台: Pornhub, Twitter...)
    │   ├── categories: string[] (XP标签: 巨乳, NTR, 足控...) -> 用于生成雷达图
    │   └── target: string (具体对象: 关联 Partner 或 临时昵称)
    │   }
    ├── edging: 'none' | 'once' | 'multiple' (边缘控制)
    ├── lubricant: string (润滑剂类型)
    └── orgasmIntensity: number (1-5 愉悦度)
\`\`\`

### 5.2 性爱记录模型 (The Sex Interaction Model)
为了支持“多伴侣、多阶段、地点转移、动作顺序”，我们废弃了扁平结构，采用了**嵌套互动流**模型。

**结构树**:
\`\`\`typescript
LogEntry
└── sex: SexRecordDetails[] (单日可多次)
    ├── id, startTime, duration
    ├── state (new: 自身状态, e.g., 'drunk')
    ├── indicators (高潮, 射精, 道具等全局标记)
    ├── postSexActivity (善后标签)
    └── interactions: SexInteraction[] (核心：互动阶段列表)
        ├── Stage 1: { partner: "A", location: "客厅", role: "人妻", chain: [...] }
        ├── Stage 2: { partner: "A", location: "卧室", costumes: ["黑丝"], chain: [...] }
        └── Stage 3: { partner: "B", location: "卧室", toys: ["震动棒"], chain: [...] }
\`\`\`

---

## 6. 组件架构规范

### 6.1 表单系统 (\`LogForm.tsx\`)
这是一个复杂的巨型表单，包含特殊的渲染逻辑。

*   **数据初始化 (Hydration)**:
    *   使用了 \`initializeLog\` 函数进行**深度合并 (Deep Merge)**。
    *   **原因**: 快速记录创建的日志可能只包含 \`{ date, sex: [...] }\`。如果直接打开，\`log.health\` 为空，会导致 UI 报错。初始化逻辑会强制补全默认值（如 \`alcohol: 'none'\`, \`stress: 2\`）。
*   **动态排序 (Dynamic Sorting)**:
    *   在 \`SexRecordModal\` 和 \`MasturbationRecordModal\` 中，标签选项（如姿势、XP类型）不是固定的。
    *   系统会遍历用户的历史记录 (\`logs\`)，统计各标签的使用频率，并将高频标签自动排在前面。

### 6.2 统计视图 (\`StatsView.tsx\`)
*   **XP 雷达图**: 位于“习惯”标签页。
    *   逻辑: 遍历所有日志的 \`masturbation.assets.categories\`。
    *   取 Top 6 频率最高的标签生成 Radar Chart。

### 6.3 个人空间 (\`MyView.tsx\`)
*   **数据映射**: 首页的六宫格统计分别映射了：日常(总天数)、晨勃、性生活、自慰、运动、好梦。
*   **功能折叠**: 核心设置（导出、备份）被折叠在右上角的 ⚙️ 设置模态框中，保持主界面清爽。

---

## 7. UI/UX 规范 (Design System)

*   **颜色语义**:
    *   🟢 绿色: 晨勃/健康/正常/有益
    *   🔴 红色: 生病/高压/秒软/负面
    *   🔵 蓝色: 睡眠/自慰/冷静
    *   💗 粉色: 性爱/伴侣
    *   🟠 橙色: 警告/运动/午休/快速消退
    *   🟣 紫色: 梦境/看片/特殊XP (新: 自慰XP标签)
*   **图标系统**: 统一使用 \`lucide-react\`。
*   **Neon Chip**: 自慰记录页使用了新的 Neon 风格标签，激活时带有光晕效果 (\`box-shadow\`)。
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
                            <p className="text-xs text-brand-muted">Developer Manual v0.0.5</p>
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
