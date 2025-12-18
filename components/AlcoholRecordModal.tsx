
import React, { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, Moon, Clock, GlassWater, Trash2, Users, MapPin, Target, Percent, Droplets, Info, ChevronRight, Settings2 } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { PRESET_DRINKS, getPrediction, calculatePureAlcohol, DrinkPreset } from '../utils/alcoholHelpers';
import { useData } from '../contexts/DataContext';

interface AlcoholRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: AlcoholRecord) => void;
    initialData?: AlcoholRecord;
}

const CATEGORIES = [
    { id: 'beer', label: '啤酒', icon: '🍺' },
    { id: 'spirit', label: '烈酒', icon: '🥃' },
    { id: 'wine', label: '果/黄', icon: '🍷' },
    { id: 'mixed', label: '混合', icon: '🍸' },
    { id: 'other', label: '其他', icon: '🧪' }
];

const DRUNK_LEVELS: { id: DrunkLevel, label: string, emoji: string, color: string }[] = [
    { id: 'none', label: '无感', emoji: '😐', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'tipsy', label: '微醺', emoji: '☺️', color: 'bg-amber-100 dark:bg-amber-900/40' },
    { id: 'drunk', label: '醉酒', emoji: '🥴', color: 'bg-orange-100 dark:bg-orange-900/40' },
    { id: 'wasted', label: '断片', emoji: '🤮', color: 'bg-rose-100 dark:bg-rose-900/40' },
];

