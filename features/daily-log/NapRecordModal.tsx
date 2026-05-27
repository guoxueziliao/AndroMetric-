
import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Star, Zap, Check, MapPin, Leaf, Heart, Shirt, Thermometer, BrainCircuit } from 'lucide-react';
import type { NapRecord, SleepLocation } from '../../domain';
import { HardnessSelector, IconToggleButton, Modal, RangeSlider, Switch } from '../../shared/ui';

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
        id: '', startTime: '', ongoing: false, duration: 30, quality: null, hardness: null, hasDream: false, dreamTypes: [], notes: '',
        location: null, temperature: null, naturalAwakening: false, attire: null, withPartner: false, preSleepState: null
    });
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const nowStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (initialData) {
                const updatedRecord = {
                    ...initialData,
                    quality: initialData.quality ?? null,
                    hardness: initialData.hardness ?? null,
                    hasDream: initialData.hasDream ?? false,
                    dreamTypes: initialData.dreamTypes ?? [],
                    location: initialData.location ?? null,
                    temperature: initialData.temperature ?? null,
                    naturalAwakening: initialData.naturalAwakening ?? false,
                    attire: initialData.attire ?? null,
                    withPartner: initialData.withPartner ?? false,
                    preSleepState: initialData.preSleepState ?? null
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
                    id: Date.now().toString(), startTime: nowStr, ongoing: false, duration: 30, quality: null, hardness: null, hasDream: false, dreamTypes: [], notes: '',
                    location: null, temperature: null, naturalAwakening: false, attire: null, withPartner: false, preSleepState: null
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
                <button onClick={handleSave} className="w-full py-4 text-text-on-accent font-black rounded-2xl shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 bg-state-warning-text">
                    <Check size={20} strokeWidth={3}/> 完成午休
                </button>
            }
        >
            <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-slow">
                
                {/* 1. Header Card - 时间追踪 */}
                <div className="bg-state-warning-bg/60 rounded-[2.5rem] p-8 text-state-warning-text relative overflow-hidden shadow-inner border border-state-warning-text/25">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-state-warning-text/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-state-warning-text mb-2">
                            <Clock size={14}/> 统计
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tabular-nums">{record.duration}</span>
                            <span className="text-sm font-bold opacity-60">分钟</span>
                        </div>
                        <div className="mt-6 flex gap-3 w-full">
                            <div className="flex-1 bg-surface-card/80 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center border border-state-warning-text/25">
                                <span className="text-[9px] font-bold opacity-50 uppercase text-state-warning-text">开始</span>
                                <input type="time" value={record.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full text-text-primary"/>
                            </div>
                            <div className="flex-1 bg-surface-card/80 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center border border-state-warning-text/25">
                                <span className="text-[9px] font-bold opacity-50 uppercase text-state-warning-text">醒来</span>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full text-text-primary"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 质量滑块 */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Star size={12}/> 午休质量反馈 {record.quality === null && <span className="text-text-muted/60 normal-case tracking-normal">[未评分,移动滑块设置]</span>}
                    </label>
                    <RangeSlider
                        leftLabel="非常糟糕 (1)" rightLabel="神清气爽 (5)"
                        min={1} max={5} colorClass="accent-accent"
                        value={record.quality ?? 3}
                        onChange={(v: number) => setRecord({...record, quality: v})}
                    />
                </div>

                {/* 3. 状态切换 */}
                <div className="flex gap-2">
                    {[
                        { key: 'naturalAwakening', label: '自然醒', icon: Leaf, color: 'text-state-success-text' },
                        { key: 'withPartner', label: '有同睡', icon: Heart, color: 'text-accent-vivid' },
                    ].map((item) => (
                        <button 
                            key={item.key} type="button"
                            onClick={() => setRecord({...record, [item.key]: !(record as any)[item.key]})}
                            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${(record as any)[item.key] ? 'bg-surface-muted border-surface-border shadow-inner' : 'bg-surface-card border-transparent'}`}
                        >
                            <item.icon size={20} className={`mb-1 ${(record as any)[item.key] ? item.color : 'text-text-muted'}`}/>
                            <span className={`text-[10px] font-bold ${(record as any)[item.key] ? 'text-text-secondary' : 'text-text-muted'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* 4. 环境选项 */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Shirt size={12}/> 穿着方式 {!record.attire && <span className="text-text-muted/60 normal-case tracking-normal">[未选]</span>}</label>
                        <IconToggleButton options={ATTIRE_OPTS} selected={record.attire ?? ''} onSelect={v => setRecord({...record, attire: v as any})} renderIcon={() => <Shirt size={18}/>}/>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={12}/> 睡前状态 {!record.preSleepState && <span className="text-text-muted/60 normal-case tracking-normal">[未选]</span>}</label>
                        <IconToggleButton options={PRE_SLEEP_OPTS} selected={record.preSleepState ?? ''} onSelect={v => setRecord({...record, preSleepState: v as any})} renderIcon={() => <Sparkles size={18}/>}/>
                    </div>
                </div>

                {/* 5. 地点和温感 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> 地点</label>
                        <select value={record.location ?? ''} onChange={e => setRecord({...record, location: (e.target.value || null) as any})} className="w-full bg-surface-muted border border-surface-border rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                            <option value="">未选择</option>
                            {LOCATIONS.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Thermometer size={12}/> 温感</label>
                        <select value={record.temperature ?? ''} onChange={e => setRecord({...record, temperature: (e.target.value || null) as any})} className="w-full bg-surface-muted border border-surface-border rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                            <option value="">未选择</option>
                            <option value="cold">冷</option>
                            <option value="comfortable">舒适</option>
                            <option value="hot">热</option>
                        </select>
                    </div>
                </div>

                {/* 6. 硬度选项 */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> 午起生理反馈</label>
                    
                    <div className="flex items-center justify-between bg-surface-muted p-4 rounded-2xl">
                        <label className="font-bold text-sm text-text-primary">醒来有勃起吗？</label>
                        <Switch
                            checked={hasErection}
                            onCheckedChange={(checked) => setRecord({...record, hardness: checked ? 3 : null})}
                            aria-label="醒来有勃起"
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
                <div className="bg-chart-tertiary/10 rounded-2xl p-4 border border-chart-tertiary/25">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-chart-tertiary uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> 梦境探测</label>
                        <Switch size="sm" checked={record.hasDream ?? false} onCheckedChange={checked => setRecord({...record, hasDream: checked})} aria-label="梦境探测" />
                    </div>
                    {record.hasDream && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
                            {DREAM_TYPES.map(t => (
                                <button key={t.value} onClick={() => toggleDreamType(t.value)} className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${record.dreamTypes?.includes(t.value) ? 'bg-chart-tertiary text-text-on-accent border-chart-tertiary shadow-soft' : 'bg-surface-card text-text-secondary border-chart-tertiary/25'}`}>{t.label}</button>
                            ))}
                        </div>
                    )}
                </div>

                <textarea 
                    value={record.notes} onChange={e => setRecord({...record, notes: e.target.value})}
                    placeholder="记录午休的心得，或者是周围环境对睡眠的影响..."
                    className="w-full bg-surface-muted border border-surface-border rounded-3xl p-4 text-xs font-medium outline-none focus:border-accent min-h-[100px]"
                />
            </div>
        </Modal>
    );
};

export default NapRecordModal;
