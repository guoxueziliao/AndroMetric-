import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../../../core/storage';
import type { TrainingGoal, GoalCheckin } from '../../../domain';
import type { AdultBehaviorWindowFacts } from '../../stats/model/adultBehaviorReviewFacts';
import type { GatedInsight } from '../../stats/model/adultBehaviorReviewConfidence';
import { generateTrainingSuggestions, buildSuggestionInput } from '../../stats/model/trainingSuggestions';
import type { TrainingSuggestion } from '../../stats/model/trainingSuggestions';
import {
  createGoalFromDraft,
  validateGoalDraft,
  createCheckin,
  applyCheckinToGoal,
  getActiveGoals,
  getDueGoals,
  getCheckinsForGoal,
  getGoalEndDate,
  archiveGoal,
  restoreGoal,
  transitionGoal,
  CATEGORY_LABELS,
} from '../../stats/model/trainingGoalService';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { Target, ChevronRight, CheckCircle, Pause, Archive, SkipForward, History, ChevronDown } from 'lucide-react';
import GoalHistorySection from './GoalHistorySection';

const MetricPill: React.FC<{
  label: string;
  value: string | number | null;
  unit?: string;
  sample: number;
}> = ({ label, value, unit, sample }) => (
  <div className="p-2 bg-surface-muted rounded-xl border border-surface-border">
    <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
    <div className="flex items-baseline gap-1">
      {value != null ? (
        <span className="text-sm font-bold text-text-primary">{value}{unit && <span className="text-[10px] text-text-muted">{unit}</span>}</span>
      ) : (
        <span className="text-xs text-text-muted">--</span>
      )}
      <span className="text-[10px] text-text-muted">n={sample}</span>
    </div>
  </div>
);

// ── Sub-components ───────────────────────────────────────────────────────────

const SuggestionCard: React.FC<{
  suggestion: TrainingSuggestion;
  isAlreadyStarted: boolean;
  onStart: (suggestion: TrainingSuggestion) => void;
  onIgnore: (id: string) => void;
}> = ({ suggestion, isAlreadyStarted, onStart, onIgnore }) => (
  <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-bold text-text-primary">
        {CATEGORY_LABELS[suggestion.dimension] ?? suggestion.dimension}
      </span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
        suggestion.confidence === 'medium' ? 'bg-accent/15 text-accent' :
        suggestion.confidence === 'low' ? 'bg-warning/15 text-warning' :
        'bg-surface-border text-text-muted'
      }`}>
        {suggestion.confidence}
      </span>
    </div>
    <p className="text-xs text-text-secondary mb-2">{suggestion.message}</p>
    <p className="text-[10px] text-text-muted mb-2">触发：{suggestion.trigger}</p>
    {suggestion.limitations.length > 0 && (
      <p className="text-[10px] text-text-muted mb-2">{suggestion.limitations[0]}</p>
    )}
    {suggestion.suggestedGoal && (
      <div className="flex gap-2">
        {isAlreadyStarted ? (
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-state-success-text bg-state-success-bg rounded-lg">
            已开始
          </span>
        ) : (
          <button
            onClick={() => onStart(suggestion)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:opacity-90"
          >
            <Target size={12} />
            开始
          </button>
        )}
        <button
          onClick={() => onIgnore(suggestion.id)}
          className="px-3 py-1.5 text-xs font-medium text-text-muted rounded-lg border border-surface-border hover:bg-surface-muted"
        >
          忽略
        </button>
      </div>
    )}
    {!suggestion.suggestedGoal && suggestion.nextAction === 'keep_recording' && (
      <p className="text-[10px] text-accent">继续记录</p>
    )}
  </div>
);

const ActiveGoalCard: React.FC<{
  goal: TrainingGoal;
  checkins: GoalCheckin[];
  onCheckin: (goal: TrainingGoal) => void;
  onArchive: (goal: TrainingGoal) => void;
}> = ({ goal, checkins, onCheckin, onArchive }) => {
  const endDate = getGoalEndDate(goal);
  const today = getActivityTargetDate(new Date());
  const isDue = today >= endDate;

  return (
    <div className={`p-3 rounded-xl border ${isDue ? 'border-accent/30 bg-accent/5' : 'border-surface-border bg-surface-card'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-text-primary">{goal.title}</span>
        <span className="text-[10px] text-text-muted">
          {CATEGORY_LABELS[goal.category] ?? goal.category}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-[10px] text-text-muted">
        <span>{goal.startDate} → {endDate}</span>
        <span>{goal.targetWindowDays} 天</span>
        {checkins.length > 0 && <span>签到 {checkins.length} 次</span>}
      </div>
      <div className="flex gap-2">
        {isDue && (
          <button
            onClick={() => onCheckin(goal)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent rounded-lg border border-accent/30 hover:bg-accent/10"
          >
            <ChevronRight size={12} />
            签到
          </button>
        )}
        {(goal.status === 'completed' || goal.status === 'paused') && (
          <button
            onClick={() => onArchive(goal)}
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-text-muted rounded-lg hover:bg-surface-muted"
          >
            <Archive size={10} />
            归档
          </button>
        )}
      </div>
    </div>
  );
};

