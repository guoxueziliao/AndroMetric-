import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { HealthProject, HealthProjectPlan, HealthProjectLog, HealthProjectType, ScheduleType, SupplementUnit, TimeLabel, HealthProjectStatus } from '../../domain';
import {
  PROJECT_TYPE_LABELS, SCHEDULE_TYPE_LABELS, TIME_LABEL_LABELS, SUPPLEMENT_UNIT_LABELS, PROJECT_STATUS_LABELS,
  canTransitionProject, ALLOWED_PROJECT_TYPES, ALLOWED_SCHEDULE_TYPES, ALLOWED_TIME_LABELS, ALLOWED_SUPPLEMENT_UNITS,
} from '../../domain';
import { StorageService } from '../../core/storage';
import { getProjectStats } from '../daily-log/model/healthProjectSchedule';
import { getActivityTargetDate } from '../../shared/lib/targetDate';
import { Plus, CheckCircle, XCircle, Heart, Settings, Pill, Sun, Dumbbell, Moon } from 'lucide-react';

// ── Labels ───────────────────────────────────────────────────────────────────

const PROJECT_ICONS: Record<HealthProjectType, React.ElementType> = {
  supplement: Pill,
  sunlight: Sun,
  stretching: Dumbbell,
  rehab: Heart,
  sleep_routine: Moon,
  other_habit: Settings,
};

// ── Create project modal ─────────────────────────────────────────────────────

interface CreateProjectModalProps {
  onSave: (project: HealthProject, plan: HealthProjectPlan) => void;
  onCancel: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<HealthProjectType>('supplement');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState<SupplementUnit>('mg');
  const [timeLabels, setTimeLabels] = useState<TimeLabel[]>(['anytime']);
  const [note, setNote] = useState('');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [consecutiveDays, setConsecutiveDays] = useState('7');

  const handleSave = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const today = getActivityTargetDate(new Date());
    const projectId = `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const planId = `hpp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const project: HealthProject = {
      id: projectId,
      type,
      name: name.trim(),
      status: 'active',
      startDate: today,
      createdAt: now,
      updatedAt: now,
    };

    const plan: HealthProjectPlan = {
      id: planId,
      projectId,
      scheduleType,
      startDate: today,
      dose: dose ? Number(dose) : undefined,
      unit: type === 'supplement' ? unit : undefined,
      timeLabels: timeLabels.length > 0 ? timeLabels : undefined,
      note: note.trim() || undefined,
      weeklyDays: scheduleType === 'weekly' && weeklyDays.length > 0 ? weeklyDays : undefined,
      consecutiveDays: scheduleType === 'consecutive_days' ? Number(consecutiveDays) || undefined : undefined,
    };

