
import React from 'react';
import { Supplement, SupplementIntake } from '../types';
import { Check, Pill } from 'lucide-react';

interface SupplementPillboxProps {
    activeSupplements: Supplement[];
    intakes: SupplementIntake[];
    onChange: (intakes: SupplementIntake[]) => void;
}

const SupplementPillbox: React.FC<SupplementPillboxProps> = ({ activeSupplements, intakes, onChange }) => {
    if (activeSupplements.length === 0) return null;

    const toggleSupplement = (id: string) => {
        const exists = intakes.find(i => i.supplementId === id);
        let next: SupplementIntake[];
        if (exists) {
            next = intakes.filter(i => i.supplementId !== id);
        } else {
            const def = activeSupplements.find(s => s.id === id);
            next = [...intakes, { supplementId: id, taken: true, dosage: def?.dosage }];
        }
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Pill size={14} className="text-slate-400" />
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">今日补剂打卡</label>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                {activeSupplements.map(sup => {
                    const isTaken = intakes.some(i => i.supplementId === sup.id);
                    return (
                        <button
                            key={sup.id}
                            type="button"
                            onClick={() => toggleSupplement(sup.id)}
                            className={`relative p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group active:scale-95 ${
                                isTaken 
                                ? `bg-white dark:bg-slate-900 shadow-md` 
                                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 border-dashed text-slate-400'
                            }`}
                            style={{ 
                                borderColor: isTaken ? sup.color : undefined,
                                color: isTaken ? sup.color : undefined 
                            }}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isTaken ? 'bg-current text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {isTaken ? <Check size={18} strokeWidth={4}/> : <Pill size={18} />}
                            </div>
                            <div className="text-center">
                                <div className={`text-xs font-black truncate w-full max-w-[70px] ${isTaken ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>{sup.name}</div>
                                <div className="text-[9px] font-bold opacity-60 truncate">{sup.dosage}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SupplementPillbox;
