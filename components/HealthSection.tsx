
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, X, Activity, BrainCircuit, Heart, AlertCircle, Info, Settings } from 'lucide-react';
import { LogEntry } from '../types';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from './FormControls';

interface HealthSectionProps {
    log: Partial<LogEntry>;
    onChange: (field: keyof LogEntry, value: any) => void;
    onDeepChange: (parent: keyof LogEntry, field: string, value: any) => void;
    onManageTags: (type: 'symptom') => void;
}

const SYMPTOMS = ['头痛', '喉咙痛', '胃不适', '肌肉酸痛', '腹泻', '发烧', '鼻塞', '乏力', '咳嗽'];
const MEDICATIONS = ['感冒药', '止痛药', '助眠药', '消炎药', '维生素', '抗过敏', '其他'];

const ChipSelect = ({ 
    options, 
    selected, 
    onToggle, 
    color = 'red',
    onAdd
}: { 
    options: string[], 
    selected: string[], 
    onToggle: (val: string) => void, 
    color?: string,
    onAdd?: () => void
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onToggle(opt)}
                    type="button"
                    className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                        selected.includes(opt) 
                        ? `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300 dark:border-${color}-800` 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    {opt}
                </button>
            ))}
            {selected.filter(s => !options.includes(s)).map(s => (
                <button key={s} onClick={() => onToggle(s)} type="button" className={`px-2 py-1 rounded text-xs font-bold border bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300 dark:border-${color}-800`}>
                    {s}
                </button>
            ))}
            
            {onAdd && (
                <button onClick={onAdd} type="button" className="px-2 py-1 rounded text-xs font-bold border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center">
                    <Plus size={12}/>
                </button>
            )}
        </div>
    );
};

const HealthSection: React.FC<HealthSectionProps> = ({ log, onChange, onDeepChange, onManageTags }) => {
    
    // Safety check: Clear data if sick is turned off
    // This is handled in the onChange event of the toggle below
    
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

    const handleSickToggle = (checked: boolean) => {
        if (!checked) {
            // Clear details when turning off
            // Instead of direct deepChange for each, we replace the whole object or batch updates if possible
            // Here we do it manually to ensure state consistency
            const newHealth = { 
                ...log.health, 
                isSick: false, 
                discomfortLevel: undefined, // Clear level
                symptoms: [], 
                medications: [] 
            };
            onChange('health', newHealth);
        } else {
            onDeepChange('health', 'isSick', true);
        }
    };

    const hasDiscomfort = log.health?.isSick;

    return (
        <div className="space-y-6 animate-in fade-in">
            
            {/* 1. Mood */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">心情 (Mood)</label>
                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => onChange('mood', v)} />
                {!log.mood && <p className="text-[10px] text-blue-400 flex items-center"><Info size={10} className="mr-1"/> 心情未记录</p>}
            </div>
            
            {/* 2. Stress */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">压力等级 (Stress)</label>
                <FaceSelector options={STRESS_FACES} value={log.stressLevel || null} onChange={v => onChange('stressLevel', v)} />
                {!log.stressLevel && <p className="text-[10px] text-blue-400 flex items-center"><Info size={10} className="mr-1"/> 压力等级未记录</p>}
            </div>
            
            {/* 3. Physical Discomfort (The new logic) */}
            <div className={`mt-4 rounded-xl border transition-all duration-300 overflow-hidden ${hasDiscomfort ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                {/* Header / Toggle */}
                <div className="flex items-center justify-between p-4">
                    <div className={`flex items-center font-bold ${hasDiscomfort ? 'text-red-700 dark:text-red-300' : 'text-slate-500'}`}>
                        <ShieldAlert size={18} className="mr-2"/>
                        身体不适
                    </div>
                    <input 
                        type="checkbox" 
                        className="toggle-checkbox h-5 w-10" 
                        checked={hasDiscomfort || false} 
                        onChange={e => handleSickToggle(e.target.checked)} 
                    />
                </div>

                {/* Expanded Content */}
                {hasDiscomfort && (
                    <div className="px-4 pb-4 space-y-5 animate-in slide-in-from-top-2">
                        
                        {/* Discomfort Level */}
                        <div>
                            <label className="text-xs font-bold text-red-600/70 dark:text-red-400/70 mb-2 block uppercase">不适程度</label>
                            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-red-100 dark:border-red-900/30 shadow-sm">
                                {[{v: 'mild', l: '轻微不适'}, {v: 'moderate', l: '明显不适'}, {v: 'severe', l: '很难受'}].map(opt => (
                                    <button
                                        key={opt.v}
                                        type="button"
                                        onClick={() => onDeepChange('health', 'discomfortLevel', opt.v)}
                                        className={`flex-1 text-xs py-2 rounded-md transition-all ${
                                            log.health?.discomfortLevel === opt.v 
                                            ? 'bg-red-500 text-white font-bold shadow-md' 
                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                            {!log.health?.discomfortLevel && (
                                <p className="text-[10px] text-orange-500 mt-1 flex items-center">
                                    <Info size={10} className="mr-1"/> 已标记不适，但未记录程度
                                </p>
                            )}
                        </div>

                        {/* Symptoms */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-red-600/70 dark:text-red-400/70 block uppercase">症状 (多选)</label>
                                <button type="button" onClick={() => onManageTags('symptom')} className="text-[10px] text-slate-400 flex items-center hover:text-slate-600 dark:hover:text-slate-300"><Settings size={10} className="mr-1"/> 管理标签</button>
                            </div>
                            <ChipSelect 
                                options={SYMPTOMS} 
                                selected={log.health?.symptoms || []} 
                                onToggle={toggleSymptom} 
                                color="red" 
                                onAdd={() => onManageTags('symptom')}
                            />
                        </div>

                        {/* Medications */}
                        <div>
                            <label className="text-xs font-bold text-red-600/70 dark:text-red-400/70 mb-2 block uppercase">用药情况</label>
                            <ChipSelect options={MEDICATIONS} selected={log.health?.medications || []} onToggle={toggleMed} color="blue" />
                            {(!log.health?.symptoms?.length && !log.health?.medications?.length) && (
                                <p className="text-[10px] text-blue-400 mt-2 flex items-center">
                                    <Info size={10} className="mr-1"/> 可补充具体症状或用药（可选）
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthSection;
