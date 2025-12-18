
import React, { useState, useEffect } from 'react';
import { Check, Minus, Plus, Moon, Clock, GlassWater, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { DRINK_TYPES, getPrediction } from '../utils/alcoholHelpers';
import { useData } from '../contexts/DataContext';

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
    const { cancelAlcoholRecord } = useData();
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [duration, setDuration] = useState(60); 
    const [prediction, setPrediction] = useState<any>(null);
    const [isLate, setIsLate] = useState(false);
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [scene, setScene] = useState<string>('独自');
    const [time, setTime] = useState<string>('20:00');
    const [startTime, setStartTime] = useState('');
    const [mode, setMode] = useState<'sip' | 'session'>('sip');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const map: Record<string, number> = {};
                initialData.items.forEach(i => map[i.key] = i.count);
                setSelectedItems(map);
                setDuration(initialData.durationMinutes || 60);
                setIsLate(initialData.isLate || false);
                setDrunkLevel(initialData.drunkLevel || 'none');
                setScene(initialData.alcoholScene || '独自');
                setTime(initialData.time || '20:00');
                setStartTime(initialData.startTime || '');
                setMode(initialData.ongoing || initialData.startTime ? 'session' : 'sip');
                
                if (initialData.ongoing) {
                    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    setTime(nowStr);
                    if (initialData.startTime) {
                        const [sh, sm] = initialData.startTime.split(':').map(Number);
                        const [eh, em] = nowStr.split(':').map(Number);
                        let diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff < 0) diff += 24 * 60;
                        setDuration(Math.max(1, diff));
                    }
                }
            } else {
                setSelectedItems({});
                setDuration(60);
                const now = new Date();
                setIsLate(now.getHours() >= 0 && now.getHours() < 5);
                setDrunkLevel('none');
                setScene('独自');
                setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setStartTime('');
                setMode('sip');
            }
        }
    }, [isOpen, initialData]);

    const totalGrams = React.useMemo(() => {
        let sum = 0;
        Object.entries(selectedItems).forEach(([key, val]) => {
            const count = val as number;
            const drink = DRINK_TYPES.find(d => d.key === key);
            if (drink) sum += drink.pure * count;
        });
        return Math.round(sum * 10) / 10;
    }, [selectedItems]);

    useEffect(() => {
        if (totalGrams > 0) {
            setPrediction(getPrediction(totalGrams));
        } else {
            setPrediction(null);
        }
    }, [totalGrams]);

    const handleItemChange = (key: string, delta: number) => {
        setSelectedItems(prev => {
            const next = Math.max(0, (prev[key] || 0) + delta);
            const newMap = { ...prev, [key]: next };
            if (next === 0) delete newMap[key];
            return newMap;
        });
    };

    const handleSave = () => {
        const items: AlcoholItem[] = [];
        Object.entries(selectedItems).forEach(([key, val]) => {
            const drink = DRINK_TYPES.find(d => d.key === key);
            if (drink) items.push({ key: drink.key, name: drink.name, volume: drink.volume, abv: drink.abv, pureAlcohol: drink.pure, count: val as number });
        });

        onSave({ totalGrams, durationMinutes: mode === 'sip' ? 10 : duration, items, isLate, drunkLevel, alcoholScene: scene, time, startTime: mode === 'session' ? startTime : undefined, endTime: mode === 'session' ? time : undefined, ongoing: false });
        onClose();
    };

    const handleDiscard = async () => {
        if (confirm('确定要放弃本次酒局计时吗？记录将被删除。')) {
            await cancelAlcoholRecord();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="饮酒详细记录"
            footer={
                <div className="w-full flex flex-col gap-3">
                    <button onClick={handleSave} className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform"><Check size={20} className="mr-2" strokeWidth={3}/> 确认保存 ({totalGrams}g 酒精)</button>
                    {initialData?.ongoing && (
                        <button onClick={handleDiscard} className="w-full py-2 text-slate-400 text-xs font-bold flex items-center justify-center hover:text-red-500 transition-colors"><Trash2 size={12} className="mr-1"/> 放弃本次酒局计时</button>
                    )}
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-2">
                {/* 模式选择 */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-2 mb-4">
                    <button onClick={() => setMode('sip')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'sip' ? 'bg-white dark:bg-slate-700 shadow-md text-amber-600' : 'text-slate-500'}`}><GlassWater size={14}/> 小酌一口</button>
                    <button onClick={() => setMode('session')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'session' ? 'bg-white dark:bg-slate-700 shadow-md text-amber-600' : 'text-slate-500'}`}><Clock size={14}/> 持续饮酒</button>
                </div>

                {/* 摄入总量卡片 */}
                <div className="mx-2 mb-4 bg-slate-950 rounded-[1.5rem] p-5 text-white relative overflow-hidden shrink-0 shadow-lg border border-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">当前摄入纯酒精</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-amber-400">{totalGrams}</span>
                                <span className="text-sm font-bold text-amber-400/60">g</span>
                            </div>
                        </div>
                        {prediction && (
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">预测次日硬度</div>
                                <div className={`text-2xl font-black ${prediction.predicted >= 4 ? 'text-emerald-400' : prediction.predicted >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{prediction.predicted}级</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 时间与环境 */}
                <div className="mx-2 mb-4 space-y-4 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={10}/> {mode === 'sip' ? '饮用时间' : '结束时间'}</span>
                            <div className="flex items-center gap-2">
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-100 outline-none" />
                            </div>
                        </div>
                        {mode === 'session' && (
                            <div className="flex-1 flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">持续时长 (分)</span>
                                <div className="flex items-center">
                                    <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||0)} className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-100 outline-none w-full" />
                                </div>
                            </div>
                        )}
                        <button onClick={() => setIsLate(!isLate)} className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 ${isLate ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                            <Moon size={14} fill={isLate ? "currentColor" : "none"}/>
                            <span className="text-[9px] font-black">熬夜</span>
                        </button>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                        {SCENES.map(s => (
                            <button key={s} onClick={() => setScene(s)} className={`px-3.5 py-1.5 text-xs font-bold rounded-full border-2 whitespace-nowrap transition-all ${scene === s ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{s}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {DRUNK_LEVELS.map(lvl => (
                            <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all border-2 ${drunkLevel === lvl.id ? 'bg-white dark:bg-slate-700 border-amber-400 shadow-md ring-4 ring-amber-500/5' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-60'}`}>
                                <span className="text-2xl mb-1">{lvl.emoji}</span>
                                <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-brand-text dark:text-slate-100' : 'text-slate-500'}`}>{lvl.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 酒水网格 */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-3 pb-8">
                        {DRINK_TYPES.map(drink => {
                            const count = selectedItems[drink.key] || 0;
                            return (
                                <div key={drink.key} onClick={() => handleItemChange(drink.key, 1)} className={`relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer aspect-square ${count > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 shadow-md shadow-amber-500/5' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                    <div className="text-3xl mb-2">{drink.icon}</div>
                                    <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 text-center leading-tight">{drink.name}</div>
                                    {count > 0 && (
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1.5px] rounded-[1.5rem] flex flex-col items-center justify-center z-10" onClick={(e) => e.stopPropagation()}>
                                            <div className="text-2xl font-black text-white mb-2">{count}</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleItemChange(drink.key, -1)} className="w-8 h-8 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-xl active:scale-90 transition-transform"><Minus size={14} strokeWidth={3}/></button>
                                                <button onClick={() => handleItemChange(drink.key, 1)} className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"><Plus size={14} strokeWidth={3}/></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AlcoholRecordModal;