const CheckinModal: React.FC<{
  goal: TrainingGoal;
  onSubmit: (status: GoalCheckin['status'], cycleFeeling?: number, note?: string) => void;
  onClose: () => void;
}> = ({ goal, onSubmit, onClose }) => {
  const [status, setStatus] = useState<GoalCheckin['status']>('continue');
  const [feeling, setFeeling] = useState<number | undefined>();
  const [note, setNote] = useState('');

  const statusOptions: Array<{ value: GoalCheckin['status']; label: string; icon: React.ElementType }> = [
    { value: 'continue', label: '继续', icon: SkipForward },
    { value: 'pause', label: '暂停', icon: Pause },
    { value: 'complete', label: '完成', icon: CheckCircle },
    { value: 'adjust', label: '调整', icon: ChevronRight },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-card rounded-2xl p-5 max-w-sm w-full border border-surface-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-text-primary mb-1">周期签到</h3>
        <p className="text-xs text-text-secondary mb-4">{goal.title}</p>

        <div className="space-y-2 mb-4">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                status === opt.value
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-surface-muted text-text-secondary border border-surface-border'
              }`}
            >
              <opt.icon size={14} />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-secondary mb-1">本周期感受（可选）</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setFeeling(feeling === v ? undefined : v)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  feeling === v
                    ? 'bg-accent text-white'
                    : 'bg-surface-muted text-text-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-secondary mb-1">备注（可选）</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="本周期感受..."
            className="w-full px-3 py-2 text-xs bg-surface-muted rounded-xl border border-surface-border resize-none"
            rows={2}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-muted rounded-xl border border-surface-border"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(status, feeling, note || undefined)}
            className="px-4 py-2 text-xs font-medium text-white bg-accent rounded-xl hover:opacity-90"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

interface TrainingSectionProps {
  facts: AdultBehaviorWindowFacts;
  insights: GatedInsight[];
}

const TrainingSection: React.FC<TrainingSectionProps> = ({ facts, insights }) => {
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [checkins, setCheckins] = useState<GoalCheckin[]>([]);
  const [checkinGoal, setCheckinGoal] = useState<TrainingGoal | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const today = useMemo(() => getActivityTargetDate(new Date()), []);

  // Load goals and checkins
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [g, c] = await Promise.all([
        StorageService.trainingGoals.queries.all(),
        StorageService.goalCheckins.queries.all(),
      ]);
      if (!cancelled) {
        setGoals(g);
        setCheckins(c);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const activeGoals = useMemo(() => getActiveGoals(goals), [goals]);
  const dueGoals = useMemo(() => getDueGoals(goals, today), [goals, today]);
  const activeNotDue = useMemo(
    () => activeGoals.filter((g) => !dueGoals.some((d) => d.id === g.id)),
    [activeGoals, dueGoals],
  );

  const suggestions = useMemo(() => {
    const input = buildSuggestionInput(facts, insights, activeGoals.length);
    return generateTrainingSuggestions(input).filter((s) => !ignoredIds.has(s.id));
  }, [facts, insights, activeGoals.length, ignoredIds]);

  const handleStart = async (suggestion: TrainingSuggestion) => {
    if (!suggestion.suggestedGoal) return;
    // Idempotency: check if an active goal already exists for this suggestion category
    const existingGoal = goals.find(
      (g) => g.status === 'active' && g.category === suggestion.suggestedGoal!.category,
    );
    if (existingGoal) {
      // Already started — mark suggestion as ignored to show "已开始"
      setIgnoredIds((prev) => new Set(prev).add(suggestion.id));
      return;
    }
    const errors = validateGoalDraft(suggestion.suggestedGoal);
    if (errors.length > 0) return;
    const goal = createGoalFromDraft(suggestion.suggestedGoal, today);
    await StorageService.trainingGoals.save(goal);
    setGoals((prev) => [...prev, goal]);
    setIgnoredIds((prev) => new Set(prev).add(suggestion.id));
  };

  const handleIgnore = (id: string) => {
    setIgnoredIds((prev) => new Set(prev).add(id));
  };

  const handleCheckin = (goal: TrainingGoal) => {
    setCheckinGoal(goal);
  };

  const handleSubmitCheckin = async (status: GoalCheckin['status'], cycleFeeling?: number, note?: string) => {
    if (!checkinGoal) return;
    // Re-read goal from DB to guard against concurrent status changes
    const currentGoal = await StorageService.trainingGoals.queries.byId(checkinGoal.id);
    if (!currentGoal || currentGoal.status === 'archived') {
      setCheckinGoal(null);
      return;
    }
    const checkin = createCheckin({
      goalId: currentGoal.id,
      targetDate: today,
      status,
      cycleFeeling,
      note,
    });
    await StorageService.goalCheckins.save(checkin);

    const updatedGoal = applyCheckinToGoal(currentGoal, checkin);
    await StorageService.trainingGoals.save(updatedGoal);

    setCheckins((prev) => [...prev, checkin]);
    setGoals((prev) => prev.map((g) => g.id === updatedGoal.id ? updatedGoal : g));
    setCheckinGoal(null);
  };

  const handleArchive = async (goal: TrainingGoal) => {
    const current = await StorageService.trainingGoals.queries.byId(goal.id);
    if (!current) return;
    const archived = archiveGoal(current);
    await StorageService.trainingGoals.save(archived);
    setGoals((prev) => prev.map((g) => g.id === archived.id ? archived : g));
  };

  const handleRestore = async (goal: TrainingGoal) => {
    const current = await StorageService.trainingGoals.queries.byId(goal.id);
    if (!current || current.status !== 'archived') return;
    const restored = restoreGoal(current);
    await StorageService.trainingGoals.save(restored);
    setGoals((prev) => prev.map((g) => g.id === restored.id ? restored : g));
  };

  const handlePause = async (goal: TrainingGoal) => {
    const current = await StorageService.trainingGoals.queries.byId(goal.id);
    if (!current || current.status !== 'active') return;
    const paused = transitionGoal(current, 'paused');
    await StorageService.trainingGoals.save(paused);
    setGoals((prev) => prev.map((g) => g.id === paused.id ? paused : g));
  };

  const handleComplete = async (goal: TrainingGoal) => {
    const current = await StorageService.trainingGoals.queries.byId(goal.id);
    if (!current || current.status !== 'active') return;
    const completed = transitionGoal(current, 'completed');
    await StorageService.trainingGoals.save(completed);
    setGoals((prev) => prev.map((g) => g.id === completed.id ? completed : g));
  };

  const hasContent = suggestions.length > 0 || activeGoals.length > 0 || dueGoals.length > 0 || goals.length > 0 || checkins.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1">
            <Target size={12} className="text-accent" />
            训练建议
          </h3>
          <div className="space-y-2">
            {suggestions.map((s) => {
              const alreadyStarted = s.suggestedGoal ? goals.some(
                (g) => g.status === 'active' && g.category === s.suggestedGoal!.category,
              ) : false;
              return (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  isAlreadyStarted={alreadyStarted}
                  onStart={handleStart}
                  onIgnore={handleIgnore}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Due check-ins */}
      {dueGoals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-accent mb-2">待签到</h3>
          <div className="space-y-2">
            {dueGoals.map((g) => (
              <ActiveGoalCard
                key={g.id}
                goal={g}
                checkins={getCheckinsForGoal(checkins, g.id)}
                onCheckin={handleCheckin}
                onArchive={handleArchive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active goals (not due) */}
      {activeNotDue.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-text-primary mb-2">进行中</h3>
          <div className="space-y-2">
            {activeNotDue.map((g) => (
              <ActiveGoalCard
                key={g.id}
                goal={g}
                checkins={getCheckinsForGoal(checkins, g.id)}
                onCheckin={handleCheckin}
                onArchive={handleArchive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Performance summary */}
      <div>
        <h3 className="text-xs font-bold text-text-primary mb-2">表现稳定性</h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricPill
            label="硬度稳定"
            value={facts.recovery.morningHardnessMean?.toFixed(1) ?? null}
            unit="/5"
            sample={facts.recovery.morningHardnessSampleSize}
          />
          <MetricPill
            label="睡眠均值"
            value={facts.recovery.sleepMeanMinutes != null ? (facts.recovery.sleepMeanMinutes / 60).toFixed(1) : null}
            unit="h"
            sample={facts.recovery.sleepSampleSize}
          />
          <MetricPill
            label="满意度均值"
            value={facts.masturbation.satisfactionMean?.toFixed(1) ?? facts.sex.satisfactionMean?.toFixed(1) ?? null}
            unit="/5"
            sample={facts.masturbation.satisfactionSampleSize + facts.sex.satisfactionSampleSize}
          />
          <MetricPill
            label="活动负荷"
            value={facts.pornUse.count + facts.masturbation.count + facts.sex.count}
            unit="次"
            sample={facts.pornUse.count + facts.masturbation.count + facts.sex.count}
          />
        </div>
      </div>

      {/* Goal history toggle */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-bold text-text-secondary bg-surface-muted rounded-xl border border-surface-border hover:text-accent transition-colors"
        >
          <History size={12} />
          目标历史
          <span className="text-[10px] text-text-muted ml-auto">
            {goals.length} 个目标 · {checkins.length} 次签到
          </span>
          {showHistory ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {showHistory && (
          <div className="mt-2">
            <GoalHistorySection
              goals={goals}
              checkins={checkins}
              onRestore={handleRestore}
              onArchive={handleArchive}
              onPause={handlePause}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>

      {/* Check-in modal */}
      {checkinGoal && (
        <CheckinModal
          goal={checkinGoal}
          onSubmit={handleSubmitCheckin}
          onClose={() => setCheckinGoal(null)}
        />
      )}
    </div>
  );
};

export default TrainingSection;
