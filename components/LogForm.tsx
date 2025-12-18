
import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, ChangeDetail, ChangeRecord, AlcoholRecord, PartnerProfile, MorningRecord, SleepRecord, CaffeineRecord, CaffeineItem } from '../types';
import { CheckSquare, Tag, Beer, Film, Dumbbell, Sun, Cloud, CloudRain, Snowflake, Wind, CloudFog, Home, Users, Hotel, Plane, MapPin, Shirt, HeartPulse, Hand, Plus, Edit2, Trash2, Footprints, Save, Coffee, Calendar, X, Zap, Check, Sparkles, Settings, List, ChevronRight, ShoppingCart, Timer, CupSoda, Leaf, Flame } from 'lucide-react';
import Modal from './Modal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal'; 
import NapRecordModal from './NapRecordModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import { generateLogSummary, getTodayDateString, calculateLogDiff, calculateDataQuality } from '../utils/helpers';
import { validateLogEntry } from '../utils/validators';
import { useToast } from '../contexts/ToastContext';
import { hydrateLog } from '../utils/hydrateLog';

// Modular Components
import { IconToggleButton } from './FormControls';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import HealthSection from './HealthSection';
import { TagType } from './TagManager';

// Lazy Load
const TagManager = lazy(() => import('./TagManager'));

// --- Caffeine Menu Config ---
const CAFFEINE_MENU = [
    {
        category: '咖啡 (Coffee)',
        icon: Coffee,
        items: [
            { name: '美式咖啡', vol: 350, emoji: '☕' },
            { name: '拿铁', vol: 350, emoji: '🥛' },
            { name: '意式浓缩', vol: 30, emoji: '⚡' },
            { name: '冷萃', vol: 300, emoji: '🧊' },
            { name: '手冲咖啡', vol: 250, emoji: '🍯' },
            { name: '速溶咖啡', vol: 200, emoji: '🎒' }
        ]
    },
    {
        category: '茶饮 (Tea)',
        icon: Leaf,
        items: [
            { name: '绿茶', vol: 300, emoji: '🍵' },
            { name: '红茶', vol: 300, emoji: '🍂' },
            { name: '乌龙茶', vol: 300, emoji: '🪵' },
            { name: '奶茶', vol: 500, emoji: '🧋' },
            { name: '普洱/浓茶', vol: 200, emoji: '🗿' },
            { name: '抹茶', vol: 150, emoji: '🍀' }
        ]
    },
    {
        category: '功能/软饮 (Energy)',
        icon: CupSoda,
        items: [
            { name: '红牛', vol: 250, emoji: '🐂' },
            { name: '魔爪', vol: 500, emoji: 'Ⓜ️' },
            { name: '可乐', vol: 330, emoji: '🥤' },
            { name: '氮泵', vol: 250, emoji: '🔥' },
            { name: '乐虎', vol: 250, emoji: '🐯' }
        ]
    }
];

const PORN_OPTS = [{value: 'none', label: '无'}, {value: 'low', label: '少量'}, {value: 'medium', label: '适量'}, {value: 'high', label: '沉迷'}];
const WEATHER_OPTS = [{value: 'sunny', label: '晴'}, {value: 'cloudy', label: '多云'}, {value: 'rainy', label: '雨'}, {value: 'snowy', label: '雪'}, {value: 'windy', label: '大风'}, {value: 'foggy', label: '雾'}];
const LOCATION_OPTS = [{value: 'home', label: '家'}, {value: 'partner', label: '伴侣家'}, {value: 'hotel', label: '酒店'}, {value: 'travel', label: '旅途'}, {value: 'other', label: '其他'}];
const ATTIRE_OPTS = [{value: 'naked', label: '裸睡'}, {value: 'light', label: '内衣'}, {value: 'pajamas', label: '睡衣'}, {value: 'other', label: '其他'}];
const EVENT_PRESETS = ['加班', '吵架', '出差', '聚会', '家庭烦心事', '生病'];

