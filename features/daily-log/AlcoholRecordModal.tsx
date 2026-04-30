import React, { useState, useEffect, useMemo } from 'react';
import { Minus, Plus, Trash2, Users, MapPin, Target, ChevronDown, ChevronUp, ChevronRight, Beer, Sparkles } from 'lucide-react';
import { Modal } from '../../shared/ui';
import type { AlcoholRecord, AlcoholItem, DrunkLevel } from '../../domain';
import { DRINK_TYPES, getPrediction, calculatePureAlcohol } from '../../utils/alcoholHelpers';

interface AlcoholRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: AlcoholRecord) => void;
    initialData?: AlcoholRecord;
}

const DRUNK_LEVELS: { id: DrunkLevel, label: string, emoji: string }[] = [
    { id: 'none', label: '没感觉', emoji: '😐' },
    { id: 'tipsy', label: '微醺', emoji: '☺️' },
    { id: 'drunk', label: '醉酒', emoji: '🥴' },
    { id: 'wasted', label: '断片', emoji: '🤮' },
];

const SCENE_OPTIONS = {
    where: { label: '1. 哪里喝的？', icon: MapPin, options: ['家', '饭店/餐厅', '酒吧/KTV', '大排档', '办公室', '户外'], activeColor: 'bg-indigo-600 border-indigo-600' },
    who: { label: '2. 和谁喝的？', icon: Users, options: ['独自', '朋友', '伴侣', '同事/客户', '家人'], activeColor: 'bg-blue-600 border-blue-600' },
    why: { label: '3. 为什么喝？', icon: Target, options: ['放松', '聚会', '应酬', '助兴', '借酒浇愁', '庆祝'], activeColor: 'bg-emerald-600 border-emerald-600' }
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [step, setStep] = useState<0 | 1>(0);
    const [selectedItems, setSelectedItems] = useState<Record<string, { count: number, abv: number, vol: number }>>({});
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [time, setTime] = useState<string>('20:00');
    const [duration, setDuration] = useState(60);
    const [mode, setMode] = useState<'sip' | 'session'>('sip');
    const [drinkWhere, setDrinkWhere] = useState('家');
    const [drinkWith, setDrinkWith] = useState('独自');
    const [drinkWhy, setDrinkWhy] = useState('放松');
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            if (initialData) {
                const map: Record<string, { count: number, abv: number, vol: number }> = {};
                initialData.items.forEach(i => map[i.key] = { count: i.count, abv: i.abv, vol: i.volume });
                setSelectedItems(map);
                setDrunkLevel(initialData.drunkLevel || 'none');
                setTime(initialData.time || '20:00');
                setDuration(initialData.durationMinutes || 60);
                setMode(initialData.ongoing || initialData.startTime ? 'session' : 'sip');
                if (initialData.alcoholScene) {
                    const parts = initialData.alcoholScene.split(' | ');
                    if (parts.length >= 3) { setDrinkWhere(parts[0]); setDrinkWith(parts[1]); setDrinkWhy(parts[2]); }
                }
            } else {
                setSelectedItems({}); setDrunkLevel('none'); setDrinkWhere('家'); setDrinkWith('独自'); setDrinkWhy('放松');
                setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
                setMode('sip');
            }
        }
    }, [isOpen, initialData]);

    const totalGrams = useMemo(() => {
        let sum = 0;
        // Fix: Explicitly type d to avoid 'unknown' errors
        (Object.entries(selectedItems) as [string, { count: number, abv: number, vol: number }][]).forEach(([_, d]) => { sum += calculatePureAlcohol(d.vol, d.abv) * d.count; });
        return Math.round(sum * 10) / 10;
    }, [selectedItems]);

    const prediction = useMemo(() => getPrediction(totalGrams), [totalGrams]);

    const updateItemValue = (key: string, field: 'abv' | 'vol' | 'count', val: number) => {
        setSelectedItems(prev => {
            const next = { ...prev, [key]: { ...prev[key], [field]: val } };
            if (field === 'count' && val <= 0) delete next[key];
            return next;
        });
    };

    const handleSave = () => {
        // Fix: Explicitly type val to avoid 'unknown' errors
        const items: AlcoholItem[] = (Object.entries(selectedItems) as [string, { count: number, abv: number, vol: number }][]).map(([key, val]) => ({
            key, name: DRINK_TYPES.find(d => d.key === key)?.name || '未知',
            volume: val.vol, abv: val.abv, count: val.count, pureAlcohol: calculatePureAlcohol(val.vol, val.abv)
        }));
        const isLate = parseInt(time.split(':')[0]) < 5;
        onSave({ 
            id: initialData?.id || Date.now().toString(),
            totalGrams, 
            durationMinutes: mode === 'sip' ? 10 : duration, 
            items, isLate, drunkLevel, 
            alcoholScene: `${drinkWhere} | ${drinkWith} | ${drinkWhy}`, 
            time, ongoing: false 
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 0 ? "饮酒清单" : "饮酒总结"}
            footer={
                <div className="w-full">
                    {step === 0 ? (
                        <button onClick={() => setStep(1)} disabled={totalGrams === 0} className="w-full py-4 bg-amber-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all">
                            下一步：总结场景 <ChevronRight size={20} className="ml-2" />
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={() => setStep(0)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl">修改饮品</button>
                            <button onClick={handleSave} className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95">确认保存</button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-4 -mt-4 bg-white dark:bg-[#0a0f1d] overflow-hidden">
                
                <div className="px-6 py-6 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/5 relative shrink-0">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                <Beer size={32} className="text-amber-500" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">酒精摄入总量</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-amber-500 tabular-nums">{totalGrams}</span>
                                    <span className="text-sm font-bold text-slate-400">克</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase mb-1">预测状态</div>
                            <div className="text-3xl font-black text-amber-500">{prediction.predicted}级</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">{time} - {mode === 'session' ? '持续' : '小酌'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6">
                    {step === 0 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex p-1 bg-slate-100 dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5">
                                <button onClick={() => setMode('session')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'session' ? 'bg-white dark:bg-[#1e293b] text-amber-500 shadow-md' : 'text-slate-400 dark:text-slate-500'}`}>持续性饮酒</button>
                                <button onClick={() => setMode('sip')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'sip' ? 'bg-white dark:bg-[#1e293b] text-amber-500 shadow-md' : 'text-slate-400 dark:text-slate-500'}`}>一口/一杯</button>
                            </div>

                            {Object.keys(selectedItems).length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase px-1">已添加清单 (可微调毫升/精度)</h4>
                                    {/* Fix: Explicitly type item to avoid 'unknown' errors */}
                                    {(Object.entries(selectedItems) as [string, { count: number, abv: number, vol: number }][]).map(([key, item]) => {
                                        const preset = DRINK_TYPES.find(d => d.key === key);
                                        const isExp = expandedKey === key;
                                        return (
                                            <div key={key} className={`rounded-3xl border transition-all ${isExp ? 'bg-white dark:bg-[#1e293b] border-amber-500/50 shadow-lg' : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/5'}`}>
                                                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedKey(isExp ? null : key)}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-2xl">{preset?.icon}</div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">{preset?.name} {isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</div>
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{item.vol}毫升 · {item.abv}% 浓度</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#0a0f1d] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count - 1); }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Minus size={16} strokeWidth={3}/></button>
                                                        <span className="text-lg font-black text-slate-900 dark:text-white w-5 text-center tabular-nums">{item.count}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count + 1); }} className="p-1.5 text-amber-500 hover:text-amber-400 transition-colors"><Plus size={16} strokeWidth={3}/></button>
                                                    </div>
                                                </div>
                                                {isExp && (
                                                    <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 dark:text-slate-500"><span>单杯毫升 (ml)</span><span className="text-amber-500">{item.vol}ml</span></div>
                                                            <input type="range" min="10" max="2000" step="10" value={item.vol} onChange={e => updateItemValue(key, 'vol', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-amber-500" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 dark:text-slate-500"><span>酒精浓度 (ABV)</span><span className="text-red-500">{item.abv}%</span></div>
                                                            <input type="range" min="0" max="75" step="0.5" value={item.abv} onChange={e => updateItemValue(key, 'abv', parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-amber-500" />
                                                        </div>
                                                        <button onClick={() => updateItemValue(key, 'count', 0)} className="w-full py-2 text-[10px] font-bold text-red-500 flex items-center justify-center gap-1"><Trash2 size={12}/> 移除此项</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="space-y-4 pb-10">
                                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase px-1">点击添加酒类</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {DRINK_TYPES.map(drink => (
                                        <button 
                                            key={drink.key} 
                                            onClick={() => { setSelectedItems(prev => ({ ...prev, [drink.key]: { count: (prev[drink.key]?.count || 0) + 1, abv: prev[drink.key]?.abv || drink.abv, vol: prev[drink.key]?.vol || drink.volume } })); setExpandedKey(drink.key); }} 
                                            className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-4 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all hover:border-amber-500/30"
                                        >
                                            <div className="text-3xl">{drink.icon}</div>
                                            <div className="text-left">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-slate-200">{drink.name}</div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{drink.abv}% · {drink.volume}ml</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
                            {Object.entries(SCENE_OPTIONS).map(([key, dim]) => {
                                const state = key === 'where' ? drinkWhere : key === 'who' ? drinkWith : drinkWhy;
                                const setter = key === 'where' ? setDrinkWhere : key === 'who' ? setDrinkWith : setDrinkWhy;
                                return (
                                    <div key={key} className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 px-1">
                                            <dim.icon size={14} /><h4 className="text-[11px] font-black uppercase tracking-widest">{dim.label}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {dim.options.map(opt => (
                                                <button 
                                                    key={opt} onClick={() => setter(opt)} 
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${state === opt ? dim.activeColor + ' text-white shadow-md scale-105' : 'bg-slate-50 dark:bg-[#111827] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2"><Sparkles size={14} /> 4. 醉到什么程度？</h4>
                                <div className="grid grid-cols-4 gap-3 pb-10">
                                    {DRUNK_LEVELS.map(lvl => (
                                        <button 
                                            key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} 
                                            className={`flex flex-col items-center py-5 rounded-[2.5rem] transition-all border-2 ${drunkLevel === lvl.id ? 'bg-white dark:bg-[#1e293b] border-amber-500 shadow-xl scale-105' : 'bg-slate-50 dark:bg-[#111827] border-transparent opacity-60'}`}
                                        >
                                            <span className="text-3xl mb-2">{lvl.emoji}</span>
                                            <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>{lvl.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
