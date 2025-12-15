
import React, { useState } from 'react';
import Modal from './Modal';
import { Sparkles, Zap, Bug, Layout, Database, History, ChevronDown, ChevronRight, Construction, AlertCircle, Tag, GitCommit } from 'lucide-react';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ChangeType = 'new' | 'opt' | 'fix' | 'ui' | 'data';

interface ChangeItem {
    type: ChangeType;
    text: string;
}

interface VersionEntry {
    version: string;
    date: string;
    summary: string;
    isHotfix?: boolean;
    changes: ChangeItem[];
}

const HISTORY: VersionEntry[] = [
    {
        version: '0.0.6',
        date: '2025-12-12',
        summary: 'Context & Quality：引入全局时间轴与多维身心记录。',
        changes: [
            { type: 'new', text: '全局事件时间轴：在日记底部将睡眠、运动、咖啡与性活动串联为生活流' },
            { type: 'new', text: '自慰详情增强：新增“纸巾压力测试”与“贤者时间”心理/生理评估' },
            { type: 'new', text: '生活方式补全：新增咖啡因摄入记录，饮酒记录增加具体时间' },
            { type: 'opt', text: '数据质量评分：根据记录完整度实时反馈质量分' },
            { type: 'data', text: 'Schema v1.1：底层数据结构升级适配新特性' }
        ]
    },
    {
        version: '0.0.5',
        date: '2025-12-10',
        summary: '生活方式记录全面升级：从 QuickLog 到多维体感。',
        changes: [
            { type: 'new', text: '自慰 Quick Log：一键记录开始时间，完事后再补充详情' },
            { type: 'new', text: '睡眠增强：新增梦境记录（含午休）、睡眠环境（地点/温度）' },
            { type: 'new', text: '饮酒扩展：新增醉意程度 (微醺/断片) 与饮酒场景' },
            { type: 'new', text: '身体状态：细化健康记录（症状/用药/体感）与运动后感受' },
            { type: 'new', text: '生活点滴：增加咖啡因摄入记录与每日特别事件标签' },
            { type: 'data', text: '数据结构升级，支持更丰富的元数据记录' },
            { type: 'opt', text: '日历组件新增月份快速跳转功能' }
        ]
    },
    {
        version: '0.0.4',
        date: '2025-12-10',
        summary: '数据健康体系上线：让数据更可靠，维护更轻松。',
        changes: [
            { type: 'new', text: '全新“数据健康体检”功能，可自动扫描并修复数据结构异常' },
            { type: 'fix', text: '修复了历史版本遗留的“未知伴侣”引用问题' },
            { type: 'data', text: '增强了数据ID的唯一性约束，防止未来出现数据冲突' },
            { type: 'opt', text: '优化了设置页面布局，将维护工具集中展示' }
        ]
    },
    {
        version: '0.0.3',
        date: '2025-11-11',
        summary: '引入“伴侣档案”与自慰记录 2.0，大幅增强数据维度。',
        changes: [
            { type: 'new', text: '全新“伴侣档案”，记录喜好、纪念日与身体密码' },
            { type: 'new', text: '自慰记录 2.0，支持记录 XP、素材来源与场景' },
            { type: 'new', text: '性生活记录支持多阶段互动、动作链与体位细节' },
            { type: 'opt', text: '优化了数据备份与恢复功能，支持生成快照' },
            { type: 'ui', text: '改进了深色模式下的显示效果与色彩对比度' },
            { type: 'fix', text: '修复了跨午夜睡眠时长计算不准的问题' },
            { type: 'data', text: '升级了数据存储结构以支持更复杂的记录' }
        ]
    },
    {
        version: '0.0.2',
        date: '2025-11-11',
        summary: '生活习惯快速记录与统计模块上线。',
        changes: [
            { type: 'new', text: '增加饮酒、运动与午休的快速记录功能' },
            { type: 'new', text: '统计页面上线，增加基础趋势分析图表' },
            { type: 'opt', text: '首页日历支持通过颜色区分当日健康状态' },
            { type: 'ui', text: '调整了底部导航栏布局，操作更顺手' },
            { type: 'fix', text: '修复了部分设备上输入框被键盘遮挡的问题' }
        ]
    },
    {
        version: '0.0.1',
        date: '2025-11-11',
        summary: '初版发布，确立隐私优先的核心架构。',
        changes: [
            { type: 'new', text: '核心功能上线，支持晨勃硬度与睡眠时间记录' },
            { type: 'new', text: '隐私优先设计，所有数据完全存储于本地' },
            { type: 'ui', text: '基于日历热力图的主界面设计' }
        ]
    }
];

