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
    surface: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
    iconBox: 'bg-white dark:bg-slate-800 text-blue-500',
    iconText: 'text-blue-500',
    title: 'text-blue-700 dark:text-blue-400',
    subline: 'text-blue-500/70'
  },
  pink: {
    surface: 'bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/30',
    iconBox: 'bg-white dark:bg-slate-800 text-pink-500',
    iconText: 'text-pink-500',
    title: 'text-pink-700 dark:text-pink-400',
    subline: 'text-pink-500/70'
  },
  amber: {
    surface: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30',
    iconBox: 'bg-white dark:bg-slate-800 text-amber-500',
    iconText: 'text-amber-500',
    title: 'text-amber-700 dark:text-amber-400',
    subline: 'text-amber-500/70'
  },
  emerald: {
    surface: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30',
    iconBox: 'bg-white dark:bg-slate-800 text-emerald-500',
    iconText: 'text-emerald-500',
    title: 'text-emerald-700 dark:text-emerald-400',
    subline: 'text-emerald-500/70'
  },
  violet: {
    surface: 'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30',
    iconBox: 'bg-white dark:bg-slate-800 text-violet-500',
    iconText: 'text-violet-500',
    title: 'text-violet-700 dark:text-violet-400',
    subline: 'text-violet-500/70'
  },
  slate: {
    surface: 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800',
    iconBox: 'bg-white dark:bg-slate-800 text-slate-500',
    iconText: 'text-slate-500',
    title: 'text-slate-700 dark:text-slate-300',
    subline: 'text-slate-500/70'
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
            <button onClick={onEdit} aria-label="编辑" className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors shadow-sm">
              <Edit3 size={16}/>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} aria-label="删除" className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm">
              <Trash2 size={16}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordCard;
