import React from 'react';
import { Activity, CalendarDays, ChevronRight, FlaskConical, HeartPulse } from 'lucide-react';
import { StateView } from '../state';
import type { LogEntry } from '../../domain';

type AnalysisDestination = 'calendar' | 'my';

interface AnalysisViewProps {
  isDarkMode: boolean;
  logs: LogEntry[];
  onNavigate: (view: AnalysisDestination) => void;
}

const entryCardClass = 'rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const EntryCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  accent: string;
  onClick: () => void;
}> = ({ icon: Icon, title, description, cta, accent, onClick }) => (
  <article className={entryCardClass}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</div>
      </div>
      <div className={`rounded-2xl p-3 ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {cta}
      <ChevronRight size={15} />
    </button>
  </article>
);

const AnalysisView: React.FC<AnalysisViewProps> = ({ isDarkMode, logs, onNavigate }) => {
  return (
    <div className="space-y-6 pb-24">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">Analysis Hub</div>
            <div className="mt-3 text-3xl font-black">分析总览</div>
            <div className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              状态引擎、7 天预测、因素排行和历史统计已经并入这个入口；其余分析能力分布在仪表盘与“我的”页。
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">日志样本</div>
            <div className="mt-1 text-3xl font-black">{logs.length}</div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">能力地图</h2>
          <span className="text-[10px] font-bold text-slate-400">把已完成功能从隐藏入口拉到台前</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <EntryCard
            icon={Activity}
            title="状态引擎与历史统计"
            description="当前状态、7 天预测、正负因素、可达目标和历史统计直接在本页查看。"
            cta="查看本页分析"
            accent="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
          <EntryCard
            icon={CalendarDays}
            title="仪表盘深层分析"
            description="九宫格、周视图、月热力图、屏幕时间与经期卡都在仪表盘入口，包含按日钻取。"
            cta="前往仪表盘"
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            onClick={() => onNavigate('calendar')}
          />
          <EntryCard
            icon={FlaskConical}
            title="虚拟回测实验室"
            description="P5 的模拟回测仍在“我的”页弹窗里，适合校验方向正确率、排序稳定性和可用性。"
            cta="前往我的"
            accent="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            onClick={() => onNavigate('my')}
          />
        </div>
        <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <HeartPulse size={18} className="mt-0.5 shrink-0" />
            <div>
              经期、备孕和怀孕事件面板仍然挂在仪表盘的经期卡明细里，入口已实现，但不在独立分析页中重复渲染。
            </div>
          </div>
        </div>
      </section>

      <StateView isDarkMode={isDarkMode} logs={logs} />
    </div>
  );
};

export default AnalysisView;