const COMING_SOON = [
    '⌚ 接入 Apple Health & Google Fit (自动同步睡眠/运动)',
    '🧬 精液质量追踪 & 备孕辅助模式',
    '🏥 勃起功能障碍 (IIEF-5) 专业自测',
    '📱 桌面小组件 (无需打开 App 即可打卡)'
];

const TypeIcon = ({ type }: { type: ChangeType }) => {
    switch (type) {
        case 'new': return <Sparkles size={14} className="text-green-500" />;
        case 'opt': return <Zap size={14} className="text-blue-500" />;
        case 'fix': return <Bug size={14} className="text-red-500" />;
        case 'ui': return <Layout size={14} className="text-purple-500" />;
        case 'data': return <Database size={14} className="text-orange-500" />;
    }
};

const TypeBadge = ({ type }: { type: ChangeType }) => {
    const config = {
        new: { label: '新增', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        opt: { label: '优化', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        fix: { label: '修复', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        ui: { label: '界面', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        data: { label: '数据', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${config[type].color}`}>
            {config[type].label}
        </span>
    );
};

const VersionCard = ({ entry, isLatest }: { entry: VersionEntry, isLatest: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(isLatest);
    
    // Extract unique types for summary tags
    const types = Array.from(new Set(entry.changes.map(c => c.type)));

    return (
        <div className="relative pl-6 pb-8 border-l-2 border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 transition-colors z-10 ${isLatest ? 'bg-brand-accent shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            
            <div className="flex flex-col gap-2">
                {/* Header Row */}
                <div 
                    className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-brand-text dark:text-slate-100 tracking-tight">v{entry.version}</span>
                        {entry.isHotfix && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <AlertCircle size={10}/> HOTFIX
                            </span>
                        )}
                        <span className="text-xs text-brand-muted font-mono mt-1 ml-1 opacity-70">{entry.date}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                </div>
                
                {/* Summary */}
                <div className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">
                    {entry.summary}
                </div>

                {/* Type Tags Summary */}
                {!isExpanded && (
                    <div className="flex gap-2 mt-1">
                        {types.map(t => <TypeBadge key={t} type={t} />)}
                    </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                        {entry.changes.length === 0 ? (
                            <div className="text-xs text-slate-400 italic">暂无详细记录</div>
                        ) : (
                            entry.changes.map((change, i) => (
                                <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
                                    <div className="mt-0.5 flex-shrink-0 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                                        <TypeIcon type={change.type} />
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {change.text}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="版本记录"
            footer={
                <button onClick={onClose} className="w-full py-3 bg-brand-primary dark:bg-slate-800 text-brand-text dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    关闭
                </button>
            }
        >
            <div className="space-y-8 py-2">
                {/* Coming Soon Block */}
                <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-4 rounded-2xl border border-violet-100 dark:border-violet-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Construction size={64} />
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-xs">
                            <GitCommit size={14}/>
                        </span>
                        <h3 className="font-bold text-violet-700 dark:text-violet-300 text-sm">正在开发 / 下个版本</h3>
                    </div>
                    <ul className="space-y-2 relative z-10">
                        {COMING_SOON.map((item, idx) => (
                            <li key={idx} className="flex items-center text-xs text-violet-600 dark:text-violet-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mr-2"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* History List */}
                <div className="space-y-0">
                    {HISTORY.map((entry, idx) => (
                        <VersionCard key={entry.version} entry={entry} isLatest={idx === 0} />
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default VersionHistoryModal;
