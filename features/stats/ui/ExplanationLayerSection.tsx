import React, { useMemo, useState } from 'react';
import type { LogEntry } from '../../../domain';
import { StatsEngine } from '../model/StatsEngine';
import { computePersonalNormal } from '../model/personalNormalEngine';
import { computeContextExplanations } from '../model/contextExplanationEngine';
import type { ContextExplanationResult, ContextExplanationCard } from '../model/contextExplanationTypes';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { confidenceBadgeLabel } from '../../../shared/lib/confidence';
import { Eye, AlertCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { buildDraftFromExplanationCard } from '../model/observationPlanService';
import type { ObservationPlanDraft } from '../model/observationPlanService';

// ── Labels ───────────────────────────────────────────────────────────────────

const CONTEXT_LABELS: Record<string, string> = {
  sleep: '睡眠',
  stress: '压力',
  sex_load: '性活动负荷',
  recovery: '恢复感受',
  porn_use: '色情使用',
  exercise: '运动',
  alcohol: '饮酒',
  screen_time: '屏幕使用',
  training_goals: '训练目标',
  relationship_context: '关系上下文',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  none: confidenceBadgeLabel('none'),
  low: confidenceBadgeLabel('low'),
  medium: confidenceBadgeLabel('medium'),
};

// ── Explanation card ─────────────────────────────────────────────────────────

const ExplanationCard: React.FC<{
  card: ContextExplanationCard;
  onStartObservation?: (draft: ObservationPlanDraft) => void;
}> = ({ card, onStartObservation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-xl border border-surface-border bg-surface-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-text-primary">
          {CONTEXT_LABELS[card.contextType] ?? card.contextType}
        </span>
        {card.confidence !== 'none' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-accent bg-accent/10">
            {CONFIDENCE_LABEL[card.confidence]}
          </span>
        )}
      </div>

      <p className="text-[11px] text-text-secondary mb-1.5 leading-relaxed">{card.message}</p>

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>n={card.sampleSize}</span>
        <span>{card.windowDays} 天窗口</span>
      </div>

      {card.limitations.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1.5 text-[10px] text-text-muted hover:text-accent"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          {card.limitations.length} 条说明
        </button>
      )}

      {expanded && (
        <ul className="mt-1 space-y-0.5 text-[10px] text-text-muted">
          {card.limitations.map((lim, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="mt-0.5">-</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      )}

      {onStartObservation && (
        <button
          type="button"
          onClick={() => onStartObservation(buildDraftFromExplanationCard(card))}
          className="flex items-center gap-1 mt-2 text-[10px] text-accent hover:underline"
        >
          记录一段时间再看
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────

interface ExplanationLayerSectionProps {
  logs: LogEntry[];
  windowDays: 14 | 30;
  onStartObservation?: (draft: ObservationPlanDraft) => void;
}

const ExplanationLayerSection: React.FC<ExplanationLayerSectionProps> = ({ logs, windowDays, onStartObservation }) => {
  const today = useMemo(() => getActivityTargetDate(new Date()), []);

  const result: ContextExplanationResult = useMemo(() => {
    const engine = new StatsEngine(logs);
    const pnResult = computePersonalNormal(
      (metricName) => engine.getSeries(metricName as Parameters<typeof engine.getSeries>[0]),
      windowDays,
      today,
    );
    return computeContextExplanations(
      pnResult,
      (metricName) => engine.getSeries(metricName as Parameters<typeof engine.getSeries>[0]),
      today,
    );
  }, [logs, windowDays, today]);

  // No shifted metrics
  if (result.cards.length === 0 && result.recordGaps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Eye size={12} className="text-accent" />
        <span className="text-xs font-bold text-text-primary">变化附近的上下文</span>
        <span className="text-[10px] text-text-muted ml-auto">仅供参考</span>
      </div>

      {/* Explanation cards */}
      {result.cards.length > 0 && (
        <div className="space-y-2">
          {result.cards.map((card) => (
            <ExplanationCard key={card.id} card={card} onStartObservation={onStartObservation} />
          ))}
        </div>
      )}

      {/* Record gaps */}
      {result.recordGaps.length > 0 && (
        <div className="p-3 bg-warning/10 rounded-xl border border-warning/30">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle size={12} className="text-warning" />
            <span className="text-xs font-bold text-warning">记录缺口</span>
          </div>
          <div className="space-y-0.5 text-[10px] text-warning">
            {result.recordGaps.slice(0, 5).map((gap, i) => (
              <p key={i}>{gap.detail}</p>
            ))}
            {result.recordGaps.length > 5 && (
              <p>另有 {result.recordGaps.length - 5} 条缺口</p>
            )}
          </div>
        </div>
      )}

      {/* Limitations */}
      {result.limitations.length > 0 && (
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={12} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted">说明</span>
          </div>
          <ul className="space-y-0.5 text-[10px] text-text-muted">
            {result.limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExplanationLayerSection;
