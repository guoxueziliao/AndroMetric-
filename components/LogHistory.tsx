
import React, { useState, useMemo } from 'react';
import { History, PenTool, Zap, Wrench, HeartPulse, Hand, Dumbbell, BedDouble, SunMedium, Beer, ShieldAlert, CloudSun, FileText } from 'lucide-react';
import { LogEntry, HistoryCategory, HistoryEventType } from '../types';
import { inferHistoryEventType } from '../utils/helpers';
import { DiffRow } from './DiffRow';

interface LogHistoryProps {
    log: LogEntry;
}

const CATEGORY_ICONS: Record<HistoryCategory | 'meta', React.ElementType> = {
    sex: HeartPulse,
    masturbation: Hand,
    exercise: Dumbbell,
    sleep: BedDouble,
    morning: SunMedium,
    lifestyle: Beer,
    health: ShieldAlert,
    nap: CloudSun,
    meta: FileText,
    system: Wrench
};

const CATEGORY_LABELS: Record<HistoryCategory | 'meta', string> = {
    sex: '性爱',
    masturbation: '自慰',
    exercise: '运动',
    sleep: '睡眠',
    morning: '晨勃',
    lifestyle: '生活',
    health: '健康',
    nap: '午休',
    meta: '信息',
    system: '系统'
};

const EVENT_TYPE_CONFIG: Record<HistoryEventType, { label: string, color: string, icon: React.ElementType }> = {
    manual: { label: '详细', color: 'bg-blue-500', icon: PenTool },
    quick: { label: '快速', color: 'bg-purple-500', icon: Zap },
    auto: { label: '修复', color: 'bg-slate-500', icon: Wrench },
};

export const LogHistory: React.FC<LogHistoryProps> = ({ log }) => {
    const [typeFilter, setTypeFilter] = useState<HistoryEventType | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<HistoryCategory | 'all'>('all');

    const historyItems = useMemo(() => {
        if (!log.changeHistory || !Array.isArray(log.changeHistory) || log.changeHistory.length === 0) return [];
        
        return log.changeHistory.slice().reverse().map(record => {
            if (!record) return null; // Skip invalid records
            
            // Infer type if missing
            const summary = record.summary || '未知操作';
            const eventType = record.type || inferHistoryEventType(summary);
            
            // Determine main category
            const counts: Record<string, number> = {};
            const details = Array.isArray(record.details) ? record.details : [];
            
            details.forEach(d => {
                if (d && d.category) counts[d.category] = (counts[d.category] || 0) + 1;
            });
            const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
            const mainCategory = (sorted.length > 0 ? sorted[0][0] : 'meta') as HistoryCategory;

            return {
                ...record,
                summary,
                details,
                inferredType: eventType,
                mainCategory
            };
        }).filter(Boolean) as (typeof log.changeHistory[0] & { inferredType: HistoryEventType, mainCategory: HistoryCategory, summary: string, details: typeof log.changeHistory[0]['details'] })[];
    }, [log.changeHistory]);

    const filteredItems = useMemo(() => {
        return historyItems.filter(item => {
            const matchesType = typeFilter === 'all' || item.inferredType === typeFilter;
            const matchesCategory = categoryFilter === 'all' || item.mainCategory === categoryFilter;
            // Also filter out empty noise events unless it's a creation event
            const hasDetails = item.details && item.details.length > 0;
            const isCreation = item.summary.includes('创建') || item.summary.includes('New');
            
            return matchesType && matchesCategory && (hasDetails || isCreation);
        });
    }, [historyItems, typeFilter, categoryFilter]);

    if (!log.changeHistory || log.changeHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <History size={48} className="mb-4 opacity-20"/>
                <span className="text-sm">暂无修改记录</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-2">
            {/* Filter Bar */}
            <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                {/* Type Filter */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${typeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'}`}
                    >
                        全部类型
                    </button>
                    {(['manual', 'quick', 'auto'] as HistoryEventType[]).map(t => {
                        const conf = EVENT_TYPE_CONFIG[t];
                        const Icon = conf.icon;
                        return (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors flex items-center border ${typeFilter === t ? `${conf.color} text-white border-transparent` : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                <Icon size={10} className="mr-1"/> {conf.label}
                            </button>
                        );
                    })}
                </div>
                
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button 
                        onClick={() => setCategoryFilter('all')}
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${categoryFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'}`}
                    >
                        全部模块
                    </button>
                    {Object.keys(CATEGORY_LABELS).map(key => {
                        const cat = key as HistoryCategory;
                        if (cat === 'system' || cat === 'meta') return null; // Skip system categories in filter for simplicity
                        return (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${categoryFilter === cat ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {CATEGORY_LABELS[cat]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pb-4">
                {filteredItems.length === 0 ? (
                    <div className="pl-6 py-4 text-xs text-slate-400 italic">
                        没有符合筛选条件的记录
                    </div>
                ) : (
                    filteredItems.map((record, i) => {
                        // Safe Access
                        if (!record) return null;
                        const typeConf = EVENT_TYPE_CONFIG[record.inferredType] || EVENT_TYPE_CONFIG['manual'];
                        const CategoryIcon = CATEGORY_ICONS[record.mainCategory] || FileText;
                        const catLabel = CATEGORY_LABELS[record.mainCategory] || '其他';

                        return (
                            <div key={i} className="relative pl-6 animate-in slide-in-from-bottom-2 fade-in" style={{animationDelay: `${Math.min(i * 30, 300)}ms`}}>
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm z-10 ${typeConf.color} text-white`}>
                                    <CategoryIcon size={12}/>
                                </div>
                                
                                {/* Card Content */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-brand-text dark:text-slate-200">{record.summary}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center`}>
                                                {catLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-[10px] font-bold ${typeConf.color.replace('bg-', 'text-')}`}>
                                                {React.createElement(typeConf.icon, { size: 10 })}
                                                {typeConf.label}
                                            </span>
                                            <span className="text-[10px] text-brand-muted font-mono">
                                                {new Date(record.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {record.details && record.details.length > 0 && (
                                        <div className="mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                            {record.details.map((d, idx) => (
                                                d ? <DiffRow key={idx} diff={d} /> : null
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div className="absolute -left-[5px] bottom-0 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>
    );
};