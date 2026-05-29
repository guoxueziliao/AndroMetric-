import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../../core/storage';
import type { TrainingGoal } from '../../domain';
import { getActiveGoals, getDueGoals, CATEGORY_LABELS } from '../stats/model/trainingGoalService';
import { getActivityTargetDate } from '../../shared/lib/targetDate';
import { Target, ChevronRight, History } from 'lucide-react';

interface DashboardTrainingHintProps {
  onNavigateToReview?: () => void;
}

const DashboardTrainingHint: React.FC<DashboardTrainingHintProps> = ({ onNavigateToReview }) => {
  const [goals, setGoals] = useState<TrainingGoal[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const g = await StorageService.trainingGoals.queries.all();
      if (!cancelled) setGoals(g);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const today = useMemo(() => getActivityTargetDate(new Date()), []);
  const activeGoals = useMemo(() => getActiveGoals(goals), [goals]);
  const dueGoals = useMemo(() => getDueGoals(goals, today), [goals, today]);

  if (activeGoals.length === 0) return null;

  const nearestDue = dueGoals.length > 0 ? dueGoals[0] : null;
  const nearestActive = activeGoals.find((g) => !dueGoals.some((d) => d.id === g.id));

  return (
    <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Target size={14} className="text-accent" />
        <span className="text-xs font-bold text-accent">训练</span>
        <span className="text-[10px] text-text-muted ml-auto">{activeGoals.length} 个活跃目标</span>
      </div>

      {nearestDue && (
        <div className="flex items-center gap-1.5 p-1.5 bg-accent/10 rounded-xl mb-1">
          <ChevronRight size={12} className="text-accent" />
          <span className="text-xs text-text-primary font-medium">{nearestDue.title}</span>
          <span className="text-[10px] text-accent ml-auto">待签到</span>
        </div>
      )}

      {!nearestDue && nearestActive && (
        <div className="flex items-center gap-1.5 p-1.5 bg-surface-muted rounded-xl mb-1">
          <span className="text-xs text-text-secondary">{nearestActive.title}</span>
          <span className="text-[10px] text-text-muted ml-auto">
            {CATEGORY_LABELS[nearestActive.category] ?? nearestActive.category} · {nearestActive.targetWindowDays}天
          </span>
        </div>
      )}

      {onNavigateToReview && (
        <button
          onClick={onNavigateToReview}
          className="flex items-center gap-1 mt-1.5 text-[10px] text-accent hover:underline"
        >
          <History size={10} />
          查看目标历史
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
};

export default DashboardTrainingHint;
