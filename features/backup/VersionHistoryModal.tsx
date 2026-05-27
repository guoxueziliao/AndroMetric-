import React, { useState } from 'react';
import { Modal } from '../../shared/ui';
import { Sparkles, Zap, Bug, Layout, Database, ChevronDown, ChevronRight, Construction, AlertCircle, GitCommit } from 'lucide-react';

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
        summary: 'Tag System & Context：引入标签治理体系与全局时间轴。',
        changes: [
            { type: 'new', text: '全局时间轴 (Global Timeline)：自动将睡眠、运动、咖啡与性活动串联为生活流视图' },
            { type: 'new', text: '标签健康体系：新增“标签体检”功能，自动检测复合语义、维度冲突等长期风险' },
            { type: 'new', text: '标签管理重构：支持按 XP/事件/症状 分类管理，新增创建时的语义即时校验' },
            { type: 'new', text: '自慰记录 2.0：新增射精强度（量/力）评级与贤者时间身心状态评估' },
            { type: 'new', text: '生活方式补全：新增咖啡因摄入记录，饮酒记录增加具体时间点' },
            { type: 'opt', text: '数据质量评分：根据记录完整度实时反馈质量环，鼓励高质量记录' },
            { type: 'fix', text: '健康模块重构：支持记录生病时的具体不适程度与详细症状' },
            { type: 'data', text: 'Schema v36：底层数据结构升级，支持标签维度的长期统计' }
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

const TypeIcon: React.FC<{ type: ChangeType }> = ({ type }) => {
    switch (type) {
        case 'new': return <Sparkles size={14} className="text-state-success-text" />;
        case 'opt': return <Zap size={14} className="text-state-info-text" />;
        case 'fix': return <Bug size={14} className="text-state-danger-text" />;
        case 'ui': return <Layout size={14} className="text-chart-tertiary" />;
        case 'data': return <Database size={14} className="text-state-warning-text" />;
    }
};

const TypeBadge: React.FC<{ type: ChangeType }> = ({ type }) => {
    const config = {
        new: { label: '新增', color: 'bg-state-success-bg text-state-success-text' },
        opt: { label: '优化', color: 'bg-state-info-bg text-state-info-text' },
        fix: { label: '修复', color: 'bg-state-danger-bg text-state-danger-text' },
        ui: { label: '界面', color: 'bg-surface-muted text-chart-tertiary' },
        data: { label: '数据', color: 'bg-state-warning-bg text-state-warning-text' },
    };
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${config[type].color}`}>
            {config[type].label}
        </span>
    );
};

const VersionCard: React.FC<{ entry: VersionEntry, isLatest: boolean }> = ({ entry, isLatest }) => {
    const [isExpanded, setIsExpanded] = useState(isLatest);
    
    // Extract unique types for summary tags
    const types = Array.from(new Set(entry.changes.map(c => c.type)));

    return (
        <div className="relative pl-6 pb-8 border-l-2 border-surface-border last:border-0 last:pb-0 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-surface-card transition-colors z-10 ${isLatest ? 'bg-accent shadow-glow' : 'bg-surface-border'}`}></div>
            
            <div className="flex flex-col gap-2">
                {/* Header Row */}
                <div 
                    className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-text-primary tracking-tight">v{entry.version}</span>
                        {entry.isHotfix && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-state-danger-bg text-state-danger-text border border-state-danger-text/20">
                                <AlertCircle size={10}/> HOTFIX
                            </span>
                        )}
                        <span className="text-xs text-text-muted font-mono mt-1 ml-1 opacity-70">{entry.date}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-text-muted"/> : <ChevronRight size={16} className="text-text-muted"/>}
                </div>
                
                {/* Summary */}
                <div className="text-sm font-bold text-text-secondary leading-snug">
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
                    <div className="mt-3 bg-surface-muted rounded-xl p-4 border border-surface-border animate-in slide-in-from-top-2 duration-normal">
                        {entry.changes.length === 0 ? (
                            <div className="text-xs text-text-muted italic">暂无详细记录</div>
                        ) : (
                            entry.changes.map((change, i) => (
                                <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
                                    <div className="mt-0.5 flex-shrink-0 bg-surface-card p-1 rounded-md shadow-sm border border-surface-border">
                                        <TypeIcon type={change.type} />
                                    </div>
                                    <span className="text-sm text-text-secondary leading-relaxed">
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
                <button onClick={onClose} className="w-full py-3 bg-surface-muted text-text-primary font-bold rounded-xl hover:bg-surface-border transition-colors">
                    关闭
                </button>
            }
        >
            <div className="space-y-8 py-2">
                {/* Coming Soon Block */}
                <div className="bg-gradient-to-r from-surface-muted to-state-info-bg p-4 rounded-2xl border border-chart-tertiary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Construction size={64} />
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-chart-tertiary text-text-on-accent text-xs">
                            <GitCommit size={14}/>
                        </span>
                        <h3 className="font-bold text-chart-tertiary text-sm">正在开发 / 下个版本</h3>
                    </div>
                    <ul className="space-y-2 relative z-10">
                        {COMING_SOON.map((item, idx) => (
                            <li key={idx} className="flex items-center text-xs text-chart-tertiary font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-chart-tertiary mr-2"></span>
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
