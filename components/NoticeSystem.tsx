
import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export type NoticeLevel = 'error' | 'warn' | 'info';

export interface NoticeAction {
  label: string;
  intent?: 'primary' | 'ghost';
  onAction: (e: React.MouseEvent) => void;
  confirm?: {
    title: string;
    message: string;
  };
}

export interface NoticeItem {
  id: string;
  level: NoticeLevel;
  title: string;
  detail?: string;
  ruleId?: string;
  path?: string;
  action?: NoticeAction;
}

const LEVEL_CONFIG = {
    error: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-900/30' },
    warn: { icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-900/30' },
    info: { icon: Info, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' }
};

export const NoticeBadge: React.FC<{
  level: NoticeLevel;
  count: number;
  expanded?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  className?: string;
}> = ({ level, count, expanded, onToggle, className = '' }) => {
    const conf = LEVEL_CONFIG[level];
    const Icon = conf.icon;
    
    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(e); }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${conf.bg} ${conf.border} ${conf.color} ${className}`}
        >
            <Icon size={12} strokeWidth={2.5} />
            <span>{count}</span>
            {onToggle && (expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
        </button>
    );
};

export const InlineNotice: React.FC<{
  item: NoticeItem;
  compact?: boolean;
  className?: string;
}> = ({ item, compact = true, className = '' }) => {
    const conf = LEVEL_CONFIG[item.level];
    const Icon = conf.icon;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.action) {
            if (item.action.confirm) {
                if (window.confirm(`${item.action.confirm.title}\n\n${item.action.confirm.message}`)) {
                    item.action.onAction(e);
                }
            } else {
                item.action.onAction(e);
            }
        }
    };

    return (
        <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs transition-all ${conf.bg} ${conf.border} ${className}`}>
            <Icon size={16} className={`flex-shrink-0 mt-0.5 ${conf.color}`} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <span className={`font-medium ${conf.color} leading-5`}>{item.title}</span>
                    {item.action && (
                        <button 
                            onClick={handleClick}
                            className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap ${
                                item.action.intent === 'primary' 
                                ? 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-sm' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {item.action.label}
                        </button>
                    )}
                </div>
                {!compact && item.detail && (
                    <p className="mt-1 opacity-80 leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.detail}
                    </p>
                )}
            </div>
        </div>
    );
};

export const NoticeStack: React.FC<{
  items: NoticeItem[];
  maxVisible?: number;
  defaultExpanded?: boolean;
  className?: string;
}> = ({ items, maxVisible = 3, defaultExpanded = false, className = '' }) => {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
    const shouldTruncate = items.length > maxVisible;
    const isExpanded = defaultExpanded || internalExpanded;
    
    if (items.length === 0) return null;

    const visibleItems = (!isExpanded && shouldTruncate) ? items.slice(0, maxVisible) : items;
    const hiddenCount = items.length - visibleItems.length;

    return (
        <div className={`space-y-2 animate-in slide-in-from-top-1 ${className}`}>
            {visibleItems.map(item => (
                <InlineNotice key={item.id} item={item} compact={!isExpanded} />
            ))}
            
            {hiddenCount > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setInternalExpanded(true); }}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 py-1 font-medium transition-colors"
                >
                    还有 {hiddenCount} 条提示...
                </button>
            )}
            
            {isExpanded && shouldTruncate && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setInternalExpanded(false); }}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 py-1 font-medium transition-colors"
                >
                    收起提示
                </button>
            )}
        </div>
    );
};
