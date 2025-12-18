
import React, { useState, useCallback, useMemo } from 'react';
import { 
    Plus, Heart, Hand, Dumbbell, 
    StickyNote, Check, Trash2, Clock, MapPin, 
    Zap, Activity, Sparkles, Sun, Cloud, CloudRain, 
    Snowflake, Wind, CloudFog, Home, Navigation, Hotel, Plane, 
    Shirt, Droplets, ShieldAlert, Search, Coffee, Film, BrainCircuit
} from 'lucide-react';
import BeverageModal from './BeverageModal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import { 
    LogEntry, PartnerProfile, Weather, Location, SleepAttire, AlcoholRecord
} from '../types';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from './FormControls';
import { calculateDataQuality, formatDateFriendly } from '../utils/helpers';

interface LogFormProps {
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[];
  partners: PartnerProfile[];
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
                <span className="text-[8px] font-black text-slate-400 leading-none uppercase">Quality</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">{score}</span>
            </div>
        </div>
    );
};

const LogForm: React.FC<LogFormProps> = ({ onSave, existingLog, logDate, onDirtyStateChange, logs, partners }) => {
    const [log, setLog] = useState<LogEntry>(existingLog || { 
        date: logDate || '', status: 'completed', updatedAt: Date.now(),
        morning: { id: `m_${Date.now()}`, timestamp: Date.now(), wokeWithErection: true, wokenByErection: false },
        sleep: { id: `s_${Date.now()}`, quality: 3, naturalAwakening: true, nocturnalEmission: false, withPartner: false, naps: [], hasDream: false, dreamTypes: [], environment: { location: 'home', temperature: 'comfortable' } },
        exercise: [], sex: [], masturbation: [], dailyEvents: [], tags: [],
        health: { isSick: false, symptoms: [], medications: [] },
        changeHistory: []
    } as LogEntry);

    const [activeMidTab, setActiveMidTab] = useState<MidTabType>('life');
    const [modalState, setModalState] = useState({ bev: false, sex: false, mb: false, ex: false, alc: false });
    const [eventSearch, setEventSearch] = useState('');

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);
    const qualityScore = useMemo(() => calculateDataQuality(log), [log]);

    const setField = (field: keyof LogEntry, value: any) => {
        setLog(prev => ({ ...prev, [field]: value }));
        markDirty();
    };

    const handleMorningChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } }));
        markDirty();
    };

    const handleSleepChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
        markDirty();
    };

    const removeItem = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeine' | 'alcohol', id: string) => {
        if (field === 'caffeine') {
            const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
            setLog(prev => ({ ...prev, caffeineRecord: { totalCount: newItems.length, items: newItems } }));
        } else if (field === 'alcohol') {
            setField('alcoholRecord', null);
            setField('alcohol', 'none');
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
        setLog(prev => ({ 
            ...prev, 
            alcoholRecord: r, 
            alcohol: r.totalGrams > 50 ? 'high' : r.totalGrams > 20 ? 'medium' : 'low' 
        }));
        markDirty();
    };

    return (
        <div className="space-y-6">
            {/* 0. 顶部日期卡片 */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft border border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex-1 pr-4">
                    <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 leading-tight">
                        {log.date ? formatDateFriendly(log.date).replace(/年|月|日/g, (m) => m === '日' ? '日 ' : m) : '未设置日期'}
                    </h2>
                </div>
                <QualityScoreRing score={qualityScore} />
            </div>

            {/* 1. 晨间状态卡片 */}
            <MorningSection morning={log.morning!} onChange={handleMorningChange} />
            
            {/* 2. 睡眠周期卡片 */}
            <SleepSection 
                sleep={log.sleep!} 
                onChange={handleSleepChange}
                onAddNap={() => {/* 午休逻辑 */}}
                onEditNap={() => {}}
                onDeleteNap={(id) => handleSleepChange('naps', log.sleep?.naps.filter(n => n.id !== id))}
            />

            {/* 3. 中部 Tab 切换区 */}
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
                    {/* 生活 Tab */}
                    {activeMidTab === 'life' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">饮酒</label>
                                    {log.alcoholRecord ? (
                                        <div 
                                            onClick={() => setModalState(s => ({ ...s, alc: true }))}
                                            className="relative aspect-square bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer group hover:border-amber-400 transition-all shadow-sm"
                                        >
                                            <div className="text-2xl mb-1">🍺</div>
                                            <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                                {log.alcoholRecord.totalGrams}<span className="text-[10px] ml-0.5">g</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-amber-500/70 mt-1 uppercase tracking-tighter line-clamp-1 px-1">
                                                {log.alcoholRecord.items.length} 种饮品
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeItem('alcohol', ''); }}
                                                className="absolute -top-1 -right-1 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-slate-100 dark:border-slate-700"
                                            >
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setModalState(s => ({ ...s, alc: true }))}
                                            className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 hover:border-brand-accent hover:text-brand-accent transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-950/30"
                                        >
                                            <Plus size={24} strokeWidth={3} />
                                            <span className="text-[10px] font-black mt-2">添加记录</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">看片</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'none', label: '无' },
                                            { id: 'low', label: '少量' },
                                            { id: 'medium', label: '适量' },
                                            { id: 'high', label: '沉迷' }
                                        ].map(opt => (
                                            <button 
                                                key={opt.id}
                                                onClick={() => setField('pornConsumption', opt.id)}
                                                className={`py-3 rounded-2xl text-xs font-black border transition-all ${log.pornConsumption === opt.id ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-accent border-brand-accent shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">咖啡因</label>
                                    <button onClick={() => setModalState(s => ({ ...s, bev: true }))} className="text-[10px] text-brand-accent font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.caffeineRecord?.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                            <button onClick={() => removeItem('caffeine', item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && <p className="text-[11px] text-slate-300 italic pl-1">无记录</p>}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">运动</label>
                                    <button onClick={() => setModalState(s => ({ ...s, ex: true }))} className="text-[10px] text-emerald-500 font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.exercise?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.type}</span>
                                            <button onClick={() => removeItem('exercise', item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    {(!log.exercise || log.exercise.length === 0) && <p className="text-[11px] text-slate-300 italic pl-1">无记录</p>}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">性活动</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setModalState(s => ({ ...s, sex: true }))} className="flex-1 py-4 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-pink-100 dark:border-pink-900/50 active:scale-95 transition-all">
                                        <Heart size={16} fill="currentColor" fillOpacity={0.2} /> 记录性爱
                                    </button>
                                    <button onClick={() => setModalState(s => ({ ...s, mb: true }))} className="flex-1 py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/50 active:scale-95 transition-all">
                                        <Hand size={16} /> 记录自慰
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 环境 Tab */}
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

                    {/* 健康 Tab */}
                    {activeMidTab === 'health' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">心情 (MOOD)</label>
                                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => setField('mood', v)} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">压力等级 (STRESS)</label>
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

            {/* 4. 底部备注卡片 */}
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

            {/* 5. 底部操作栏 */}
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

            {/* 弹窗 */}
            <BeverageModal isOpen={modalState.bev} onClose={() => setModalState(s => ({ ...s, bev: false }))} onSave={(i) => { const current = log.caffeineRecord || { totalCount: 0, items: [] }; setLog(prev => ({ ...prev, caffeineRecord: { totalCount: current.items.length + 1, items: [...current.items, i] } })); }} />
            <SexRecordModal isOpen={modalState.sex} onClose={() => setModalState(s => ({ ...s, sex: false }))} onSave={(r) => { setField('sex', [...(log.sex || []), r]); setModalState(s => ({ ...s, sex: false })); }} dateStr={log.date} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={modalState.mb} onClose={() => setModalState(s => ({ ...s, mb: false }))} onSave={(r) => { setField('masturbation', [...(log.masturbation || []), r]); setModalState(s => ({ ...s, mb: false })); }} dateStr={log.date} logs={logs} partners={partners} />
            <ExerciseRecordModal isOpen={modalState.ex} onClose={() => setModalState(s => ({ ...s, ex: false }))} onSave={(r) => { setField('exercise', [...(log.exercise || []), r]); setModalState(s => ({ ...s, ex: false })); }} />
            <AlcoholRecordModal isOpen={modalState.alc} onClose={() => setModalState(s => ({ ...s, alc: false }))} onSave={handleSaveAlcohol} initialData={log.alcoholRecord || undefined} />
        </div>
    );
};

export default LogForm;
