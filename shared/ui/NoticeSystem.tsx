
import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

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
    error: { icon: AlertCircle, color: 'text-state-danger-text', bg: 'bg-state-danger-bg', border: 'border-state-danger-text/30' },
    warn: { icon: AlertTriangle, color: 'text-state-warning-text', bg: 'bg-state-warning-bg', border: 'border-state-warning-text/30' },
    info: { icon: Info, color: 'text-state-info-text', bg: 'bg-state-info-bg', border: 'border-state-info-text/30' }
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
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all hover:opacity-80 ${conf.bg} ${conf.border} ${conf.color} ${className}`}
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
    const [pendingClick, setPendingClick] = useState<React.MouseEvent | null>(null);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.action) {
            if (item.action.confirm) {
                e.persist();
                setPendingClick(e);
            } else {
                item.action.onAction(e);
            }
        }
    };

    return (
        <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${conf.bg} ${conf.border} ${className}`}>
            <Icon size={14} className={`flex-shrink-0 mt-0.5 ${conf.color}`} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    {/* Spec: title text-xs semibold */}
                    <span className={`text-xs font-semibold ${conf.color} leading-5`}>{item.title}</span>
                    {item.action && (
                        /* Spec: action text-[11px] bold */
                        <button
                            onClick={handleClick}
                            className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                                item.action.intent === 'primary'
                                ? 'bg-accent text-text-on-accent hover:bg-accent/90 shadow-sm'
                                : 'bg-surface-card text-text-secondary border border-surface-border hover:bg-surface-muted'
                            }`}
                        >
                            {item.action.label}
                        </button>
                    )}
                </div>
                {/* Spec: detail text-[11px] normal */}
                {!compact && item.detail && (
                    <p className="mt-1 text-[11px] opacity-90 leading-relaxed text-text-secondary font-normal">
                        {item.detail}
                    </p>
                )}
            </div>
            {item.action?.confirm && (
                <ConfirmModal
                    isOpen={!!pendingClick}
                    onClose={() => setPendingClick(null)}
                    onConfirm={() => {
                        if (pendingClick && item.action) item.action.onAction(pendingClick);
                        setPendingClick(null);
                    }}
                    title={item.action.confirm.title}
                    message={item.action.confirm.message}
                />
            )}
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
                    className="w-full text-center text-[10px] text-text-muted hover:text-text-secondary py-1 font-medium transition-colors"
                >
                    还有 {hiddenCount} 条提示...
                </button>
            )}
            
            {isExpanded && shouldTruncate && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setInternalExpanded(false); }}
                    className="w-full text-center text-[10px] text-text-muted hover:text-text-secondary py-1 font-medium transition-colors"
                >
                    收起提示
                </button>
            )}
        </div>
    );
};
