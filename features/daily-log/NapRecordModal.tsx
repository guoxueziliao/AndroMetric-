
import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Star, Zap, Check, MapPin, Leaf, Heart, Shirt, Thermometer, BrainCircuit } from 'lucide-react';
import type { NapRecord, SleepLocation } from '../../domain';
import { HardnessSelector, IconToggleButton, Modal, RangeSlider } from '../../shared/ui';

interface NapRecordModalData {
    initialData?: NapRecord;
}

interface NapRecordModalActions {
    onSave: (record: NapRecord) => void;
}

interface NapRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: NapRecordModalData;
    actions: NapRecordModalActions;
}

const DREAM_TYPES = [
    { value: 'erotic', label: '春梦' },
    { value: 'nightmare', label: '噩梦' },
    { value: 'normal', label: '普通' },
    { value: 'lucid', label: '清醒梦' },
    { value: 'weird', label: '离奇' },
];

const LOCATIONS: { value: SleepLocation, label: string }[] = [
    { value: 'home', label: '家里' },
    { value: 'office', label: '办公室' },
    { value: 'transport', label: '通勤中' },
    { value: 'hotel', label: '酒店' },
    { value: 'others_home', label: '别人家' },
    { value: 'dorm', label: '宿舍' },
    { value: 'other', label: '其他' }
];

const ATTIRE_OPTS = [
    {value: 'naked', label: '裸睡'}, {value: 'light', label: '内衣'}, {value: 'pajamas', label: '睡衣'}, {value: 'other', label: '其他'}
];

const PRE_SLEEP_OPTS = [
    {value: 'tired', label: '疲劳'}, {value: 'calm', label: '平静'}, {value: 'energetic', label: '亢奋'}, {value: 'stressed', label: '压力'}, {value: 'other', label: '其他'}
];

