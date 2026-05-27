import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

export type RecordCardTone = 'blue' | 'pink' | 'amber' | 'emerald' | 'violet' | 'slate';

interface RecordCardProps {
  icon: React.ReactNode;
  tone: RecordCardTone;
  title: React.ReactNode;
  meta?: React.ReactNode;
  subline?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TONE: Record<RecordCardTone, { surface: string; iconBox: string; iconText: string; title: string; subline: string }> = {
  blue: {
    surface: 'bg-state-info-bg/60 border-state-info-text/25',
    iconBox: 'bg-surface-card text-state-info-text',
    iconText: 'text-state-info-text',
    title: 'text-state-info-text',
    subline: 'text-state-info-text/70'
  },
  pink: {
    surface: 'bg-accent-vivid/10 border-accent-vivid/30',
    iconBox: 'bg-surface-card text-accent-vivid',
    iconText: 'text-accent-vivid',
    title: 'text-accent-vivid',
    subline: 'text-accent-vivid/70'
  },
  amber: {
    surface: 'bg-state-warning-bg/60 border-state-warning-text/25',
    iconBox: 'bg-surface-card text-state-warning-text',
    iconText: 'text-state-warning-text',
    title: 'text-state-warning-text',
    subline: 'text-state-warning-text/70'
  },
  emerald: {
    surface: 'bg-state-success-bg/60 border-state-success-text/25',
    iconBox: 'bg-surface-card text-state-success-text',
    iconText: 'text-state-success-text',
    title: 'text-state-success-text',
    subline: 'text-state-success-text/70'
  },
  violet: {
    surface: 'bg-chart-tertiary/10 border-chart-tertiary/30',
    iconBox: 'bg-surface-card text-chart-tertiary',
    iconText: 'text-chart-tertiary',
    title: 'text-chart-tertiary',
    subline: 'text-chart-tertiary/70'
  },
  slate: {
    surface: 'bg-surface-muted border-surface-border',
    iconBox: 'bg-surface-card text-text-muted',
    iconText: 'text-text-muted',
    title: 'text-text-secondary',
    subline: 'text-text-muted'
  }
};

const RecordCard: React.FC<RecordCardProps> = ({ icon, tone, title, meta, subline, onEdit, onDelete }) => {
  const t = TONE[tone];
  return (
    <div className={`group flex justify-between items-center p-3.5 rounded-2xl border shadow-sm ${t.surface}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 ${t.iconBox}`}>{icon}</div>
        <div className="min-w-0">
          <span className={`text-xs font-black ${t.title}`}>
            {title}
            {meta && <span className="font-mono opacity-50 text-[10px] ml-1">{meta}</span>}
          </span>
          {subline !== undefined && (
            <div className={`text-[9px] font-bold ${t.subline}`}>{subline}</div>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-1.5 shrink-0">
          {onEdit && (
            <button onClick={onEdit} aria-label="编辑" className="p-2 bg-surface-card rounded-xl text-text-muted hover:text-accent transition-colors shadow-sm">
              <Edit3 size={16}/>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} aria-label="删除" className="p-2 bg-surface-card rounded-xl text-text-muted hover:text-state-danger-text transition-colors shadow-sm">
              <Trash2 size={16}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordCard;
