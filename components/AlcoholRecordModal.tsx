
import React, { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, Beer, Clock, X, Edit2, Play, StopCircle, RefreshCw, ChevronDown, ChevronUp, MapPin, Users, Target, Zap, Trash2 } from 'lucide-react';
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

// New Context Tags
const TAGS = {
    location: ['家', '烧烤摊', '大排档', '饭店', '餐厅', '酒吧', 'KTV', '夜店', '公司', '户外'],
    people: ['独自', '朋友', '伴侣', '同事', '客户', '家人', '同学', '暧昧对象'],
    reason: ['放松', '聚会', '应酬', '佐餐', '助兴', '借酒浇愁', '庆祝', '品鉴']
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    // Flow State
    const [step, setStep] = useState<'recording' | 'summary'>('recording');

    // Session State
    const [id, setId] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [isOngoing, setIsOngoing] = useState(false);
    
    // Drink Items State
    const [items, setItems] = useState<AlcoholItem[]>([]);
    
    // Details State
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [location, setLocation] = useState<string>('家');
    const [people, setPeople] = useState<string>('独自');
    const [reason, setReason] = useState<string>('放松');
    
    // Inline Editing State (Index of expanded item)
    const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

    // Initialize
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setId(initialData.id || Date.now().toString());
                setStartTime(initialData.startTime || initialData.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setEndTime(initialData.endTime || '');
                setIsOngoing(initialData.ongoing ?? false);
                setItems(JSON.parse(JSON.stringify(initialData.items || []))); // Deep copy
                
                // Context
                setDrunkLevel(initialData.drunkLevel || 'none');
                setLocation(initialData.location || (initialData.alcoholScene === '独自' ? '家' : initialData.alcoholScene) || '家');
                setPeople(initialData.people || (initialData.alcoholScene === '独自' ? '独自' : '朋友'));
                setReason(initialData.reason || '放松');
                
                // If opening an ongoing session, go to recording step. If completed, go to summary? 
                // Let's stick to: Always start at 'recording' to review drinks, unless explicitly viewing history?
                // For editing history, maybe summary is better. 
                // But for now, let's keep it simple: always start at recording to see list.
                setStep('recording'); 
            } else {
                // New Manual Record
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 60);
                const endStr = endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                setId(Date.now().toString());
                setStartTime(nowStr);
                setEndTime(endStr);
                setIsOngoing(false);
                setItems([]);
                
                setDrunkLevel('none');
                setLocation('家');
                setPeople('独自');
                setReason('放松');
                
                setStep('recording');
            }
            setExpandedItemIndex(null);
        }
    }, [isOpen, initialData]);

    // Helper: Calculate Total Grams
    const totalGrams = useMemo(() => {
        let sum = 0;
        items.forEach(i => {
            sum += i.pureAlcohol * i.count;
        });
        return Math.round(sum * 10) / 10;
    }, [items]);

    // Helper: Duration
    const durationDisplay = useMemo(() => {
        if (!startTime) return '0m';
        const end = isOngoing ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : (endTime || startTime);
        
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        return `${diff}m`;
    }, [startTime, endTime, isOngoing]);

    // Actions
    const handleAddPreset = (drink: typeof DRINK_TYPES[0]) => {
        setItems(prev => {
            const existingIdx = prev.findIndex(i => i.key === drink.key);
            if (existingIdx > -1) {
                const newItems = [...prev];
                newItems[existingIdx].count += 1;
                return newItems;
            } else {
                return [...prev, {
                    key: drink.key,
                    name: drink.name,
                    volume: drink.volume,
                    abv: drink.abv,
                    pureAlcohol: drink.pure,
                    count: 1
                }];
            }
        });
    };

    const handleChangeCount = (index: number, delta: number) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index].count += delta;
            if (newItems[index].count <= 0) {
                return newItems.filter((_, i) => i !== index);
            }
            return newItems;
        });
    };

    const handleUpdateItem = (index: number, field: keyof AlcoholItem, value: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], [field]: value };
            
            // Recalc pure alcohol if vol/abv changed
            if (field === 'volume' || field === 'abv') {
                item.pureAlcohol = Math.round(item.volume * (item.abv / 100) * 0.8 * 10) / 10;
            }
            
            newItems[index] = item;
            return newItems;
        });
    };
    
    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
        if (expandedItemIndex === index) setExpandedItemIndex(null);
    };

    const handleNext = () => {
        // Stop timer if ongoing
        if (isOngoing) {
            setIsOngoing(false);
            setEndTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }
        setStep('summary');
    };

    const handleSave = () => {
        // Duration in minutes
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = (isOngoing ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : (endTime || startTime)).split(':').map(Number);
        let durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (durationMinutes < 0) durationMinutes += 24 * 60;

        // Is Late?
        const isLate = h2 >= 0 && h2 < 5;

        onSave({
            id,
            startTime,
            endTime: isOngoing ? undefined : endTime,
            ongoing: isOngoing,
            totalGrams,
            durationMinutes,
            items,
            isLate,
            drunkLevel,
            location,
            people,
            reason,
            // Legacy mapping
            alcoholScene: location,
            time: startTime
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'recording' ? (isOngoing ? "正在饮酒..." : "饮酒明细") : "饮酒总结"}
            footer={
                step === 'recording' ? (
                    <button 
                        onClick={handleNext} 
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center"
                    >
                        {isOngoing ? <StopCircle size={20} className="mr-2"/> : <Check size={20} className="mr-2"/>}
                        {isOngoing ? "结束本次饮酒" : "下一步"}
                    </button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setStep('recording')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl">返回修改</button>
                        <button onClick={handleSave} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg">完成记录</button>
                    </div>
                )
            }
        >
            <div className="h-[75vh] flex flex-col -mx-2 relative">
                
                {/* 1. Header Card (Common) */}
                <div className="mx-2 mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex-none">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isOngoing ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                <Beer size={20}/>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    总摄入量
                                </div>
                                <div className="text-2xl font-black text-brand-text dark:text-slate-100">
                                    {totalGrams}<span className="text-sm text-slate-400 font-bold ml-1">g</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2 mb-1">
                                <Clock size={12} className="text-slate-400"/>
                                <span className="font-mono font-bold text-sm text-slate-600 dark:text-slate-300">{durationDisplay}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400 font-mono">
                                {startTime} <span className="opacity-50">-</span> {isOngoing ? '...' : endTime}
                            </div>
                        </div>
                    </div>
                </div>

                {/* STEP 1: RECORDING */}
                {step === 'recording' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-20 animate-in fade-in slide-in-from-right-4">
                        
                        {/* List */}
                        {items.length > 0 && (
                            <div className="space-y-3 mb-6">
                                {items.map((item, idx) => {
                                    const isExpanded = expandedItemIndex === idx;
                                    return (
                                        <div key={idx} className={`bg-white dark:bg-slate-800 border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-amber-400 ring-1 ring-amber-400 shadow-md' : 'border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                                            {/* Header Row */}
                                            <div className="p-3 flex items-center justify-between" onClick={() => setExpandedItemIndex(isExpanded ? null : idx)}>
                                                <div className="flex items-center gap-3 flex-1 cursor-pointer">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xl shrink-0">
                                                        {DRINK_TYPES.find(d => d.key === item.key)?.icon || '🍺'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-brand-text dark:text-slate-200 flex items-center gap-1">
                                                            {item.name}
                                                            {isExpanded ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {item.volume}ml · {item.abv}%
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleChangeCount(idx, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Minus size={14}/></button>
                                                    <span className="font-black text-sm w-5 text-center">{item.count}</span>
                                                    <button onClick={() => handleChangeCount(idx, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Plus size={14}/></button>
                                                </div>
                                            </div>

                                            {/* Inline Editor */}
                                            {isExpanded && (
                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                                            <span>单杯容量</span>
                                                            <span className="text-brand-accent">{item.volume} ml</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="10" max="1000" step="10" 
                                                            value={item.volume} onChange={e => handleUpdateItem(idx, 'volume', Number(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                                            <span>酒精度 (ABV)</span>
                                                            <span className="text-red-500">{item.abv}%</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="1" max="80" step="0.5" 
                                                            value={item.abv} onChange={e => handleUpdateItem(idx, 'abv', Number(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end pt-2">
                                                        <button 
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="text-xs text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                        >
                                                            <Trash2 size={12}/> 删除此项
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add Grid */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">添加饮品</label>
                            <div className="grid grid-cols-3 gap-3">
                                {DRINK_TYPES.map(drink => (
                                    <button 
                                        key={drink.key} 
                                        onClick={() => handleAddPreset(drink)} 
                                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-800 transition-all active:scale-95"
                                    >
                                        <span className="text-2xl mb-1">{drink.icon}</span>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{drink.name}</span>
                                        <span className="text-[9px] text-slate-400 mt-0.5">{drink.volume}ml</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: SUMMARY */}
                {step === 'summary' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-20 space-y-6 animate-in fade-in slide-in-from-right-4">
                        
                        {/* 1. Context Tags */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1"><MapPin size={12}/> 地点 (Where)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.location.map(t => (
                                    <button 
                                        key={t} onClick={() => setLocation(t)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all ${location === t ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-300' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1"><Users size={12}/> 人物 (Who)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.people.map(t => (
                                    <button 
                                        key={t} onClick={() => setPeople(t)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all ${people === t ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1"><Target size={12}/> 动机 (Why)</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.reason.map(t => (
                                    <button 
                                        key={t} onClick={() => setReason(t)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all ${reason === t ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Drunk Level */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-3 flex items-center gap-1"><Zap size={12}/> 醉意程度</label>
                            <div className="flex gap-2">
                                {DRUNK_LEVELS.map(lvl => (
                                    <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex-1 py-3 rounded-xl border flex flex-col items-center transition-all ${drunkLevel === lvl.id ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 shadow-sm ring-1 ring-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                                        <span className="text-2xl mb-1">{lvl.emoji}</span>
                                        <span className={`text-xs font-bold ${drunkLevel === lvl.id ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>{lvl.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
