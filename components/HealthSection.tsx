
import React, { useState } from 'react';
import { ShieldAlert, Plus, X } from 'lucide-react';
import { LogEntry } from '../types';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from './FormControls';

interface HealthSectionProps {
    log: Partial<LogEntry>;
    onChange: (field: keyof LogEntry, value: any) => void;
    onDeepChange: (parent: keyof LogEntry, field: string, value: any) => void;
}

const SYMPTOMS = ['头痛', '咽喉痛', '胃不适', '肌肉酸痛', '腹泻', '发烧', '鼻塞', '乏力'];
const MEDICATIONS = ['感冒药', '止痛药', '助眠药', '消炎药', '维生素', '其他'];

const ChipSelect = ({ 
    options, 
    selected, 
    onToggle, 
    color = 'red' 
}: { 
    options: string[], 
    selected: string[], 
    onToggle: (val: string) => void, 
    color?: string 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onToggle(newItem.trim());
            setNewItem('');
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onToggle(opt)}
                    type="button"
                    className={`px-2 py-1 rounded text-xs font-bold border transition-all ${selected.includes(opt) ? `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                    {opt}
                </button>
            ))}
            {selected.filter(s => !options.includes(s)).map(s => (
                <button key={s} onClick={() => onToggle(s)} type="button" className={`px-2 py-1 rounded text-xs font-bold border bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300`}>
                    {s}
                </button>
            ))}
            
            {isAdding ? (
                <div className="flex items-center">
                    <input 
                        autoFocus
                        className="w-16 text-xs border border-slate-300 rounded px-1 py-0.5 outline-none"
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        onBlur={() => setIsAdding(false)}
                    />
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} type="button" className="px-2 py-1 rounded text-xs font-bold border border-dashed border-slate-300 text-slate-400 hover:text-slate-600">
                    +
                </button>
            )}
        </div>
    );
};

const HealthSection: React.FC<HealthSectionProps> = ({ log, onChange, onDeepChange }) => {
    
    const toggleSymptom = (s: string) => {
        const current = log.health?.symptoms || [];
        const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
        onDeepChange('health', 'symptoms', next);
    };

    const toggleMed = (m: string) => {
        const current = log.health?.medications || [];
        const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
        onDeepChange('health', 'medications', next);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="space-y-3">
                <label className="text-sm font-medium text-brand-text dark:text-slate-300">心情</label>
                <FaceSelector options={MOOD_FACES} value={log.mood || 'neutral'} onChange={v => onChange('mood', v)} />
            </div>
            
            <div className="space-y-3">
                <label className="text-sm font-medium text-brand-text dark:text-slate-300">压力等级</label>
                <FaceSelector options={STRESS_FACES} value={log.stressLevel || 2} onChange={v => onChange('stressLevel', v)} />
            </div>
            
            <div className={`p-4 rounded-lg border transition-colors ${log.health?.isSick ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center font-bold ${log.health?.isSick ? 'text-red-700 dark:text-red-300' : 'text-slate-500'}`}>
                        <ShieldAlert size={18} className="mr-2"/>
                        {log.health?.isSick ? '身体不适' : '身体健康'}
                    </div>
                    <input type="checkbox" className="toggle-checkbox h-5 w-10" checked={log.health?.isSick || false} onChange={e => onDeepChange('health', 'isSick', e.target.checked)} />
                </div>

                {log.health?.isSick && (
                    <div className="space-y-4 animate-in fade-in pt-2 border-t border-red-100 dark:border-red-900/30">
                        {/* Feeling */}
                        <div>
                            <label className="text-xs font-bold text-red-600/70 mb-2 block uppercase">体感</label>
                            <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-red-100 dark:border-red-900/30">
                                {[{v: 'normal', l: '正常'}, {v: 'minor_discomfort', l: '轻微不适'}, {v: 'bad', l: '难受'}].map(opt => (
                                    <button
                                        key={opt.v}
                                        type="button"
                                        onClick={() => onDeepChange('health', 'feeling', opt.v)}
                                        className={`flex-1 text-xs py-1.5 rounded transition-colors ${log.health?.feeling === opt.v ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-bold' : 'text-slate-500'}`}
                                    >
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div>
                            <label className="text-xs font-bold text-red-600/70 mb-2 block uppercase">症状</label>
                            <ChipSelect options={SYMPTOMS} selected={log.health?.symptoms || []} onToggle={toggleSymptom} color="red" />
                        </div>

                        {/* Medications */}
                        <div>
                            <label className="text-xs font-bold text-red-600/70 mb-2 block uppercase">用药</label>
                            <ChipSelect options={MEDICATIONS} selected={log.health?.medications || []} onToggle={toggleMed} color="blue" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthSection;
