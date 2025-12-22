
import React from 'react';
import { Supplement } from '../types';
import { Zap, AlertCircle } from 'lucide-react';

interface SupplementCycleBarProps {
    supplements: Supplement[];
    currentDate: string;
}

const SupplementCycleBar: React.FC<SupplementCycleBarProps> = ({ supplements, currentDate }) => {
    const activeCycles = supplements.filter(s => s.isActive && s.cycleEnabled);

    if (activeCycles.length === 0) return null;

    return (
        <div className="space-y-4 px-1 mb-4">
            {activeCycles.map(sup => {
                const start = new Date(sup.startDate + 'T00:00:00').getTime();
                const now = new Date(currentDate + 'T00:00:00').getTime();
                const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) return null;

                const cycleTotal = sup.daysOn + sup.daysOff;
                const dayInCycle = (diffDays % cycleTotal) + 1;
                const isOnDay = dayInCycle <= sup.daysOn;
                
                return (
                    <div key={sup.id} className="bg-white dark:bg-slate-900/40 rounded-3xl p-4 border border-slate-100 dark:border-white/5 shadow-soft">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: sup.color }}>
                                    <Zap size={14} fill="currentColor" fillOpacity={0.3}/>
                                </div>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sup.name} 周期 <span className="text-slate-400 font-bold ml-1">{dayInCycle}/{cycleTotal}</span></span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isOnDay ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500'}`}>
                                {isOnDay ? '服用中' : '休赛期'}
                            </span>
                        </div>

                        <div className="flex gap-1 h-1.5 mb-2">
                            {Array.from({ length: cycleTotal }).map((_, i) => {
                                const idx = i + 1;
                                const isSupDay = idx <= sup.daysOn;
                                const isCurrent = idx === dayInCycle;
                                return (
                                    <div 
                                        key={i} 
                                        className={`flex-1 rounded-full transition-all ${
                                            isCurrent ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                                        } ${
                                            isSupDay ? (idx <= dayInCycle ? 'opacity-100' : 'opacity-20') : 'bg-slate-200 dark:bg-slate-800'
                                        }`}
                                        style={{ backgroundColor: isSupDay ? sup.color : undefined }}
                                    />
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                            <span>起始: {sup.startDate}</span>
                            {!isOnDay && <span className="flex items-center gap-1"><AlertCircle size={8}/> 今日无需服用</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SupplementCycleBar;
