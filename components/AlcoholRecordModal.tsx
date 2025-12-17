
import React, { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, Beer, Clock, X, StopCircle, ChevronDown, ChevronUp, MapPin, Users, Target, Zap, Trash2, Sliders } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { DRINK_TYPES } from '../utils/alcoholHelpers';

interface AlcoholRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: AlcoholRecord) => void;
    initialData?: AlcoholRecord;
}

const DRUNK_LEVELS: { id: DrunkLevel, label: string, emoji: string }[] = [
    { id: 'none', label: '无感', emoji: '😐' },
    { id: 'tipsy', label: '微醺', emoji: '☺️' },
    { id: 'drunk', label: '醉酒', emoji: '🥴' },
    { id: 'wasted', label: '断片', emoji: '🤮' },
];

const TAGS = {
    location: ['家', '烧烤摊', '大排档', '饭店', '餐厅', '酒吧', 'KTV', '夜店', '公司', '户外'],
    people: ['独自', '朋友', '伴侣', '同事', '客户', '家人', '同学'],
    reason: ['放松', '聚会', '应酬', '佐餐', '助兴', '借酒浇愁', '庆祝', '品鉴']
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [step, setStep] = useState<'recording' | 'summary'>('recording');
    const [isInstant, setIsInstant] = useState(false);

    // Session State
    const [id, setId] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [isOngoing, setIsOngoing] = useState(false);
    
    // Items State
    const [items, setItems] = useState<AlcoholItem[]>([]);
    const [expandedItemIdx, setExpandedItemIdx] = useState<number | null>(null);
    
    // Details State
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [location, setLocation] = useState<string>('家');
    const [people, setPeople] = useState<string>('独自');
    const [reason, setReason] = useState<string>('放松');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setId(initialData.id || Date.now().toString());
                setStartTime(initialData.startTime || '');
                setEndTime(initialData.endTime || '');
                setIsOngoing(initialData.ongoing ?? false);
                setIsInstant(initialData.isInstant ?? false);
                setItems(JSON.parse(JSON.stringify(initialData.items || [])));
                
                setDrunkLevel(initialData.drunkLevel || 'none');
                setLocation(initialData.location || '家');
                setPeople(initialData.people || '独自');
                setReason(initialData.reason || '放松');
                setStep('recording');
            } else {
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                setId(Date.now().toString());
                setStartTime(nowStr);
                setItems([]);
                setIsOngoing(true);
                setIsInstant(false);
                setStep('recording');
            }
            setExpandedItemIdx(null);
        }
    }, [isOpen, initialData]);

    const totalGrams = useMemo(() => {
        let sum = 0;
        items.forEach(i => sum += (i.pureAlcohol * i.count));
        return Math.round(sum * 10) / 10;
    }, [items]);

    const durationDisplay = useMemo(() => {
        if (!startTime) return '0m';
        const end = isOngoing ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : (endTime || startTime);
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440;
        return `${diff}m`;
    }, [startTime, endTime, isOngoing]);

    const handleAddPreset = (drink: typeof DRINK_TYPES[0]) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i.key === drink.key);
            if (idx > -1) {
                const newItems = [...prev];
                newItems[idx].count += 1;
                return newItems;
            }
            return [...prev, {
                key: drink.key, name: drink.name, volume: drink.volume,
                abv: drink.abv, pureAlcohol: drink.pure, count: 1
            }];
        });
    };

    const updateItem = (idx: number, field: keyof AlcoholItem, val: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[idx], [field]: val };
            if (field === 'volume' || field === 'abv') {
                item.pureAlcohol = Math.round(item.volume * (item.abv / 100) * 0.8 * 10) / 10;
            }
            newItems[idx] = item;
            return newItems;
        });
    };

    const handleFinish = () => {
        if (isInstant) {
            setEndTime(startTime);
        } else if (isOngoing) {
            setEndTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }
        setIsOngoing(false);
        setStep('summary');
    };

    const handleSave = () => {
        const [h1, m1] = startTime.split(':').map(Number);
        const finalEnd = isInstant ? startTime : (endTime || startTime);
        const [h2, m2] = finalEnd.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440;

        onSave({
            id, startTime, endTime: finalEnd, ongoing: false, isInstant,
            totalGrams, durationMinutes: diff, isLate: h2 < 5,
            items, drunkLevel, location, people, reason
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'recording' ? "正在饮酒..." : "饮酒总结"}
            footer={
                step === 'recording' ? (
                    <button onClick={handleFinish} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center">
                        {isInstant ? <Check size={20} className="mr-2"/> : <StopCircle size={20} className="mr-2"/>}
                        {isInstant ? "记录完成" : "结束本次饮酒"}
                    </button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setStep('recording')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl">修改饮品</button>
                        <button onClick={handleSave} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg">保存记录</button>
                    </div>
                )
            }
        >
            <div className="h-[75vh] flex flex-col -mx-2 relative">
                
                {/* Header Info */}
                <div className="mx-2 mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isOngoing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}><Beer size={20}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">总摄入量</div>
                                <div className="text-2xl font-black">{totalGrams}<span className="text-xs text-slate-400 ml-1">g</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                <Clock size={12} className="text-slate-400"/>
                                <span className="font-mono font-bold text-sm">{isInstant ? '一次性' : durationDisplay}</span>
                             </div>
                             <div className="text-[10px] text-slate-400 mt-1 font-mono">{startTime} {isOngoing ? '...' : `- ${endTime}`}</div>
                        </div>
                    </div>
                </div>

                {/* STEP 1: RECORDING */}
                {step === 'recording' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6 pb-10">
                        
                        {/* Mode Switch */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button onClick={() => setIsInstant(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isInstant ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-400'}`}>持续性饮酒</button>
                            <button onClick={() => setIsInstant(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isInstant ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-400'}`}>一口/一杯</button>
                        </div>

                        {/* Drink List with Inline Expansion */}
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className={`bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden transition-all ${expandedItemIdx === idx ? 'ring-2 ring-amber-400 border-amber-400 shadow-md' : 'border-slate-100 dark:border-slate-700'}`}>
                                    <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => setExpandedItemIdx(expandedItemIdx === idx ? null : idx)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xl">{DRINK_TYPES.find(d => d.key === item.key)?.icon || '🍺'}</div>
                                            <div>
                                                <div className="text-sm font-bold flex items-center gap-1">{item.name} {expandedItemIdx === idx ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.volume}ml · {item.abv}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => updateItem(idx, 'count', Math.max(0, item.count - 1))} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Minus size={14}/></button>
                                            <span className="w-4 text-center font-bold text-sm">{item.count}</span>
                                            <button onClick={() => updateItem(idx, 'count', item.count + 1)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                    {expandedItemIdx === idx && (
                                        <div className="px-4 pb-4 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>单杯容量</span><span className="text-amber-600">{item.volume}ml</span></div>
                                                <input type="range" min="10" max="1000" step="10" value={item.volume} onChange={e => updateItem(idx, 'volume', Number(e.target.value))} className="w-full h-1.5 accent-amber-500"/>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>酒精浓度 (ABV)</span><span className="text-red-500">{item.abv}%</span></div>
                                                <input type="range" min="1" max="80" step="0.5" value={item.abv} onChange={e => updateItem(idx, 'abv', Number(e.target.value))} className="w-full h-1.5 accent-red-500"/>
                                            </div>
                                            <div className="flex justify-end"><button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Trash2 size={10}/>删除</button></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Presets Grid */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">快速加酒</label>
                            <div className="grid grid-cols-3 gap-3">
                                {DRINK_TYPES.map(d => (
                                    <button key={d.key} onClick={() => handleAddPreset(d)} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all">
                                        <span className="text-2xl">{d.icon}</span>
                                        <span className="text-xs font-bold truncate w-full text-center">{d.name}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">{d.volume}ml</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: SUMMARY */}
                {step === 'summary' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6 pb-10 animate-in slide-in-from-right-4">
                        <section>
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-3"><MapPin size={12}/> 饮酒地点 (Where)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.location.map(t => <button key={t} onClick={() => setLocation(t)} className={`px-3 py-2 text-xs rounded-xl border transition-all ${location === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{t}</button>)}
                            </div>
                        </section>
                        <section>
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-3"><Users size={12}/> 与谁共饮 (Who)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.people.map(t => <button key={t} onClick={() => setPeople(t)} className={`px-3 py-2 text-xs rounded-xl border transition-all ${people === t ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{t}</button>)}
                            </div>
                        </section>
                        <section>
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-3"><Target size={12}/> 饮酒目的 (Why)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.reason.map(t => <button key={t} onClick={() => setReason(t)} className={`px-3 py-2 text-xs rounded-xl border transition-all ${reason === t ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{t}</button>)}
                            </div>
                        </section>
                        <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-4"><Zap size={12}/> 醉意程度</label>
                            <div className="flex gap-2">
                                {DRUNK_LEVELS.map(lvl => (
                                    <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex-1 py-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${drunkLevel === lvl.id ? 'bg-amber-100 border-amber-400 shadow-sm ring-1 ring-amber-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60'}`}>
                                        <span className="text-2xl">{lvl.emoji}</span>
                                        <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-amber-700' : 'text-slate-500'}`}>{lvl.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
