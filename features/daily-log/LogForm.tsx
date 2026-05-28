import React, { useState, useCallback, useMemo } from 'react';
import {
    Plus, Heart, Hand, Dumbbell,
    StickyNote, Check, Trash2, MapPin,
    Sparkles, Sun, Cloud, CloudRain,
    Snowflake, Wind, CloudFog, Home, Navigation, Hotel, Plane,
    Shirt, Droplets, ShieldAlert, Search, Coffee, Edit3, Beer, RotateCcw
} from 'lucide-react';
import { ConfirmModal, RecordCard, Switch } from '../../shared/ui';
import BeverageModal from './BeverageModal';
import ExerciseRecordModal from './ExerciseRecordModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import NapRecordModal from './NapRecordModal';
import { SexRecordModal, MasturbationRecordModal } from '../sex-life';
import type { LogEntry, PartnerProfile, AlcoholRecord, TagEntry, TagType } from '../../domain';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from '../../shared/ui';
import { formatDateFriendly } from '../../shared/lib';
import { calculateDataQuality } from '../../domain';
import { hydrateLog } from '../../core/storage';
import { MENSTRUAL_OPTIONS, SUPPLEMENT_OPTIONS, type MidTabType } from './model/logFormData';
import QualityScoreRing from './QualityScoreRing';

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
  onAddOrUpdatePartner?: (partner: PartnerProfile) => Promise<void>;
}

