import React, { useState, useCallback, useMemo } from 'react';
import { 
    Plus, Heart, Hand, Dumbbell, 
    StickyNote, Check, Trash2, MapPin,
    Sparkles, Sun, Cloud, CloudRain,
    Snowflake, Wind, CloudFog, Home, Navigation, Hotel, Plane, 
    Shirt, Droplets, ShieldAlert, Search, Coffee, Edit3, Beer, RotateCcw
} from 'lucide-react';
import BeverageModal from './BeverageModal';
import ExerciseRecordModal from './ExerciseRecordModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import NapRecordModal from './NapRecordModal';
import { SexRecordModal, MasturbationRecordModal } from '../sex-life';
import type { LogEntry, PartnerProfile, AlcoholRecord, TagEntry, TagType } from '../../domain';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from '../../shared/ui';
import { calculateDataQuality, formatDateFriendly } from '../../shared/lib';

interface LogFormData {
  existingLog: LogEntry | null;
  logDate: string | null;
  logs: LogEntry[];
  partners: PartnerProfile[];
  userTags: TagEntry[];
}

interface LogFormActions {
  onSave: (log: LogEntry) => void;
  onDirtyStateChange: (isDirty: boolean) => void;
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
}

interface LogFormProps {
  data: LogFormData;
  actions: LogFormActions;
}

type MidTabType = 'life' | 'env' | 'health';

// 顶部评分圆环组件
const QualityScoreRing = ({ score }: { score: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-orange-500 transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 leading-none uppercase">质量</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">{score}</span>
            </div>
        </div>
    );
};

