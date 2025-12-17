
import React, { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, Beer, Clock, X, Edit2, Play, StopCircle, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { DRINK_TYPES, getPrediction } from '../utils/alcoholHelpers';
import { RangeSlider } from './FormControls';

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

const SCENES = ['独自', '朋友', '应酬', '家庭', '夜店'];

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    // Session State
    const [id, setId] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [isOngoing, setIsOngoing] = useState(false);
    
    // Drink Items State
    const [items, setItems] = useState<AlcoholItem[]>([]);
    
    // Details State
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [scene, setScene] = useState<string>('独自');
    
    // Editing Custom Drink State
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [tempVolume, setTempVolume] = useState<number>(0);
    const [tempAbv, setTempAbv] = useState<number>(0);

    // Initialize
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setId(initialData.id || Date.now().toString());
                setStartTime(initialData.startTime || initialData.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setEndTime(initialData.endTime || '');
                setIsOngoing(initialData.ongoing ?? false);
                setItems(JSON.parse(JSON.stringify(initialData.items || []))); // Deep copy
                setDrunkLevel(initialData.drunkLevel || 'none');
                setScene(initialData.alcoholScene || '独自');
            } else {
                // New Manual Record (Default to completed)
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
                setScene('独自');
            }
            setEditingItemIndex(null);
        }
    }, [isOpen, initialData]);

    // Live Timer for Ongoing Sessions
    useEffect(() => {
        let interval: any;
        if (isOngoing && isOpen) {
            // Just force re-render to update the duration display if needed
            // Actually duration is calc'd from startTime and current time
            interval = setInterval(() => {
                // setTick(t => t + 1); 
            }, 60000);
        }
        return () => clearInterval(interval);
    }, [isOngoing, isOpen]);

    // Helper: Calculate Total Grams
    const totalGrams = useMemo(() => {
        let sum = 0;
        items.forEach(i => {
            sum += i.pureAlcohol * i.count;
        });
        return Math.round(sum * 10) / 10;
    }, [items]);

    // Helper: Prediction
    const prediction = useMemo(() => {
        return totalGrams > 0 ? getPrediction(totalGrams) : null;
    }, [totalGrams]);

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

    const handleEditItem = (index: number) => {
        setEditingItemIndex(index);
        setTempVolume(items[index].volume);
        setTempAbv(items[index].abv);
    };

    const handleSaveItemEdit = () => {
        if (editingItemIndex === null) return;
        setItems(prev => {
            const newItems = [...prev];
            const item = newItems[editingItemIndex];
            const newVolume = tempVolume;
            const newAbv = tempAbv;
            // Recalculate pure alcohol: Vol * ABV * 0.8 / 100
            const newPure = Math.round(newVolume * (newAbv / 100) * 0.8 * 10) / 10;
            
            newItems[editingItemIndex] = {
                ...item,
                volume: newVolume,
                abv: newAbv,
                pureAlcohol: newPure
            };
            return newItems;
        });
        setEditingItemIndex(null);
    };

    const handleSave = () => {
        // End session if ongoing
        if (isOngoing) {
            setIsOngoing(false);
            setEndTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }

        // Duration in minutes
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = (isOngoing ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : (endTime || startTime)).split(':').map(Number);
        let durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (durationMinutes < 0) durationMinutes += 24 * 60;

        // Is Late? Logic: if duration spans into or starts in 0:00 - 5:00
        // Simplified: check if end time is late
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
            alcoholScene: scene,
            time: startTime // Legacy compact support
        });
        onClose();
    };

    const handleEndSession = () => {
        setIsOngoing(false);
        setEndTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isOngoing ? "正在饮酒..." : "饮酒记录"}
            footer={
                <div className="flex gap-2 w-full">
                    {isOngoing && (
                        <button 
                            onClick={handleEndSession}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center"
                        >
                            <StopCircle size={18} className="mr-2"/> 结束局
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center"
                    >
                        <Check size={20} className="mr-2"/> {isOngoing ? '更新状态' : '完成记录'}
                    </button>
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-2 relative">
                
                {/* 1. Header Card (Time & Stats) */}
                <div className="mx-2 mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isOngoing ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                <Beer size={20}/>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {isOngoing ? '进行中' : '总摄入量'}
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

                    {/* Timeline Controls (For Manual) */}
                    {!isOngoing && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">开始</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-mono font-bold outline-none"/>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">结束</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-mono font-bold outline-none"/>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Selected List (Editable) */}
                {items.length > 0 && (
                    <div className="mx-2 mb-4 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">已点饮品 (点击修改)</label>
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-right-2">
                                <div 
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => handleEditItem(idx)}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xl">
                                        {DRINK_TYPES.find(d => d.key === item.key)?.icon || '🍺'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-brand-text dark:text-slate-200 flex items-center gap-1">
                                            {item.name}
                                            <Edit2 size={10} className="text-slate-300"/>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {item.volume}ml · {item.abv}%
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
                                    <button onClick={() => handleChangeCount(idx, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Minus size={14}/></button>
                                    <span className="font-black text-sm w-4 text-center">{item.count}</span>
                                    <button onClick={() => handleChangeCount(idx, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Plus size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. Add Presets Grid */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar pb-20">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">添加饮品</label>
                    <div className="grid grid-cols-3 gap-3 pb-4">
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

                    {/* Context Details */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">场景</label>
                            <div className="flex flex-wrap gap-2">
                                {SCENES.map(s => (
                                    <button key={s} onClick={() => setScene(s)} className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all ${scene === s ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-300' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">醉意程度</label>
                            <div className="flex gap-2">
                                {DRUNK_LEVELS.map(lvl => (
                                    <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex-1 py-2 rounded-xl border flex flex-col items-center transition-all ${drunkLevel === lvl.id ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                                        <span className="text-xl mb-1">{lvl.emoji}</span>
                                        <span className={`text-[10px] font-bold ${drunkLevel === lvl.id ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>{lvl.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Item Overlay Modal */}
                {editingItemIndex !== null && (
                    <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="w-full space-y-6">
                            <div className="text-center">
                                <div className="text-4xl mb-2">{DRINK_TYPES.find(d => d.key === items[editingItemIndex].key)?.icon}</div>
                                <h3 className="text-lg font-bold text-brand-text dark:text-slate-200">{items[editingItemIndex].name} 参数调整</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>容量 (ml)</span>
                                        <span className="text-brand-accent">{tempVolume}</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="1000" step="10" 
                                        value={tempVolume} onChange={e => setTempVolume(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-300 mt-1"><span>一口</span><span>一瓶</span></div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>酒精度 (% ABV)</span>
                                        <span className="text-brand-accent">{tempAbv}%</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="80" step="0.5" 
                                        value={tempAbv} onChange={e => setTempAbv(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-300 mt-1"><span>淡啤</span><span>烈酒</span></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setEditingItemIndex(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">取消</button>
                                <button onClick={handleSaveItemEdit} className="flex-1 py-3 rounded-xl bg-brand-accent text-white font-bold shadow-md">确认修改</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
