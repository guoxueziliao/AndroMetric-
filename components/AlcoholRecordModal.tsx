
import React, { useState, useEffect } from 'react';
import { Check, Minus, Plus, Moon, Clock, GlassWater } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { DRINK_TYPES, getPrediction } from '../utils/alcoholHelpers';

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
                
                // If it was an ongoing session, auto-set end time to now
                if (initialData.ongoing) {
                    setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                    if (initialData.startTime) {
                        const [sh, sm] = initialData.startTime.split(':').map(Number);
                        const [eh, em] = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
                        let diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff < 0) diff += 24 * 60;
                        setDuration(diff);
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

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="饮酒详细记录"
            footer={<button onClick={handleSave} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center"><Check size={20} className="mr-2"/> 确认 ({totalGrams}g 酒精)</button>}
        >
            <div className="h-[75vh] flex flex-col -mx-2">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mx-2 mb-4">
                    <button onClick={() => setMode('sip')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${mode === 'sip' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-500'}`}><GlassWater size={14}/> 小酌一口</button>
                    <button onClick={() => setMode('session')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${mode === 'session' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-500'}`}><Clock size={14}/> 持续饮酒</button>
                </div>

                <div className="mx-2 mb-4 bg-slate-900 rounded-xl p-4 text-white border border-slate-800 relative overflow-hidden shrink-0">
                    <div className="relative z-10 flex justify-between items-end">
                        <div><div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">当前摄入纯酒精</div><div className="text-3xl font-black text-amber-400">{totalGrams}g</div></div>
                        {prediction && <div className="text-right"><div className="text-xs text-slate-400 font-bold uppercase mb-1">预测次日硬度</div><div className={`text-2xl font-black ${prediction.predicted >= 4 ? 'text-green-400' : 'text-yellow-400'}`}>{prediction.predicted}级</div></div>}
                    </div>
                </div>

                <div className="mx-2 mb-4 space-y-3 shrink-0 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{mode === 'sip' ? '饮用时间' : '结束时间'}</span>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-transparent text-lg font-mono font-bold outline-none" />
                        </div>
                        {mode === 'session' && (
                            <div className="flex-1 flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">持续时长 (分)</span>
                                <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||0)} className="bg-transparent text-lg font-mono font-bold outline-none" />
                            </div>
                        )}
                        <button onClick={() => setIsLate(!isLate)} className={`px-2 py-1 rounded text-xs border flex items-center ${isLate ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}><Moon size={12}/> 熬夜</button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {SCENES.map(s => <button key={s} onClick={() => setScene(s)} className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${scene === s ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white dark:bg-slate-900 text-slate-500'}`}>{s}</button>)}
                    </div>
                    <div className="flex justify-between gap-1">
                        {DRUNK_LEVELS.map(lvl => <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex-1 flex flex-col items-center p-2 rounded transition-all ${drunkLevel === lvl.id ? 'bg-white dark:bg-slate-700 shadow-sm ring-1 ring-amber-400' : 'opacity-60'}`}><span className="text-xl">{lvl.emoji}</span><span className="text-[10px] font-bold mt-1">{lvl.label}</span></button>)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-3 pb-4">
                        {DRINK_TYPES.map(drink => {
                            const count = selectedItems[drink.key] || 0;
                            return (
                                <div key={drink.key} onClick={() => handleItemChange(drink.key, 1)} className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer aspect-square ${count > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50'}`}>
                                    <div className="text-3xl mb-1">{drink.icon}</div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">{drink.name}</div>
                                    {count > 0 && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10" onClick={(e) => e.stopPropagation()}>
                                            <div className="text-2xl font-black text-white mb-2">{count}</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleItemChange(drink.key, -1)} className="w-8 h-8 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-lg"><Minus size={14}/></button>
                                                <button onClick={() => handleItemChange(drink.key, 1)} className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg"><Plus size={14}/></button>
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
