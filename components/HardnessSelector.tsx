
import React from 'react';

const HardnessSelector = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    const levels = [
        { val: 1, label: '豆腐', sub: '软趴趴', color: 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800', rotation: 135 },
        { val: 2, label: '剥皮', sub: '微勃', color: 'bg-green-200 border-green-300 dark:bg-green-800/40 dark:border-green-700', rotation: 105 },
        { val: 3, label: '带皮', sub: '标准', color: 'bg-green-400 border-green-500 dark:bg-green-500/80 dark:border-green-500', rotation: 65 },
        { val: 4, label: '冻瓜', sub: '坚硬', color: 'bg-green-600 border-green-700 dark:bg-green-500 dark:border-green-400', rotation: 30 },
        { val: 5, label: '铁棒', sub: '超硬', color: 'bg-slate-700 border-slate-600 dark:bg-slate-200 dark:border-slate-100', rotation: 0 },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] p-5 border border-slate-100 dark:border-white/5 transition-colors">
            <div className="flex justify-between items-end h-24 px-1 mb-2 relative">
                {levels.map((item) => {
                    const isSelected = value === item.val;
                    return (
                        <button
                            key={item.val}
                            type="button"
                            onClick={() => onChange(item.val)}
                            className="group flex flex-col items-center gap-2 focus:outline-none w-1/5 relative z-10"
                        >
                            <div className="relative h-16 w-full flex items-end justify-center">
                                <div 
                                    className={`
                                        w-5 rounded-full border-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom
                                        ${item.color}
                                        ${isSelected ? 'shadow-glow dark:shadow-blue-500/20 ring-2 ring-offset-2 ring-brand-accent dark:ring-offset-slate-900 z-10' : 'opacity-40 grayscale-[0.3] dark:opacity-20 hover:opacity-80'}
                                    `}
                                    style={{ 
                                        height: isSelected ? '4.2rem' : '3rem',
                                        transform: `rotate(${isSelected ? 0 : item.rotation}deg) scale(${isSelected ? 1.15 : 1})`
                                    }} 
                                >
                                    <div className="absolute top-2 left-1 w-1 h-1/3 bg-white/40 dark:bg-white/20 rounded-full"></div>
                                    {item.val >= 4 && (
                                        <div className="absolute bottom-2 right-1 w-0.5 h-1/4 bg-black/10 dark:bg-white/5 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                            <div className={`flex flex-col items-center transition-all duration-300 ${isSelected ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-40'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-brand-accent dark:text-blue-400' : 'text-slate-400'}`}>
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
            <div className="text-center h-6 mt-2">
                <span className="text-[11px] font-black text-brand-accent dark:text-blue-400/80 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {value === 1 && "Level 1: 像豆腐一样 (充血不足)"}
                    {value === 2 && "Level 2: 像剥皮黄瓜 (硬度欠佳)"}
                    {value === 3 && "Level 3: 像带皮黄瓜 (勉强合格)"}
                    {value === 4 && "Level 4: 像冰镇黄瓜 (足够坚硬)"}
                    {value === 5 && "Level 5: 像铁棒一样 (完全坚硬)"}
                </span>
            </div>
        </div>
    );
};

export default HardnessSelector;
