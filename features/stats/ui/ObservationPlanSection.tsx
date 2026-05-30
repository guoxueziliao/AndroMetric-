import React, { useMemo, useState, useEffect } from 'react';
import type { TrainingGoal, GoalCheckin } from '../../../domain';
import { StorageService } from '../../../core/storage';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { buildObservationReview, getActiveObservationPlans, isObservationPlan } from '../model/observationPlanService';
import type { ObservationReview } from '../model/observationPlanService';
import { Eye, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

// ── Active plan card ─────────────────────────────────────────────────────────

const ActivePlanCard: React.FC<{ goal: TrainingGoal; today: string }> = ({ goal, today }) => {
  const start = new Date(goal.startDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + goal.targetWindowDays);
  const endStr = end.toISOString().slice(0, 10);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000));

  return (
    <div className="p-3 rounded-xl border border-accent/30 bg-accent/5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Eye size={12} className="text-accent" />
          <span className="text-xs font-bold text-text-primary">{goal.title}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-accent bg-accent/10">
          进行中
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>{goal.targetWindowDays} 天窗口</span>
        <span>·</span>
        <span>{goal.startDate} → {endStr}</span>
        {daysLeft > 0 && (
          <>
            <span>·</span>
            <span className="text-accent">还剩 {daysLeft} 天</span>
          </>
        )}
      </div>
    </div>
  );
};

// ── Completed review card ────────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: ObservationReview }> = ({ review }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-xl border border-surface-border bg-surface-card">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} className="text-state-success-text" />
          <span className="text-xs font-bold text-text-primary">{review.title}</span>
        </div>
        <span className="text-[10px] text-text-muted">{review.windowDays} 天</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] mb-1">
        <div>
          <p className="text-text-muted">记录天数</p>
          <p className="font-bold text-text-primary">{review.checkinDays}/{review.totalDays}</p>
        </div>
        <div>
          <p className="text-text-muted">缺失天数</p>
          <p className="font-bold text-text-primary">{review.missingDays}</p>
        </div>
        <div>
          <p className="text-text-muted">窗口</p>
          <p className="font-bold text-text-primary">{review.startDate} ~ {review.endDate}</p>
        </div>
      </div>

      {review.limitations.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1 text-[10px] text-text-muted hover:text-accent"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          {review.limitations.length} 条说明
        </button>
      )}

      {expanded && (
        <ul className="mt-1 space-y-0.5 text-[10px] text-text-muted">
          {review.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────

const ObservationPlanSection: React.FC = () => {
  const today = useMemo(() => getActivityTargetDate(new Date()), []);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [checkins, setCheckins] = useState<GoalCheckin[]>([]);

  useEffect(() => {
    const load = async () => {
      const allGoals = await StorageService.trainingGoals.queries.all();
      const allCheckins = await StorageService.goalCheckins.queries.all();
      setGoals(allGoals);
      setCheckins(allCheckins);
    };
    void load();
  }, []);

  const observationGoals = useMemo(() => goals.filter(isObservationPlan), [goals]);
  const activePlans = useMemo(() => getActiveObservationPlans(goals), [goals]);
  const completedPlans = useMemo(
    () => observationGoals.filter((g) => g.status === 'completed' || g.status === 'archived'),
    [observationGoals],
  );
  const reviews = useMemo(
    () => completedPlans.map((g) => buildObservationReview(g, checkins)),
    [completedPlans, checkins],
  );

  if (observationGoals.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Eye size={12} className="text-accent" />
        <span className="text-xs font-bold text-text-primary">观察计划</span>
        <span className="text-[10px] text-text-muted ml-auto">
          {activePlans.length > 0 ? `${activePlans.length} 个进行中` : '无进行中'}
        </span>
      </div>

      {/* Active plans */}
      {activePlans.map((goal) => (
        <ActivePlanCard key={goal.id} goal={goal} today={today} />
      ))}

      {/* Completed reviews */}
      {reviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-text-muted">已完成的观察</p>
          {reviews.map((review) => (
            <ReviewCard key={review.goalId} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObservationPlanSection;
