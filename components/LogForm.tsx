
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, ChangeDetail, ChangeRecord, AlcoholRecord, PartnerProfile, MorningRecord, SleepRecord, CaffeineIntake, CaffeineRecord } from '../types';
import { CheckSquare, Tag, GlassWater, Beer, Film, Clapperboard, Eye, Dumbbell, Sun, Cloud, CloudRain, Snowflake, Wind, CloudFog, Home, Users, Hotel, Plane, MapPin, Shirt, EyeOff, HeartPulse, Hand, Plus, Edit2, Trash2, Footprints, Save, Coffee, Calendar, X } from 'lucide-react';
import Modal from './Modal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal'; 
import NapRecordModal from './NapRecordModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import { generateLogSummary, getTodayDateString, calculateLogDiff } from '../utils/helpers';
import { validateLogEntry } from '../utils/validators';
import { useToast } from '../contexts/ToastContext';
import { hydrateLog } from '../utils/hydrateLog';

// Modular Components
import { IconToggleButton } from './FormControls';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import HealthSection from './HealthSection';
import { DailyTimeline } from './DailyTimeline';

// --- Options Config ---
const PORN_OPTS = [{value: 'none', label: '无'}, {value: 'low', label: '少量'}, {value: 'medium', label: '适量'}, {value: 'high', label: '沉迷'}];
const WEATHER_OPTS = [{value: 'sunny', label: '晴'}, {value: 'cloudy', label: '多云'}, {value: 'rainy', label: '雨'}, {value: 'snowy', label: '雪'}, {value: 'windy', label: '大风'}, {value: 'foggy', label: '雾'}];
const LOCATION_OPTS = [{value: 'home', label: '家'}, {value: 'partner', label: '伴侣家'}, {value: 'hotel', label: '酒店'}, {value: 'travel', label: '旅途'}, {value: 'other', label: '其他'}];
const ATTIRE_OPTS = [{value: 'naked', label: '裸睡'}, {value: 'light', label: '内衣'}, {value: 'pajamas', label: '睡衣'}, {value: 'other', label: '其他'}];
const CAFFEINE_OPTS = [{value: 'none', label: '无'}, {value: 'low', label: '少'}, {value: 'medium', label: '中'}, {value: 'high', label: '多'}];
const EVENT_PRESETS = ['加班', '吵架', '出差', '聚会', '家庭烦心事', '生病'];

