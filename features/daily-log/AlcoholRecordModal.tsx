import React, { useState, useEffect, useMemo } from 'react';
import { Minus, Plus, Trash2, Users, MapPin, Target, ChevronDown, ChevronUp, ChevronRight, Beer, Sparkles } from 'lucide-react';
import { Modal } from '../../shared/ui';
import type { AlcoholRecord, AlcoholItem, DrunkLevel } from '../../domain';
import { DRINK_TYPES, getPrediction, calculatePureAlcohol } from '../../utils/alcoholHelpers';

interface AlcoholRecordModalData {
    initialData?: AlcoholRecord;
}

interface AlcoholRecordModalActions {
    onSave: (record: AlcoholRecord) => void;
}

interface AlcoholRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AlcoholRecordModalData;
    actions: AlcoholRecordModalActions;
    onSwitchToOther?: () => void;
}

const DRUNK_LEVELS: { id: DrunkLevel, label: string, emoji: string }[] = [
    { id: 'none', label: '没感觉', emoji: '😐' },
    { id: 'tipsy', label: '微醺', emoji: '☺️' },
    { id: 'drunk', label: '醉酒', emoji: '🥴' },
    { id: 'wasted', label: '断片', emoji: '🤮' },
];

const SCENE_OPTIONS = {
    where: { label: '1. 哪里喝的？', icon: MapPin, options: ['家', '饭店/餐厅', '酒吧/KTV', '大排档', '办公室', '户外'], activeColor: 'bg-chart-tertiary border-chart-tertiary' },
    who: { label: '2. 和谁喝的？', icon: Users, options: ['独自', '朋友', '伴侣', '同事/客户', '家人'], activeColor: 'bg-state-info-text border-state-info-text' },
    why: { label: '3. 为什么喝？', icon: Target, options: ['放松', '聚会', '应酬', '助兴', '借酒浇愁', '庆祝'], activeColor: 'bg-state-success-text border-state-success-text' }
};

