
import React, { useState, useCallback } from 'react';
import { 
    Coffee, Plus, Heart, Hand, Dumbbell, 
    StickyNote, Check, Trash2, Clock, MapPin, 
    Zap, Activity, Sparkles 
} from 'lucide-react';
import BeverageModal from './BeverageModal';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import ExerciseRecordModal from './ExerciseSelectorModal';
import { 
    LogEntry, CaffeineItem, PartnerProfile, 
    NapRecord, SexRecordDetails, MasturbationRecordDetails, 
    ExerciseRecord 
} from '../types';
import MorningSection from './MorningSection';
import SleepSection from './SleepSection';
import HealthSection from './HealthSection';

interface LogFormProps {
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[];
  partners: PartnerProfile[];
}

const LogForm: React.FC<LogFormProps> = ({ 
  onSave, 
  existingLog, 
  logDate, 
  onDirtyStateChange, 
  logs, 
  partners 
}) => {
    // 初始化完整的 LogEntry
    const [log, setLog] = useState<LogEntry>(existingLog || { 
        date: logDate || '', 
        status: 'completed', 
        updatedAt: Date.now(),
        morning: { id: `m_${Date.now()}`, timestamp: Date.now(), wokeWithErection: true, wokenByErection: false },
        sleep: { id: `s_${Date.now()}`, quality: 3, naturalAwakening: true, nocturnalEmission: false, withPartner: false, naps: [], hasDream: false, dreamTypes: [], environment: { location: 'home', temperature: 'comfortable' } },
        exercise: [],
        sex: [],
        masturbation: [],
        dailyEvents: [],
        tags: [],
        health: { isSick: false, symptoms: [], medications: [] },
        changeHistory: []
    } as LogEntry);

    // 弹窗状态
    const [modalState, setModalState] = useState<{
        bev: boolean, sex: boolean, mb: boolean, ex: boolean
    }>({ bev: false, sex: false, mb: false, ex: false });

    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);

    // 通用列表更新逻辑
    const updateList = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeineRecord', newData: any) => {
        if (field === 'caffeineRecord') {
             setLog(prev => ({ ...prev, caffeineRecord: newData }));
        } else {
             setLog(prev => ({ ...prev, [field]: newData }));
        }
        markDirty();
    };

    // --- 各模块处理函数 ---
    const handleMorningChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } }));
        markDirty();
    };

    const handleSleepChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
        markDirty();
    };

    const handleAddBeverage = (item: CaffeineItem) => {
        const current = log.caffeineRecord || { totalCount: 0, items: [] };
        const newItems = [...current.items, item];
        updateList('caffeineRecord', { totalCount: newItems.length, items: newItems });
    };

    const handleAddSex = (record: SexRecordDetails) => {
        updateList('sex', [...(log.sex || []), record]);
        setModalState(s => ({ ...s, sex: false }));
    };

    const handleAddMb = (record: MasturbationRecordDetails) => {
        updateList('masturbation', [...(log.masturbation || []), record]);
        setModalState(s => ({ ...s, mb: false }));
    };

    const handleAddEx = (record: ExerciseRecord) => {
        updateList('exercise', [...(log.exercise || []), record]);
        setModalState(s => ({ ...s, ex: false }));
    };

    const removeItem = (field: 'sex' | 'masturbation' | 'exercise' | 'caffeine', id: string) => {
        if (field === 'caffeine') {
            const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
            updateList('caffeineRecord', { totalCount: newItems.length, items: newItems });
        } else {
            updateList(field, (log[field] as any[]).filter(i => i.id !== id));
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* 1. 晨间与睡眠 (基础数据) */}
            <MorningSection morning={log.morning!} onChange={handleMorningChange} />
            
            <SleepSection 
                sleep={log.sleep!} 
                onChange={handleSleepChange}
                onAddNap={() => {/* 快速午休逻辑 */}}
                onEditNap={() => {}}
                onDeleteNap={(id) => handleSleepChange('naps', log.sleep?.naps.filter(n => n.id !== id))}
            />

            {/* 2. 性生活模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                        <Heart size={16} /> 性生活
                    </h3>
                    <button onClick={() => setModalState(s => ({ ...s, sex: true }))} className="p-2 bg-pink-500 text-white rounded-xl shadow-lg shadow-pink-500/20 active:scale-90 transition-transform">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {log.sex?.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-pink-500 shadow-sm text-xs font-black">
                                    <Heart size={14} fill="currentColor" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.interactions?.[0]?.partner || '伴侣'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.startTime} · {item.duration}m</div>
                                </div>
                            </div>
                            <button onClick={() => removeItem('sex', item.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Plus size={14} className="rotate-45" /></button>
                        </div>
                    ))}
                    {(!log.sex || log.sex.length === 0) && <div className="text-center py-6 text-xs text-slate-300 font-bold italic border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">无记录</div>}
                </div>
            </div>

            {/* 3. 自慰记录模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <Hand size={16} /> 施法记录
                    </h3>
                    <button onClick={() => setModalState(s => ({ ...s, mb: true }))} className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-90 transition-transform">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {log.masturbation?.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-blue-500 shadow-sm text-xs font-black">
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.tools?.join(',') || '徒手'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.startTime} · {item.duration}m {item.ejaculation ? '· 射精' : '· Edging'}</div>
                                </div>
                            </div>
                            <button onClick={() => removeItem('masturbation', item.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Plus size={14} className="rotate-45" /></button>
                        </div>
                    ))}
                    {(!log.masturbation || log.masturbation.length === 0) && <div className="text-center py-6 text-xs text-slate-300 font-bold italic border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">无记录</div>}
                </div>
            </div>

            {/* 4. 运动健身模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Dumbbell size={16} /> 运动健身
                    </h3>
                    <button onClick={() => setModalState(s => ({ ...s, ex: true }))} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {log.exercise?.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-emerald-500 shadow-sm text-xs font-black">
                                    <Activity size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.type}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.startTime} · {item.duration}m · {item.intensity}</div>
                                </div>
                            </div>
                            <button onClick={() => removeItem('exercise', item.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Plus size={14} className="rotate-45" /></button>
                        </div>
                    ))}
                    {(!log.exercise || log.exercise.length === 0) && <div className="text-center py-6 text-xs text-slate-300 font-bold italic border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">无记录</div>}
                </div>
            </div>

            {/* 5. 提神补剂模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <Coffee size={16} /> 提神与补剂
                    </h3>
                    <button onClick={() => setModalState(s => ({ ...s, bev: true }))} className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-transform">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {log.caffeineRecord?.items.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-orange-500 shadow-sm text-xs font-black">
                                    {item.name[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.time} · {item.volume}ml</div>
                                </div>
                            </div>
                            <button onClick={() => removeItem('caffeine', item.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Plus size={14} className="rotate-45" /></button>
                        </div>
                    ))}
                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && <div className="text-center py-6 text-xs text-slate-300 font-bold italic border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">无记录</div>}
                </div>
            </div>

            {/* 6. 健康与备注 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <HealthSection 
                    log={log} 
                    onChange={(f, v) => { setLog(p => ({ ...p, [f]: v })); markDirty(); }} 
                    onDeepChange={(p, f, v) => { setLog(prev => ({ ...prev, [p]: { ...(prev[p] as any), [f]: v } })); markDirty(); }}
                    onManageTags={() => {}}
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <StickyNote size={16} className="text-blue-500" /> 补充备注
                </h3>
                <textarea 
                    value={log.notes || ''}
                    onChange={(e) => { setLog(p => ({ ...p, notes: e.target.value })); markDirty(); }}
                    placeholder="记录今日其他重要事项..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium outline-none min-h-[100px] focus:ring-2 focus:ring-brand-accent/20 transition-all"
                />
            </div>

            {/* 保存按钮 */}
            <div className="pt-4">
                <button 
                    onClick={() => onSave(log)}
                    className="w-full py-5 bg-brand-accent text-white font-black text-lg rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Check size={24} strokeWidth={3} />
                    保存今日数据
                </button>
            </div>

            {/* 所有相关弹窗 */}
            <BeverageModal isOpen={modalState.bev} onClose={() => setModalState(s => ({ ...s, bev: false }))} onSave={handleAddBeverage} />
            <SexRecordModal isOpen={modalState.sex} onClose={() => setModalState(s => ({ ...s, sex: false }))} onSave={handleAddSex} dateStr={log.date} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={modalState.mb} onClose={() => setModalState(s => ({ ...s, mb: false }))} onSave={handleAddMb} dateStr={log.date} logs={logs} partners={partners} />
            <ExerciseRecordModal isOpen={modalState.ex} onClose={() => setModalState(s => ({ ...s, ex: false }))} onSave={handleAddEx} />
        </div>
    );
};

export default LogForm;