const LogForm: React.FC<{
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[]; 
  partners?: PartnerProfile[];
}> = ({ onSave, existingLog, logDate, onDirtyStateChange, logs, partners = [] }) => {
    const { showToast } = useToast();
    
    // --- Initialization Logic ---
    const initializeLog = (baseData: LogEntry | null): LogEntry => {
        const date = logDate || baseData?.date || getTodayDateString();
        const base = baseData ? { ...baseData } : { date };
        return hydrateLog(base);
    };

    // State initialization
    const [log, setLog] = useState<LogEntry>(() => initializeLog(existingLog));
    const [activeDetailTab, setActiveDetailTab] = useState<'lifestyle' | 'environment' | 'health'>('lifestyle');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<Array<{ label: string, value: string }>>([]);
    const [tagInput, setTagInput] = useState('');
    const [eventInput, setEventInput] = useState('');
    
    // Modals
    const [isSexModalOpen, setIsSexModalOpen] = useState(false);
    const [editingSexRecord, setEditingSexRecord] = useState<SexRecordDetails | undefined>(undefined);
    const [isMbModalOpen, setIsMbModalOpen] = useState(false);
    const [editingMbRecord, setEditingMbRecord] = useState<MasturbationRecordDetails | undefined>(undefined);
    const [isNapModalOpen, setIsNapModalOpen] = useState(false);
    const [editingNapRecord, setEditingNapRecord] = useState<NapRecord | undefined>(undefined);
    const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
    
    // Exercise Modal
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [editingExerciseRecord, setEditingExerciseRecord] = useState<ExerciseRecord | undefined>(undefined);

    const initialLogState = useRef(JSON.stringify(log));

    // Handle updates to existingLog from parent
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

    useEffect(() => {
        onDirtyStateChange(JSON.stringify(log) !== initialLogState.current);
    }, [log, onDirtyStateChange]);

    // --- Handlers ---
    const handleChange = (field: keyof LogEntry, value: any) => {
        setLog(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDeepChange = (parent: keyof LogEntry, field: string, value: any) => {
        setLog(prev => ({
            ...prev,
            [parent]: { ...((prev[parent] as any) || {}), [field]: value }
        }));
    };

    const handleMorningChange = (field: keyof MorningRecord, value: any) => {
        setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } }));
    };

    const handleSleepChange = (field: keyof SleepRecord, value: any) => {
        setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
    };

    const handleSaveAlcohol = (record: AlcoholRecord) => {
        const startTime = record.startTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const alcoholLevel = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';
        setLog(prev => ({
            ...prev,
            alcoholRecord: { ...record, startTime },
            alcohol: alcoholLevel
        }));
    };

    const handleAddCaffeine = () => {
        const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const newRecord: CaffeineRecord = {
            id: Date.now().toString(),
            time,
            type: 'coffee',
            amount: 'medium'
        };
        const currentRecords = log.caffeineRecords || [];
        const nextRecords = [...currentRecords, newRecord];
        
        // Update simple level
        const level = nextRecords.length > 2 ? 'high' : nextRecords.length > 0 ? 'medium' : 'none';
        
        setLog(prev => ({
            ...prev,
            caffeineRecords: nextRecords,
            caffeineIntake: level
        }));
    };

    const removeCaffeine = (id: string) => {
        const currentRecords = log.caffeineRecords || [];
        const nextRecords = currentRecords.filter(c => c.id !== id);
        const level = nextRecords.length > 2 ? 'high' : nextRecords.length > 0 ? 'medium' : 'none';
        
        setLog(prev => ({
            ...prev,
            caffeineRecords: nextRecords,
            caffeineIntake: level
        }));
    };

    const handleReview = () => {
        const { valid, errors } = validateLogEntry(log as LogEntry);
        if (!valid) {
            showToast(errors[0], 'error');
            return;
        }
        setSummaryData(generateLogSummary(log));
        setIsSummaryModalOpen(true);
    };

    const handleConfirmSave = () => {
        const { valid, errors } = validateLogEntry(log as LogEntry);
        if (!valid) {
            showToast(errors[0], 'error');
            return;
        }

        let diffs: ChangeDetail[] = [];
        if (existingLog) {
            diffs = calculateLogDiff(existingLog, log);
        } else {
            diffs = [{ field: '记录', oldValue: '无', newValue: '新创建' }];
        }

        const historyEntry: ChangeRecord = { 
            timestamp: Date.now(), 
            summary: existingLog ? '更新详细记录' : '完成详细记录',
            details: diffs,
            type: 'manual'
        };

        const finalLog = {
            ...log,
            status: 'completed',
            changeHistory: [...(log.changeHistory || []), historyEntry]
        } as LogEntry;
        
        onSave(finalLog);
    }
    
    const handleSaveDraft = () => {
        const historyEntry: ChangeRecord = { 
            timestamp: Date.now(), 
            summary: '保存草稿 (部分记录)',
            details: [],
            type: 'manual'
        };

        const draftLog = {
            ...log,
            status: 'pending',
            changeHistory: [...(log.changeHistory || []), historyEntry]
        } as LogEntry;
        
        onSave(draftLog);
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
            if (type === 'naps') {
                setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, naps: prev.sleep?.naps.filter(n => n.id !== id) || [] } }));
            } else {
                setLog(prev => ({ ...prev, [type]: (prev[type] as any[]).filter(r => r.id !== id) }));
            }
        }
    };

    const toggleEvent = (evt: string) => {
        const events = log.dailyEvents || [];
        const next = events.includes(evt) ? events.filter(e => e !== evt) : [...events, evt];
        handleChange('dailyEvents', next);
    };

    if (!log.date) return <div>Loading...</div>;

    const renderWeatherIcon = (v: string) => v === 'sunny' ? <Sun size={20}/> : v === 'cloudy' ? <Cloud size={20}/> : v === 'rainy' ? <CloudRain size={20}/> : v === 'snowy' ? <Snowflake size={20}/> : v === 'windy' ? <Wind size={20}/> : <CloudFog size={20}/>;
    const renderLocationIcon = (v: string) => v === 'home' ? <Home size={20}/> : v === 'partner' ? <Users size={20}/> : v === 'hotel' ? <Hotel size={20}/> : v === 'travel' ? <Plane size={20}/> : <MapPin size={20}/>;
    const renderAttireIcon = (v: string) => <Shirt size={20}/>; 

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleReview(); }} className="space-y-6 pb-8">
             <div className="text-center bg-brand-secondary dark:bg-slate-900 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                 <p className="text-lg font-bold text-brand-text dark:text-slate-200">
                     {new Date(log.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                 </p>
             </div>

            {/* --- Modular Sections --- */}
            
            <MorningSection 
                morning={log.morning!} 
                onChange={handleMorningChange} 
            />

            <SleepSection 
                sleep={log.sleep!} 
                onChange={handleSleepChange} 
                onEditNap={(r) => { setEditingNapRecord(r); setIsNapModalOpen(true); }}
                onDeleteNap={(id) => deleteRecord('naps', id)}
                onAddNap={() => { setEditingNapRecord(undefined); setIsNapModalOpen(true); }}
            />

            {/* Tabs for Details */}
            <div className="bg-brand-secondary dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                     {['lifestyle', 'environment', 'health'].map(tab => (
                         <button key={tab} type="button" onClick={() => setActiveDetailTab(tab as any)} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${activeDetailTab === tab ? 'bg-slate-50 dark:bg-slate-800 text-brand-accent border-b-2 border-brand-accent' : 'text-brand-muted hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{tab === 'lifestyle' ? '生活' : tab === 'environment' ? '环境' : '健康'}</button>
                     ))}
                </div>
                <div className="p-4">
                    {/* TAB: LIFESTYLE */}
                    {activeDetailTab === 'lifestyle' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-text dark:text-slate-300">今日饮酒</label>
                                {log.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors" onClick={() => setIsAlcoholModalOpen(true)}>
                                        <div className="flex items-center">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full mr-3 text-amber-600 dark:text-amber-200">
                                                <Beer size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                                                    {log.alcoholRecord.totalGrams}g 纯酒精
                                                </div>
                                                <div className="text-xs text-amber-600/70 dark:text-amber-400 flex gap-2">
                                                    {log.alcoholRecord.drunkLevel !== 'none' && <span className="font-bold">{log.alcoholRecord.drunkLevel}</span>}
                                                    <span>{log.alcoholRecord.items.map(i => `${i.name}x${i.count}`).join(', ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-amber-500">
                                            <Edit2 size={16} />
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAlcoholModalOpen(true)}
                                        className="w-full py-3 border-2 border-dashed border-amber-200 dark:border-amber-800/50 text-amber-500 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium flex justify-center items-center transition-colors"
                                    >
                                        <Plus size={16} className="mr-1"/> 添加饮酒记录 (精准量化)
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-brand-text dark:text-slate-300">咖啡因</label>
                                    <button 
                                        type="button" 
                                        onClick={handleAddCaffeine}
                                        className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100"
                                    >
                                        + 添加一杯
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {log.caffeineRecords && log.caffeineRecords.length > 0 ? (
                                        log.caffeineRecords.map(c => (
                                            <div key={c.id} className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-2 py-1 rounded text-xs text-amber-800 dark:text-amber-200">
                                                <Coffee size={12} className="mr-1"/>
                                                {c.time}
                                                <button onClick={() => removeCaffeine(c.id)} className="ml-2 text-amber-400 hover:text-amber-600"><X size={12}/></button>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">今日未摄入</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-text dark:text-slate-300">看片</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {PORN_OPTS.map(opt => (
                                        <button key={opt.value} onClick={() => handleChange('pornConsumption', opt.value)} className={`p-1.5 rounded border text-[10px] text-center ${log.pornConsumption === opt.value ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 border-purple-300' : 'bg-white dark:bg-slate-800 border-slate-200'}`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                <h4 className="text-xs font-bold text-brand-muted uppercase mb-3 flex items-center"><Dumbbell size={14} className="mr-1"/>运动记录</h4>
                                <div className="space-y-2">
                                    {log.exercise?.map(r => (
                                        <div key={r.id} className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-2.5 rounded-lg flex justify-between items-center text-sm">
                                            <span className="font-semibold text-green-700 dark:text-green-300 flex items-center">
                                                {r.steps ? (
                                                    <><Footprints size={14} className="mr-2"/> {r.type} <span className="text-xs opacity-70 ml-1 font-mono">({r.steps}步)</span></>
                                                ) : (
                                                    <><span className="mr-2 font-mono text-xs">{r.startTime}</span> {r.type} <span className="text-xs opacity-70 ml-1">({r.duration}分)</span></>
                                                )}
                                            </span>
                                            <div className="flex gap-2 text-green-400">
                                                <Edit2 size={16} className="cursor-pointer hover:text-green-600" onClick={() => { setEditingExerciseRecord(r); setIsExerciseModalOpen(true); }}/>
                                                <Trash2 size={16} className="cursor-pointer hover:text-green-600" onClick={() => deleteRecord('exercise', r.id)}/>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { setEditingExerciseRecord(undefined); setIsExerciseModalOpen(true); }} className="w-full py-2 border-2 border-dashed border-green-200 dark:border-green-900 text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 text-sm font-medium flex justify-center items-center"><Plus size={16} className="mr-1"/> 添加运动</button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                <h4 className="text-xs font-bold text-brand-muted uppercase mb-3 flex items-center"><HeartPulse size={14} className="mr-1"/>性生活与自慰</h4>
                                <div className="space-y-2">
                                    {log.sex?.map(r => (
                                        <div key={r.id} className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900/30 p-2.5 rounded-lg flex justify-between items-center text-sm">
                                            <span className="font-semibold text-pink-700 dark:text-pink-300">❤️ 性生活 ({r.startTime})</span>
                                            <div className="flex gap-2 text-pink-400">
                                                <Edit2 size={16} className="cursor-pointer hover:text-pink-600" onClick={() => { setEditingSexRecord(r); setIsSexModalOpen(true); }}/>
                                                <Trash2 size={16} className="cursor-pointer hover:text-pink-600" onClick={() => deleteRecord('sex', r.id)}/>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { setEditingSexRecord(undefined); setIsSexModalOpen(true); }} className="w-full py-2 border-2 border-dashed border-pink-200 dark:border-pink-900 text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/10 text-sm font-medium flex justify-center items-center"><Plus size={16} className="mr-1"/> 添加性生活</button>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {log.masturbation?.map(r => (
                                        <div key={r.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg flex justify-between items-center text-sm">
                                            <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center">
                                                🖐️ 自慰 ({r.startTime})
                                                {r.status === 'inProgress' && <span className="ml-2 text-[10px] bg-blue-200 text-blue-800 px-1 rounded animate-pulse">进行中</span>}
                                            </span>
                                            <div className="flex gap-2 text-blue-400">
                                                <Edit2 size={16} className="cursor-pointer hover:text-blue-600" onClick={() => { setEditingMbRecord(r); setIsMbModalOpen(true); }}/>
                                                <Trash2 size={16} className="cursor-pointer hover:text-blue-600" onClick={() => deleteRecord('masturbation', r.id)}/>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { setEditingMbRecord(undefined); setIsMbModalOpen(true); }} className="w-full py-2 border-2 border-dashed border-blue-200 dark:border-blue-900 text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 text-sm font-medium flex justify-center items-center"><Plus size={16} className="mr-1"/> 添加自慰</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ENVIRONMENT */}
                    {activeDetailTab === 'environment' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-text dark:text-slate-300">天气</label>
                                <IconToggleButton options={WEATHER_OPTS} selected={log.weather || 'sunny'} onSelect={v => handleChange('weather', v)} renderIcon={renderWeatherIcon}/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-text dark:text-slate-300">地点</label>
                                <IconToggleButton options={LOCATION_OPTS} selected={log.location || 'home'} onSelect={v => handleChange('location', v)} renderIcon={renderLocationIcon}/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-text dark:text-slate-300">睡衣材质</label>
                                <IconToggleButton options={ATTIRE_OPTS} selected={log.sleep?.attire || 'light'} onSelect={v => handleSleepChange('attire', v)} renderIcon={renderAttireIcon}/>
                            </div>
                        </div>
                    )}

                    {/* TAB: HEALTH */}
                    {activeDetailTab === 'health' && (
                        <HealthSection log={log} onChange={handleChange} onDeepChange={handleDeepChange} />
                    )}
                </div>
            </div>
            
            {/* Daily Events & Tags - OUTSIDE of Tabs */}
            <div className="bg-brand-secondary dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Special Events */}
                <div className="mb-4">
                    <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Calendar size={16} className="mr-2"/> 特别事件</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {EVENT_PRESETS.map(evt => (
                            <button 
                                key={evt} 
                                type="button"
                                onClick={() => toggleEvent(evt)} 
                                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${log.dailyEvents?.includes(evt) ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {evt}
                            </button>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input value={eventInput} onChange={e => setEventInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), toggleEvent(eventInput), setEventInput(''))} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded px-2 py-1 text-xs" placeholder="自定义事件..." />
                        <button type="button" onClick={() => {if(eventInput) {toggleEvent(eventInput); setEventInput('');}}} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded text-slate-600">+</button>
                    </div>
                    {log.dailyEvents && log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {log.dailyEvents.filter(e => !EVENT_PRESETS.includes(e)).map(e => (
                                <span key={e} className="px-2 py-1 text-xs rounded-full bg-slate-700 text-white flex items-center">
                                    {e} <button type="button" onClick={() => toggleEvent(e)} className="ml-1"><X size={10}/></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-4"></div>

                <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Tag size={16} className="mr-2"/>标签 & 备注</h3>
                 <div className="flex space-x-2 mb-3">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleChange('tags', [...(log.tags||[]), tagInput]), setTagInput(''))} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm focus:ring-brand-accent focus:border-brand-accent text-brand-text dark:text-slate-200" placeholder="输入标签 (如: #补锌)"/>
                    <button type="button" onClick={() => { if(tagInput) { handleChange('tags', [...(log.tags||[]), tagInput]); setTagInput(''); } }} className="bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-300 px-4 rounded text-sm font-medium border border-slate-300 dark:border-slate-700">添加</button>
                 </div>
                 <div className="flex flex-wrap gap-2 mb-4">{log.tags?.map(tag => <span key={tag} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs flex items-center">{tag} <button type="button" onClick={() => handleChange('tags', log.tags?.filter(t => t !== tag))} className="ml-1 font-bold">×</button></span>)}</div>
                 
                 <textarea 
                    value={log.notes || ''} 
                    onChange={(e) => handleChange('notes', e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-brand-accent focus:border-brand-accent text-brand-text dark:text-slate-200 min-h-[80px]"
                    placeholder="今天感觉如何？写点什么吧..."
                />
            </div>

            {/* Daily Timeline */}
            <div className="bg-brand-secondary dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <DailyTimeline log={log} />
            </div>

            <div className="flex gap-3">
                 <button 
                    type="button" 
                    onClick={handleSaveDraft}
                    className="flex-1 py-4 font-semibold text-brand-accent bg-white dark:bg-slate-800 border border-brand-accent dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-center items-center"
                >
                    <Save className="mr-2" size={18}/> 保存草稿
                </button>
                
                <button 
                    type="submit" 
                    className="flex-[2] py-4 text-lg font-semibold text-white bg-brand-accent rounded-lg shadow-md hover:bg-brand-accent-hover transition-transform active:scale-[0.99] flex justify-center items-center"
                >
                    <CheckSquare className="mr-2"/> 完成日记
                </button>
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
            
            <SexRecordModal 
                isOpen={isSexModalOpen} 
                onClose={() => setIsSexModalOpen(false)} 
                onSave={(r) => handleSaveRecord('sex', r)} 
                initialData={editingSexRecord} 
                dateStr={log.date || ''} 
                logs={logs}
                partners={partners}
            />
            <MasturbationRecordModal 
                isOpen={isMbModalOpen} 
                onClose={() => setIsMbModalOpen(false)} 
                onSave={(r) => handleSaveRecord('masturbation', r)} 
                initialData={editingMbRecord} 
                dateStr={log.date || ''} 
                logs={logs}
                partners={partners}
            />
            <ExerciseRecordModal
                isOpen={isExerciseModalOpen}
                onClose={() => setIsExerciseModalOpen(false)}
                onSave={(r) => handleSaveRecord('exercise', r)}
                initialData={editingExerciseRecord}
            />
            <NapRecordModal
                isOpen={isNapModalOpen}
                onClose={() => setIsNapModalOpen(false)}
                onSave={handleSaveNap}
                initialData={editingNapRecord}
            />
            <AlcoholRecordModal
                isOpen={isAlcoholModalOpen}
                onClose={() => setIsAlcoholModalOpen(false)}
                onSave={handleSaveAlcohol}
                initialData={log.alcoholRecord}
            />
        </form>
    );
};

export default LogForm;
