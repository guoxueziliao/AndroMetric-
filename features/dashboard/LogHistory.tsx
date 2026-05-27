
import React, { useState, useMemo } from 'react';
import { History, PenTool, Zap, Wrench, HeartPulse, Hand, Dumbbell, BedDouble, SunMedium, Beer, ShieldAlert, CloudSun, FileText } from 'lucide-react';
import type { LogEntry, HistoryCategory, HistoryEventType } from '../../domain';
import { inferHistoryEventType } from '../../domain';
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

const EVENT_TYPE_CONFIG: Record<HistoryEventType, { label: string, bg: string, text: string, icon: React.ElementType }> = {
    manual: { label: '详细', bg: 'bg-state-info-text', text: 'text-state-info-text', icon: PenTool },
    quick: { label: '快速', bg: 'bg-chart-tertiary', text: 'text-chart-tertiary', icon: Zap },
    auto: { label: '修复', bg: 'bg-text-muted', text: 'text-text-muted', icon: Wrench },
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
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <History size={48} className="mb-4 opacity-20"/>
                <span className="text-sm">暂无修改记录</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-2">
            {/* Filter Bar */}
            <div className="space-y-2 pb-2 border-b border-surface-border">
                {/* Type Filter */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${typeFilter === 'all' ? 'bg-surface-inverted text-text-inverted border-surface-inverted' : 'bg-transparent text-text-muted border-surface-border'}`}
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
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors flex items-center border ${typeFilter === t ? `${conf.bg} text-text-on-accent border-transparent` : 'bg-transparent text-text-muted border-surface-border'}`}
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
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${categoryFilter === 'all' ? 'bg-surface-inverted text-text-inverted border-surface-inverted' : 'bg-transparent text-text-muted border-surface-border'}`}
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
                                className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${categoryFilter === cat ? 'bg-state-info-bg text-state-info-text border-state-info-text/30' : 'bg-transparent text-text-muted border-surface-border'}`}
                            >
                                {CATEGORY_LABELS[cat]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-surface-border ml-4 space-y-6 pb-4">
                {filteredItems.length === 0 ? (
                    <div className="pl-6 py-4 text-xs text-text-muted italic">
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
                                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-surface-card flex items-center justify-center shadow-sm z-10 ${typeConf.bg} text-text-on-accent`}>
                                    <CategoryIcon size={12}/>
                                </div>
                                
                                {/* Card Content */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-text-primary">{record.summary}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-surface-muted text-text-muted flex items-center`}>
                                                {catLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-[10px] font-bold ${typeConf.text}`}>
                                                {React.createElement(typeConf.icon, { size: 10 })}
                                                {typeConf.label}
                                            </span>
                                            <span className="text-[10px] text-text-muted font-mono">
                                                {new Date(record.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {record.details && record.details.length > 0 && (
                                        <div className="mt-1 bg-surface-card rounded-xl border border-surface-border shadow-sm overflow-hidden">
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
                <div className="absolute -left-[5px] bottom-0 w-3 h-3 rounded-full bg-surface-border"></div>
            </div>
        </div>
    );
};