const AlcoholRecordModal: React.FC<AlcoholRecordModalProps> = ({ isOpen, onClose, data, actions, onSwitchToOther }) => {
    const { initialData } = data;
    const { onSave } = actions;

    const [step, setStep] = useState<0 | 1>(0);
    const [selectedItems, setSelectedItems] = useState<Record<string, { count: number, abv: number, vol: number }>>({});
    const [drunkLevel, setDrunkLevel] = useState<DrunkLevel>('none');
    const [time, setTime] = useState<string>(() => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
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
                setTime(initialData.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
                setDuration(initialData.durationMinutes || 60);
                setMode(initialData.ongoing || initialData.startTime ? 'session' : 'sip');
                if (initialData.alcoholScene) {
                    const parts = initialData.alcoholScene.split(' | ');
                    if (parts.length >= 3) { setDrinkWhere(parts[0]); setDrinkWith(parts[1]); setDrinkWhy(parts[2]); }
                }
            } else {
                setSelectedItems({}); setDrunkLevel('none'); setDrinkWhere(''); setDrinkWith(''); setDrinkWhy('');
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
        const sceneStr = [drinkWhere, drinkWith, drinkWhy].filter(Boolean).join(' | ');
        onSave({
            id: initialData?.id || Date.now().toString(),
            totalGrams,
            durationMinutes: mode === 'sip' ? 10 : duration,
            items, isLate, drunkLevel,
            alcoholScene: sceneStr,
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
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} disabled={totalGrams === 0} className="flex-[2] py-4 bg-state-warning-text disabled:opacity-50 text-text-on-accent font-black rounded-2xl shadow-glow flex items-center justify-center active:scale-95 transition-all">
                                下一步：总结场景 <ChevronRight size={20} className="ml-2" />
                            </button>
                            <button onClick={handleSave} disabled={totalGrams === 0} className="flex-1 py-4 bg-surface-muted disabled:opacity-50 text-text-secondary font-bold rounded-2xl">
                                直接保存
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={() => setStep(0)} className="flex-1 py-4 bg-surface-muted text-text-muted font-bold rounded-2xl">修改饮品</button>
                            <button onClick={handleSave} className="flex-[2] py-4 bg-state-warning-text text-text-on-accent font-black rounded-2xl shadow-glow flex items-center justify-center active:scale-95">确认保存</button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-4 -mt-4 bg-surface-card overflow-hidden">
                {onSwitchToOther && (
                    <div className="flex p-1 mx-4 mt-3 bg-surface-muted rounded-2xl border border-surface-border shrink-0">
                        <button className="flex-1 py-2 text-xs font-black rounded-xl bg-surface-card text-state-warning-text shadow-soft">饮酒</button>
                        <button onClick={onSwitchToOther} className="flex-1 py-2 text-xs font-black rounded-xl text-text-muted transition-colors">提神饮品</button>
                    </div>
                )}
                <div className="px-6 py-6 bg-surface-muted border-b border-surface-border relative shrink-0">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface-card rounded-2xl border border-surface-border shadow-soft">
                                <Beer size={32} className="text-state-warning-text" />
                            </div>
                            <div>
                                <div className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">酒精摄入总量</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-state-warning-text tabular-nums">{totalGrams}</span>
                                    <span className="text-sm font-bold text-text-muted">克</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-text-muted font-black uppercase mb-1">预测状态</div>
                            <div className="text-3xl font-black text-state-warning-text">{prediction.predicted}级</div>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                aria-label="饮酒时间"
                                className="bg-transparent text-[11px] text-text-muted font-mono font-bold outline-none text-right min-h-[32px] cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6">
                    {step === 0 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-slow">
                            <div className="flex p-1 bg-surface-muted rounded-2xl border border-surface-border">
                                <button onClick={() => setMode('session')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'session' ? 'bg-surface-card text-state-warning-text shadow-soft' : 'text-text-muted'}`}>持续性饮酒</button>
                                <button onClick={() => setMode('sip')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'sip' ? 'bg-surface-card text-state-warning-text shadow-soft' : 'text-text-muted'}`}>一口/一杯</button>
                            </div>

                            {Object.keys(selectedItems).length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-text-muted uppercase px-1">已添加清单 (可微调毫升/精度)</h4>
                                    {/* Fix: Explicitly type item to avoid 'unknown' errors */}
                                    {(Object.entries(selectedItems) as [string, { count: number, abv: number, vol: number }][]).map(([key, item]) => {
                                        const preset = DRINK_TYPES.find(d => d.key === key);
                                        const isExp = expandedKey === key;
                                        return (
                                            <div key={key} className={`rounded-3xl border transition-all ${isExp ? 'bg-surface-card border-state-warning-text/50 shadow-soft' : 'bg-surface-muted border-surface-border'}`}>
                                                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedKey(isExp ? null : key)}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-2xl">{preset?.icon}</div>
                                                        <div>
                                                            <div className="text-sm font-black text-text-primary flex items-center gap-1">{preset?.name} {isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</div>
                                                            <div className="text-[10px] text-text-muted font-bold">{item.vol}毫升 · {item.abv}% 浓度</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-surface-base p-1.5 rounded-xl border border-surface-border shadow-inner">
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count - 1); }} className="p-1.5 text-text-muted hover:text-state-danger-text transition-colors"><Minus size={16} strokeWidth={3}/></button>
                                                        <span className="text-lg font-black text-text-primary w-5 text-center tabular-nums">{item.count}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemValue(key, 'count', item.count + 1); }} className="p-1.5 text-state-warning-text hover:text-state-warning-text/80 transition-colors"><Plus size={16} strokeWidth={3}/></button>
                                                    </div>
                                                </div>
                                                {isExp && (
                                                    <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-[10px] font-black uppercase text-text-muted"><span>单杯毫升 (ml)</span><span className="text-state-warning-text">{item.vol}ml</span></div>
                                                            <input type="range" min="10" max="2000" step="10" value={item.vol} onChange={e => updateItemValue(key, 'vol', parseInt(e.target.value))} className="w-full h-1.5 bg-surface-border rounded-full appearance-none accent-accent" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-[10px] font-black uppercase text-text-muted"><span>酒精浓度 (ABV)</span><span className="text-state-danger-text">{item.abv}%</span></div>
                                                            <input type="range" min="0" max="75" step="0.5" value={item.abv} onChange={e => updateItemValue(key, 'abv', parseFloat(e.target.value))} className="w-full h-1.5 bg-surface-border rounded-full appearance-none accent-accent" />
                                                        </div>
                                                        <button onClick={() => updateItemValue(key, 'count', 0)} className="w-full py-2 text-[10px] font-bold text-state-danger-text flex items-center justify-center gap-1"><Trash2 size={12}/> 移除此项</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="space-y-4 pb-10">
                                <h4 className="text-[11px] font-black text-text-muted uppercase px-1">点击添加酒类</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {DRINK_TYPES.map(drink => (
                                        <button 
                                            key={drink.key} 
                                            onClick={() => { setSelectedItems(prev => ({ ...prev, [drink.key]: { count: (prev[drink.key]?.count || 0) + 1, abv: prev[drink.key]?.abv || drink.abv, vol: prev[drink.key]?.vol || drink.volume } })); setExpandedKey(drink.key); }} 
                                            className="bg-surface-muted border border-surface-border p-4 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all hover:border-state-warning-text/30"
                                        >
                                            <div className="text-3xl">{drink.icon}</div>
                                            <div className="text-left">
                                                <div className="text-[13px] font-black text-text-primary">{drink.name}</div>
                                                <div className="text-[10px] text-text-muted font-bold mt-0.5">{drink.abv}% · {drink.volume}ml</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-slow">
                            {Object.entries(SCENE_OPTIONS).map(([key, dim]) => {
                                const state = key === 'where' ? drinkWhere : key === 'who' ? drinkWith : drinkWhy;
                                const setter = key === 'where' ? setDrinkWhere : key === 'who' ? setDrinkWith : setDrinkWhy;
                                return (
                                    <div key={key} className="space-y-4">
                                        <div className="flex items-center gap-2 text-text-muted px-1">
                                            <dim.icon size={14} /><h4 className="text-[11px] font-black uppercase tracking-widest">{dim.label}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {dim.options.map(opt => (
                                                <button 
                                                    key={opt} onClick={() => setter(opt)} 
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${state === opt ? dim.activeColor + ' text-text-on-accent shadow-soft scale-105' : 'bg-surface-muted text-text-muted border-surface-border'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="space-y-5 pt-4 border-t border-surface-border">
                                <h4 className="text-[11px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2"><Sparkles size={14} /> 4. 醉到什么程度？</h4>
                                <div className="grid grid-cols-4 gap-3 pb-10">
                                    {DRUNK_LEVELS.map(lvl => (
                                        <button 
                                            key={lvl.id} onClick={() => setDrunkLevel(lvl.id)} 
                                            className={`flex flex-col items-center py-5 rounded-[2.5rem] transition-all border-2 ${drunkLevel === lvl.id ? 'bg-surface-card border-state-warning-text shadow-glow scale-105' : 'bg-surface-muted border-transparent opacity-60'}`}
                                        >
                                            <span className="text-3xl mb-2">{lvl.emoji}</span>
                                            <span className={`text-[10px] font-black ${drunkLevel === lvl.id ? 'text-state-warning-text' : 'text-text-muted'}`}>{lvl.label}</span>
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