const LogForm: React.FC<LogFormProps> = ({ data, actions }) => {
    const {
        existingLog,
        logDate,
        logs,
        partners,
        userTags
    } = data;

    const {
        onSave,
        onDirtyStateChange,
        onAddOrUpdateLog,
        onAddOrUpdateTag,
        onDeleteTag
    } = actions;

    const [log, setLog] = useState<LogEntry>(() => {
        const base = existingLog ? { ...existingLog } : { 
            date: logDate || '', status: 'completed', updatedAt: Date.now(),
            morning: { id: `m_${Date.now()}`, timestamp: Date.now(), wokeWithErection: true, wokenByErection: false },
            sleep: { id: `s_${Date.now()}`, quality: 3, naturalAwakening: true, nocturnalEmission: false, withPartner: false, naps: [], hasDream: false, dreamTypes: [], environment: { location: 'home', temperature: 'comfortable' } },
            exercise: [], sex: [], masturbation: [], dailyEvents: [], tags: [],
            health: { isSick: false, symptoms: [], medications: [] },
            changeHistory: [],
            alcoholRecords: []
        } as LogEntry;

        // Defensive: Ensure arrays are actually arrays
        if (!Array.isArray(base.exercise)) base.exercise = [];
        if (!Array.isArray(base.sex)) base.sex = [];
        if (!Array.isArray(base.masturbation)) base.masturbation = [];
        if (!Array.isArray(base.dailyEvents)) base.dailyEvents = [];
        if (!Array.isArray(base.tags)) base.tags = [];
        if (!Array.isArray(base.changeHistory)) base.changeHistory = [];
        if (!Array.isArray(base.alcoholRecords)) base.alcoholRecords = [];
        if (base.caffeineRecord && !Array.isArray(base.caffeineRecord.items)) base.caffeineRecord.items = [];
        if (base.sleep && !Array.isArray(base.sleep.naps)) base.sleep.naps = [];

        // Ensure morning state is fully initialized with defaults
        // This fixes the bug where "wokeWithErection" appears ON by default but saves as undefined
        const wokeWithErection = base.morning?.wokeWithErection ?? true;
        return {
            ...base,
            morning: {
                ...base.morning,
                wokeWithErection,
                hardness: base.morning?.hardness ?? (wokeWithErection ? 3 : null),
                retention: base.morning?.retention ?? (wokeWithErection ? 'normal' : null),
                id: base.morning?.id || `m_${Date.now()}`,
                timestamp: base.morning?.timestamp || Date.now()
            } as any
        };
    });

    const [activeMidTab, setActiveMidTab] = useState<MidTabType>('life');
    const [modalState, setModalState] = useState({ bev: false, sex: false, mb: false, ex: false, alc: false, nap: false });
    const [eventSearch, setEventSearch] = useState('');
    
    // 编辑中的单项数据
    const [editTarget, setEditTarget] = useState<{ type: string, data: any } | null>(null);

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);
    const qualityScore = useMemo(() => calculateDataQuality(log), [log]);

    const setField = (field: keyof LogEntry, value: any) => {
        setLog(prev => ({ ...prev, [field]: value }));
        markDirty();
    };

    const handleMorningChange = (field: any, value: any) => {
        setLog(prev => {
            const newMorning = { ...prev.morning!, [field]: value };
            if (field === 'wokeWithErection' && value === true) {
                if (!newMorning.hardness) newMorning.hardness = 3;
                if (!newMorning.retention) newMorning.retention = 'normal';
            } else if (field === 'wokeWithErection' && value === false) {
                newMorning.hardness = null;
                newMorning.retention = null;
                newMorning.wokenByErection = false;
            }
            return { ...prev, morning: newMorning };
        });
        markDirty();
    };

    const handleSleepChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
        markDirty();
    };

    const handleEdit = (type: 'alc' | 'bev' | 'ex' | 'sex' | 'mb' | 'nap', data: any) => {
        setEditTarget({ type, data });
        setModalState(s => ({ ...s, [type]: true }));
    };

    const removeItem = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeine' | 'alcohol' | 'nap', id: string) => {
        const fieldNameMap = {
            'sex': '性爱记录',
            'masturbation': '自慰记录',
            'exercise': '运动记录',
            'caffeine': '提神饮品',
            'alcohol': '饮酒记录',
            'nap': '午休记录'
        };
        
        if (!window.confirm(`确定要删除这条${fieldNameMap[field]}吗？`)) return;

        if (field === 'caffeine') {
            const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
            setLog(prev => ({ ...prev, caffeineRecord: { totalCount: newItems.length, items: newItems } }));
        } else if (field === 'alcohol') {
            setLog(prev => ({ ...prev, alcoholRecords: prev.alcoholRecords.filter(r => r.id !== id) }));
        } else if (field === 'nap') {
            handleSleepChange('naps', (log.sleep?.naps || []).filter(n => n.id !== id));
        } else {
            setLog(prev => ({ ...prev, [field]: (log[field] as any[]).filter(i => i.id !== id) }));
        }
        markDirty();
    };

    const handleCreateEventTag = () => {
        const tag = eventSearch.trim();
        if (!tag) return;
        const current = log.dailyEvents || [];
        if (!current.includes(tag)) {
            setField('dailyEvents', [...current, tag]);
        }
        setEventSearch('');
    };

    const handleSaveAlcohol = (r: AlcoholRecord) => {
        const current = log.alcoholRecords || [];
        const exists = current.find(x => x.id === r.id);
        const next = exists ? current.map(x => x.id === r.id ? r : x) : [...current, r];
        
        const total = next.reduce((sum, item) => sum + item.totalGrams, 0);
        const level = total > 50 ? 'high' : total > 20 ? 'medium' : total > 0 ? 'low' : 'none';

        setLog(prev => ({ 
            ...prev, 
            alcoholRecords: next, 
            alcohol: level
        }));
        markDirty();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft border border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex-1 pr-4">
                    <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 leading-tight">
                        {log.date ? formatDateFriendly(log.date).replace(/年|月|日/g, (m) => m === '日' ? '日 ' : m) : '未设置日期'}
                    </h2>
                </div>
                <QualityScoreRing score={qualityScore} />
            </div>

            <MorningSection morning={log.morning!} onChange={handleMorningChange} />
            
            <SleepSection 
                sleep={log.sleep!} 
                onChange={handleSleepChange}
                onAddNap={() => { setEditTarget(null); setModalState(s => ({ ...s, nap: true })); }}
                onEditNap={(nap) => handleEdit('nap', nap)}
                onDeleteNap={(id) => removeItem('nap', id)}
            />

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="flex bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                    {[
                        { id: 'life', label: '生活' },
                        { id: 'env', label: '环境' },
                        { id: 'health', label: '健康' }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveMidTab(t.id as MidTabType)}
                            className={`flex-1 py-4 text-sm font-black transition-all relative ${activeMidTab === t.id ? 'text-brand-accent' : 'text-slate-400'}`}
                        >
                            {t.label}
                            {activeMidTab === t.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-accent rounded-full animate-in zoom-in duration-300"></div>}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[340px]">
                    {activeMidTab === 'life' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* 饮酒列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">饮酒</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, alc: true })); }} className="text-[11px] text-amber-600 font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.alcoholRecords?.map(record => (
                                        <div key={record.id} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500"><Beer size={18}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                        {record.totalGrams}克 <span className="text-[10px] text-slate-400">纯酒精</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">{record.items.map(i => i.name).join(', ')} · {record.time}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('alc', record)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('alcohol', record.id)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.alcoholRecords || log.alcoholRecords.length === 0) && <p className="text-[11px] text-slate-300 italic pl-1">未记录饮酒</p>}
                                </div>
                            </div>

                            {/* 提神饮品列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">提神饮品</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, bev: true })); }} className="text-[11px] text-orange-600 font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.caffeineRecord?.items.map(item => (
                                        <div key={item.id} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 ${item.isDaily ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-500'} rounded-xl flex items-center justify-center`}>
                                                    {item.isDaily ? <RotateCcw size={18} className="animate-spin-slow" /> : <Coffee size={18}/>}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-black ${item.isDaily ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                        {item.time} · {item.isDaily ? '全天日常饮用' : `${item.volume}毫升`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('bev', item)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('caffeine', item.id)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && <p className="text-[11px] text-slate-300 italic pl-1">未记录饮品</p>}
                                </div>
                            </div>

                            {/* 运动列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">运动</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, ex: true })); }} className="text-[11px] text-emerald-600 font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.exercise?.map(item => (
                                        <div key={item.id} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500"><Dumbbell size={18}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">{item.type}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{item.duration}分钟 · {item.startTime}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('ex', item)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('exercise', item.id)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.exercise || log.exercise.length === 0) && <p className="text-[11px] text-slate-300 italic pl-1">未记录运动</p>}
                                </div>
                            </div>

                            {/* 看片 */}
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">看片</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'none', label: '无' },
                                        { id: 'low', label: '少量' },
                                        { id: 'medium', label: '适量' },
                                        { id: 'high', label: '沉迷' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setField('pornConsumption', opt.id)}
                                            className={`flex-1 py-3.5 rounded-2xl text-xs font-black border transition-all ${log.pornConsumption === opt.id ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-accent border-brand-accent shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 性活动 */}
                            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">性活动</label>
                                <div className="space-y-3 mb-5">
                                    {log.masturbation?.map(m => (
                                        <div key={m.id} className="group flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 shadow-sm"><Hand size={18}/></div>
                                                <div>
                                                    <span className="text-xs font-black text-blue-700 dark:text-blue-400">自慰记录 <span className="font-mono opacity-50 text-[10px] ml-1">{m.startTime} · {m.duration}分</span></span>
                                                    <div className="text-[9px] text-blue-500/70 font-bold">{m.contentItems?.length ? m.contentItems.map(i => i.type).join(', ') : '无素材'}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('mb', m)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors shadow-sm"><Edit3 size={16}/></button>
                                                <button onClick={() => removeItem('masturbation', m.id)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {log.sex?.map(s => (
                                        <div key={s.id} className="group flex justify-between items-center bg-pink-50/50 dark:bg-pink-900/10 p-3.5 rounded-2xl border border-pink-100 dark:border-pink-900/30 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-pink-500 shadow-sm"><Heart size={18} fill="currentColor" fillOpacity={0.2}/></div>
                                                <div>
                                                    <span className="text-xs font-black text-pink-700 dark:text-pink-400">{s.interactions?.[0]?.partner || '性爱记录'} <span className="font-mono opacity-50 text-[10px] ml-1">{s.startTime} · {s.duration}分</span></span>
                                                    <div className="text-[9px] text-pink-500/70 font-bold">{s.interactions?.length || 1} 阶段</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('sex', s)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-brand-accent transition-colors shadow-sm"><Edit3 size={16}/></button>
                                                <button onClick={() => removeItem('sex', s.id)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, sex: true })); }} className="flex-1 py-4 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-pink-100 dark:border-pink-900/50 active:scale-95 transition-all">
                                        <Heart size={16} fill="currentColor" fillOpacity={0.2} /> 记录性爱
                                    </button>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, mb: true })); }} className="flex-1 py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/50 active:scale-95 transition-all">
                                        <Hand size={16} /> 记录自慰
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMidTab === 'env' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {[
                                { label: '天气', field: 'weather', options: [
                                    { id: 'sunny', label: '晴', icon: Sun }, { id: 'cloudy', label: '多云', icon: Cloud }, { id: 'rainy', label: '雨', icon: CloudRain }, { id: 'snowy', label: '雪', icon: Snowflake }, { id: 'windy', label: '大风', icon: Wind }, { id: 'foggy', label: '雾', icon: CloudFog }
                                ]},
                                { label: '地点', field: 'location', options: [
                                    { id: 'home', label: '家', icon: Home }, { id: 'partner', label: '伴侣家', icon: Navigation }, { id: 'hotel', label: '酒店', icon: Hotel }, { id: 'travel', label: '旅途', icon: Plane }, { id: 'other', label: '其他', icon: MapPin }
                                ]},
                                { label: '睡衣', field: 'sleep_attire', options: [
                                    { id: 'naked', label: '裸睡', icon: Droplets }, { id: 'light', label: '内衣', icon: Shirt }, { id: 'pajamas', label: '睡衣', icon: Shirt }, { id: 'other', label: '其他', icon: Sparkles }
                                ]}
                            ].map(group => (
                                <div key={group.label} className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{group.label}</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {group.options.map(opt => {
                                            const isSelected = group.field === 'sleep_attire' ? log.sleep?.attire === opt.id : (log as any)[group.field] === opt.id;
                                            return (
                                                <button 
                                                    key={opt.id} 
                                                    onClick={() => group.field === 'sleep_attire' ? handleSleepChange('attire', opt.id) : setField(group.field as any, opt.id)} 
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-90 ${isSelected ? 'border-brand-accent bg-blue-50 dark:bg-blue-500/20 text-brand-accent dark:text-blue-400 shadow-md' : 'border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <opt.icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
                                                    <span className="text-[10px] font-black">{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeMidTab === 'health' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">心情</label>
                                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => setField('mood', v)} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">压力等级</label>
                                <FaceSelector options={STRESS_FACES} value={log.stressLevel || null} onChange={v => setField('stressLevel', v)} />
                            </div>
                            
                            <div className={`mt-6 rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${log.health?.isSick ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <ShieldAlert className={log.health?.isSick ? 'text-red-500 animate-pulse' : 'text-slate-400 dark:text-slate-600'} size={20}/>
                                        <span className={`text-sm font-black ${log.health?.isSick ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>身体不适</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="toggle-checkbox" 
                                        checked={log.health?.isSick || false} 
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setLog(prev => ({ 
                                                ...prev, 
                                                health: { 
                                                    ...(prev.health || { isSick: false, symptoms: [], medications: [] }), 
                                                    isSick: checked,
                                                    discomfortLevel: checked ? (prev.health?.discomfortLevel || 'mild') : undefined,
                                                    symptoms: checked ? (prev.health?.symptoms || []) : [],
                                                    medications: checked ? (prev.health?.medications || []) : []
                                                } 
                                            }));
                                            markDirty();
                                        }} 
                                    />
                                </div>

                                {log.health?.isSick && (
                                    <div className="px-5 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-red-600/70 dark:text-red-400/50 uppercase tracking-widest block">程度评价</label>
                                            <div className="flex bg-white dark:bg-slate-900/50 rounded-xl p-1 border border-red-100 dark:border-red-900/30 shadow-sm">
                                                {[
                                                    { v: 'mild', l: '轻微' },
                                                    { v: 'moderate', l: '明显' },
                                                    { v: 'severe', l: '很难受' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.v}
                                                        onClick={() => {
                                                            setLog(prev => ({ ...prev, health: { ...prev.health!, discomfortLevel: opt.v as any } }));
                                                            markDirty();
                                                        }}
                                                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${log.health?.discomfortLevel === opt.v ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                                    >
                                                        {opt.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-red-600/70 dark:text-red-400/50 uppercase tracking-widest block">具体症状</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['头痛', '喉咙痛', '胃不适', '肌肉酸痛', '发烧', '鼻塞', '乏力', '咳嗽'].map(s => {
                                                    const isSelected = log.health?.symptoms?.includes(s);
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => {
                                                                const current = log.health?.symptoms || [];
                                                                const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                                                                setLog(prev => ({ ...prev, health: { ...prev.health!, symptoms: next } }));
                                                                markDirty();
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isSelected ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-red-100 dark:border-red-900/30">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">用药情况</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['感冒药', '止痛药', '助眠药', '消炎药', '维生素'].map(m => {
                                                    const isSelected = log.health?.medications?.includes(m);
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => {
                                                                const current = log.health?.medications || [];
                                                                const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
                                                                setLog(prev => ({ ...prev, health: { ...prev.health!, medications: next } }));
                                                                markDirty();
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-5">
                    <StickyNote size={18} className="text-brand-muted" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">备注与事件</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-5">
                    {['加班', '吵架', '出差', '聚会', '家庭烦心事', '生病'].map(evt => (
                        <button 
                            key={evt}
                            onClick={() => {
                                const current = log.dailyEvents || [];
                                const next = current.includes(evt) ? current.filter(x => x !== evt) : [...current, evt];
                                setField('dailyEvents', next);
                            }}
                            className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all ${log.dailyEvents?.includes(evt) ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:bg-slate-100'}`}
                        >
                            {evt}
                        </button>
                    ))}
                </div>

                <div className="relative group mb-4 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                        <input 
                            value={eventSearch}
                            onChange={(e) => setEventSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="搜索或创建事件标签..."
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateEventTag()}
                        />
                    </div>
                    {eventSearch.trim() && (
                        <button 
                            onClick={handleCreateEventTag}
                            className="px-6 bg-blue-50 dark:bg-blue-900/30 text-brand-accent rounded-2xl font-black text-xs flex items-center gap-2 border border-blue-100 dark:border-blue-900 animate-in fade-in slide-in-from-right-2 transition-all active:scale-95"
                        >
                            <Plus size={16} strokeWidth={3} /> 创建
                        </button>
                    )}
                </div>

                <textarea 
                    value={log.notes || ''}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="今天感觉如何？写点什么吧..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] p-5 text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 outline-none min-h-[140px] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
            </div>

            <div className="flex gap-4 pt-4 pb-12">
                <button 
                    onClick={() => { onSave({ ...log, status: 'pending' }); }}
                    className="flex-1 py-5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-lg rounded-[2rem] shadow-soft border border-slate-100 dark:border-white/5 active:scale-95 transition-all"
                >
                    保存草稿
                </button>
                <button 
                    onClick={() => { onSave({ ...log, status: 'completed' }); }}
                    className="flex-[2] py-5 bg-brand-accent text-white font-black text-lg rounded-[2rem] shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Check size={26} strokeWidth={3.5} />
                    完成记录
                </button>
            </div>

            {/* 弹窗集合 */}
            <BeverageModal 
                isOpen={modalState.bev} 
                onClose={() => { setModalState(s => ({ ...s, bev: false })); setEditTarget(null); }} 
                data={{
                    initialData: editTarget?.type === 'bev' ? editTarget.data : undefined
                }}
                actions={{
                    onSave: (i) => {
                        const current = log.caffeineRecord || { totalCount: 0, items: [] };
                        const exists = current.items.find(x => x.id === i.id);
                        const newItems = exists ? current.items.map(x => x.id === i.id ? i : x) : [...current.items, i];
                        setLog(prev => ({ ...prev, caffeineRecord: { totalCount: newItems.length, items: newItems } }));
                    }
                }}
            />
            <SexRecordModal 
                isOpen={modalState.sex} 
                onClose={() => { setModalState(s => ({ ...s, sex: false })); setEditTarget(null); }} 
                initialData={editTarget?.type === 'sex' ? editTarget.data : undefined}
                onSave={(r) => { 
                    const current = log.sex || [];
                    const exists = current.find(x => x.id === r.id);
                    setField('sex', exists ? current.map(x => x.id === r.id ? r : x) : [...current, r]);
                    setModalState(s => ({ ...s, sex: false })); 
                }} 
                dateStr={log.date}
                data={{
                    partners,
                    logs
                }}
            />
            <MasturbationRecordModal 
                isOpen={modalState.mb} 
                onClose={() => { setModalState(s => ({ ...s, mb: false })); setEditTarget(null); }} 
                initialData={editTarget?.type === 'mb' ? editTarget.data : undefined}
                onSave={(r) => { 
                    const current = log.masturbation || [];
                    const exists = current.find(x => x.id === r.id);
                    setField('masturbation', exists ? current.map(x => x.id === r.id ? r : x) : [...current, r]);
                    setModalState(s => ({ ...s, mb: false })); 
                }} 
                dateStr={log.date}
                data={{
                    logs,
                    partners,
                    userTags
                }}
                actions={{
                    onAddOrUpdateLog,
                    onAddOrUpdateTag,
                    onDeleteTag
                }}
            />
            <ExerciseRecordModal 
                isOpen={modalState.ex} 
                onClose={() => { setModalState(s => ({ ...s, ex: false })); setEditTarget(null); }} 
                data={{
                    initialData: editTarget?.type === 'ex' ? editTarget.data : undefined
                }}
                actions={{
                    onSave: (r) => {
                        const current = log.exercise || [];
                        const exists = current.find(x => x.id === r.id);
                        setField('exercise', exists ? current.map(x => x.id === r.id ? r : x) : [...current, r]);
                        setModalState(s => ({ ...s, ex: false }));
                    }
                }}
            />
            <AlcoholRecordModal 
                isOpen={modalState.alc} 
                onClose={() => { setModalState(s => ({ ...s, alc: false })); setEditTarget(null); }} 
                data={{
                    initialData: editTarget?.type === 'alc' ? editTarget.data : undefined
                }}
                actions={{
                    onSave: handleSaveAlcohol
                }}
            />
            <NapRecordModal
                isOpen={modalState.nap}
                onClose={() => { setModalState(s => ({ ...s, nap: false })); setEditTarget(null); }}
                data={{
                    initialData: editTarget?.type === 'nap' ? editTarget.data : undefined
                }}
                actions={{
                    onSave: (r) => {
                        const current = log.sleep?.naps || [];
                        const exists = current.find(x => x.id === r.id);
                        handleSleepChange('naps', exists ? current.map(x => x.id === r.id ? r : x) : [...current, r]);
                    }
                }}
            />
        </div>
    );
};

export default LogForm;