const QualityRing = ({ score }: { score: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const isPerfect = score === 100;

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            {isPerfect && (
                <div className="absolute inset-0 animate-pulse text-yellow-400 pointer-events-none">
                    <Sparkles size={12} className="absolute -top-1 -right-1 animate-bounce" style={{animationDelay: '0.1s'}}/>
                    <Sparkles size={10} className="absolute bottom-0 -left-1 animate-bounce" style={{animationDelay: '0.3s'}}/>
                </div>
            )}
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${isPerfect ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' : score >= 80 ? 'text-green-500' : score >= 60 ? 'text-blue-500' : 'text-orange-500'}`} />
            </svg>
            <span className={`absolute text-[10px] font-black ${isPerfect ? 'text-yellow-500 scale-110' : 'text-slate-600 dark:text-slate-300'} transition-transform`}>{score}</span>
        </div>
    );
};

const CardSection: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode, className?: string }> = ({ title, icon: Icon, children, className }) => (
    <div className={`bg-brand-card dark:bg-slate-900 rounded-card p-5 shadow-soft border border-slate-100 dark:border-slate-800 ${className}`}>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg mr-2 text-brand-muted">
                <Icon size={16} />
            </div>
            {title}
        </h3>
        {children}
    </div>
);

const LogForm: React.FC<{
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[]; 
  partners?: PartnerProfile[];
}> = ({ onSave, existingLog, logDate, onDirtyStateChange, logs, partners = [] }) => {
    const { showToast } = useToast();
    const initializeLog = (baseData: LogEntry | null): LogEntry => {
        const date = logDate || baseData?.date || getTodayDateString();
        const base = baseData ? { ...baseData } : { date };
        return hydrateLog(base);
    };

    const [log, setLog] = useState<LogEntry>(() => initializeLog(existingLog));
    const [activeDetailTab, setActiveDetailTab] = useState<'lifestyle' | 'environment' | 'health'>('lifestyle');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<Array<{ label: string, value: string }>>([]);
    const [eventInput, setEventInput] = useState('');
    
    // Tag Manager State
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [tagManagerMode, setTagManagerMode] = useState<TagType>('xp');
    const [tagSearch, setTagSearch] = useState('');

    // Modals
    const [isSexModalOpen, setIsSexModalOpen] = useState(false);
    const [editingSexRecord, setEditingSexRecord] = useState<SexRecordDetails | undefined>(undefined);
    const [isMbModalOpen, setIsMbModalOpen] = useState(false);
    const [editingMbRecord, setEditingMbRecord] = useState<MasturbationRecordDetails | undefined>(undefined);
    const [isNapModalOpen, setIsNapModalOpen] = useState(false);
    const [editingNapRecord, setEditingNapRecord] = useState<NapRecord | undefined>(undefined);
    const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [editingExerciseRecord, setEditingExerciseRecord] = useState<ExerciseRecord | undefined>(undefined);

    const [isAddingCaffeine, setIsAddingCaffeine] = useState(false);
    const [activeCaffeineCat, setActiveCaffeineCat] = useState(0);

    const initialLogState = useRef(JSON.stringify(log));
    const qualityScore = calculateDataQuality(log);

    useEffect(() => {
        const freshLog = initializeLog(existingLog);
        const currentString = JSON.stringify(log);
        const initialString = initialLogState.current;
        if (log.date !== freshLog.date) {
            setLog(freshLog);
            initialLogState.current = JSON.stringify(freshLog);
            return;
        }
        if (currentString === initialString && JSON.stringify(freshLog) !== initialString) {
            setLog(freshLog);
            initialLogState.current = JSON.stringify(freshLog);
        }
    }, [existingLog, logDate]);

    useEffect(() => { onDirtyStateChange(JSON.stringify(log) !== initialLogState.current); }, [log, onDirtyStateChange]);

    const handleChange = (field: keyof LogEntry, value: any) => setLog(prev => ({ ...prev, [field]: value }));
    const handleDeepChange = (parent: keyof LogEntry, field: string, value: any) => setLog(prev => ({ ...prev, [parent]: { ...((prev[parent] as any) || {}), [field]: value } }));
    const handleMorningChange = (field: keyof MorningRecord, value: any) => setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } }));
    const handleSleepChange = (field: keyof SleepRecord, value: any) => setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
    
    const handleSaveAlcohol = (record: AlcoholRecord) => {
        const alcoholLevel = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';
        setLog(prev => ({ ...prev, alcoholRecord: record, alcohol: alcoholLevel }));
    };

    const addCaffeine = (item: { name: string, vol: number }) => {
        const id = Date.now().toString();
        const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const newItem: CaffeineItem = { id, name: item.name, time: nowStr, count: 1, volume: item.vol };
        
        setLog(prev => {
            const current = prev.caffeineRecord || { totalCount: 0, items: [] };
            const newItems = [...current.items, newItem];
            const totalCount = newItems.reduce((acc, i) => acc + i.count, 0);
            return { 
                ...prev, 
                caffeineRecord: { totalCount, items: newItems }, 
                caffeineIntake: totalCount > 3 ? 'high' : totalCount > 1 ? 'medium' : totalCount > 0 ? 'low' : 'none' 
            };
        });
        showToast(`已添加: ${item.name}`, 'info');
    };

    const removeCaffeine = (id: string) => {
        setLog(prev => {
            const current = prev.caffeineRecord || { totalCount: 0, items: [] };
            const newItems = current.items.filter(i => i.id !== id);
            const totalCount = newItems.reduce((acc, i) => acc + i.count, 0);
            return { ...prev, caffeineRecord: { totalCount, items: newItems } };
        });
    };

    const handleReview = () => {
        const { valid, errors } = validateLogEntry(log as LogEntry);
        if (!valid) { showToast(errors[0], 'error'); return; }
        setSummaryData(generateLogSummary(log));
        setIsSummaryModalOpen(true);
    };

    const handleConfirmSave = () => {
        const { valid, errors } = validateLogEntry(log as LogEntry);
        if (!valid) { showToast(errors[0], 'error'); return; }
        let diffs: ChangeDetail[] = existingLog ? calculateLogDiff(existingLog, log) : [{ field: '记录', oldValue: '无', newValue: '新创建' }];
        const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: existingLog ? '更新详细记录' : '完成详细记录', details: diffs, type: 'manual' };
        onSave({ ...log, status: 'completed', changeHistory: [...(log.changeHistory || []), historyEntry] } as LogEntry);
    }
    
    const handleSaveDraft = () => {
        const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '保存草稿 (部分记录)', details: [], type: 'manual' };
        onSave({ ...log, status: 'pending', changeHistory: [...(log.changeHistory || []), historyEntry] } as LogEntry);
    };

    const handleSaveRecord = (type: 'sex' | 'masturbation' | 'exercise', record: any) => {
        setLog(prev => {
            const list = prev[type] || [];
            const idx = list.findIndex((r: any) => r.id === record.id);
            const newList = idx >= 0 ? [...list] : [...list, record];
            if (idx >= 0) newList[idx] = record;
            return { ...prev, [type]: newList };
        });
    };

    const handleSaveNap = (record: NapRecord) => {
        setLog(prev => {
            const list = prev.sleep?.naps || [];
            const idx = list.findIndex((r: any) => r.id === record.id);
            const newList = idx >= 0 ? [...list] : [...list, record];
            if (idx >= 0) newList[idx] = record;
            return { ...prev, sleep: { ...prev.sleep!, naps: newList } };
        });
    };

    const deleteRecord = (type: 'sex' | 'masturbation' | 'exercise' | 'naps', id: string) => {
        if(confirm('删除此记录?')) {
            if (type === 'naps') setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, naps: prev.sleep?.naps.filter(n => n.id !== id) || [] } }));
            else setLog(prev => ({ ...prev, [type]: (prev[type] as any[]).filter(r => r.id !== id) }));
        }
    };

    const toggleEvent = (evt: string) => {
        const events = log.dailyEvents || [];
        const next = events.includes(evt) ? events.filter(e => e !== evt) : [...events, evt];
        handleChange('dailyEvents', next);
    };

    const handleManageTags = (type: TagType, initialSearch = '') => {
        setTagManagerMode(type);
        setTagSearch(initialSearch);
        setIsTagManagerOpen(true);
    };

    const handleTagSelect = (tag: string) => {
        if (tagManagerMode === 'event') {
            toggleEvent(tag);
        } else if (tagManagerMode === 'symptom') {
            const current = log.health?.symptoms || [];
            if (!current.includes(tag)) {
                handleDeepChange('health', 'symptoms', [...current, tag]);
            }
        }
        setIsTagManagerOpen(false);
    };

    if (!log.date) return <div>Loading...</div>;

    const renderWeatherIcon = (v: string) => v === 'sunny' ? <Sun size={20}/> : v === 'cloudy' ? <Cloud size={20}/> : v === 'rainy' ? <CloudRain size={20}/> : v === 'snowy' ? <Snowflake size={20}/> : v === 'windy' ? <Wind size={20}/> : <CloudFog size={20}/>;
    const renderLocationIcon = (v: string) => v === 'home' ? <Home size={20}/> : v === 'partner' ? <Users size={20}/> : v === 'hotel' ? <Hotel size={20}/> : v === 'travel' ? <Plane size={20}/> : <MapPin size={20}/>;
    const renderAttireIcon = (v: string) => <Shirt size={20}/>; 

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleReview(); }} className="space-y-6 pb-24 relative">
             {/* Date Header with Quality Score */}
             <div className="flex justify-between items-center bg-brand-card dark:bg-slate-900 py-3 px-5 rounded-card shadow-soft border border-slate-100 dark:border-slate-800">
                 <p className="text-xl font-black text-brand-text dark:text-slate-200 tracking-tight">
                     {new Date(log.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                 </p>
                 <div className="flex items-center gap-3">
                     <div className="text-right">
                         <span className="block text-[10px] text-brand-muted font-bold uppercase tracking-wider">Quality Score</span>
                     </div>
                     <QualityRing score={qualityScore} />
                 </div>
             </div>

            <MorningSection morning={log.morning!} onChange={handleMorningChange} />
            <SleepSection sleep={log.sleep!} onChange={handleSleepChange} onEditNap={(r) => { setEditingNapRecord(r); setIsNapModalOpen(true); }} onDeleteNap={(id) => deleteRecord('naps', id)} onAddNap={() => { setEditingNapRecord(undefined); setIsNapModalOpen(true); }} />

            {/* Tabbed Card for Details */}
            <div className="bg-brand-card dark:bg-slate-900 rounded-card shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 pt-2">
                     {['lifestyle', 'environment', 'health'].map(tab => (
                         <button key={tab} type="button" onClick={() => setActiveDetailTab(tab as any)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-t-xl transition-all ${activeDetailTab === tab ? 'bg-slate-50 dark:bg-slate-800 text-brand-accent' : 'text-brand-muted hover:bg-slate-50/50'}`}>{tab === 'lifestyle' ? '生活' : tab === 'environment' ? '环境' : '健康'}</button>
                     ))}
                </div>
                <div className="p-5">
                    {/* TAB: LIFESTYLE */}
                    {activeDetailTab === 'lifestyle' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">饮酒</label>
                                    {log.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? (
                                        <div onClick={() => setIsAlcoholModalOpen(true)} className="p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer flex flex-col gap-1 items-center justify-center h-24">
                                            <Beer size={20} className="text-amber-500"/>
                                            <span className="font-bold text-amber-900">{log.alcoholRecord.totalGrams}g</span>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setIsAlcoholModalOpen(true)} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-amber-300 hover:text-amber-500 transition-colors">
                                            <Plus size={20}/>
                                            <span className="text-xs font-bold mt-1">添加记录</span>
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">看片</label>
                                    <div className="grid grid-cols-2 gap-2 h-24">
                                        {PORN_OPTS.map(opt => (
                                            <button key={opt.value} onClick={() => handleChange('pornConsumption', opt.value)} className={`rounded-lg text-xs font-bold ${log.pornConsumption === opt.value ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-50 text-slate-500'}`}>{opt.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Caffeine Reimagined (Ordering Style) */}
                            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">咖啡因摄入</label>
                                    <button type="button" onClick={() => setIsAddingCaffeine(!isAddingCaffeine)} className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${isAddingCaffeine ? 'bg-brand-accent text-white shadow-md' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900'}`}>{isAddingCaffeine ? '收起菜单' : '+ 摄入'}</button>
                                </div>

                                {isAddingCaffeine && (
                                    <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                        {/* Category Selection */}
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 border-b border-slate-200 dark:border-slate-800">
                                            {CAFFEINE_MENU.map((cat, idx) => (
                                                <button key={cat.category} onClick={() => setActiveCaffeineCat(idx)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeCaffeineCat === idx ? 'bg-white dark:bg-slate-800 text-brand-accent shadow-sm' : 'text-slate-400'}`}>
                                                    <cat.icon size={12}/> {cat.category.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Item Grid */}
                                        <div className="p-3 grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                                            {CAFFEINE_MENU[activeCaffeineCat].items.map(item => (
                                                <button key={item.name} onClick={() => addCaffeine(item)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-brand-accent active:scale-95 transition-all shadow-sm">
                                                    <span className="text-xl">{item.emoji}</span>
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight text-center">{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Selected List (Cart Style) */}
                                <div className="space-y-2">
                                    {log.caffeineRecord?.items.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm animate-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand-accent"><Coffee size={14}/></div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name} <span className="text-[10px] text-slate-400 ml-1 font-mono">{c.time}</span></div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{c.volume}ml · {c.count}份</div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeCaffeine(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    {(!log.caffeineRecord?.items || log.caffeineRecord.items.length === 0) && (
                                        <div className="py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">NO CAFFEINE LOGGED</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Exercises */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase">运动</label>
                                    <button type="button" onClick={() => { setEditingExerciseRecord(undefined); setIsExerciseModalOpen(true); }} className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-bold">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.exercise?.map(r => (
                                        <div key={r.id} className="bg-green-50/50 border border-green-100 p-3 rounded-xl flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm"><Dumbbell size={14}/></div>
                                                <div>
                                                    <div className="text-sm font-bold text-green-900">{r.type}</div>
                                                    <div className="text-xs text-green-600">{r.steps ? `${r.steps}步` : `${r.duration}分钟`}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-green-600 hover:bg-green-100 rounded" onClick={() => { setEditingExerciseRecord(r); setIsExerciseModalOpen(true); }}><Edit2 size={14}/></button>
                                                <button className="p-1.5 text-green-600 hover:bg-green-100 rounded" onClick={() => deleteRecord('exercise', r.id)}><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sex/MB */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">性活动</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { setEditingSexRecord(undefined); setIsSexModalOpen(true); }} className="p-3 bg-pink-50 rounded-xl border border-pink-100 flex items-center justify-center gap-2 text-pink-600 font-bold text-xs hover:bg-pink-100 transition-colors">
                                        <HeartPulse size={16}/> 记录性爱
                                    </button>
                                    <button onClick={() => { setEditingMbRecord(undefined); setIsMbModalOpen(true); }} className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors">
                                        <Hand size={16}/> 记录自慰
                                    </button>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {log.sex?.map(r => (
                                        <div key={r.id} className="bg-pink-50/50 border border-pink-100 p-3 rounded-xl flex justify-between items-center text-sm">
                                            <span className="font-bold text-pink-700">❤️ 性生活 ({r.startTime})</span>
                                            <button className="text-pink-400 hover:text-pink-600" onClick={() => { setEditingSexRecord(r); setIsSexModalOpen(true); }}><Edit2 size={14}/></button>
                                        </div>
                                    ))}
                                    {log.masturbation?.map(r => (
                                        <div key={r.id} className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex justify-between items-center text-sm">
                                            <span className="font-bold text-blue-700">🖐️ 自慰 ({r.startTime})</span>
                                            <button className="text-blue-400 hover:text-blue-600" onClick={() => { setEditingMbRecord(r); setIsMbModalOpen(true); }}><Edit2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ENVIRONMENT */}
                    {activeDetailTab === 'environment' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase">天气</label>
                                <IconToggleButton options={WEATHER_OPTS} selected={log.weather || 'sunny'} onSelect={v => handleChange('weather', v)} renderIcon={renderWeatherIcon}/>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase">地点</label>
                                <IconToggleButton options={LOCATION_OPTS} selected={log.location || 'home'} onSelect={v => handleChange('location', v)} renderIcon={renderLocationIcon}/>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase">睡衣</label>
                                <IconToggleButton options={ATTIRE_OPTS} selected={log.sleep?.attire || 'light'} onSelect={v => handleSleepChange('attire', v)} renderIcon={renderAttireIcon}/>
                            </div>
                        </div>
                    )}

                    {/* TAB: HEALTH */}
                    {activeDetailTab === 'health' && (
                        <HealthSection 
                            log={log} 
                            onChange={handleChange} 
                            onDeepChange={handleDeepChange} 
                            onManageTags={handleManageTags}
                        />
                    )}
                </div>
            </div>
            
            {/* Daily Events & Tags */}
            <CardSection title="备注与事件" icon={Calendar} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {EVENT_PRESETS.map(evt => (
                        <button key={evt} type="button" onClick={() => toggleEvent(evt)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${log.dailyEvents?.includes(evt) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>{evt}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input value={eventInput} onChange={e => setEventInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleManageTags('event', eventInput))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" placeholder="搜索或创建事件标签..." />
                        <button 
                            type="button" 
                            onClick={() => handleManageTags('event', eventInput)}
                            className="absolute right-1 top-1 p-1 bg-slate-200 text-slate-600 rounded text-xs hover:bg-slate-300"
                        >
                            <Settings size={14}/>
                        </button>
                    </div>
                </div>
                {log.dailyEvents && log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).map(e => (
                            <span key={e} className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 flex items-center border border-slate-200">{e} <button type="button" onClick={() => toggleEvent(e)} className="ml-1"><X size={10}/></button></span>
                        ))}
                    </div>
                )}
                <div className="border-t border-slate-100 pt-3">
                    <textarea value={log.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] outline-none focus:border-brand-accent" placeholder="今天感觉如何？写点什么吧..."/>
                </div>
            </CardSection>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-3 z-30">
                 <button type="button" onClick={handleSaveDraft} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-2xl">保存草稿</button>
                <button type="submit" className="flex-[2] py-3 text-lg font-bold text-white bg-brand-accent rounded-2xl shadow-lg shadow-blue-500/30">完成记录</button>
            </div>

            <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="确认记录" footer={<><button onClick={() => setIsSummaryModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-300 rounded">返回修改</button><button onClick={handleConfirmSave} className="px-4 py-2 bg-brand-accent text-white rounded font-bold">确认保存</button></>}>
              <div className="space-y-3 text-sm text-brand-text dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {summaryData.map(({ label, value }) => (
                      <div key={label} className="grid grid-cols-[80px_1fr] gap-4 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                          <span className="font-bold text-brand-muted text-xs uppercase tracking-wide pt-0.5">{label}</span>
                          <span className="text-right whitespace-pre-wrap font-medium leading-relaxed">{value}</span>
                      </div>
                  ))}
              </div>
            </Modal>
            
            <Suspense fallback={null}>
                <TagManager 
                    isOpen={isTagManagerOpen} 
                    onClose={() => setIsTagManagerOpen(false)} 
                    defaultTab={tagManagerMode}
                    initialSearch={tagSearch}
                    onSelectTag={handleTagSelect}
                />
            </Suspense>

            <SexRecordModal isOpen={isSexModalOpen} onClose={() => setIsSexModalOpen(false)} onSave={(r) => handleSaveRecord('sex', r)} initialData={editingSexRecord} dateStr={log.date || ''} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={isMbModalOpen} onClose={() => setIsMbModalOpen(false)} onSave={(r) => handleSaveRecord('masturbation', r)} initialData={editingMbRecord} dateStr={log.date || ''} logs={logs} partners={partners} />
            <ExerciseRecordModal isOpen={isExerciseModalOpen} onClose={() => setIsExerciseModalOpen(false)} onSave={(r) => handleSaveRecord('exercise', r)} initialData={editingExerciseRecord} />
            <NapRecordModal isOpen={isNapModalOpen} onClose={() => setIsNapModalOpen(false)} onSave={handleSaveNap} initialData={editingNapRecord} />
            <AlcoholRecordModal isOpen={isAlcoholModalOpen} onClose={() => setIsAlcoholModalOpen(false)} onSave={handleSaveAlcohol} initialData={log.alcoholRecord} />
        </form>
    );
};

export default LogForm;
