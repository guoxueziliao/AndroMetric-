
import React from 'react';
import { Moon, HeartPulse, Zap, SunMedium, Hand, Heart, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  // 模拟 ongoing 状态用于演示横幅逻辑
  const ongoingActions = [
    { id: '1', type: '正在睡觉', icon: Moon, color: 'bg-indigo-600', subtitle: '23:30 睡下' },
    { id: '2', type: '性爱进行中', icon: Heart, color: 'bg-pink-500', subtitle: '刚刚开始' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. 横幅区 (Banners) */}
      <div className="flex flex-col gap-3">
        {ongoingActions.map(action => (
          <div key={action.id} className={`${action.color} rounded-2xl p-4 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top-2`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <action.icon size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold opacity-80 uppercase">{action.type}</div>
                <div className="text-lg font-black">{action.subtitle}</div>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* 2. 核心双卡片 (Sleep & Vitality) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 睡眠卡片 */}
        <div className="bg-slate-900 p-5 rounded-[2.5rem] shadow-lg h-44 flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Moon size={18} fill="currentColor" />
              </div>
              <span className="text-sm font-bold">睡眠</span>
            </div>
            <div className="text-xl font-black opacity-40">--</div>
          </div>
          <div className="mt-auto">
            <div className="text-[10px] font-bold opacity-30 mb-2">最近 7 天趋势</div>
            <div className="flex items-end gap-1 h-12">
              {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                <div key={i} className="flex-1 bg-brand-accent/40 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* 活力卡片 */}
        <div className="bg-slate-900 p-5 rounded-[2.5rem] shadow-lg h-44 flex flex-col justify-between text-white">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <HeartPulse size={18} />
          </div>
          <div>
            <h4 className="text-lg font-black mb-2">活力</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-orange-400">运动</span>
                <span className="text-[10px] font-black opacity-60">未完成</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-pink-400">性/手</span>
                <span className="text-[10px] font-black opacity-60">无</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-bold opacity-20 text-right">今日释放</div>
        </div>
      </div>

      {/* 3. 数据 KPI 网格 */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '平均硬度', val: '2.8', icon: Zap, color: 'text-brand-accent' },
          { label: '晨勃率', val: '94%', icon: SunMedium, color: 'text-amber-500' },
          { label: '自慰次数', val: '12次', icon: Hand, color: 'text-purple-500' },
          { label: '性爱次数', val: '5次', icon: Heart, color: 'text-pink-500' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 h-44 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
              <kpi.icon size={18} className={`${kpi.color} opacity-30`} />
            </div>
            <div className={`text-4xl font-black tracking-tighter ${kpi.color}`}>{kpi.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