    onSave(project, plan);
  };

  const toggleTimeLabel = (label: TimeLabel) => {
    setTimeLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleWeeklyDay = (day: number) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onCancel}>
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-text-primary mb-4">新建健康项目</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：维生素D、晨间拉伸"
              className="w-full px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-1 block">类型</label>
            <div className="flex flex-wrap gap-1.5">
              {(Array.from(ALLOWED_PROJECT_TYPES) as HealthProjectType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-[10px] px-2 py-1 rounded-full border ${type === t ? 'bg-accent text-text-on-accent border-accent' : 'bg-transparent text-text-muted border-surface-border'}`}
                >
                  {PROJECT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-1 block">周期</label>
            <div className="flex flex-wrap gap-1.5">
              {(Array.from(ALLOWED_SCHEDULE_TYPES) as ScheduleType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScheduleType(s)}
                  className={`text-[10px] px-2 py-1 rounded-full border ${scheduleType === s ? 'bg-accent text-text-on-accent border-accent' : 'bg-transparent text-text-muted border-surface-border'}`}
                >
                  {SCHEDULE_TYPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly days */}
          {scheduleType === 'weekly' && (
            <div>
              <label className="text-xs font-bold text-text-primary mb-1 block">选择星期</label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeeklyDay(idx)}
                    className={`w-8 h-8 text-[10px] rounded-full border font-bold ${weeklyDays.includes(idx) ? 'bg-accent text-text-on-accent border-accent' : 'bg-transparent text-text-muted border-surface-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Consecutive days */}
          {scheduleType === 'consecutive_days' && (
            <div>
              <label className="text-xs font-bold text-text-primary mb-1 block">连续天数</label>
              <input
                type="number"
                value={consecutiveDays}
                onChange={(e) => setConsecutiveDays(e.target.value)}
                min="1"
                className="w-24 px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Supplement config */}
          {type === 'supplement' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-text-primary mb-1 block">剂量</label>
                  <input
                    type="number"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="可选"
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-text-primary mb-1 block">单位</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as SupplementUnit)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl text-text-primary"
                  >
                    {(Array.from(ALLOWED_SUPPLEMENT_UNITS) as SupplementUnit[]).map((u) => (
                      <option key={u} value={u}>{SUPPLEMENT_UNIT_LABELS[u]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary mb-1 block">服用时间</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.from(ALLOWED_TIME_LABELS) as TimeLabel[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTimeLabel(t)}
                      className={`text-[10px] px-2 py-1 rounded-full border ${timeLabels.includes(t) ? 'bg-accent text-text-on-accent border-accent' : 'bg-transparent text-text-muted border-surface-border'}`}
                    >
                      {TIME_LABEL_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-1 block">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选"
              rows={2}
              className="w-full px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-xs font-bold text-text-muted bg-surface-muted rounded-xl border border-surface-border">取消</button>
          <button type="button" onClick={handleSave} disabled={!name.trim()} className="flex-1 py-2.5 text-xs font-bold text-text-on-accent bg-accent rounded-xl disabled:opacity-50">创建项目</button>
        </div>
      </div>
    </div>
  );
};

// ── Project card ─────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: HealthProject;
  plan?: HealthProjectPlan;
  todayLogs: HealthProjectLog[];
  onStatusChange: (project: HealthProject, newStatus: HealthProjectStatus) => void;
}> = ({ project, plan, todayLogs, onStatusChange }) => {
  const Icon = PROJECT_ICONS[project.type] ?? Settings;
  const todayLog = todayLogs.find((l) => l.projectId === project.id);

  const stats = useMemo(() => {
    if (!plan) return null;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return getProjectStats(
      project,
      plan,
      todayLogs.map((l) => ({ projectId: l.projectId, targetDate: l.targetDate, status: l.status })),
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
    );
  }, [project, plan, todayLogs]);

  return (
    <div className="p-3 rounded-xl border border-surface-border bg-surface-card">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/10 rounded-lg">
            <Icon size={14} className="text-accent" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-primary">{project.name}</span>
            <span className="text-[10px] text-text-muted ml-2">{PROJECT_TYPE_LABELS[project.type]}</span>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
          project.status === 'active' ? 'text-state-success-text bg-state-success-bg' :
          project.status === 'paused' ? 'text-state-warning-text bg-state-warning-bg' :
          'text-text-muted bg-surface-muted'
        }`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      {/* Plan info */}
      {plan && (
        <div className="flex items-center gap-2 text-[10px] text-text-muted mb-1">
          <span>{SCHEDULE_TYPE_LABELS[plan.scheduleType]}</span>
          {plan.dose && <span>· {plan.dose} {plan.unit ? SUPPLEMENT_UNIT_LABELS[plan.unit] : ''}</span>}
          {plan.timeLabels && plan.timeLabels.length > 0 && (
            <span>· {plan.timeLabels.map((t: TimeLabel) => TIME_LABEL_LABELS[t]).join('、')}</span>
          )}
        </div>
      )}

      {/* Today status */}
      {project.status === 'active' && (
        <div className="flex items-center gap-1.5 text-[10px]">
          {todayLog?.status === 'done' ? (
            <span className="text-state-success-text flex items-center gap-1"><CheckCircle size={10} /> 今日已完成</span>
          ) : todayLog?.status === 'skipped' ? (
            <span className="text-text-muted flex items-center gap-1"><XCircle size={10} /> 今日已跳过</span>
          ) : (
            <span className="text-state-warning-text">今日待记录</span>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1">
          <span>近 30 天：完成 {stats.doneDays}、跳过 {stats.skippedDays}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2">
        {project.status === 'active' && (
          <>
            <button type="button" onClick={() => onStatusChange(project, 'paused')} className="text-[10px] px-2 py-1 rounded-full text-state-warning-text bg-state-warning-bg">暂停</button>
            <button type="button" onClick={() => onStatusChange(project, 'completed')} className="text-[10px] px-2 py-1 rounded-full text-text-muted bg-surface-muted">结束</button>
          </>
        )}
        {project.status === 'paused' && (
          <>
            <button type="button" onClick={() => onStatusChange(project, 'active')} className="text-[10px] px-2 py-1 rounded-full text-state-success-text bg-state-success-bg">恢复</button>
            <button type="button" onClick={() => onStatusChange(project, 'completed')} className="text-[10px] px-2 py-1 rounded-full text-text-muted bg-surface-muted">结束</button>
          </>
        )}
        {(project.status === 'completed') && (
          <button type="button" onClick={() => onStatusChange(project, 'archived')} className="text-[10px] px-2 py-1 rounded-full text-text-muted bg-surface-muted">归档</button>
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

interface HealthProjectManagerProps {
  onProjectsChange?: () => void;
}

const HealthProjectManager: React.FC<HealthProjectManagerProps> = ({ onProjectsChange }) => {
  const [projects, setProjects] = useState<HealthProject[]>([]);
  const [plans, setPlans] = useState<HealthProjectPlan[]>([]);
  const [todayLogs, setTodayLogs] = useState<HealthProjectLog[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const today = useMemo(() => getActivityTargetDate(new Date()), []);

  const loadData = useCallback(async () => {
    const allProjects = await StorageService.healthProjects.queries.all();
    const allPlans = await StorageService.healthProjectPlans.queries.all();
    const dayLogs = await StorageService.healthProjectLogs.queries.byDate(today);
    setProjects(allProjects);
    setPlans(allPlans);
    setTodayLogs(dayLogs);
  }, [today]);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const pausedProjects = projects.filter((p) => p.status === 'paused');
  const completedProjects = projects.filter((p) => p.status === 'completed' || p.status === 'archived');

  const handleCreate = async (project: HealthProject, plan: HealthProjectPlan) => {
    await StorageService.healthProjects.save(project);
    await StorageService.healthProjectPlans.save(plan);
    setShowCreate(false);
    await loadData();
    onProjectsChange?.();
  };

  const handleStatusChange = async (project: HealthProject, newStatus: HealthProjectStatus) => {
    if (!canTransitionProject(project.status, newStatus)) return;
    const updated: HealthProject = {
      ...project,
      status: newStatus,
      endDate: newStatus === 'completed' ? today : project.endDate,
      updatedAt: new Date().toISOString(),
    };
    await StorageService.healthProjects.save(updated);
    await loadData();
    onProjectsChange?.();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart size={12} className="text-accent" />
          <span className="text-xs font-bold text-text-primary">健康项目</span>
          <span className="text-[10px] text-text-muted ml-auto">{activeProjects.length} 个进行中</span>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-[10px] text-accent">
          <Plus size={12} />
          新建
        </button>
      </div>

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-2">
          {activeProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              plan={plans.find((pl) => pl.projectId === p.id)}
              todayLogs={todayLogs}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Paused projects */}
      {pausedProjects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-muted mb-1">已暂停</p>
          <div className="space-y-2">
            {pausedProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                plan={plans.find((pl) => pl.projectId === p.id)}
                todayLogs={todayLogs}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed/archived */}
      {completedProjects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-muted mb-1">已结束</p>
          <div className="space-y-2">
            {completedProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                plan={plans.find((pl) => pl.projectId === p.id)}
                todayLogs={todayLogs}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center space-y-2">
          <Heart size={24} className="mx-auto text-text-muted" />
          <p className="text-sm text-text-secondary">还没有健康项目。</p>
          <p className="text-xs text-text-muted">点击"新建"创建补剂或健康习惯项目。</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateProjectModal
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

export default HealthProjectManager;