const SCENE_OPTIONS = {
    with: { label: '与谁喝', options: ['独自', '朋友', '伴侣', '同事', '客户', '长辈'], icon: Users, color: 'text-blue-500' },
    location: { label: '在哪里', options: ['家里', '餐馆', '酒吧', 'KTV', '夜店', '户外'], icon: MapPin, color: 'text-emerald-500' },
    purpose: { label: '为什么', options: ['日常习惯', '应酬社交', '庆祝', '消愁', '助眠'], icon: Target, color: 'text-purple-500' }
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { cancelAlcoholRecord } = useData();
    const [selectedItems, setSelectedItems] = useState<Record<string, { count: number, abv: number, vol: number }>>({});
    const [activeCategory, setActiveCategory] = useState('beer');
    const [duration, setDuration] = useState(60); 
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [time, setTime] = useState<string>('20:00');
    const [startTime, setStartTime] = useState('');
    const [mode, setMode] = useState<'sip' | 'session'>('sip');
    const [drinkWith, setDrinkWith] = useState('独自');
    const [drinkLoc, setDrinkLoc] = useState('家里');
    const [drinkPurpose, setDrinkPurpose] = useState('日常习惯');
    const [editingDetailsKey, setEditingDetailsKey] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const map: Record<string, { count: number, abv: number, vol: number }> = {};
                initialData.items.forEach(i => map[i.key] = { count: i.count, abv: i.abv, vol: i.volume });
                setSelectedItems(map);
                setDuration(initialData.durationMinutes || 60);
                setDrunkLevel(initialData.drunkLevel || 'none');
                setTime(initialData.time || '20:00');
                setStartTime(initialData.startTime || '');
                setMode(initialData.ongoing || initialData.startTime ? 'session' : 'sip');
                if (initialData.alcoholScene) {
                    const parts = initialData.alcoholScene.split(' | ');
                    if (parts.length >= 3) {
                        setDrinkWith(parts[0]); setDrinkLoc(parts[1]); setDrinkPurpose(parts[2]);
                    }
                }
            } else {
                setSelectedItems({}); setDuration(60); setDrunkLevel('none'); setDrinkWith('独自'); setDrinkLoc('家里'); setDrinkPurpose('日常习惯');
                setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setMode('sip');
            }
        }
    }, [isOpen, initialData]);

    const isLate = useMemo(() => { const [h] = time.split(':').map(Number); return h >= 0 && h < 5; }, [time]);

    const totalGrams = useMemo(() => {
        let sum = 0;
        Object.entries(selectedItems).forEach(([_, data]) => { sum += calculatePureAlcohol(data.vol, data.abv) * data.count; });
        return Math.round(sum * 10) / 10;
    }, [selectedItems]);

    const prediction = useMemo(() => totalGrams > 0 ? getPrediction(totalGrams) : null, [totalGrams]);

    const handleItemToggle = (key: string) => {
        setSelectedItems(prev => {
            if (prev[key]) {
                const next = { ...prev };
                delete next[key];
                if (editingDetailsKey === key) setEditingDetailsKey(null);
                return next;
            }
            const preset = PRESET_DRINKS.find(d => d.key === key);
            return { ...prev, [key]: { count: 1, abv: preset?.abv || 5, vol: preset?.volume || 330 } };
        });
    };

    const updateItemCount = (key: string, delta: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems(prev => {
            const curr = prev[key];
            if (!curr) return prev;
            const nextCount = curr.count + delta;
            if (nextCount <= 0) {
                const next = { ...prev }; delete next[key];
                return next;
            }
            return { ...prev, [key]: { ...curr, count: nextCount } };
        });
    };

    const handleSave = () => {
        const items: AlcoholItem[] = [];
        Object.entries(selectedItems).forEach(([key, val]) => {
            const preset = PRESET_DRINKS.find(d => d.key === key);
            items.push({ key, name: preset?.name || '未知酒类', volume: val.vol, abv: val.abv, pureAlcohol: calculatePureAlcohol(val.vol, val.abv), count: val.count });
        });
        const combinedScene = `${drinkWith} | ${drinkLoc} | ${drinkPurpose}`;
        onSave({ totalGrams, durationMinutes: mode === 'sip' ? 10 : duration, items, isLate, drunkLevel, alcoholScene: combinedScene, time, startTime: mode === 'session' ? startTime : undefined, endTime: mode === 'session' ? time : undefined, ongoing: false });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="饮酒详细记录"
            footer={
                <div className="w-full flex flex-col gap-3">
                    <button onClick={handleSave} className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all"><Check size={22} className="mr-2" strokeWidth={3}/> 确认保存 ({totalGrams}g 酒精)</button>
                    <button onClick={() => confirm('确定放弃？') && cancelAlcoholRecord().then(onClose)} className="w-full py-2 text-slate-400 text-[10px] font-bold flex items-center justify-center hover:text-red-500"><Trash2 size={12} className="mr-1"/> 放弃本次记录</button>
                </div>
            }
        >
            <div className="h-[78vh] flex flex-col -mx-4 -mt-4">
                {/* 1. 模式与时间设置 */}
                <div className="px-5 py-4 space-y-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setMode('sip')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${mode === 'sip' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}>小酌一口</button>
                        <button onClick={() => setMode('session')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${mode === 'session' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}>持续饮酒</button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-transparent text-xl font-black font-mono text-brand-text dark:text-slate-100 outline-none" />
                            {isLate && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded text-[10px] font-black flex items-center gap-1"><Moon size={10} fill="currentColor"/> 熬夜饮酒</span>}
                        </div>
                        {mode === 'session' && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase">时长</span>
                                <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||0)} className="bg-transparent text-sm font-black w-8 text-center outline-none" />
                                <span className="text-[10px] font-black text-slate-400">min</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 状态仪表盘 */}
                <div className="px-5 py-4 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="bg-slate-900 rounded-[1.5rem] p-5 text-white relative overflow-hidden shadow-lg border border-white/5">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">纯酒精摄入</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-amber-400 tabular-nums">{totalGrams}</span>
                                    <span className="text-xs font-bold text-amber-400/50">g</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="grid grid-cols-4 gap-1">
                                    {DRUNK_LEVELS.map(lvl => (
                                        <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${drunkLevel === lvl.id ? 'bg-white text-slate-900 shadow-md scale-110' : 'bg-white/10 text-white/40'}`}>
                                            <span className="text-sm">{lvl.emoji}</span>
                                            <span className="text-[7px] font-black leading-none mt-0.5">{lvl.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 场景选择器 */}
                <div className="px-5 py-2 shrink-0 space-y-3 bg-white dark:bg-slate-900">
                    {Object.entries(SCENE_OPTIONS).map(([key, group]) => {
                        const Icon = group.icon;
                        const state = key === 'with' ? drinkWith : key === 'location' ? drinkLoc : drinkPurpose;
                        const setter = key === 'with' ? setDrinkWith : key === 'location' ? setDrinkLoc : setDrinkPurpose;
                        return (
                            <div key={key} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${group.color} bg-current bg-opacity-10 flex items-center justify-center shrink-0`}><Icon size={14} /></div>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                    {group.options.map(opt => (
                                        <button key={opt} onClick={() => setter(opt)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${state === opt ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100'}`}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 4. 酒水网格选择 */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-slate-800 shrink-0">
                        {CATEGORIES.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${activeCategory === cat.id ? 'bg-amber-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800'}`}>
                                <span>{cat.icon}</span>{cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                        <div className="grid grid-cols-2 gap-3 pb-8">
                            {PRESET_DRINKS.filter(d => d.category === activeCategory).map(drink => {
                                const data = selectedItems[drink.key];
                                const isSelected = !!data;
                                return (
                                    <div key={drink.key} onClick={() => !isSelected && handleItemToggle(drink.key)} className={`relative p-3 rounded-[1.25rem] border-2 transition-all group ${isSelected ? 'border-amber-400 bg-white dark:bg-slate-800 shadow-md' : 'border-white dark:border-slate-900 bg-white/60 dark:bg-slate-900/60 hover:border-slate-200'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">{drink.icon}</div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-black truncate text-slate-700 dark:text-slate-100">{drink.name}</div>
                                                <div className="text-[9px] text-slate-400 font-bold">{isSelected ? `${data.vol}ml·${data.abv}%` : `${drink.volume}ml·${drink.abv}%`}</div>
                                            </div>
                                        </div>

                                        {isSelected ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                                                    <button onClick={(e) => updateItemCount(drink.key, -1, e)} className="p-1 text-slate-500 hover:text-red-500"><Minus size={12} strokeWidth={4}/></button>
                                                    <span className="text-xs font-black w-4 text-center">{data.count}</span>
                                                    <button onClick={(e) => updateItemCount(drink.key, 1, e)} className="p-1 text-amber-600"><Plus size={12} strokeWidth={4}/></button>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingDetailsKey(editingDetailsKey === drink.key ? null : drink.key); }} className={`p-1.5 rounded-lg transition-colors ${editingDetailsKey === drink.key ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}><Settings2 size={14}/></button>
                                            </div>
                                        ) : (
                                            <div className="absolute top-2 right-2 text-slate-200 group-hover:text-amber-500 transition-colors"><Plus size={16} strokeWidth={3}/></div>
                                        )}

                                        {editingDetailsKey === drink.key && isSelected && (
                                            <div className="mt-3 space-y-3 pt-3 border-t border-slate-50 dark:border-slate-700 animate-in slide-in-from-top-2">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400"><span>酒精度</span><span className="text-amber-600">{data.abv}%</span></div>
                                                    <input type="range" min="0" max="75" step="0.5" value={data.abv} onChange={e => setSelectedItems(p => ({...p, [drink.key]: {...data, abv: parseFloat(e.target.value)}}))} className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400"><span>单份容量</span><span className="text-amber-600">{data.vol}ml</span></div>
                                                    <input type="range" min="10" max="1000" step="10" value={data.vol} onChange={e => setSelectedItems(p => ({...p, [drink.key]: {...data, vol: parseInt(e.target.value)}}))} className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-amber-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
