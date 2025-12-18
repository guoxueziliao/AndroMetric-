
import React, { useState, useCallback } from 'react';
import { 
    Coffee, Plus, Heart, Hand, Dumbbell, 
    StickyNote, Check, Trash2, Clock, MapPin, 
    Zap, Activity, Sparkles, BedDouble, 
    HeartPulse, BrainCircuit, Sun, Cloud, CloudRain, 
    Snowflake, Wind, CloudFog, Home, Hotel, Plane, 
    Navigation, Shirt, Droplets, MonitorPlay, ShieldAlert,
    Search
} from 'lucide-react';
import BeverageModal from './BeverageModal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal';
import { 
    LogEntry, CaffeineItem, PartnerProfile, 
    SexRecordDetails, MasturbationRecordDetails, 
    ExerciseRecord
} from '../types';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import { FaceSelector, MOOD_FACES, STRESS_FACES } from './FormControls';

interface LogFormProps {
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[];
  partners: PartnerProfile[];
}

type MidTabType = 'life' | 'env' | 'health';

const LogForm: React.FC<LogFormProps> = ({ 
  onSave, 
  existingLog, 
  logDate, 
  onDirtyStateChange, 
  logs, 
  partners 
}) => {
    const [log, setLog] = useState<LogEntry>(existingLog || { 
        date: logDate || '', 
        status: 'completed', 
        updatedAt: Date.now(),
        morning: { id: `m_${Date.now()}`, timestamp: Date.now(), wokeWithErection: true, wokenByErection: false },
        sleep: { id: `s_${Date.now()}`, quality: 3, naturalAwakening: true, nocturnalEmission: false, withPartner: false, naps: [], hasDream: false, dreamTypes: [], environment: { location: 'home', temperature: 'comfortable' } },
        exercise: [], sex: [], masturbation: [], dailyEvents: [], tags: [],
        health: { isSick: false, symptoms: [], medications: [] },
        changeHistory: []
    } as LogEntry);

    const [activeMidTab, setActiveMidTab] = useState<MidTabType>('life');
    const [modalState, setModalState] = useState({ bev: false, sex: false, mb: false, ex: false });

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);

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

    const removeItem = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeine', id: string) => {
        if (field === 'caffeine') {
            const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
            setLog(prev => ({ ...prev, caffeineRecord: { totalCount: newItems.length, items: newItems } }));
        } else {
            setLog(prev => ({ ...prev, [field]: (log[field] as any[]).filter(i => i.id !== id) }));
        }
        markDirty();
    };

    return (
        <div className="space-y-6 pb-24">
            {/* 1. 顶部基础区 - 适配深色边框 */}
            <div className="space-y-6">
                <MorningSection morning={log.morning!} onChange={handleMorningChange} />
                <SleepSection 
                    sleep={log.sleep!} 
                    onChange={handleSleepChange}
                    onAddNap={() => {/* 快速午休 */}}
                    onEditNap={() => {}}
                    onDeleteNap={(id) => handleSleepChange('naps', log.sleep?.naps.filter(n => n.id !== id))}
                />
            </div>

            {/* 2. 中部 Tab 区域 - 精细化深色模式层级 */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft dark:shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden transition-colors">
                <div className="flex bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                    {[
                        { id: 'life', label: '生活' },
                        { id: 'env', label: '环境' },
                        { id: 'health', label: '健康' }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveMidTab(t.id as MidTabType)}
                            className={`flex-1 py-4 text-sm font-black transition-all relative ${activeMidTab === t.id ? 'text-brand-accent dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}
                        >
                            {t.label}
                            {activeMidTab === t.id && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-accent dark:bg-blue-400 rounded-full animate-in fade-in zoom-in duration-300"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[340px]">
                    {/* 生活 Tab */}
                    {activeMidTab === 'life' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">饮酒</label>
                                    <div className="aspect-square border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 hover:border-brand-accent hover:text-brand-accent transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-950/30">
                                        <Plus size={24} strokeWidth={3} />
                                        <span className="text-[10px] font-black mt-2">添加饮酒</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">看片</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['none', 'low', 'medium', 'high'].map(opt => (
                                            <button 
                                                key={opt}
                                                onClick={() => setField('pornConsumption', opt)}
                                                className={`py-3 rounded-2xl text-xs font-black border transition-all ${log.pornConsumption === opt ? 'bg-blue-50 dark:bg-blue-500/20 text-brand-accent dark:text-blue-400 border-brand-accent dark:border-blue-500/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                {opt === 'none' ? '无' : opt === 'low' ? '少量' : opt === 'medium' ? '适量' : '沉迷'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 咖啡因 & 运动 列表适配 */}
                            <div className="space-y-4">
                                {[{ id: 'caffeine', label: '咖啡因', color: 'text-orange-500', btn: 'bev', items: log.caffeineRecord?.items || [] },
                                  { id: 'exercise', label: '运动健身', color: 'text-emerald-500', btn: 'ex', items: log.exercise || [] }].map(sec => (
                                    <div key={sec.id}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{sec.label}</label>
                                            <button onClick={() => setModalState(s => ({ ...s, [sec.btn]: true }))} className={`text-[10px] font-black ${sec.color} hover:opacity-80 transition-opacity`}>+ 添加记录</button>
                                        </div>
                                        <div className="space-y-2">
                                            {sec.items.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(item as any).name || (item as any).type}</span>
                                                    <button onClick={() => removeItem(sec.id as any, item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                            {sec.items.length === 0 && <p className="text-[11px] text-slate-300 dark:text-slate-700 italic pl-1">今日无记录</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 记录动作按钮 */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setModalState(s => ({ ...s, sex: true }))} className="flex-1 py-4 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-pink-100 dark:border-pink-500/20 active:scale-95 transition-all shadow-sm">
                                    <Heart size={16} fill="currentColor" fillOpacity={0.2} /> 记录性爱
                                </button>
                                <button onClick={() => setModalState(s => ({ ...s, mb: true }))} className="flex-1 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-500/20 active:scale-95 transition-all shadow-sm">
                                    <Hand size={16} /> 记录自慰
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 环境 Tab */}
                    {activeMidTab === 'env' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                            {[
                                { label: '天气', field: 'weather', options: [
                                    { id: 'sunny', label: '晴', icon: Sun }, { id: 'cloudy', label: '多云', icon: Cloud }, { id: 'rainy', label: '雨', icon: CloudRain }, { id: 'snowy', label: '雪', icon: Snowflake }, { id: 'windy', label: '大风', icon: Wind }
                                ]},
                                { label: '地点', field: 'location', options: [
                                    { id: 'home', label: '家', icon: Home }, { id: 'partner', label: '伴侣家', icon: Navigation }, { id: 'hotel', label: '酒店', icon: Hotel }, { id: 'travel', label: '旅途', icon: Plane }, { id: 'other', label: '其他', icon: MapPin }
                                ]},
                                { label: '睡衣', field: 'sleep_attire', options: [
                                    { id: 'naked', label: '裸睡', icon: Droplets }, { id: 'light', label: '内衣', icon: Shirt }, { id: 'pajamas', label: '睡衣', icon: Shirt }, { id: 'other', label: '其他', icon: Sparkles }
                                ]}
                            ].map(group => (
                                <div key={group.label} className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{group.label}</label>
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
                                                    <span className="text-[9px] font-black">{opt.label}</span>
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
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">今日心情 (MOOD)</label>
                                <FaceSelector options={MOOD_FACES} value={log.mood || null} onChange={v => setField('mood', v)} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">压力等级 (STRESS)</label>
                                <FaceSelector options={STRESS_FACES} value={log.stressLevel || null} onChange={v => setField('stressLevel', v)} />
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${log.health?.isSick ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'}`}>
                                    <div className="flex items-center gap-4">
                                        <ShieldAlert className={log.health?.isSick ? 'text-red-500' : 'text-slate-400 dark:text-slate-600'} size={20}/>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black ${log.health?.isSick ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>身体不适</span>
                                            {log.health?.isSick && <span className="text-[10px] font-bold text-red-500/70">建议详细记录症状</span>}
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="toggle-checkbox" 
                                        checked={log.health?.isSick || false} 
                                        onChange={e => setLog(prev => ({ ...prev, health: { ...prev.health!, isSick: e.target.checked } }))} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 底部备注区 - 增强深色模式文字对比 */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft dark:shadow-2xl border border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex items-center gap-3 mb-5 pl-1">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500"><StickyNote size={18} /></div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">备注与事件</h3>
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
                            className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all ${log.dailyEvents?.includes(evt) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-600' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-500 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            {evt}
                        </button>
                    ))}
                </div>

                <div className="relative group mb-4">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-accent transition-colors" size={16} />
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="搜索或创建事件标签..."
                    />
                </div>

                <textarea 
                    value={log.notes || ''}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="今天感觉如何？写点什么吧..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border-none rounded-[1.5rem] p-5 text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 outline-none min-h-[160px] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
            </div>

            {/* 4. 保存按钮 - 极致悬浮感 */}
            <div className="pt-4 sticky bottom-6 z-30">
                <button 
                    onClick={() => onSave(log)}
                    className="w-full py-5 bg-brand-accent dark:bg-blue-600 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-3 ring-4 ring-white/10 dark:ring-black/10"
                >
                    <Check size={26} strokeWidth={3.5} />
                    完成记录
                </button>
            </div>

            {/* Modals 保持原逻辑 */}
            <BeverageModal isOpen={modalState.bev} onClose={() => setModalState(s => ({ ...s, bev: false }))} onSave={(i) => { const current = log.caffeineRecord || { totalCount: 0, items: [] }; setLog(prev => ({ ...prev, caffeineRecord: { totalCount: current.items.length + 1, items: [...current.items, i] } })); }} />
            <SexRecordModal isOpen={modalState.sex} onClose={() => setModalState(s => ({ ...s, sex: false }))} onSave={(r) => { setField('sex', [...(log.sex || []), r]); setModalState(s => ({ ...s, sex: false })); }} dateStr={log.date} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={modalState.mb} onClose={() => setModalState(s => ({ ...s, mb: false }))} onSave={(r) => { setField('masturbation', [...(log.masturbation || []), r]); setModalState(s => ({ ...s, mb: false })); }} dateStr={log.date} logs={logs} partners={partners} />
            <ExerciseRecordModal isOpen={modalState.ex} onClose={() => setModalState(s => ({ ...s, ex: false }))} onSave={(r) => { setField('exercise', [...(log.exercise || []), r]); setModalState(s => ({ ...s, ex: false })); }} />
        </div>
    );
};

export default LogForm;
