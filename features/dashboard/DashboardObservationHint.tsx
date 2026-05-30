import React, { useMemo, useEffect, useState } from 'react';
import type { TrainingGoal } from '../../domain';
import { StorageService } from '../../core/storage';
import { getActiveObservationPlans } from '../stats/model/observationPlanService';
import { getActivityTargetDate } from '../../shared/lib/targetDate';
import { Eye, ChevronRight, Calendar } from 'lucide-react';

interface DashboardObservationHintProps {
  onNavigateToStats?: () => void;
}

const DashboardObservationHint: React.FC<DashboardObservationHintProps> = ({ onNavigateToStats }) => {
  const [goals, setGoals] = useState<TrainingGoal[]>([]);

  useEffect(() => {
    const load = async () => {
      const allGoals = await StorageService.trainingGoals.queries.all();
      setGoals(allGoals);
    };
    void load();
  }, []);

  const activePlans = useMemo(() => getActiveObservationPlans(goals), [goals]);

  if (activePlans.length === 0) return null;

  const nearest = activePlans[0];
  const start = new Date(nearest.startDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + nearest.targetWindowDays);
  const today = new Date(getActivityTargetDate(new Date()) + 'T12:00:00');
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));

  return (
    <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Eye size={14} className="text-accent" />
        <span className="text-xs font-bold text-accent">观察计划</span>
        <span className="text-[10px] text-text-muted ml-auto">{activePlans.length} 个进行中</span>
      </div>

      <p className="text-[11px] text-text-secondary mb-1.5">
        {nearest.title} — {daysLeft > 0 ? `还剩 ${daysLeft} 天` : '已到期，可回看事实总结'}
      </p>

      {onNavigateToStats && (
        <button
          onClick={onNavigateToStats}
          className="flex items-center gap-1 text-[10px] text-accent hover:underline"
        >
          <Calendar size={10} />
          在统计中查看
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
};

export default DashboardObservationHint;
