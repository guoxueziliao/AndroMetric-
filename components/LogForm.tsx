
import React, { useState, useCallback, useMemo } from 'react';
import { StickyNote, Check, Trash2, Clock, MapPin, Zap, Activity, Sparkles, Sun, Cloud, CloudRain, Snowflake, Wind, CloudFog, Home, Navigation, Hotel, Plane, Shirt, Droplets, ShieldAlert, Search, Coffee, Film, BrainCircuit, Edit3, ChevronRight, Beer, Hand, Heart, Dumbbell } from 'lucide-react';
import BeverageModal from './BeverageModal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal';
import AlcoholRecordModal from './AlcoholRecordModal';
import NapRecordModal from './NapRecordModal';
import SupplementPillbox from './SupplementPillbox';
import { LogEntry, PartnerProfile, AlcoholRecord, CaffeineItem } from '../types';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from './FormControls';
import { calculateDataQuality, formatDateFriendly } from '../utils/helpers';
import { useData } from '../contexts/DataContext';

interface LogFormProps {
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[];
  partners: PartnerProfile[];
}

type MidTabType = 'life' | 'env' | 'health';

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

const LogForm: React.FC<LogFormProps> = ({ onSave, existingLog, logDate, onDirtyStateChange, logs, partners }) => {
    const { supplements } = useData();
    const [log, setLog] = useState<LogEntry>(existingLog || { 
        date: logDate || '', status: 'completed', updatedAt: Date.now(),
        morning: { id: `m_${Date.now()}`, timestamp: Date.now(), wokeWithErection: true, wokenByErection: false },
        sleep: { id: `s_${Date.now()}`, quality: 3, naturalAwakening: true, nocturnalEmission: false, withPartner: false, naps: [], hasDream: false, dreamTypes: [], environment: { location: 'home', temperature: 'comfortable' } },
        exercise: [], sex: [], masturbation: [], dailyEvents: [], tags: [],
        health: { isSick: false, symptoms: [], medications: [] },
        changeHistory: [],
        alcoholRecords: [],
        supplementIntake: []
    } as LogEntry);

    const [activeMidTab, setActiveMidTab] = useState<MidTabType>('life');
    const [modalState, setModalState] = useState({ bev: false, sex: false, mb: false, ex: false, alc: false, nap: false });
    const [editTarget, setEditTarget] = useState<{ type: string, data: any } | null>(null);

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);
    const qualityScore = useMemo(() => calculateDataQuality(log), [log]);
    const activeSupplements = useMemo(() => supplements.filter(s => s.isActive), [supplements]);

    const setField = (field: keyof LogEntry, value: any) => { setLog(prev => ({ ...prev, [field]: value })); markDirty(); };
    const handleMorningChange = (field: any, value: any) => { setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } })); markDirty(); };
    const handleSleepChange = (field: any, value: any) => { setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } })); markDirty(); };

    const handleSaveAlcohol = (record: AlcoholRecord) => {
        const nextRecords = log.alcoholRecords.find(r => r.id === record.id) ? log.alcoholRecords.map(r => r.id === record.id ? record : r) : [...log.alcoholRecords, record];
        const totalGrams = nextRecords.reduce((s, r) => s + r.totalGrams, 0);
        setLog(prev => ({ ...prev, alcohol: totalGrams > 50 ? 'high' : totalGrams > 20 ? 'medium' : 'low', alcoholRecords: nextRecords }));
        markDirty();
    };

    const handleEdit = (type: 'alc' | 'bev' | 'ex' | 'sex' | 'mb' | 'nap', data: any) => { setEditTarget({ type, data }); setModalState(s => ({ ...s, [type]: true })); };
    const removeItem = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeine' | 'alcohol' | 'nap', id: string) => {
        if (!window.confirm(`确定要删除这条记录吗？`)) return;
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

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-soft flex justify-between items-center border border-slate-100 dark:border-white/5">
                <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 leading-tight">{log.date ? formatDateFriendly(log.date) : '未设置日期'}</h2>
                <QualityScoreRing score={qualityScore} />
            </div>

            <MorningSection morning={log.morning!} onChange={handleMorningChange} />
            <SleepSection sleep={log.sleep!} onChange={handleSleepChange} onAddNap={() => { setEditTarget(null); setModalState(s => ({ ...s, nap: true })); }} onEditNap={(nap) => handleEdit('nap', nap)} onDeleteNap={(id) => removeItem('nap', id)} />

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="flex bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                    {['life', 'env', 'health'].map(t => (
                        <button key={t} onClick={() => setActiveMidTab(t as MidTabType)} className={`flex-1 py-4 text-sm font-black transition-all relative ${activeMidTab === t ? 'text-brand-accent' : 'text-slate-400'}`}>
                            {t === 'life' ? '生活' : t === 'env' ? '环境' : '健康'}
                            {activeMidTab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-accent rounded-full"></div>}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[340px]">
                    {activeMidTab === 'health' && (
                        <div className="space-y-8">
                            <SupplementPillbox activeSupplements={activeSupplements} intakes={log.supplementIntake} onChange={val => setField('supplementIntake', val)} />
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase block pl-1">今日心情</label>
                                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => setField('mood', v)} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase block pl-1">压力等级</label>
                                <FaceSelector options={STRESS_FACES} value={log.stressLevel || null} onChange={v => setField('stressLevel', v)} />
                            </div>
                        </div>
                    )}

                    {activeMidTab === 'life' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, sex: true })); }} className="py-4 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2"><Heart size={16}/> 记录性爱</button>
                                <button onClick={() => { setEditTarget(null); setModalState(s => ({ ...s, mb: true })); }} className="py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2"><Hand size={16}/> 记录自慰</button>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">饮酒</label>
                                    <button onClick={() => setModalState(s => ({ ...s, alc: true }))} className="text-xs text-amber-600 font-bold">+ 添加</button>
                                </div>
                                <div className="space-y-2">
                                    {log.alcoholRecords?.map(r => (
                                        <div key={r.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                                            <div className="flex items-center gap-2"><Beer size={16} className="text-amber-500"/><span className="text-sm font-bold">{r.totalGrams}g 酒精</span></div>
                                            <div className="flex gap-2"><button onClick={() => handleEdit('alc', r)}><Edit3 size={14}/></button><button onClick={() => removeItem('alcohol', r.id)}><Trash2 size={14}/></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-soft border border-slate-100 dark:border-white/5">
                <textarea value={log.notes || ''} onChange={(e) => setField('notes', e.target.value)} placeholder="记录今天的心情、特别事件或身体感悟..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-medium outline-none border-none min-h-[120px] resize-none" />
            </div>

            <div className="flex gap-4">
                <button onClick={() => onSave({ ...log, status: 'pending' })} className="flex-1 py-5 bg-white text-slate-500 font-black rounded-3xl shadow-sm">保存草稿</button>
                <button onClick={() => onSave({ ...log, status: 'completed' })} className="flex-[2] py-5 bg-brand-accent text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-2"><Check size={24} strokeWidth={3}/> 完成记录</button>
            </div>

            <BeverageModal isOpen={modalState.bev} onClose={() => setModalState(s => ({ ...s, bev: false }))} initialData={editTarget?.data} onSave={(i) => {}} />
            <SexRecordModal isOpen={modalState.sex} onClose={() => setModalState(s => ({ ...s, sex: false }))} initialData={editTarget?.data} onSave={(r) => {}} dateStr={log.date} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={modalState.mb} onClose={() => setModalState(s => ({ ...s, mb: false }))} initialData={editTarget?.data} onSave={(r) => {}} dateStr={log.date} logs={logs} partners={partners} />
            <ExerciseRecordModal isOpen={modalState.ex} onClose={() => setModalState(s => ({ ...s, ex: false }))} initialData={editTarget?.data} onSave={(r) => {}} />
            <AlcoholRecordModal isOpen={modalState.alc} onClose={() => setModalState(s => ({ ...s, alc: false }))} onSave={handleSaveAlcohol} initialData={editTarget?.data} />
            <NapRecordModal isOpen={modalState.nap} onClose={() => setModalState(s => ({ ...s, nap: false }))} initialData={editTarget?.data} onSave={(r) => {}} />
        </div>
    );
};

export default LogForm;
