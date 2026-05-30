import React, { useState, useMemo } from 'react';
import type { TrainingGoal, GoalCheckin, TrainingGoalStatus, TrainingGoalCategory } from '../../../domain';
import {
  getCheckinsForGoal,
  getGoalEndDate,
  getOrphanCheckins,
  getStatusCounts,
  getCategoryDistribution,
  getGoalsWithCheckins,
  getRecentFocusCategories,
  CATEGORY_LABELS,
} from '../../stats/model/trainingGoalService';
import { Archive, RotateCcw, ChevronDown, ChevronRight, AlertCircle, Activity } from 'lucide-react';

// ── Status / filter types ────────────────────────────────────────────────────

type StatusFilter = 'all' | TrainingGoalStatus;
type CategoryFilter = 'all' | TrainingGoalCategory;

const STATUS_BADGE_STYLE: Record<TrainingGoalStatus, string> = {
  active: 'bg-accent/15 text-accent',
  paused: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  archived: 'bg-surface-border text-text-muted',
};

const STATUS_LABEL: Record<TrainingGoalStatus, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档',
};

const CHECKIN_STATUS_LABEL: Record<string, string> = {
  continue: '继续',
  pause: '暂停',
  complete: '完成',
  adjust: '调整',
};

// ── Sub-components ───────────────────────────────────────────────────────────

