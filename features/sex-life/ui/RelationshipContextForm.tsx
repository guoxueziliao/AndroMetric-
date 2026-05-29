import React, { useState } from 'react';
import type { RelationshipContext, CycleContextValue, CareNeededValue } from '../../../domain';
import { CYCLE_CONTEXT_LABELS, CARE_NEEDED_LABELS } from '../../../domain';
import { ChevronDown, ChevronRight, Heart, MessageCircle, Shield, Hand, Flower2 } from 'lucide-react';

// ── Option sets ──────────────────────────────────────────────────────────────

const YES_NO_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'yes', label: '是' },
  { value: 'partial', label: '部分' },
  { value: 'no', label: '否' },
  { value: 'not_recorded', label: '未记录' },
];

const COMMUNICATION_BEFORE_OPTIONS: Array<{ value: NonNullable<RelationshipContext['communicationBefore']>; label: string }> = [
  { value: 'clear', label: '充分沟通' },
  { value: 'partial', label: '部分沟通' },
  { value: 'none', label: '未沟通' },
  { value: 'not_recorded', label: '未记录' },
];

const FEEDBACK_OPTIONS: Array<{ value: NonNullable<RelationshipContext['partnerFeedback']>; label: string }> = [
  { value: 'positive', label: '正面' },
  { value: 'neutral', label: '中性' },
  { value: 'mixed', label: '复杂' },
  { value: 'negative', label: '负面' },
  { value: 'not_recorded', label: '未记录' },
];

const CYCLE_CONTEXT_OPTIONS = (Object.entries(CYCLE_CONTEXT_LABELS) as Array<[CycleContextValue, string]>)
  .map(([value, label]) => ({ value, label }));

const CARE_NEEDED_OPTIONS = (Object.entries(CARE_NEEDED_LABELS) as Array<[CareNeededValue, string]>)
  .map(([value, label]) => ({ value, label }));

// ── Sub-components ───────────────────────────────────────────────────────────

const FieldGroup: React.FC<{
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}> = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-text-muted flex items-center gap-1">
      {Icon && <Icon size={10} />}
      {label}
    </label>
    {children}
  </div>
);

const SegmentedSelect: React.FC<{
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}> = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(value === opt.value ? undefined : opt.value)}
        className={`px-2 py-1 text-[10px] rounded-lg font-medium transition-all ${
          value === opt.value
            ? 'bg-accent text-white'
            : 'bg-surface-muted text-text-muted border border-surface-border'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

interface RelationshipContextFormProps {
  value: RelationshipContext;
  onChange: (ctx: RelationshipContext) => void;
  showCycleContext?: boolean;
}

const RelationshipContextForm: React.FC<RelationshipContextFormProps> = ({
  value,
  onChange,
  showCycleContext = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<RelationshipContext>) => {
    onChange({ ...value, ...patch });
  };

  const hasAnyData = Object.values(value).some((v) => v != null && v !== false && v !== '');

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-xs"
      >
        <span className="font-bold text-text-primary flex items-center gap-1.5">
          <Heart size={12} className="text-accent" />
          关系上下文
          {hasAnyData && <span className="text-[10px] text-accent">已填写</span>}
        </span>
        {expanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-surface-border pt-3">
          {/* 1. Communication */}
          <FieldGroup label="沟通状态" icon={MessageCircle}>
            <SegmentedSelect
              value={value.communicationBefore}
              options={COMMUNICATION_BEFORE_OPTIONS}
              onChange={(v) => update({ communicationBefore: v as RelationshipContext['communicationBefore'] })}
            />
          </FieldGroup>

          {/* 2. Boundary confirmed */}
          <FieldGroup label="边界确认" icon={Shield}>
            <SegmentedSelect
              value={value.boundaryConfirmed}
              options={YES_NO_OPTIONS}
              onChange={(v) => update({ boundaryConfirmed: v as RelationshipContext['boundaryConfirmed'] })}
            />
          </FieldGroup>

          {/* 3. Partner feedback */}
          <FieldGroup label="伴侣反馈" icon={Hand}>
            <SegmentedSelect
              value={value.partnerFeedback}
              options={FEEDBACK_OPTIONS}
              onChange={(v) => update({ partnerFeedback: v as RelationshipContext['partnerFeedback'] })}
            />
          </FieldGroup>

          {/* 4. Follow-up needed */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.needsFollowUp ?? false}
              onChange={(e) => update({ needsFollowUp: e.target.checked ? true : undefined })}
              className="h-4 w-4 rounded border-surface-border text-accent"
            />
            <span className="text-xs text-text-secondary">需要后续沟通</span>
          </div>

          {/* 5. Cycle context (optional) */}
          {showCycleContext && (
            <>
              <FieldGroup label="周期状态" icon={Flower2}>
                <SegmentedSelect
                  value={value.cycleContext}
                  options={CYCLE_CONTEXT_OPTIONS}
                  onChange={(v) => update({ cycleContext: v as CycleContextValue })}
                />
                <p className="text-[9px] text-text-muted mt-1">
                  仅为关怀上下文，伴侣实际感受优先。
                </p>
              </FieldGroup>

              {value.cycleContext && value.cycleContext !== 'unknown' && (
                <FieldGroup label="需要的关怀">
                  <SegmentedSelect
                    value={value.careNeeded}
                    options={CARE_NEEDED_OPTIONS}
                    onChange={(v) => update({ careNeeded: v as CareNeededValue })}
                  />
                </FieldGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RelationshipContextForm;
