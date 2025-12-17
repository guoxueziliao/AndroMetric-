
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, ChangeDetail, ChangeRecord, AlcoholRecord, PartnerProfile, MorningRecord, SleepRecord, CaffeineRecord } from '../types';
import { CheckSquare, Tag, Beer, Film, Dumbbell, Sun, Cloud, CloudRain, Snowflake, Wind, CloudFog, Home, Users, Hotel, Plane, MapPin, Shirt, HeartPulse, Hand, Plus, Edit2, Trash2, Footprints, Save, Coffee, Calendar, X, Zap, Check, Sparkles, Settings } from 'lucide-react';
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

// --- Options Config ---
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
    <div className={`bg-brand-card dark:bg-slate-900 rounded-card p-5 shadow-soft border border-slate-100 dark:border-slate-800 transition-colors ${className}`}>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg mr-2 text-brand-muted dark:text-slate-400">
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
    const [qualityScore, setQualityScore] = useState(0);
    
    // Modals state
    const [isSexModalOpen, setIsSexModalOpen] = useState(false);
    const [isMbModalOpen, setIsMbModalOpen] = useState(false);
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [isNapModalOpen, setIsNapModalOpen] = useState(false);
    const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    
    // Edit targets
    const [editingSexId, setEditingSexId] = useState<string | null>(null);
    const [editingMbId, setEditingMbId] = useState<string | null>(null);
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
    const [editingNapId, setEditingNapId] = useState<string | null>(null);

    const isDirtyRef = useRef(false);

    useEffect(() => {
        setQualityScore(calculateDataQuality(log));
    }, [log]);

    const updateLog = (field: keyof LogEntry, value: any) => {
        setLog(prev => {
            const next = { ...prev, [field]: value };
            isDirtyRef.current = true;
            onDirtyStateChange(true);
            return next;
        });
    };

    const updateDeepLog = (parent: keyof LogEntry, field: string, value: any) => {
        setLog(prev => {
            const parentObj = prev[parent] as any || {};
            const next = { ...prev, [parent]: { ...parentObj, [field]: value } };
            isDirtyRef.current = true;
            onDirtyStateChange(true);
            return next;
        });
    };

    const handlePreSave = () => {
        const { valid, errors } = validateLogEntry(log);
        if (!valid) {
            showToast(errors[0], 'error');
            return;
        }
        
        // Generate Change History
        if (existingLog) {
            const diffs: ChangeDetail[] = calculateLogDiff(existingLog, log);
            if (diffs.length > 0) {
                const historyEntry: ChangeRecord = {
                    timestamp: Date.now(),
                    summary: '编辑记录',
                    details: diffs,
                    type: 'manual'
                };
                log.changeHistory = [...(log.changeHistory || []), historyEntry];
            }
        } else {
             // New Log
             const historyEntry: ChangeRecord = {
                timestamp: Date.now(),
                summary: '创建新记录',
                details: [],
                type: 'manual'
            };
            log.changeHistory = [historyEntry];
        }

        onSave(log);
    };

    const handleSaveDraft = () => {
        onSave({ ...log, status: 'pending' });
    };

    // --- Sub-Record Handlers ---
    const saveSubRecord = (field: 'sex' | 'masturbation' | 'exercise' | 'naps', item: any) => {
        if (field === 'naps') {
            const currentNaps = log.sleep?.naps || [];
            const idx = currentNaps.findIndex((x: any) => x.id === item.id);
            const newNaps = idx >= 0 ? currentNaps.map((x: any) => x.id === item.id ? item : x) : [...currentNaps, item];
            updateDeepLog('sleep', 'naps', newNaps);
        } else {
            const list = (log[field] as any[]) || [];
            const idx = list.findIndex((x: any) => x.id === item.id);
            const newList = idx >= 0 ? list.map((x: any) => x.id === item.id ? item : x) : [...list, item];
            updateLog(field, newList);
        }
        isDirtyRef.current = true;
        onDirtyStateChange(true);
    };

    const deleteSubRecord = (field: 'sex' | 'masturbation' | 'exercise' | 'naps', id: string) => {
        if (confirm('确定删除此条记录吗？')) {
            if (field === 'naps') {
                const currentNaps = log.sleep?.naps || [];
                updateDeepLog('sleep', 'naps', currentNaps.filter((x: any) => x.id !== id));
            } else {
                const list = (log[field] as any[]) || [];
                updateLog(field, list.filter((x: any) => x.id !== id));
            }
            isDirtyRef.current = true;
            onDirtyStateChange(true);
        }
    };

    // --- Render Helpers ---
    const renderTag = (tag: string) => (
        <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mr-2 mb-2">
            {tag}
            <button onClick={() => updateLog('tags', (log.tags || []).filter(t => t !== tag))} className="ml-1.5 text-slate-400 hover:text-red-500"><X size={12}/></button>
        </span>
    );

    const toggleDailyEvent = (evt: string) => {
        const current = log.dailyEvents || [];
        const next = current.includes(evt) ? current.filter(e => e !== evt) : [...current, evt];
        updateLog('dailyEvents', next);
    };
    
    const handleAddEventTag = (tag: string) => {
        if (!log.dailyEvents?.includes(tag)) {
            updateLog('dailyEvents', [...(log.dailyEvents || []), tag]);
        }
        setIsTagManagerOpen(false);
    };

    return (
        <div className="pb-32 space-y-6">
            {/* Header: Date & Score */}
            <div className="bg-brand-card dark:bg-slate-900 rounded-3xl p-5 shadow-soft border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                <div>
                    <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 tracking-tight flex items-center">
                        {new Date(log.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-sm font-bold text-brand-muted uppercase tracking-wider mt-1">{new Date(log.date).toLocaleDateString('zh-CN', { weekday: 'long' })}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 pr-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <QualityRing score={qualityScore} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUALITY SCORE</span>
                        <span className={`text-xs font-bold ${qualityScore >= 80 ? 'text-green-500' : 'text-slate-500'}`}>{qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Incomplete'}</span>
                    </div>
                </div>
            </div>

            {/* 1. Morning Section */}
            {log.morning && <MorningSection morning={log.morning} onChange={(f, v) => updateDeepLog('morning', f as string, v)} />}

            {/* 2. Sleep Section */}
            {log.sleep && (
                <SleepSection 
                    sleep={log.sleep} 
                    onChange={(f, v) => updateDeepLog('sleep', f as string, v)} 
                    onEditNap={(n) => { setEditingNapId(n.id); setIsNapModalOpen(true); }}
                    onDeleteNap={(id) => deleteSubRecord('naps', id)}
                    onAddNap={() => { setEditingNapId(null); setIsNapModalOpen(true); }}
                />
            )}

            {/* 3. Detailed Records (Tabs) */}
            <div className="bg-brand-card dark:bg-slate-900 rounded-card shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    {[
                        { id: 'lifestyle', label: '生活', icon: Coffee },
                        { id: 'environment', label: '环境', icon: Cloud },
                        { id: 'health', label: '健康', icon: HeartPulse }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDetailTab(tab.id as any)}
                            className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeDetailTab === tab.id ? 'text-brand-accent bg-blue-50/50 dark:bg-slate-800 border-b-2 border-brand-accent' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-5 animate-in fade-in">
                    {/* Tab: Lifestyle */}
                    {activeDetailTab === 'lifestyle' && (
                        <div className="space-y-6">
                            {/* Alcohol */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">饮酒 (Alcohol)</label>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsAlcoholModalOpen(true)} className="flex-1 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-amber-100 dark:border-amber-900/30 font-bold">
                                        <Beer size={18}/>
                                        {log.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? `${log.alcoholRecord.totalGrams}g 纯酒精` : '记录饮酒'}
                                    </button>
                                </div>
                            </div>

                            {/* Caffeine */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">咖啡因 (Caffeine)</label>
                                <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl flex items-center">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const current = log.caffeineRecord?.totalCount || 0;
                                            updateDeepLog('caffeineRecord', 'totalCount', Math.max(0, current - 1));
                                        }}
                                        className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm text-slate-500 transition-all"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                    <div className="flex-1 text-center font-black text-xl text-slate-700 dark:text-slate-200">
                                        {log.caffeineRecord?.totalCount || 0} <span className="text-xs font-bold text-slate-400">杯</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const current = log.caffeineRecord?.totalCount || 0;
                                            updateDeepLog('caffeineRecord', 'totalCount', current + 1);
                                        }}
                                        className="p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-brand-accent transition-all hover:scale-105"
                                    >
                                        <Plus size={16} strokeWidth={3}/>
                                    </button>
                                </div>
                            </div>

                            {/* Porn */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">看片 (Porn)</label>
                                <IconToggleButton 
                                    options={PORN_OPTS} 
                                    selected={log.pornConsumption || 'none'} 
                                    onSelect={v => updateLog('pornConsumption', v)} 
                                    renderIcon={(v) => <Film size={18} className={v !== 'none' ? 'text-purple-500' : 'text-slate-300'} />}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Environment */}
                    {activeDetailTab === 'environment' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">天气 (Weather)</label>
                                <IconToggleButton 
                                    options={WEATHER_OPTS} 
                                    selected={log.weather || 'sunny'} 
                                    onSelect={v => updateLog('weather', v)} 
                                    renderIcon={(v) => {
                                        if (v === 'rainy') return <CloudRain size={18} className="text-blue-400"/>;
                                        if (v === 'cloudy') return <Cloud size={18} className="text-slate-400"/>;
                                        if (v === 'snowy') return <Snowflake size={18} className="text-cyan-300"/>;
                                        return <Sun size={18} className="text-orange-400"/>;
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">地点 (Location)</label>
                                <IconToggleButton 
                                    options={LOCATION_OPTS} 
                                    selected={log.location || 'home'} 
                                    onSelect={v => updateLog('location', v)} 
                                    renderIcon={(v) => {
                                        if (v === 'hotel') return <Hotel size={18} className="text-indigo-400"/>;
                                        if (v === 'travel') return <Plane size={18} className="text-sky-400"/>;
                                        if (v === 'partner') return <Users size={18} className="text-pink-400"/>;
                                        return <Home size={18} className="text-green-400"/>;
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Health */}
                    {activeDetailTab === 'health' && (
                        <HealthSection 
                            log={log} 
                            onChange={updateLog} 
                            onDeepChange={updateDeepLog}
                            onManageTags={() => { setIsTagManagerOpen(true); }}
                        />
                    )}
                </div>
            </div>

            {/* 4. Activities (Grid Layout) */}
            <div className="grid grid-cols-2 gap-4">
                {/* Sex */}
                <button onClick={() => { setEditingSexId(null); setIsSexModalOpen(true); }} className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 p-4 rounded-3xl text-left hover:scale-[1.02] transition-transform shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><HeartPulse size={48} className="text-pink-500"/></div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">性生活</span>
                        <div className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-1">{log.sex?.length || 0} <span className="text-sm font-bold opacity-60">次</span></div>
                        <div className="mt-2 space-y-1">
                            {log.sex?.map((s, i) => (
                                <div key={s.id} onClick={(e) => { e.stopPropagation(); setEditingSexId(s.id); setIsSexModalOpen(true); }} className="text-[10px] bg-white/60 dark:bg-black/20 p-1.5 rounded-lg flex justify-between items-center text-pink-700 dark:text-pink-300 font-medium">
                                    <span>{s.partner || '伴侣'} ({s.duration}m)</span>
                                    <Edit2 size={10} className="opacity-50"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </button>

                {/* Masturbation */}
                <button onClick={() => { setEditingMbId(null); setIsMbModalOpen(true); }} className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-3xl text-left hover:scale-[1.02] transition-transform shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Hand size={48} className="text-blue-500"/></div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">自慰</span>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{log.masturbation?.length || 0} <span className="text-sm font-bold opacity-60">次</span></div>
                        <div className="mt-2 space-y-1">
                            {log.masturbation?.map((m, i) => (
                                <div key={m.id} onClick={(e) => { e.stopPropagation(); setEditingMbId(m.id); setIsMbModalOpen(true); }} className="text-[10px] bg-white/60 dark:bg-black/20 p-1.5 rounded-lg flex justify-between items-center text-blue-700 dark:text-blue-300 font-medium">
                                    <span>{m.startTime} ({m.duration}m)</span>
                                    <Edit2 size={10} className="opacity-50"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </button>
            </div>

            {/* Exercise Button */}
            <button onClick={() => { setEditingExerciseId(null); setIsExerciseModalOpen(true); }} className="w-full bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400"><Dumbbell size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-orange-800 dark:text-orange-200">运动记录</h3>
                        <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">今日已运动 {log.exercise?.length || 0} 次</p>
                    </div>
                </div>
                {log.exercise && log.exercise.length > 0 && (
                    <div className="flex gap-2">
                        {log.exercise.slice(0, 3).map(e => (
                            <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setEditingExerciseId(e.id); setIsExerciseModalOpen(true); }} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-500 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                                {e.steps ? <Footprints size={14}/> : <Dumbbell size={14}/>}
                            </div>
                        ))}
                    </div>
                )}
                {(!log.exercise || log.exercise.length === 0) && <Plus size={20} className="text-orange-400"/>}
            </button>

            {/* 5. Events & Notes */}
            <CardSection title="事件与备注" icon={Tag}>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {EVENT_PRESETS.map(evt => (
                            <button
                                key={evt}
                                onClick={() => toggleDailyEvent(evt)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${log.dailyEvents?.includes(evt) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {evt}
                            </button>
                        ))}
                        <button onClick={() => setIsTagManagerOpen(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 flex items-center hover:text-slate-600 dark:hover:text-slate-300">
                            <Plus size={12} className="mr-1"/> 更多事件
                        </button>
                    </div>
                    
                    {log.dailyEvents && log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).map(tag => (
                                <span key={tag} onClick={() => toggleDailyEvent(tag)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900 cursor-pointer flex items-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors group">
                                    {tag}
                                    <X size={10} className="ml-1 opacity-0 group-hover:opacity-100"/>
                                </span>
                            ))}
                        </div>
                    )}

                    <textarea
                        value={log.notes || ''}
                        onChange={e => updateLog('notes', e.target.value)}
                        placeholder="记录今天的特殊情况、心情或备注..."
                        className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all resize-none text-brand-text dark:text-slate-200 placeholder-slate-400"
                    />
                </div>
            </CardSection>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-40 transition-colors">
                <button onClick={handleSaveDraft} className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    保存草稿
                </button>
                <button 
                    onClick={handlePreSave}
                    className="flex-1 ml-4 py-3 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all active:scale-[0.98]"
                >
                    <CheckSquare size={18} className="mr-2" />
                    完成记录
                </button>
            </div>

            {/* Modals */}
            <SexRecordModal 
                isOpen={isSexModalOpen} 
                onClose={() => { setIsSexModalOpen(false); setEditingSexId(null); }} 
                onSave={(data) => saveSubRecord('sex', data)} 
                initialData={editingSexId ? log.sex?.find(s => s.id === editingSexId) : undefined} 
                dateStr={log.date}
                partners={partners}
                logs={logs}
            />
            <MasturbationRecordModal 
                isOpen={isMbModalOpen} 
                onClose={() => { setIsMbModalOpen(false); setEditingMbId(null); }} 
                onSave={(data) => saveSubRecord('masturbation', data)} 
                initialData={editingMbId ? log.masturbation?.find(m => m.id === editingMbId) : undefined} 
                dateStr={log.date}
                logs={logs}
                partners={partners}
            />
            <ExerciseRecordModal 
                isOpen={isExerciseModalOpen} 
                onClose={() => { setIsExerciseModalOpen(false); setEditingExerciseId(null); }} 
                onSave={(data) => saveSubRecord('exercise', data)} 
                initialData={editingExerciseId ? log.exercise?.find(e => e.id === editingExerciseId) : undefined} 
            />
            <NapRecordModal
                isOpen={isNapModalOpen}
                onClose={() => { setIsNapModalOpen(false); setEditingNapId(null); }}
                onSave={(data) => saveSubRecord('naps', data)}
                initialData={editingNapId ? log.sleep?.naps?.find(n => n.id === editingNapId) : undefined}
            />
            <AlcoholRecordModal
                isOpen={isAlcoholModalOpen}
                onClose={() => setIsAlcoholModalOpen(false)}
                onSave={(record) => { updateLog('alcoholRecord', record); updateLog('alcohol', record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none'); }}
                initialData={log.alcoholRecord || undefined}
            />
            <Suspense fallback={null}>
                <TagManager 
                    isOpen={isTagManagerOpen} 
                    onClose={() => setIsTagManagerOpen(false)} 
                    onSelectTag={handleAddEventTag} 
                    defaultTab="event" 
                />
            </Suspense>
        </div>
    );
};

export default LogForm;
