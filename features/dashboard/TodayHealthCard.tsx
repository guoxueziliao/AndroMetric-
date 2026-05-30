import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { HealthProject, HealthProjectPlan, HealthProjectLog } from '../../domain';
import { SUPPLEMENT_UNIT_LABELS } from '../../domain';
import { StorageService } from '../../core/storage';
import { getDueProjects } from '../daily-log/model/healthProjectSchedule';
import { getActivityTargetDate } from '../../shared/lib/targetDate';
import { CheckCircle, XCircle, Heart, ChevronRight } from 'lucide-react';

interface TodayHealthCardProps {
  onNavigateToManage?: () => void;
}

const TodayHealthCard: React.FC<TodayHealthCardProps> = ({ onNavigateToManage }) => {
  const [projects, setProjects] = useState<HealthProject[]>([]);
  const [plans, setPlans] = useState<HealthProjectPlan[]>([]);
  const [todayLogs, setTodayLogs] = useState<HealthProjectLog[]>([]);
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

  const dueProjects = useMemo(() => getDueProjects(projects, plans, today), [projects, plans, today]);

  if (dueProjects.length === 0) return null;

  const doneCount = dueProjects.filter(({ project }) =>
    todayLogs.some((l) => l.projectId === project.id && l.status === 'done')
  ).length;

  const handleMarkDone = async (project: HealthProject) => {
    const log: HealthProjectLog = {
      id: `hpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      targetDate: today,
      status: 'done',
    };
    await StorageService.healthProjectLogs.save(log);
    await loadData();
  };

  const handleMarkSkipped = async (project: HealthProject) => {
    const log: HealthProjectLog = {
      id: `hpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      targetDate: today,
      status: 'skipped',
    };
    await StorageService.healthProjectLogs.save(log);
    await loadData();
  };

  return (
    <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Heart size={14} className="text-accent" />
        <span className="text-xs font-bold text-accent">今日健康项目</span>
        <span className="text-[10px] text-text-muted ml-auto">{doneCount}/{dueProjects.length} 完成</span>
      </div>

      <div className="space-y-1.5">
        {dueProjects.map(({ project, plan }) => {
          const log = todayLogs.find((l) => l.projectId === project.id);
          const isDone = log?.status === 'done';
          const isSkipped = log?.status === 'skipped';

          return (
            <div key={project.id} className="flex items-center justify-between p-2 bg-surface-card rounded-xl border border-surface-border">
              <div className="flex-1">
                <span className={`text-xs font-medium ${isDone ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {project.name}
                </span>
                {plan.dose && (
                  <span className="text-[10px] text-text-muted ml-1.5">
                    {plan.dose} {plan.unit ? SUPPLEMENT_UNIT_LABELS[plan.unit] : ''}
                  </span>
                )}
              </div>

              {isDone ? (
                <span className="text-[10px] text-state-success-text flex items-center gap-1">
                  <CheckCircle size={12} />
                  已完成
                </span>
              ) : isSkipped ? (
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <XCircle size={12} />
                  已跳过
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMarkDone(project)}
                    className="text-[10px] px-2 py-1 rounded-full text-state-success-text bg-state-success-bg font-bold"
                  >
                    完成
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkSkipped(project)}
                    className="text-[10px] px-2 py-1 rounded-full text-text-muted bg-surface-muted"
                  >
                    跳过
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onNavigateToManage && (
        <button
          type="button"
          onClick={onNavigateToManage}
          className="flex items-center gap-1 mt-2 text-[10px] text-accent hover:underline"
        >
          管理健康项目
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
};

export default TodayHealthCard;
