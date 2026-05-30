import React, { useMemo, useState, useEffect } from 'react';
import type { TrainingGoal, GoalCheckin } from '../../../domain';
import { StorageService } from '../../../core/storage';
import { getExperienceCards, filterExperienceCards } from '../model/experienceCardService';
import type { ExperienceCard, ExperienceCardFilter } from '../model/experienceCardService';
import { BookOpen, ChevronDown, ChevronRight, Filter } from 'lucide-react';

// ── Context labels ───────────────────────────────────────────────────────────

const CONTEXT_LABELS: Record<string, string> = {
  sleep: '睡眠',
  stress: '压力',
  sex_load: '性活动负荷',
  recovery: '恢复感受',
  porn_use: '色情使用',
  exercise: '运动',
  alcohol: '饮酒',
  screen_time: '屏幕使用',
};

// ── Card detail ──────────────────────────────────────────────────────────────

const ExperienceCardDetail: React.FC<{ card: ExperienceCard }> = ({ card }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-xl border border-surface-border bg-surface-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-text-primary">{card.title}</span>
        <span className="text-[10px] text-text-muted">{card.dateRange.startDate} ~ {card.dateRange.endDate}</span>
      </div>

      {card.contextTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {card.contextTypes.map((ctx) => (
            <span key={ctx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
              {CONTEXT_LABELS[ctx] ?? ctx}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-text-secondary mb-1 leading-relaxed">{card.factSummary}</p>

      {card.userReflection && (
        <div className="p-2 bg-surface-muted rounded-lg mb-1.5">
          <p className="text-[10px] font-bold text-text-muted mb-0.5">我的心得</p>
          <p className="text-[11px] text-text-primary">{card.userReflection}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>{card.goalTitle}</span>
        <span>·</span>
        <span>保存于 {card.savedAt.slice(0, 10)}</span>
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
            <li key={i}>{lim}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────

interface ExperienceCardSectionProps {
  refreshKey?: number;
}

const ExperienceCardSection: React.FC<ExperienceCardSectionProps> = ({ refreshKey }) => {
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [checkins, setCheckins] = useState<GoalCheckin[]>([]);
  const [filter, setFilter] = useState<ExperienceCardFilter>({});
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const load = async () => {
      const allGoals = await StorageService.trainingGoals.queries.all();
      const allCheckins = await StorageService.goalCheckins.queries.all();
      setGoals(allGoals);
      setCheckins(allCheckins);
    };
    void load();
  }, [refreshKey]);

  const allCards = useMemo(() => getExperienceCards(goals, checkins), [goals, checkins]);
  const filteredCards = useMemo(() => filterExperienceCards(allCards, filter), [allCards, filter]);

  const availableContexts = useMemo(() => {
    const ctxSet = new Set<string>();
    allCards.forEach((c) => c.contextTypes.forEach((ctx) => ctxSet.add(ctx)));
    return [...ctxSet].sort();
  }, [allCards]);

  if (allCards.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <BookOpen size={12} className="text-accent" />
        <span className="text-xs font-bold text-text-primary">经验卡</span>
        <span className="text-[10px] text-text-muted ml-auto">{allCards.length} 条</span>
        {availableContexts.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className="p-1 text-text-muted hover:text-accent"
          >
            <Filter size={12} />
          </button>
        )}
      </div>

      {/* Filter */}
      {showFilter && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface-muted rounded-xl border border-surface-border">
          <button
            type="button"
            onClick={() => setFilter({})}
            className={`text-[10px] px-2 py-1 rounded-full border ${
              Object.keys(filter).length === 0
                ? 'bg-accent text-text-on-accent border-accent'
                : 'bg-transparent text-text-muted border-surface-border'
            }`}
          >
            全部
          </button>
          {availableContexts.map((ctx) => (
            <button
              key={ctx}
              type="button"
              onClick={() => setFilter({ contextType: filter.contextType === ctx ? undefined : ctx })}
              className={`text-[10px] px-2 py-1 rounded-full border ${
                filter.contextType === ctx
                  ? 'bg-accent text-text-on-accent border-accent'
                  : 'bg-transparent text-text-muted border-surface-border'
              }`}
            >
              {CONTEXT_LABELS[ctx] ?? ctx}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      {filteredCards.length > 0 ? (
        <div className="space-y-2">
          {filteredCards.map((card) => (
            <ExperienceCardDetail key={card.checkinId} card={card} />
          ))}
        </div>
      ) : (
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border text-center">
          <p className="text-[10px] text-text-muted">当前筛选无匹配的经验卡。</p>
        </div>
      )}
    </div>
  );
};

export default ExperienceCardSection;
