import React, { useState, useEffect, useMemo } from 'react';
/* Added missing ChevronRight import */
import { Check, Minus, Plus, Moon, Clock, GlassWater, Trash2, Users, MapPin, Target, ChevronDown, ChevronUp, ChevronRight, Beer, Sparkles, LayoutGrid } from 'lucide-react';
import Modal from './Modal';
import { AlcoholRecord, AlcoholItem, DrunkLevel } from '../types';
import { DRINK_TYPES, getPrediction, calculatePureAlcohol } from '../utils/alcoholHelpers';
import { useData } from '../contexts/DataContext';

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
    where: { label: '1. 哪里喝的？ (WHERE)', icon: MapPin, options: ['家', '烧烤摊', '大排档', '饭店', '餐厅', '酒吧', 'KTV', '夜店', '公司', '户外'] },
    who: { label: '2. 和谁喝的？ (WHO)', icon: Users, options: ['独自', '朋友', '伴侣', '同事', '客户', '家人', '同学'] },
    why: { label: '3. 为什么喝？ (WHY)', icon: Target, options: ['放松', '应酬', '聚会', '助兴', '借酒浇愁', '庆祝', '品鉴'] }
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { cancelAlcoholRecord } = useData();
    
    // UI State: 0 = List (Screenshot 3), 1 = Summary (Screenshot 4)
    const [step, setStep] = useState<0 | 1>(0);
    const [selectedItems, setSelectedItems] = useState<Record<string, { count: number, abv: number, vol: number }>>({});
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [time, setTime] = useState<string>('20:00');
    const [duration, setDuration] = useState(60);
    const [mode, setMode] = useState<'sip' | 'session'>('sip');
    
    // Scene State
    const [drinkWhere, setDrinkWhere] = useState('家');
    const [drinkWith, setDrinkWith] = useState('独自');
    const [drinkWhy, setDrinkWhy] = useState('放松');
    const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            setExpandedItemKey(null);
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
                    if (parts.length >= 3) {
                        setDrinkWhere(parts[0]);
                        setDrinkWith(parts[1]);
                        setDrinkWhy(parts[2]);
                    }
                }
            } else {
                setSelectedItems({});
                setDrunkLevel('none');
                setDrinkWhere('家');
                setDrinkWith('独自');
                setDrinkWhy('放松');
                setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setMode('sip');
            }
        }
    }, [isOpen, initialData]);

    const totalGrams = useMemo(() => {
        let sum = 0;
        Object.entries(selectedItems).forEach(([_, d]) => { sum += calculatePureAlcohol(d.vol, d.abv) * d.count; });
        return Math.round(sum * 10) / 10;
    }, [selectedItems]);

    const prediction = useMemo(() => getPrediction(totalGrams), [totalGrams]);

    const handleQuickAdd = (key: string) => {
        setSelectedItems(prev => {
            const current = prev[key];
            const preset = DRINK_TYPES.find(d => d.key === key);
            if (!preset) return prev;
            return {
                ...prev,
                [key]: {
                    count: (current?.count || 0) + 1,
                    abv: current?.abv || preset.abv,
                    vol: current?.vol || preset.volume
                }
            };
        });
        if (!selectedItems[key]) setExpandedItemKey(key);
    };

    const updateItemValue = (key: string, field: 'abv' | 'vol' | 'count', val: number) => {
        setSelectedItems(prev => {
            const next = { ...prev, [key]: { ...prev[key], [field]: val } };
            if (field === 'count' && val <= 0) {
                delete next[key];
                if (expandedItemKey === key) setExpandedItemKey(null);
            }
            return next;
        });
    };

    const handleConfirm = () => {
        const items: AlcoholItem[] = Object.entries(selectedItems).map(([key, val]) => ({
            key,
            name: DRINK_TYPES.find(d => d.key === key)?.name || '未知',
            volume: val.vol,
            abv: val.abv,
            count: val.count,
            pureAlcohol: calculatePureAlcohol(val.vol, val.abv)
        }));

        const combinedScene = `${drinkWhere} | ${drinkWith} | ${drinkWhy}`;
        const isLate = parseInt(time.split(':')[0]) < 5;

        onSave({
            totalGrams,
            durationMinutes: mode === 'sip' ? 10 : duration,
            items,
            isLate,
            drunkLevel,
            alcoholScene: combinedScene,
            time,
            ongoing: false
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
                <div className="flex gap-3 w-full">
                    {step === 0 ? (
                        <button 
                            onClick={() => setStep(1)} 
                            disabled={totalGrams === 0}
                            className="flex-1 py-4 bg-amber-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all"
                        >
                            下一步：总结场景 <ChevronRight size={20} className="ml-2" />
                        </button>
                    ) : (
                        <div className="flex flex-col w-full gap-3">
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setStep(0)} className="flex-1 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700">修改饮品</button>
                                <button onClick={handleConfirm} className="flex-[1.5] py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all">确认保存</button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-4 -mt-4 bg-[#0a0f1d]">
                {/* 1. 顶部黑色仪表盘 (Screenshot 3/4 Header) */}
                <div className="px-6 py-6 bg-[#0f172a] text-white border-b border-white/5 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                <Beer size={32} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">酒精摄入总量</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-amber-400 tabular-nums">{totalGrams}</span>
                                    <span className="text-sm font-bold text-slate-500">g</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 font-black uppercase mb-1">预测状态</div>
                            <div className="text-2xl font-black text-amber-500">{prediction.predicted}级</div>
                            <div className="text-[10px] text-slate-600 font-mono">{time} - {mode === 'session' ? `${duration}m` : '小酌'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6">
                    {step === 0 ? (
                        /* 清单录入视图 (Screenshot 3) */
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* 模式选择 */}
                            <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
                                <button onClick={() => setMode('session')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'session' ? 'bg-[#1e293b] text-amber-400 shadow-md' : 'text-slate-500'}`}>持续性饮酒</button>
                                <button onClick={() => setMode('sip')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'sip' ? 'bg-[#1e293b] text-amber-400 shadow-md' : 'text-slate-500'}`}>一口/一杯</button>
                            </div>

                            {/* 已添加列表 */}
                            {Object.keys(selectedItems).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">已添加 ({Object.keys(selectedItems).length})</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(selectedItems).map(([key, item]) => {
                                            const preset = DRINK_TYPES.find(d => d.key === key);
                                            const isExpanded = expandedItemKey === key;
                                            return (
                                                <div key={key} className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-[#1e293b] border-amber-500/50 shadow-xl' : 'bg-slate-900 border-slate-800'}`}>
                                                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedItemKey(isExpanded ? null : key)}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner">{preset?.icon}</div>
                                                            <div>
                                                                <div className="text-sm font-black text-slate-100 flex items-center gap-1">
                                                                    {preset?.name} {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 font-bold">{item.vol}ml · {item.abv}% ABV</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 bg-slate-950/50 p-1 rounded-xl border border-white/5">
                                                            <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count - 1); }} className="p-2 text-slate-400 hover:text-red-500"><Minus size={16} strokeWidth={3} /></button>
                                                            <span className="text-lg font-black text-white w-6 text-center tabular-nums">{item.count}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count + 1); }} className="p-2 text-amber-500"><Plus size={16} strokeWidth={3} /></button>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-top-2">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>单杯精确容量</span><span className="text-amber-500">{item.vol}ml</span></div>
                                                                <input type="range" min="10" max="1000" step="10" value={item.vol} onChange={e => updateItemValue(key, 'vol', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-amber-500" />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>酒精浓度 (ABV)</span><span className="text-red-400">{item.abv}%</span></div>
                                                                <input type="range" min="0" max="70" step="0.5" value={item.abv} onChange={e => updateItemValue(key, 'abv', parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-amber-500" />
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', 0); }} className="w-full py-2.5 text-[10px] font-bold text-red-400 flex items-center justify-center gap-1 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={12} /> 移除此项</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 快速加酒网格 */}
                            <div className="space-y-4 pb-12">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">快速加酒 (点击添加)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {DRINK_TYPES.map(drink => (
                                        <button 
                                            key={drink.key} onClick={() => handleQuickAdd(drink.key)}
                                            className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:border-amber-500/30 group"
                                        >
                                            <div className="text-3xl group-hover:scale-110 transition-transform">{drink.icon}</div>
                                            <div className="text-center">
                                                <div className="text-[11px] font-black text-slate-200">{drink.name}</div>
                                                <div className="text-[9px] text-slate-500 font-bold mt-0.5">{drink.volume}ml</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 场景总结视图 (Screenshot 4) */
                        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* 时间设定 */}
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-900 p-4 rounded-3xl border border-slate-800">
                                    <label className="text-[10px] text-slate-500 font-black uppercase mb-1 block">饮用时间</label>
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-transparent text-2xl font-black text-white outline-none w-full tabular-nums" />
                                </div>
                                {mode === 'session' && (
                                    <div className="flex-1 bg-slate-900 p-4 rounded-3xl border border-slate-800">
                                        <label className="text-[10px] text-slate-500 font-black uppercase mb-1 block">总时长 (min)</label>
                                        <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||0)} className="bg-transparent text-2xl font-black text-white outline-none w-full tabular-nums" />
                                    </div>
                                )}
                            </div>

                            {/* 场景维度 */}
                            {Object.entries(SCENE_OPTIONS).map(([key, dim]) => {
                                const state = key === 'where' ? drinkWhere : key === 'who' ? drinkWith : drinkWhy;
                                const setter = key === 'where' ? setDrinkWhere : key === 'who' ? setDrinkWith : setDrinkWhy;
                                return (
                                    <div key={key} className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500 px-1">
                                            <dim.icon size={14} />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest">{dim.label}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {dim.options.map(opt => (
                                                <button 
                                                    key={opt} onClick={() => setter(opt)}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${state === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 醉酒程度 */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2"><Sparkles size={14} /> 4. 醉到什么程度？</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {DRUNK_LEVELS.map(lvl => (
                                        <button 
                                            key={lvl.id} onClick={() => setDrunkLevel(lvl.id)}
                                            className={`flex flex-col items-center py-5 rounded-[2rem] transition-all border-2 ${drunkLevel === lvl.id ? 'bg-[#1e293b] border-amber-500 shadow-xl scale-105' : 'bg-slate-900 border-transparent opacity-60'}`}
                                        >
                                            <span className="text-3xl mb-2">{lvl.emoji}</span>
                                            <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-amber-500' : 'text-slate-500'}`}>{lvl.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pb-12 px-1">
                                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0"><Moon size={16} /></div>
                                    <div>
                                        <h5 className="text-xs font-black text-amber-500 mb-1">小助手提醒</h5>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">本次摄入的 {totalGrams}g 酒精约会在 {Math.ceil(totalGrams/7)} 小时内代谢完成。建议睡前多喝水以减轻次日身体压力。</p>
                                    </div>
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