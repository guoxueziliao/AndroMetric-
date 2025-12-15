
import React, { useMemo, useState } from 'react';
import { BedDouble, Leaf, CloudDrizzle, Heart, CheckSquare, CloudSun, Clock, Edit2, Trash2, Plus, AlertCircle, Sparkles, MapPin, Thermometer } from 'lucide-react';
import { SleepRecord, NapRecord } from '../types';
import DateTimePicker from './DateTimePicker';
import { RangeSlider, IconToggleButton } from './FormControls';

interface SleepSectionProps {
    sleep: SleepRecord;
    onChange: (field: keyof SleepRecord, value: any) => void;
    onEditNap: (nap: NapRecord) => void;
    onDeleteNap: (id: string) => void;
    onAddNap: () => void;
}

const DREAM_TYPES = [
    { value: 'erotic', label: '春梦' },
    { value: 'nightmare', label: '噩梦' },
    { value: 'normal', label: '普通' },
    { value: 'lucid', label: '清醒梦' },
    { value: 'weird', label: '离奇' },
];

const LOCATIONS = [
    { value: 'home', label: '自家' },
    { value: 'hotel', label: '酒店' },
    { value: 'others_home', label: '别人家' },
    { value: 'dorm', label: '宿舍' },
    { value: 'other', label: '其他' },
];

const TEMPS = [
    { value: 'cold', label: '冷' },
    { value: 'comfortable', label: '舒适' },
    { value: 'hot', label: '热' },
];

const SleepSection: React.FC<SleepSectionProps> = ({ sleep, onChange, onEditNap, onDeleteNap, onAddNap }) => {
    const [showDreams, setShowDreams] = useState(sleep.hasDream || false);

    // Inline Validation
    const timeError = useMemo(() => {
        if (sleep.startTime && sleep.endTime) {
            const s = new Date(sleep.startTime).getTime();
            const e = new Date(sleep.endTime).getTime();
            if (e <= s) return "起床时间需晚于入睡时间";
            if ((e - s) > 24 * 60 * 60 * 1000) return "时长异常 (>24h)";
        }
        return null;
    }, [sleep.startTime, sleep.endTime]);

    const toggleDreamType = (type: string) => {
        const types = sleep.dreamTypes || [];
        const newTypes = types.includes(type) ? types.filter(t => t !== type) : [...types, type];
        onChange('dreamTypes', newTypes);
    };

    const handleDreamToggle = (checked: boolean) => {
        setShowDreams(checked);
        onChange('hasDream', checked);
        if (!checked) onChange('dreamTypes', []);
    };

    const updateEnv = (key: 'location' | 'temperature', val: string) => {
        onChange('environment', { ...sleep.environment, [key]: val });
    };

    return (
        <div className={`bg-brand-secondary dark:bg-slate-900 p-4 rounded-lg shadow-sm border ${timeError ? 'border-red-300 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'} space-y-4 transition-colors`}>
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center">
                    <BedDouble size={16} className="mr-2 text-brand-accent"/>睡眠周期
                </h3>
                {timeError && (
                    <span className="text-xs font-bold text-red-500 flex items-center animate-pulse">
                        <AlertCircle size={12} className="mr-1"/>
                        {timeError}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <DateTimePicker label="入睡时间" value={sleep.startTime || ''} onChange={(v) => onChange('startTime', v)} />
                <DateTimePicker label="起床时间" value={sleep.endTime || ''} onChange={(v) => onChange('endTime', v)} />
            </div>
            
            <RangeSlider 
                leftLabel="质量极差 (1)" rightLabel="睡得超棒 (5)" 
                min={1} max={5} colorClass="accent-indigo-500"
                value={sleep.quality} 
                onChange={(v: number) => onChange('quality', v)} 
            />
            
            {/* Event Toggles */}
            <div className="flex gap-2 pt-1">
                <button 
                    type="button"
                    onClick={() => onChange('naturalAwakening', !sleep.naturalAwakening)}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${sleep.naturalAwakening ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                    <Leaf size={16} className="mr-1"/> 
                    <span className="text-[10px] font-bold">自然醒</span>
                </button>
                <button 
                        type="button"
                        onClick={() => onChange('nocturnalEmission', !sleep.nocturnalEmission)}
                        className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${sleep.nocturnalEmission ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                    <CloudDrizzle size={16} className="mr-1"/>
                    <span className="text-[10px] font-bold">梦遗</span>
                </button>
                <button 
                        type="button"
                        onClick={() => onChange('withPartner', !sleep.withPartner)}
                        className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${sleep.withPartner ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                    <Heart size={16} className="mr-1"/>
                    <span className="text-[10px] font-bold">同睡</span>
                </button>
            </div>

            {/* Dream Section */}
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                        <Sparkles size={14} className="mr-1.5"/> 梦境记录
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" className="toggle-checkbox h-4 w-8" checked={showDreams} onChange={e => handleDreamToggle(e.target.checked)} />
                    </div>
                </div>
                {showDreams && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in">
                        {DREAM_TYPES.map(t => (
                            <button
                                key={t.value}
                                onClick={() => toggleDreamType(t.value)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${sleep.dreamTypes?.includes(t.value) ? 'bg-purple-500 text-white border-purple-600' : 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800 text-slate-500'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Environment Section */}
            <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block">睡眠环境</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400"/>
                        <select 
                            value={sleep.environment?.location || 'home'} 
                            onChange={e => updateEnv('location', e.target.value)}
                            className="bg-transparent text-xs w-full outline-none text-brand-text dark:text-slate-300 appearance-none"
                        >
                            {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <Thermometer size={14} className="text-slate-400"/>
                        <select 
                            value={sleep.environment?.temperature || 'comfortable'} 
                            onChange={e => updateEnv('temperature', e.target.value)}
                            className="bg-transparent text-xs w-full outline-none text-brand-text dark:text-slate-300 appearance-none"
                        >
                            {TEMPS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Naps Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-brand-muted uppercase mb-3 flex items-center"><CloudSun size={14} className="mr-1"/>午休 / 小睡</h4>
                <div className="space-y-2">
                    {sleep.naps?.map(r => (
                        <div key={r.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-2.5 rounded-lg flex justify-between items-center text-sm">
                            <span className="font-semibold text-orange-700 dark:text-orange-300 flex items-center">
                                <Clock size={14} className="mr-2"/> 
                                {r.startTime} 
                                <span className="mx-1 opacity-60">-</span> 
                                {r.endTime || '...'}
                                <span className="text-xs opacity-70 ml-2">({r.ongoing ? '进行中...' : `${r.duration}分钟`})</span>
                                {r.hasDream && <Sparkles size={12} className="ml-2 text-purple-500" />}
                            </span>
                            <div className="flex gap-2 text-orange-400">
                                <Edit2 size={16} className="cursor-pointer hover:text-orange-600" onClick={() => onEditNap(r)}/>
                                <Trash2 size={16} className="cursor-pointer hover:text-orange-600" onClick={() => onDeleteNap(r.id)}/>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={onAddNap} className="w-full py-2 border-2 border-dashed border-orange-200 dark:border-orange-900 text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10 text-sm font-medium flex justify-center items-center"><Plus size={16} className="mr-1"/> 补录午休</button>
                </div>
            </div>
        </div>
    );
};

export default SleepSection;