const NapRecordModal: React.FC<NapRecordModalProps> = ({ isOpen, onClose, data, actions }) => {
    const { initialData } = data;
    const { onSave } = actions;

    const [record, setRecord] = useState<NapRecord>({
        id: '', startTime: '', ongoing: false, duration: 30, quality: 3, hardness: null, hasDream: false, dreamTypes: [], notes: '',
        location: 'home', temperature: 'comfortable', naturalAwakening: true, attire: 'light', withPartner: false, preSleepState: 'calm'
    });
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const nowStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (initialData) {
                const updatedRecord = {
                    ...initialData,
                    quality: initialData.quality || 3,
                    hardness: initialData.hardness || null,
                    hasDream: initialData.hasDream || false,
                    dreamTypes: initialData.dreamTypes || [],
                    location: initialData.location || 'home',
                    temperature: initialData.temperature || 'comfortable',
                    naturalAwakening: initialData.naturalAwakening ?? true,
                    attire: initialData.attire || 'light',
                    withPartner: initialData.withPartner || false,
                    preSleepState: initialData.preSleepState || 'calm'
                };

                let initialEndTime = '';
                let initialDuration = initialData.duration || 0;

                if (initialData.ongoing) {
                    initialEndTime = nowStr;
                    if (initialData.startTime) {
                        const [h1, m1] = initialData.startTime.split(':').map(Number);
                        const [h2, m2] = nowStr.split(':').map(Number);
                        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                        if (diff < 0) diff += 24 * 60;
                        initialDuration = diff;
                    }
                } else if (initialData.endTime) {
                    initialEndTime = initialData.endTime;
                } else if (initialData.startTime && initialData.duration) {
                    const [h, m] = initialData.startTime.split(':').map(Number);
                    const d = new Date(); d.setHours(h); d.setMinutes(m + initialData.duration);
                    initialEndTime = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
                } else {
                    initialEndTime = nowStr;
                }

                setRecord({ ...updatedRecord, duration: initialDuration });
                setEndTime(initialEndTime);
            } else {
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                setRecord({
                    id: Date.now().toString(), startTime: nowStr, ongoing: false, duration: 30, quality: 3, hardness: null, hasDream: false, dreamTypes: [], notes: '',
                    location: 'home', temperature: 'comfortable', naturalAwakening: true, attire: 'light', withPartner: false, preSleepState: 'calm'
                });
                setEndTime(endD.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
            }
        }
    }, [isOpen, initialData]);

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60; // 跨零点处理
        return diff;
    };

    const handleStartTimeChange = (newStartTime: string) => {
        const newDuration = calculateDuration(newStartTime, endTime);
        setRecord(prev => ({ ...prev, startTime: newStartTime, duration: newDuration }));
    };

    const handleEndTimeChange = (newEndTime: string) => {
        setEndTime(newEndTime);
        const newDuration = calculateDuration(record.startTime, newEndTime);
        setRecord(prev => ({ ...prev, duration: newDuration }));
    };

    const toggleDreamType = (t: string) => {
        setRecord(prev => ({
            ...prev,
            dreamTypes: prev.dreamTypes?.includes(t) ? prev.dreamTypes.filter(x => x !== t) : [...(prev.dreamTypes || []), t]
        }));
    };

    const handleSave = () => {
        onSave({ ...record, endTime, ongoing: false });
        onClose();
    };

    if (!isOpen) return null;

    const hasErection = record.hardness !== null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData?.ongoing ? "结束午休" : "午休记录详情"}
            footer={
                <button onClick={handleSave} className="w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-orange-500 shadow-orange-500/20">
                    <Check size={20} strokeWidth={3}/> 完成午休
                </button>
            }
        >
            <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Header Card - 时间追踪 */}
                <div className="bg-orange-50 dark:bg-slate-900 rounded-[2.5rem] p-8 text-orange-950 dark:text-white relative overflow-hidden shadow-inner border border-orange-100 dark:border-white/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 mb-2">
                            <Clock size={14}/> 统计
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tabular-nums">{record.duration}</span>
                            <span className="text-sm font-bold opacity-60">分钟</span>
                        </div>
                        <div className="mt-6 flex gap-3 w-full">
                            <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center border border-orange-200 dark:border-white/10">
                                <span className="text-[9px] font-bold opacity-50 uppercase text-orange-900 dark:text-orange-200">开始</span>
                                <input type="time" value={record.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full text-orange-950 dark:text-white"/>
                            </div>
                            <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center border border-orange-200 dark:border-white/10">
                                <span className="text-[9px] font-bold opacity-50 uppercase text-orange-900 dark:text-orange-200">醒来</span>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full text-orange-950 dark:text-white"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 质量滑块 */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Star size={12}/> 午休质量反馈
                    </label>
                    <RangeSlider 
                        leftLabel="非常糟糕 (1)" rightLabel="神清气爽 (5)" 
                        min={1} max={5} colorClass="accent-orange-500"
                        value={record.quality || 3} 
                        onChange={(v: number) => setRecord({...record, quality: v})} 
                    />
                </div>

                {/* 3. 状态切换 */}
                <div className="flex gap-2">
                    {[
                        { key: 'naturalAwakening', label: '自然醒', icon: Leaf, color: 'text-green-600' },
                        { key: 'withPartner', label: '有同睡', icon: Heart, color: 'text-pink-600' },
                    ].map((item) => (
                        <button 
                            key={item.key} type="button"
                            onClick={() => setRecord({...record, [item.key]: !(record as any)[item.key]})}
                            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${(record as any)[item.key] ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-inner' : 'bg-white dark:bg-slate-900 border-transparent'}`}
                        >
                            <item.icon size={20} className={`mb-1 ${(record as any)[item.key] ? item.color : 'text-slate-300'}`}/> 
                            <span className={`text-[10px] font-bold ${(record as any)[item.key] ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* 4. 环境选项 */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shirt size={12}/> 穿着方式</label>
                        <IconToggleButton options={ATTIRE_OPTS} selected={record.attire || 'light'} onSelect={v => setRecord({...record, attire: v})} renderIcon={() => <Shirt size={18}/>}/>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={12}/> 睡前状态</label>
                        <IconToggleButton options={PRE_SLEEP_OPTS} selected={record.preSleepState || 'calm'} onSelect={v => setRecord({...record, preSleepState: v})} renderIcon={() => <Sparkles size={18}/>}/>
                    </div>
                </div>

                {/* 5. 地点和温感 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> 地点</label>
                        <select value={record.location} onChange={e => setRecord({...record, location: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                            {LOCATIONS.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Thermometer size={12}/> 温感</label>
                        <select value={record.temperature} onChange={e => setRecord({...record, temperature: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                            <option value="cold">冷</option>
                            <option value="comfortable">舒适</option>
                            <option value="hot">热</option>
                        </select>
                    </div>
                </div>

                {/* 6. 硬度选项 */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> 午起生理反馈</label>
                    
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                        <label className="font-bold text-sm text-brand-text dark:text-slate-200">醒来有勃起吗？</label>
                        <input 
                            type="checkbox" 
                            className="toggle-checkbox" 
                            checked={hasErection} 
                            onChange={(e) => setRecord({...record, hardness: e.target.checked ? 3 : null})} 
                        />
                    </div>

                    {hasErection && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <HardnessSelector 
                                value={record.hardness || 3} 
                                onChange={(v) => setRecord({...record, hardness: v as any})} 
                            />
                        </div>
                    )}
                </div>

                {/* 7. 梦境记录 */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> 梦境探测</label>
                        <input type="checkbox" className="toggle-checkbox h-4 w-8" checked={record.hasDream} onChange={e => setRecord({...record, hasDream: e.target.checked})} />
                    </div>
                    {record.hasDream && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
                            {DREAM_TYPES.map(t => (
                                <button key={t.value} onClick={() => toggleDreamType(t.value)} className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${record.dreamTypes?.includes(t.value) ? 'bg-purple-500 text-white border-purple-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-purple-100 dark:border-purple-800'}`}>{t.label}</button>
                            ))}
                        </div>
                    )}
                </div>

                <textarea 
                    value={record.notes} onChange={e => setRecord({...record, notes: e.target.value})}
                    placeholder="记录午休的心得，或者是周围环境对睡眠的影响..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 text-xs font-medium outline-none focus:border-orange-400 min-h-[100px]"
                />
            </div>
        </Modal>
    );
};

export default NapRecordModal;
