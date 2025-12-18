
import React, { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, Moon, Clock, GlassWater, Trash2, Users, MapPin, Target, Thermometer, Percent, Droplets } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { PRESET_DRINKS, getPrediction, calculatePureAlcohol } from '../utils/alcoholHelpers';
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

const SCENE_OPTIONS = {
    with: ['独自', '朋友', '伴侣', '同事', '客户', '长辈'],
    location: ['家里', '餐馆', '酒吧', 'KTV', '夜店', '户外'],
    purpose: ['日常习惯', '应酬社交', '庆祝', '消愁', '助眠']
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { cancelAlcoholRecord } = useData();
    const [selectedItems, setSelectedItems] = useState<Record<string, { count: number, abv: number, vol: number }>>({});
    const [duration, setDuration] = useState(60); 
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [time, setTime] = useState<string>('20:00');
    const [startTime, setStartTime] = useState('');
    const [mode, setMode] = useState<'sip' | 'session'>('sip');
    
    // 细化场景状态
    const [drinkWith, setDrinkWith] = useState('独自');
    const [drinkLoc, setDrinkLoc] = useState('家里');
    const [drinkPurpose, setDrinkPurpose] = useState('日常习惯');

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
                
                // 解析场景字符串 "With | Location | Purpose"
                if (initialData.alcoholScene) {
                    const parts = initialData.alcoholScene.split(' | ');
                    if (parts.length >= 3) {
                        setDrinkWith(parts[0]);
                        setDrinkLoc(parts[1]);
                        setDrinkPurpose(parts[2]);
                    }
                }

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
                setDrunkLevel('none');
                setDrinkWith('独自');
                setDrinkLoc('家里');
                setDrinkPurpose('日常习惯');
                setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setStartTime('');
                setMode('sip');
            }
        }
    }, [isOpen, initialData]);

    // 自动计算是否熬夜 (00:00 - 05:00)
    const isLate = useMemo(() => {
        const [h] = time.split(':').map(Number);
        return h >= 0 && h < 5;
    }, [time]);

    const totalGrams = useMemo(() => {
        let sum = 0;
        Object.entries(selectedItems).forEach(([_, data]) => {
            sum += calculatePureAlcohol(data.vol, data.abv) * data.count;
        });
        return Math.round(sum * 10) / 10;
    }, [selectedItems]);

    const prediction = useMemo(() => totalGrams > 0 ? getPrediction(totalGrams) : null, [totalGrams]);

    const handleItemChange = (key: string, delta: number) => {
        setSelectedItems(prev => {
            const current = prev[key];
            if (!current && delta < 0) return prev;
            
            const preset = PRESET_DRINKS.find(d => d.key === key);
            const nextCount = (current?.count || 0) + delta;
            
            if (nextCount <= 0) {
                const next = { ...prev };
                delete next[key];
                return next;
            }

            return {
                ...prev,
                [key]: {
                    count: nextCount,
                    abv: current?.abv || preset?.abv || 5,
                    vol: current?.vol || preset?.volume || 330
                }
            };
        });
    };

    const updateItemDetails = (key: string, field: 'abv' | 'vol', value: number) => {
        setSelectedItems(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSave = () => {
        const items: AlcoholItem[] = [];
        Object.entries(selectedItems).forEach(([key, val]) => {
            const preset = PRESET_DRINKS.find(d => d.key === key);
            items.push({ 
                key, 
                name: preset?.name || '未知酒类', 
                volume: val.vol, 
                abv: val.abv, 
                pureAlcohol: calculatePureAlcohol(val.vol, val.abv), 
                count: val.count 
            });
        });

        const combinedScene = `${drinkWith} | ${drinkLoc} | ${drinkPurpose}`;

        onSave({ 
            totalGrams, 
            durationMinutes: mode === 'sip' ? 10 : duration, 
            items, 
            isLate, 
            drunkLevel, 
            alcoholScene: combinedScene, 
            time, 
            startTime: mode === 'session' ? startTime : undefined, 
            endTime: mode === 'session' ? time : undefined, 
            ongoing: false 
        });
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

                {/* 摄入总量仪表盘 - 统一深色样式 */}
                <div className="mx-2 mb-4 bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shrink-0 shadow-lg border border-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">当前摄入纯酒精</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-amber-400 tabular-nums">{totalGrams}</span>
                                <span className="text-sm font-bold text-amber-400/60">g</span>
                            </div>
                        </div>
                        {prediction && (
                            <div className="text-right bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-[9px] text-slate-400 font-black uppercase mb-1">预测次日状态</div>
                                <div className={`text-xl font-black ${prediction.predicted >= 4 ? 'text-emerald-400' : prediction.predicted >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{prediction.predicted}级</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 核心设置区 */}
                <div className="mx-2 mb-4 space-y-5 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-6 items-center">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12}/> {mode === 'sip' ? '饮用时间' : '结束时间'}</span>
                            <div className="flex items-center gap-2">
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-transparent text-2xl font-mono font-black text-brand-text dark:text-slate-100 outline-none" />
                                {isLate && <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg" title="熬夜警报"><Moon size={14} fill="currentColor"/></span>}
                            </div>
                        </div>
                        {mode === 'session' && (
                            <div className="flex-1 flex flex-col border-l border-slate-200 dark:border-slate-700 pl-6">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">持续时长 (分)</span>
                                <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||0)} className="bg-transparent text-2xl font-mono font-black text-brand-text dark:text-slate-100 outline-none w-full" />
                            </div>
                        )}
                    </div>

                    {/* 三维场景选择器 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg shrink-0"><Users size={12}/></div>
                            {SCENE_OPTIONS.with.map(s => (
                                <button key={s} onClick={() => setDrinkWith(s)} className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${drinkWith === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{s}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-lg shrink-0"><MapPin size={12}/></div>
                            {SCENE_OPTIONS.location.map(s => (
                                <button key={s} onClick={() => setDrinkLoc(s)} className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${drinkLoc === s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{s}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-lg shrink-0"><Target size={12}/></div>
                            {SCENE_OPTIONS.purpose.map(s => (
                                <button key={s} onClick={() => setDrinkPurpose(s)} className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${drinkPurpose === s ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* 醉酒程度 */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {DRUNK_LEVELS.map(lvl => (
                            <button key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} className={`flex flex-col items-center py-2.5 rounded-2xl transition-all border-2 ${drunkLevel === lvl.id ? 'bg-white dark:bg-slate-700 border-amber-400 shadow-sm ring-2 ring-amber-500/10' : 'bg-transparent border-transparent opacity-40 hover:opacity-100'}`}>
                                <span className="text-xl mb-1">{lvl.emoji}</span>
                                <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{lvl.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 酒水列表与详情调节 */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="space-y-3 pb-8">
                        {PRESET_DRINKS.map(drink => {
                            const data = selectedItems[drink.key];
                            const isSelected = !!data;
                            
                            return (
                                <div key={drink.key} className={`rounded-3xl border-2 transition-all overflow-hidden ${isSelected ? 'border-amber-400 bg-white dark:bg-slate-800 shadow-md' : 'border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-900/50 hover:border-slate-200'}`}>
                                    <div className="p-4 flex items-center justify-between" onClick={() => !isSelected && handleItemChange(drink.key, 1)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                {drink.icon}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-black text-slate-800 dark:text-slate-100">{drink.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">{drink.volume}ml · {drink.abv}%</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            {isSelected ? (
                                                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                                    <button onClick={() => handleItemChange(drink.key, -1)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"><Minus size={14} strokeWidth={3}/></button>
                                                    <span className="text-sm font-black w-4 text-center">{data.count}</span>
                                                    <button onClick={() => handleItemChange(drink.key, 1)} className="p-1.5 text-amber-600"><Plus size={14} strokeWidth={3}/></button>
                                                </div>
                                            ) : (
                                                <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-300 group-hover:text-amber-500 transition-colors">
                                                    <Plus size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 选中后展开的手动调节区 */}
                                    {isSelected && (
                                        <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">酒精度 %</span>
                                                    <span className="text-xs font-black text-amber-600">{data.abv}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="range" min="0" max="75" step="0.5"
                                                        value={data.abv}
                                                        onChange={e => updateItemDetails(drink.key, 'abv', parseFloat(e.target.value))}
                                                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-amber-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">单份 ml</span>
                                                    <span className="text-xs font-black text-amber-600">{data.vol}ml</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="range" min="10" max="1000" step="10"
                                                        value={data.vol}
                                                        onChange={e => updateItemDetails(drink.key, 'vol', parseInt(e.target.value))}
                                                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-amber-500"
                                                    />
                                                </div>
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