const CheckinHistoryRow: React.FC<{ checkin: GoalCheckin }> = ({ checkin }) => (
  <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-b-0">
    <span className="text-[10px] font-mono text-text-muted w-20 shrink-0">
      {checkin.targetDate}
    </span>
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
      checkin.status === 'complete' ? 'bg-success/15 text-success' :
      checkin.status === 'pause' ? 'bg-warning/15 text-warning' :
      'bg-surface-muted text-text-secondary'
    }`}>
      {CHECKIN_STATUS_LABEL[checkin.status] ?? checkin.status}
    </span>
    {checkin.cycleFeeling != null && (
      <span className="text-[10px] text-text-muted">
        感受 {checkin.cycleFeeling}/5
      </span>
    )}
    {checkin.note && (
      <span className="text-[10px] text-text-muted truncate max-w-[120px]">
        {checkin.note}
      </span>
    )}
  </div>
);

const GoalHistoryCard: React.FC<{
  goal: TrainingGoal;
  checkins: GoalCheckin[];
  onRestore: (goal: TrainingGoal) => void;
  onArchive: (goal: TrainingGoal) => void;
  onPause?: (goal: TrainingGoal) => void;
  onComplete?: (goal: TrainingGoal) => void;
}> = ({ goal, checkins, onRestore, onArchive, onPause, onComplete }) => {
  const [expanded, setExpanded] = useState(false);
  const endDate = getGoalEndDate(goal);

  return (
    <div className="p-3 bg-surface-card rounded-xl border border-surface-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-text-primary">{goal.title}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLE[goal.status]}`}>
          {STATUS_LABEL[goal.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 text-[10px] text-text-muted">
        <span>{CATEGORY_LABELS[goal.category] ?? goal.category}</span>
        <span>{goal.startDate} → {endDate}</span>
        <span>{goal.targetWindowDays} 天</span>
        {goal.source === 'suggested' && <span>建议</span>}
      </div>

      {checkins.length > 0 ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent mb-1"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          共签到 {checkins.length} 次
        </button>
      ) : (
        <p className="text-[10px] text-text-muted mb-1">暂无签到</p>
      )}

      {expanded && (
        <div className="mt-1 pl-2 border-l-2 border-surface-border">
          {checkins.map((c) => (
            <CheckinHistoryRow key={c.id} checkin={c} />
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {goal.status === 'active' && (
          <>
            {onPause && (
              <button
                onClick={() => onPause(goal)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted rounded-lg hover:bg-surface-muted"
              >
                暂停
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(goal)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted rounded-lg hover:bg-surface-muted"
              >
                结束
              </button>
            )}
          </>
        )}
        {goal.status === 'archived' && (
          <button
            onClick={() => onRestore(goal)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted rounded-lg hover:bg-surface-muted"
          >
            <RotateCcw size={10} />
            恢复
          </button>
        )}
        {(goal.status === 'paused' || goal.status === 'completed') && (
          <button
            onClick={() => onArchive(goal)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted rounded-lg hover:bg-surface-muted"
          >
            <Archive size={10} />
            归档
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

interface GoalHistorySectionProps {
  goals: TrainingGoal[];
  checkins: GoalCheckin[];
  onRestore: (goal: TrainingGoal) => void;
  onArchive: (goal: TrainingGoal) => void;
  onPause?: (goal: TrainingGoal) => void;
  onComplete?: (goal: TrainingGoal) => void;
}

const GoalHistorySection: React.FC<GoalHistorySectionProps> = ({ goals, checkins, onRestore, onArchive, onPause, onComplete }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const statusCounts = useMemo(() => getStatusCounts(goals), [goals]);
  const categoryDist = useMemo(() => getCategoryDistribution(goals), [goals]);
  const orphanCheckins = useMemo(() => getOrphanCheckins(checkins, goals), [checkins, goals]);
  const goalsWithCheckins = useMemo(() => getGoalsWithCheckins(goals, checkins), [goals, checkins]);
  const recentFocus = useMemo(() => getRecentFocusCategories(goals, 4), [goals]);
  const completedCount = statusCounts.completed;
  const pausedCount = statusCounts.paused;
  const totalCheckins = checkins.length;

  const categories = useMemo(
    () => (Object.keys(categoryDist) as TrainingGoalCategory[])
      .filter((c) => CATEGORY_LABELS[c] != null)
      .sort(),
    [categoryDist],
  );

  const filteredGoals = useMemo(() => {
    let result = goals;
    if (statusFilter !== 'all') {
      result = result.filter((g) => g.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((g) => g.category === categoryFilter);
    }
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [goals, statusFilter, categoryFilter]);

  return (
    <div className="space-y-3">
      {/* Status summary */}
      <div className="grid grid-cols-4 gap-1.5">
        {(['active', 'paused', 'completed', 'archived'] as TrainingGoalStatus[]).map((s) => (
          <div
            key={s}
            className={`text-center p-2 rounded-xl border cursor-pointer transition-all ${
              statusFilter === s ? 'border-accent bg-accent/5' : 'border-surface-border bg-surface-card'
            }`}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
          >
            <p className="text-sm font-bold text-text-primary">{statusCounts[s]}</p>
            <p className="text-[10px] text-text-muted">{STATUS_LABEL[s]}</p>
          </div>
        ))}
      </div>

      {/* Cross-cycle summary */}
      {completedCount >= 2 && (
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border space-y-2">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-accent" />
            <span className="text-xs font-bold text-text-primary">阶段摘要</span>
          </div>

          {/* Check-in coverage */}
          <p className="text-[10px] text-text-secondary">
            {goalsWithCheckins.length} / {goals.length} 个目标有签到记录
            {totalCheckins > 0 && `，共 ${totalCheckins} 次`}
          </p>

          {/* Recent focus */}
          {recentFocus.length > 0 && (
            <p className="text-[10px] text-text-secondary">
              近期关注：{recentFocus.map((c) => CATEGORY_LABELS[c] ?? c).join('、')}
            </p>
          )}

          {/* Stability hints */}
          {completedCount >= 2 && (
            <p className="text-[10px] text-text-secondary">
              已完成 {completedCount} 个目标，可以回看关注方向的变化。
            </p>
          )}
          {pausedCount >= 2 && (
            <p className="text-[10px] text-warning">
              多个目标处于暂停状态，可能适合减少目标数量。
            </p>
          )}

          {/* Sample limitations */}
          {completedCount < 2 && totalCheckins < 3 && (
            <p className="text-[10px] text-text-muted">
              目标历史样本仍少，本阶段更适合继续记录，而不是判断趋势。
            </p>
          )}
        </div>
      )}

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 px-2.5 py-1 text-[10px] rounded-full font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-accent text-white'
                : 'bg-surface-muted text-text-muted border border-surface-border'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`shrink-0 px-2.5 py-1 text-[10px] rounded-full font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-accent text-white'
                  : 'bg-surface-muted text-text-muted border border-surface-border'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Orphan check-in hint */}
      {orphanCheckins.length > 0 && (
        <div className="flex items-center gap-1.5 p-2 bg-warning/10 rounded-xl border border-warning/30">
          <AlertCircle size={12} className="text-warning shrink-0" />
          <span className="text-[10px] text-warning">
            {orphanCheckins.length} 条签到记录未关联到现有目标（数据保留，未丢失）
          </span>
        </div>
      )}

      {/* Goal list */}
      {filteredGoals.length > 0 ? (
        <div className="space-y-2">
          {filteredGoals.map((goal) => (
            <GoalHistoryCard
              key={goal.id}
              goal={goal}
              checkins={getCheckinsForGoal(checkins, goal.id)}
              onRestore={onRestore}
              onArchive={onArchive}
              onPause={onPause}
              onComplete={onComplete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center space-y-2">
          <p className="text-sm text-text-secondary">
            {statusFilter !== 'all' || categoryFilter !== 'all'
              ? '筛选条件下暂无目标。'
              : '暂无训练目标。'}
          </p>
          <p className="text-xs text-text-muted">
            {statusFilter !== 'all' || categoryFilter !== 'all'
              ? '可以尝试调整筛选条件。'
              : '从复盘建议中创建轻目标，开始自我管理。'}
          </p>
        </div>
      )}

      {/* Check-in summary */}
      {goals.length > 0 && checkins.length > 0 && (
        <div className="text-[10px] text-text-muted text-center">
          共 {goals.length} 个目标 · {checkins.length} 次签到
        </div>
      )}
    </div>
  );
};

export default GoalHistorySection;