interface LogFormProps {
  data: LogFormData;
  actions: LogFormActions;
}

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
        onDeleteTag,
        onAddOrUpdatePartner
    } = actions;

    const handleAddPartnerByName = useCallback(async (name: string): Promise<PartnerProfile | null> => {
        if (!onAddOrUpdatePartner) return null;
        const colors = ['bg-accent-vivid', 'bg-chart-tertiary', 'bg-state-info-text', 'bg-state-success-text', 'bg-state-warning-text', 'bg-state-danger-text'];
        const newPartner: PartnerProfile = {
            id: `partner_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            avatarColor: colors[partners.length % colors.length]
        } as PartnerProfile;
        await onAddOrUpdatePartner(newPartner);
        return newPartner;
    }, [onAddOrUpdatePartner, partners.length]);

    const [log, setLog] = useState<LogEntry>(() => {
        const base = hydrateLog(existingLog ? { ...existingLog } : { date: logDate || '' });

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
        // Post-0.0.8: preserve nullable signal (未记录) rather than forcing wokeWithErection=true
        const wokeWithErection = base.morning?.wokeWithErection ?? null;
        return {
            ...base,
            morning: {
                ...base.morning,
                wokeWithErection,
                hardness: base.morning?.hardness ?? null,
                retention: base.morning?.retention ?? null,
                id: base.morning?.id || `m_${Date.now()}`,
                timestamp: base.morning?.timestamp || Date.now()
            } as any,
            touchedPaths: Array.isArray(base.touchedPaths) ? [...base.touchedPaths] : []
        };
    });

    const [activeMidTab, setActiveMidTab] = useState<MidTabType>('sex');
    const [modalState, setModalState] = useState({ bev: false, sex: false, mb: false, ex: false, alc: false, nap: false });
    const [eventSearch, setEventSearch] = useState('');
    
    // 编辑中的单项数据
    const [editTarget, setEditTarget] = useState<{ type: string, data: any } | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<{ field: 'sex' | 'masturbation' | 'exercise' | 'caffeine' | 'alcohol' | 'nap', id: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const performSave = async (status: 'pending' | 'completed') => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave({ ...log, status });
        } finally {
            setIsSaving(false);
        }
    };

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);
    const qualityScore = useMemo(() => calculateDataQuality(log), [log]);
    const markPathTouched = useCallback((path: string) => {
        setLog(prev => ({
            ...prev,
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), path]))
        }));
    }, []);
    const markPathsTouched = useCallback((paths: string[]) => {
        setLog(prev => ({
            ...prev,
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), ...paths]))
        }));
    }, []);

    const setField = (field: keyof LogEntry, value: any) => {
        setLog(prev => ({
            ...prev,
            [field]: value,
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), String(field)]))
        }));
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
            return {
                ...prev,
                morning: newMorning,
                touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), `morning.${String(field)}`]))
            };
        });
        markDirty();
    };

    const handleSleepChange = (field: any, value: any) => {
        setLog(prev => ({
            ...prev,
            sleep: { ...prev.sleep!, [field]: value },
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), `sleep.${String(field)}`]))
        }));
        markDirty();
    };

    const handleEdit = (type: 'alc' | 'bev' | 'ex' | 'sex' | 'mb' | 'nap', data: any) => {
        setEditTarget({ type, data });
        setModalState(s => ({ ...s, [type]: true }));
    };

    type RemovableField = 'sex' | 'masturbation' | 'exercise' | 'caffeine' | 'alcohol' | 'nap';
    const fieldNameMap: Record<RemovableField, string> = {
        'sex': '性爱记录',
        'masturbation': '自慰记录',
        'exercise': '运动记录',
        'caffeine': '提神饮品',
        'alcohol': '饮酒记录',
        'nap': '午休记录'
    };

    const removeItem = (field: RemovableField, id: string) => {
        setPendingRemoval({ field, id });
    };

    const confirmRemoval = () => {
        if (!pendingRemoval) return;
        const { field, id } = pendingRemoval;
        if (field === 'caffeine') {
            const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
            setLog(prev => ({ ...prev, caffeineRecord: { totalCount: newItems.length, items: newItems } }));
            markPathsTouched(['caffeineRecord.items', 'caffeineRecord.totalCount']);
        } else if (field === 'alcohol') {
            setLog(prev => ({ ...prev, alcoholRecords: prev.alcoholRecords.filter(r => r.id !== id) }));
            markPathsTouched(['alcoholRecords', 'alcohol']);
        } else if (field === 'nap') {
            handleSleepChange('naps', (log.sleep?.naps || []).filter(n => n.id !== id));
        } else {
            setLog(prev => ({ ...prev, [field]: (log[field] as any[]).filter(i => i.id !== id) }));
            markPathTouched(String(field));
        }
        markDirty();
        setPendingRemoval(null);
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
            alcohol: level,
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'alcoholRecords', 'alcohol']))
        }));
        markDirty();
    };

    const setScreenTimeMinutes = (totalMinutes: number | null) => {
        setLog(prev => ({
            ...prev,
            screenTime: totalMinutes && totalMinutes > 0 ? {
                totalMinutes,
                source: prev.screenTime?.source || 'manual',
                notes: prev.screenTime?.notes || ''
            } : null,
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'screenTime.totalMinutes']))
        }));
        markDirty();
    };

    const setScreenTimeNotes = (notes: string) => {
        setLog(prev => ({
            ...prev,
            screenTime: {
                totalMinutes: prev.screenTime?.totalMinutes || 0,
                source: prev.screenTime?.source || 'manual',
                notes
            },
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'screenTime.notes']))
        }));
        markDirty();
    };

    const toggleSupplement = (name: string) => {
        setLog(prev => {
            const current = Array.isArray(prev.supplements) ? [...prev.supplements] : [];
            const existing = current.find(item => item.name === name);
            const next = existing
                ? current.filter(item => item.name !== name)
                : [...current, { id: `supp_${Date.now()}_${name}`, name, taken: true, notes: '' }];

            return {
                ...prev,
                supplements: next,
                touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'supplements']))
            };
        });
        markDirty();
    };

    const setMenstrualStatus = (status: 'unknown' | 'none' | 'period' | 'fertile_window') => {
        setLog(prev => ({
            ...prev,
            menstrual: status === 'unknown' ? { status, notes: prev.menstrual?.notes || '' } : {
                status,
                notes: prev.menstrual?.notes || ''
            },
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'menstrual.status']))
        }));
        markDirty();
    };

    const setMenstrualNotes = (notes: string) => {
        setLog(prev => ({
            ...prev,
            menstrual: {
                status: prev.menstrual?.status || 'unknown',
                notes
            },
            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'menstrual.notes']))
        }));
        markDirty();
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface-card rounded-[2rem] p-6 shadow-soft border border-surface-border flex justify-between items-center">
                <div className="flex-1 pr-4">
                    <h2 className="text-2xl font-black text-text-primary leading-tight">
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

            <div className="bg-surface-card rounded-[2rem] shadow-soft border border-surface-border overflow-hidden">
                <div className="flex bg-surface-muted/50 border-b border-surface-border">
                    {[
                        { id: 'sex', label: '性活动' },
                        { id: 'life', label: '生活' },
                        { id: 'env', label: '环境' },
                        { id: 'health', label: '健康' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveMidTab(t.id as MidTabType)}
                            className={`flex-1 py-4 text-sm font-black transition-all relative ${activeMidTab === t.id ? 'text-accent' : 'text-text-muted'}`}
                        >
                            {t.label}
                            {activeMidTab === t.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-full animate-in zoom-in duration-slow"></div>}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[340px]">
                    {activeMidTab === 'sex' && (
                        <div className="space-y-5 animate-in fade-in duration-slow">
                            <div className="space-y-3">
                                {log.masturbation?.map(m => (
                                    <RecordCard
                                        key={m.id}
                                        kind="masturbation"
                                        icon={<Hand size={18}/>}
                                        title={<>自慰记录</>}
                                        meta={`${m.startTime} · ${m.duration}分`}
                                        subline={m.contentItems?.length ? m.contentItems.map(i => i.type).join(', ') : '无素材'}
                                        onEdit={() => handleEdit('mb', m)}
                                        onDelete={() => removeItem('masturbation', m.id)}
                                    />
                                ))}
                                {log.sex?.map(s => (
                                    <RecordCard
                                        key={s.id}
                                        kind="sex"
                                        icon={<Heart size={18} fill="currentColor" fillOpacity={0.2}/>}
                                        title={s.interactions?.[0]?.partner || '性爱记录'}
                                        meta={`${s.startTime} · ${s.duration}分`}
                                        subline={`${s.interactions?.length || 1} 阶段`}
                                        onEdit={() => handleEdit('sex', s)}
                                        onDelete={() => removeItem('sex', s.id)}
                                    />
                                ))}
                                {!log.masturbation?.length && !log.sex?.length && (
                                    <p className="text-[11px] text-text-muted/70 italic pl-1">今天没有性活动记录</p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, sex: true })); }} className="flex-1 py-4 bg-accent-vivid/10 text-accent-vivid rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-accent-vivid/25 active:scale-95 transition-all">
                                    <Heart size={16} fill="currentColor" fillOpacity={0.2} /> 记录性爱
                                </button>
                                <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, mb: true })); }} className="flex-1 py-4 bg-state-info-bg text-state-info-text rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-state-info-text/25 active:scale-95 transition-all">
                                    <Hand size={16} /> 记录自慰
                                </button>
                            </div>
                        </div>
                    )}
                    {activeMidTab === 'life' && (
                        <div className="space-y-8 animate-in fade-in duration-slow">
                            {/* 饮酒列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest">饮酒</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, alc: true })); }} className="text-[11px] text-state-warning-text font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.alcoholRecords?.map(record => (
                                        <div key={record.id} className="group flex justify-between items-center bg-surface-card p-3.5 rounded-2xl border border-surface-border shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-state-warning-bg rounded-xl flex items-center justify-center text-state-warning-text"><Beer size={18}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-text-secondary">
                                                        {record.totalGrams}克 <span className="text-[10px] text-text-muted">纯酒精</span>
                                                    </div>
                                                    <div className="text-[10px] text-text-muted font-bold mt-0.5 line-clamp-1">{record.items.map(i => i.name).join(', ')} · {record.time}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('alc', record)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('alcohol', record.id)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-state-danger-text transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.alcoholRecords || log.alcoholRecords.length === 0) && <p className="text-[11px] text-text-muted/70 italic pl-1">未记录饮酒</p>}
                                </div>
                            </div>

                            {/* 提神饮品列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest">提神饮品</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, bev: true })); }} className="text-[11px] text-state-warning-text font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.caffeineRecord?.items.map(item => (
                                        <div key={item.id} className="group flex justify-between items-center bg-surface-card p-3.5 rounded-2xl border border-surface-border shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 ${item.isDaily ? 'bg-state-success-bg text-state-success-text' : 'bg-state-warning-bg text-state-warning-text'} rounded-xl flex items-center justify-center`}>
                                                    {item.isDaily ? <RotateCcw size={18} className="animate-spin-slow" /> : <Coffee size={18}/>}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-black ${item.isDaily ? 'text-state-success-text' : 'text-text-secondary'}`}>{item.name}</div>
                                                    <div className="text-[10px] text-text-muted font-bold mt-0.5">
                                                        {item.time} · {item.isDaily ? '全天日常饮用' : `${item.volume}毫升`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('bev', item)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('caffeine', item.id)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-state-danger-text transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && <p className="text-[11px] text-text-muted/70 italic pl-1">未记录饮品</p>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest">屏幕使用时间</label>
                                <div className="rounded-[1.5rem] border border-surface-border bg-surface-muted p-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            value={log.screenTime?.totalMinutes || ''}
                                            onChange={(event) => setScreenTimeMinutes(event.target.value ? Number(event.target.value) : null)}
                                            placeholder="总分钟"
                                            className="w-28 rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm font-black text-text-primary outline-none transition-all focus:border-accent"
                                        />
                                        <span className="text-xs font-bold text-text-muted">分钟 / 手动录入</span>
                                    </div>
                                    <textarea
                                        value={log.screenTime?.notes || ''}
                                        onChange={(event) => setScreenTimeNotes(event.target.value)}
                                        rows={2}
                                        placeholder="备注（可选）"
                                        className="mt-3 w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-xs font-bold text-text-secondary outline-none transition-all focus:border-accent"
                                    />
                                </div>
                            </div>

                            {/* 运动列表 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest">运动</label>
                                    <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, ex: true })); }} className="text-[11px] text-state-success-text font-black">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.exercise?.map(item => (
                                        <div key={item.id} className="group flex justify-between items-center bg-surface-card p-3.5 rounded-2xl border border-surface-border shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-state-success-bg rounded-xl flex items-center justify-center text-state-success-text"><Dumbbell size={18}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-text-secondary">{item.type}</div>
                                                    <div className="text-[10px] text-text-muted font-bold mt-0.5">{item.duration}分钟 · {item.startTime}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleEdit('ex', item)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-accent transition-colors"><Edit3 size={15}/></button>
                                                <button onClick={() => removeItem('exercise', item.id)} className="p-2 bg-surface-muted rounded-xl text-text-muted hover:text-state-danger-text transition-colors"><Trash2 size={15}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!log.exercise || log.exercise.length === 0) && <p className="text-[11px] text-text-muted/70 italic pl-1">未记录运动</p>}
                                </div>
                            </div>

                            {/* 看片 */}
                            <div>
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 block">看片</label>
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
                                            className={`flex-1 py-3.5 rounded-2xl text-xs font-black border transition-all ${log.pornConsumption === opt.id ? 'bg-accent-vivid/10 text-accent-vivid border-accent-vivid shadow-soft' : 'bg-surface-muted border-transparent text-text-muted hover:bg-surface-border'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMidTab === 'env' && (
                        <div className="space-y-8 animate-in fade-in duration-slow">
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
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{group.label}</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {group.options.map(opt => {
                                            const isSelected = group.field === 'sleep_attire' ? log.sleep?.attire === opt.id : (log as any)[group.field] === opt.id;
                                            return (
                                                <button 
                                                    key={opt.id} 
                                                    onClick={() => group.field === 'sleep_attire' ? handleSleepChange('attire', opt.id) : setField(group.field as any, opt.id)} 
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-90 ${isSelected ? 'border-accent bg-state-info-bg text-accent shadow-soft' : 'border-surface-border bg-surface-card text-text-muted hover:bg-surface-muted'}`}
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
                        <div className="space-y-10 animate-in fade-in duration-slow">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">心情</label>
                                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => setField('mood', v)} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">压力等级</label>
                                <FaceSelector options={STRESS_FACES} value={log.stressLevel || null} onChange={v => setField('stressLevel', v)} />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">补剂</label>
                                <div className="flex flex-wrap gap-2">
                                    {SUPPLEMENT_OPTIONS.map((name) => {
                                        const selected = (log.supplements || []).some(item => item.name === name && item.taken);
                                        return (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => toggleSupplement(name)}
                                                className={`rounded-xl border px-3 py-2 text-[11px] font-black transition-all ${
                                                    selected
                                                        ? 'border-state-success-text bg-state-success-bg text-state-success-text shadow-soft'
                                                        : 'border-surface-border bg-surface-card text-text-muted'
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 rounded-[1.5rem] border border-surface-border bg-surface-muted/70 p-4">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">周期摘要（兼容）</label>
                                <p className="text-[11px] font-bold text-text-muted">
                                    建议在首页九宫格的“经期”面板维护周期、备孕和怀孕事件；这里仅保留每日摘要兼容。
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {MENSTRUAL_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setMenstrualStatus(option.id)}
                                            className={`rounded-2xl border px-3 py-3 text-xs font-black transition-all ${
                                                (log.menstrual?.status || 'unknown') === option.id
                                                    ? 'border-chart-tertiary bg-chart-tertiary/10 text-chart-tertiary shadow-soft'
                                                    : 'border-surface-border bg-surface-card text-text-muted'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={log.menstrual?.notes || ''}
                                    onChange={(event) => setMenstrualNotes(event.target.value)}
                                    rows={2}
                                    placeholder="周期备注（可选）"
                                    className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-xs font-bold text-text-secondary outline-none transition-all focus:border-accent"
                                />
                            </div>
                            
                            <div className={`mt-6 rounded-[1.5rem] border transition-all duration-slow overflow-hidden ${log.health?.isSick ? 'bg-state-danger-bg/50 border-state-danger-text/25' : 'bg-surface-muted/50 border-surface-border'}`}>
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <ShieldAlert className={log.health?.isSick ? 'text-state-danger-text animate-pulse' : 'text-text-muted'} size={20}/>
                                        <span className={`text-sm font-black ${log.health?.isSick ? 'text-state-danger-text' : 'text-text-secondary'}`}>身体不适</span>
                                    </div>
                                    <Switch
                                        tone="danger"
                                        checked={log.health?.isSick || false}
                                        onCheckedChange={checked => {
                                            setLog(prev => ({
                                                ...prev,
                                                health: {
                                                    ...(prev.health || { isSick: false, symptoms: [], medications: [] }),
                                                    isSick: checked,
                                                    discomfortLevel: checked ? (prev.health?.discomfortLevel || 'mild') : undefined,
                                                    symptoms: checked ? (prev.health?.symptoms || []) : [],
                                                    medications: checked ? (prev.health?.medications || []) : []
                                                },
                                                touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'health.isSick']))
                                            }));
                                            markDirty();
                                        }} 
                                    />
                                </div>

                                {log.health?.isSick && (
                                    <div className="px-5 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-slow">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-state-danger-text/70 uppercase tracking-widest block">程度评价</label>
                                            <div className="flex bg-surface-card rounded-xl p-1 border border-state-danger-text/25 shadow-soft">
                                                {[
                                                    { v: 'mild', l: '轻微' },
                                                    { v: 'moderate', l: '明显' },
                                                    { v: 'severe', l: '很难受' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.v}
                                                        onClick={() => {
                                                            setLog(prev => ({
                                                                ...prev,
                                                                health: { ...prev.health!, discomfortLevel: opt.v as any },
                                                                touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'health.discomfortLevel']))
                                                            }));
                                                            markDirty();
                                                        }}
                                                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${log.health?.discomfortLevel === opt.v ? 'bg-state-danger-text text-text-on-accent shadow-soft' : 'text-text-muted hover:bg-state-danger-bg'}`}
                                                    >
                                                        {opt.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-state-danger-text/70 uppercase tracking-widest block">具体症状</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['头痛', '喉咙痛', '胃不适', '肌肉酸痛', '腹泻', '发烧', '鼻塞', '乏力', '咳嗽'].map(s => {
                                                    const isSelected = log.health?.symptoms?.includes(s);
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => {
                                                                const current = log.health?.symptoms || [];
                                                                const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                                                                setLog(prev => ({ ...prev, health: { ...prev.health!, symptoms: next } }));
                                                                markPathTouched('health.symptoms');
                                                                markDirty();
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isSelected ? 'bg-state-danger-text text-text-on-accent border-state-danger-text shadow-soft' : 'bg-surface-card border-surface-border text-text-muted'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-state-danger-text/20">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">用药情况</label>
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
                                                                markPathTouched('health.medications');
                                                                markDirty();
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isSelected ? 'bg-state-info-text text-text-on-accent border-state-info-text shadow-soft' : 'bg-surface-muted border-transparent text-text-muted'}`}
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

            <div className="bg-surface-card rounded-[2rem] p-6 shadow-soft border border-surface-border">
                <div className="flex items-center gap-3 mb-5">
                    <StickyNote size={18} className="text-text-muted" />
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">备注与事件</h3>
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
                            className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all ${log.dailyEvents?.includes(evt) ? 'bg-surface-inverted text-text-inverted shadow-soft' : 'bg-surface-muted text-text-secondary border border-surface-border hover:bg-surface-border'}`}
                        >
                            {evt}
                        </button>
                    ))}
                </div>

                <div className="relative group mb-4 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input 
                            value={eventSearch}
                            onChange={(e) => setEventSearch(e.target.value)}
                            className="w-full bg-surface-muted border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-text-secondary placeholder-text-muted/60 focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            placeholder="搜索或创建事件标签..."
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateEventTag()}
                        />
                    </div>
                    {eventSearch.trim() && (
                        <button 
                            onClick={handleCreateEventTag}
                            className="px-6 bg-state-info-bg text-accent rounded-2xl font-black text-xs flex items-center gap-2 border border-accent/20 animate-in fade-in slide-in-from-right-2 transition-all active:scale-95"
                        >
                            <Plus size={16} strokeWidth={3} /> 创建
                        </button>
                    )}
                </div>

                <textarea
                    value={log.notes || ''}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="今天感觉如何？写点什么吧..."
                    className="w-full bg-surface-muted border-none rounded-[1.5rem] p-5 text-sm font-medium text-text-secondary placeholder-text-muted/60 outline-none min-h-[140px] focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                />
            </div>

            <div className="sticky bottom-20 z-20 -mx-4 mt-4 px-4 pt-3 pb-3 bg-surface-base/90 backdrop-blur-md border-t border-surface-border/60 flex gap-3">
                <button
                    type="button"
                    onClick={() => performSave('pending')}
                    disabled={isSaving}
                    className="flex-1 min-h-[48px] py-3 bg-surface-card text-text-secondary font-bold text-sm rounded-2xl shadow-soft border border-surface-border active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    保存草稿
                </button>
                <button
                    type="button"
                    onClick={() => performSave('completed')}
                    disabled={isSaving}
                    className="flex-[2] min-h-[48px] py-3 bg-accent text-text-on-accent font-bold text-sm rounded-2xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <RotateCcw size={18} className="animate-spin" />
                    ) : (
                        <Check size={20} strokeWidth={3} />
                    )}
                    {isSaving ? '保存中...' : '完成记录'}
                </button>
            </div>

            {/* 弹窗集合 */}
            <BeverageModal
                isOpen={modalState.bev}
                onClose={() => { setModalState(s => ({ ...s, bev: false })); setEditTarget(null); }}
                onSwitchToOther={editTarget ? undefined : () => setModalState(s => ({ ...s, bev: false, alc: true }))}
                data={{
                    initialData: editTarget?.type === 'bev' ? editTarget.data : undefined,
                    logs
                }}
                actions={{
                    onSave: (i) => {
                        const current = log.caffeineRecord || { totalCount: 0, items: [] };
                        const exists = current.items.find(x => x.id === i.id);
                        const newItems = exists ? current.items.map(x => x.id === i.id ? i : x) : [...current.items, i];
                        setLog(prev => ({
                            ...prev,
                            caffeineRecord: { totalCount: newItems.length, items: newItems },
                            touchedPaths: Array.from(new Set([...(prev.touchedPaths || []), 'caffeineRecord.items', 'caffeineRecord.totalCount']))
                        }));
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
                onAddPartner={onAddOrUpdatePartner ? handleAddPartnerByName : undefined}
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
                    initialData: editTarget?.type === 'ex' ? editTarget.data : undefined,
                    logs
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
                onSwitchToOther={editTarget ? undefined : () => setModalState(s => ({ ...s, alc: false, bev: true }))}
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

            <ConfirmModal
                isOpen={!!pendingRemoval}
                onClose={() => setPendingRemoval(null)}
                onConfirm={confirmRemoval}
                title="删除记录"
                message={pendingRemoval ? `确定要删除这条${fieldNameMap[pendingRemoval.field]}吗?` : ''}
                confirmLabel="删除"
            />
        </div>
    );
};

export default LogForm;
