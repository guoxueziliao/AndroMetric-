import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

// --- DataCard (pure UI primitive) ---

export type DataCardTone =
  | 'default'
  | 'health'
  | 'adult'
  | 'recovery'
  | 'stimulant'
  | 'activity'
  | 'warning'
  | 'danger'
  | 'quiet';

export type DataCardDensity = 'compact' | 'comfortable';

interface DataCardProps {
  tone?: DataCardTone;
  density?: DataCardDensity;
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}

const TONE: Record<DataCardTone, { surface: string; iconBox: string; title: string; description: string }> = {
  default: {
    surface: 'bg-surface-muted/50 border-surface-border',
    iconBox: 'bg-surface-card text-text-muted',
    title: 'text-text-primary',
    description: 'text-text-muted',
  },
  health: {
    surface: 'bg-state-success-bg/60 border-state-success-text/25',
    iconBox: 'bg-surface-card text-state-success-text',
    title: 'text-state-success-text',
    description: 'text-state-success-text/70',
  },
  adult: {
    surface: 'bg-accent-vivid/10 border-accent-vivid/30',
    iconBox: 'bg-surface-card text-accent-vivid',
    title: 'text-accent-vivid',
    description: 'text-accent-vivid/70',
  },
  recovery: {
    surface: 'bg-chart-tertiary/10 border-chart-tertiary/30',
    iconBox: 'bg-surface-card text-chart-tertiary',
    title: 'text-chart-tertiary',
    description: 'text-chart-tertiary/70',
  },
  stimulant: {
    surface: 'bg-state-warning-bg/60 border-state-warning-text/25',
    iconBox: 'bg-surface-card text-state-warning-text',
    title: 'text-state-warning-text',
    description: 'text-state-warning-text/70',
  },
  activity: {
    surface: 'bg-state-info-bg/60 border-state-info-text/25',
    iconBox: 'bg-surface-card text-state-info-text',
    title: 'text-state-info-text',
    description: 'text-state-info-text/70',
  },
  warning: {
    surface: 'bg-state-warning-bg/60 border-state-warning-text/25',
    iconBox: 'bg-surface-card text-state-warning-text',
    title: 'text-state-warning-text',
    description: 'text-state-warning-text/70',
  },
  danger: {
    surface: 'bg-state-danger-bg/60 border-state-danger-text/25',
    iconBox: 'bg-surface-card text-state-danger-text',
    title: 'text-state-danger-text',
    description: 'text-state-danger-text/70',
  },
  quiet: {
    surface: 'bg-surface-muted border-surface-border',
    iconBox: 'bg-surface-card text-text-muted',
    title: 'text-text-secondary',
    description: 'text-text-muted',
  },
};

const densityPadding: Record<DataCardDensity, string> = {
  compact: 'p-3',
  comfortable: 'p-3.5',
};

export const DataCard: React.FC<DataCardProps> = ({
  tone = 'default',
  density = 'comfortable',
  leading,
  title,
  meta,
  description,
  badges,
  actions,
}) => {
  const t = TONE[tone];
  return (
    <div className={`group flex justify-between items-center ${densityPadding[density]} rounded-2xl border shadow-sm ${t.surface}`}>
      <div className="flex items-center gap-3 min-w-0">
        {leading && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 ${t.iconBox}`}>
            {leading}
          </div>
        )}
        <div className="min-w-0">
          <span className={`text-xs font-black ${t.title}`}>
            {title}
            {meta && <span className="font-mono opacity-50 text-[10px] ml-1.5">{meta}</span>}
          </span>
          {description && (
            <div className={`text-[9px] font-bold ${t.description}`}>{description}</div>
          )}
          {badges && (
            <div className="flex gap-1 mt-1">{badges}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-1.5 shrink-0">{actions}</div>
      )}
    </div>
  );
};

// --- RecordCard (record-kind wrapper) ---

export type RecordKind =
  | 'morning'
  | 'sex'
  | 'masturbation'
  | 'sleep'
  | 'nap'
  | 'exercise'
  | 'alcohol'
  | 'caffeine'
  | 'mood'
  | 'health'
  | 'note';

const kindToTone: Record<RecordKind, DataCardTone> = {
  morning: 'health',
  sex: 'adult',
  masturbation: 'adult',
  sleep: 'recovery',
  nap: 'recovery',
  exercise: 'activity',
  alcohol: 'stimulant',
  caffeine: 'stimulant',
  mood: 'health',
  health: 'health',
  note: 'default',
};

/** @deprecated Use DataCardTone instead. Kept for backward compatibility. */
export type LegacyRecordCardTone = 'blue' | 'pink' | 'amber' | 'emerald' | 'violet' | 'slate';

const legacyToneMap: Record<LegacyRecordCardTone, DataCardTone> = {
  blue: 'activity',
  pink: 'adult',
  amber: 'stimulant',
  emerald: 'health',
  violet: 'recovery',
  slate: 'quiet',
};

interface RecordCardProps {
  icon: React.ReactNode;
  /** Semantic tone. Accepts legacy color names for backward compatibility. */
  tone?: DataCardTone | LegacyRecordCardTone;
  /** Record kind. When provided, automatically resolves to the appropriate tone. */
  kind?: RecordKind;
  title: React.ReactNode;
  meta?: React.ReactNode;
  subline?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** @deprecated Use DataCardTone. */
export type RecordCardTone = LegacyRecordCardTone;

const RecordCard: React.FC<RecordCardProps> = ({ icon, tone, kind, title, meta, subline, onEdit, onDelete }) => {
  const resolvedTone: DataCardTone = kind
    ? kindToTone[kind]
    : tone
      ? (tone in legacyToneMap ? legacyToneMap[tone as LegacyRecordCardTone] : tone as DataCardTone)
      : 'default';

  return (
    <DataCard
      tone={resolvedTone}
      density="compact"
      leading={icon}
      title={title}
      meta={meta}
      description={subline}
      actions={
        (onEdit || onDelete) ? (
          <>
            {onEdit && (
              <button onClick={onEdit} aria-label="编辑" className="p-2 min-w-[36px] min-h-[36px] bg-surface-card rounded-xl text-text-muted hover:text-accent active:scale-95 transition-all shadow-sm">
                <Edit3 size={16}/>
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} aria-label="删除" className="p-2 min-w-[36px] min-h-[36px] bg-surface-card rounded-xl text-text-muted hover:text-state-danger-text active:scale-95 transition-all shadow-sm">
                <Trash2 size={16}/>
              </button>
            )}
          </>
        ) : undefined
      }
    />
  );
};

export default RecordCard;
