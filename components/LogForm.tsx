
import React, { useState, useCallback } from 'react';
import { Coffee, Plus, SunMedium, BedDouble, Heart, StickyNote, Activity, BrainCircuit } from 'lucide-react';
import BeverageModal from './BeverageModal';
import { LogEntry, CaffeineItem, PartnerProfile, NapRecord } from '../types';
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
    // 基础状态初始化
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

    const [isBevModalOpen, setIsBevModalOpen] = useState(false);

    // 通用变更通知
    const markDirty = useCallback(() => onDirtyStateChange(true), [onDirtyStateChange]);

    // --- 晨间状态处理 ---
    const handleMorningChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, morning: { ...prev.morning!, [field]: value } }));
        markDirty();
    };

    // --- 睡眠周期处理 ---
    const handleSleepChange = (field: any, value: any) => {
        setLog(prev => ({ ...prev, sleep: { ...prev.sleep!, [field]: value } }));
        markDirty();
    };

    const handleAddNap = () => {
        const newNap: NapRecord = { id: `n_${Date.now()}`, startTime: '13:00', endTime: '13:30', duration: 30, ongoing: false, hasDream: false, dreamTypes: [] };
        handleSleepChange('naps', [...(log.sleep?.naps || []), newNap]);
    };

    // --- 健康与心情处理 ---
    const handleHealthChange = (field: keyof LogEntry, value: any) => {
        setLog(prev => ({ ...prev, [field]: value }));
        markDirty();
    };

    const handleDeepHealthChange = (parent: keyof LogEntry, field: string, value: any) => {
        setLog(prev => ({ ...prev, [parent]: { ...(prev[parent] as any), [field]: value } }));
        markDirty();
    };

    // --- 提神补剂处理 ---
    const handleAddBeverage = (item: CaffeineItem) => {
        const current = log.caffeineRecord || { totalCount: 0, items: [] };
        const newItems = [...current.items, item];
        setLog(prev => ({
            ...prev,
            caffeineRecord: {
                totalCount: newItems.length,
                items: newItems
            }
        }));
        markDirty();
    };

    const removeBeverage = (id: string) => {
        const newItems = (log.caffeineRecord?.items || []).filter(i => i.id !== id);
        setLog(prev => ({
            ...prev,
            caffeineRecord: {
                totalCount: newItems.length,
                items: newItems
            }
        }));
        markDirty();
    };

    return (
        <div className="space-y-6 pb-12">
            {/* 1. 晨勃模块 */}
            <MorningSection 
                morning={log.morning!} 
                onChange={handleMorningChange} 
            />

            {/* 2. 睡眠模块 */}
            <SleepSection 
                sleep={log.sleep!} 
                onChange={handleSleepChange}
                onAddNap={handleAddNap}
                onEditNap={(nap) => { /* 可以在此处扩展午休编辑弹窗 */ }}
                onDeleteNap={(id) => handleSleepChange('naps', log.sleep?.naps.filter(n => n.id !== id))}
            />

            {/* 3. 提神补剂模块 (新) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <Coffee size={16} className="text-orange-500" /> 提神与补剂
                    </h3>
                    <button 
                        type="button"
                        onClick={() => setIsBevModalOpen(true)}
                        className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-transform"
                    >
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
                            <button 
                                onClick={() => removeBeverage(item.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Plus size={14} className="rotate-45" />
                            </button>
                        </div>
                    ))}
                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && (
                        <div className="text-center py-6 text-xs text-slate-300 font-bold italic border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">
                            暂无补剂记录，点击右上角添加
                        </div>
                    )}
                </div>
            </div>

            {/* 4. 健康与心情模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <HealthSection 
                    log={log} 
                    onChange={handleHealthChange} 
                    onDeepChange={handleDeepHealthChange}
                    onManageTags={() => {}}
                />
            </div>

            {/* 5. 备注模块 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <StickyNote size={16} className="text-blue-500" /> 补充备注
                </h3>
                <textarea 
                    value={log.notes || ''}
                    onChange={(e) => { handleHealthChange('notes', e.target.value); }}
                    placeholder="记录今日其他重要事项..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium outline-none min-h-[120px] focus:ring-2 focus:ring-brand-accent/20 transition-all"
                />
            </div>

            {/* 保存操作 */}
            <div className="pt-4">
                <button 
                    onClick={() => onSave(log)}
                    className="w-full py-5 bg-brand-accent text-white font-black text-lg rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Check size={24} strokeWidth={3} />
                    保存今日数据
                </button>
            </div>

            {/* 弹窗 */}
            <BeverageModal 
                isOpen={isBevModalOpen} 
                onClose={() => setIsBevModalOpen(false)} 
                onSave={handleAddBeverage} 
            />
        </div>
    );
};

// 辅助组件：简单的 Check 图标
const Check = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default LogForm;
