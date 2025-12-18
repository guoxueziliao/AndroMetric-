import React, { useState, useEffect } from 'react';
import { CloudSun, Clock, Play, Sparkles, Star, Zap, Trash2, Check, Minus, Plus, MapPin, Leaf, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import { NapRecord, SleepLocation } from '../types';
import HardnessSelector from './HardnessSelector';

interface NapRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: NapRecord) => void;
    initialData?: NapRecord;
}

const DREAM_TYPES = ['情色', '噩梦', '普通梦', '模糊梦', '离奇', '清醒梦'];
const NAP_LOCATIONS: { value: SleepLocation, label: string }[] = [
    { value: 'home', label: '家里' },
    { value: 'office', label: '办公室' },
    { value: 'transport', label: '通勤中' },
    { value: 'hotel', label: '酒店' },
    { value: 'other', label: '其他' }
];

const NapRecordModal: React.FC<NapRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [record, setRecord] = useState<NapRecord>({
        id: '', startTime: '', ongoing: false, duration: 30, quality: 3, hardness: null, hasDream: false, dreamTypes: [], notes: '',
        location: 'home', naturalAwakening: true
    });
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setRecord({
                    ...initialData,
                    quality: initialData.quality || 3,
                    hardness: initialData.hardness || null,
                    hasDream: initialData.hasDream || false,
                    dreamTypes: initialData.dreamTypes || [],
                    notes: initialData.notes || '',
                    location: initialData.location || 'home',
                    naturalAwakening: initialData.naturalAwakening ?? true
                });
                
                if (initialData.startTime && initialData.duration) {
                    const [h, m] = initialData.startTime.split(':').map(Number);
                    const d = new Date(); d.setHours(h); d.setMinutes(m + initialData.duration);
                    setEndTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                } else if (initialData.endTime) {
                    setEndTime(initialData.endTime);
                } else {
                    const now = new Date();
                    setEndTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                }
            } else {
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                setRecord({
                    id: Date.now().toString(),
                    startTime: nowStr,
                    ongoing: false,
                    duration: 30,
                    quality: 3,
                    hardness: null,
                    hasDream: false,
                    dreamTypes: [],
                    notes: '',
                    location: 'home',
                    naturalAwakening: true
                });
                setEndTime(endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            }
        }
    }, [isOpen, initialData]);

    const handleEndTimeChange = (newEndTime: string) => {
        setEndTime(newEndTime);
        if (!record.startTime || !newEndTime) return;
        const [h1, m1] = record.startTime.split(':').map(Number);
        const [h2, m2] = newEndTime.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        setRecord(prev => ({ ...prev, duration: diff }));
    };

    const toggleDreamType = (t: string) => {
        setRecord(prev => ({
            ...prev,
            dreamTypes: prev.dreamTypes?.includes(t) 
                ? prev.dreamTypes.filter(x => x !== t) 
                : [...(prev.dreamTypes || []), t]
        }));
    };

    const handleSave = () => {
        onSave({ ...record, endTime, ongoing: false });
        onClose();
    };

    if (!isOpen) return null;

    const isHardnessSelected = record.hardness !== null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData?.ongoing ? "结束午休" : "午休记录"}
            footer={
                <button 
                    onClick={handleSave} 
                    className="w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-orange-500 shadow-orange-500/20"
                >
                    <Check size={20} strokeWidth={3}/>
                    完成午休
                </button>
            }
        >
            <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Header Card - Summary */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2">
                            <Clock size={14}/> Nap Statistics
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tabular-nums">{record.duration}</span>
                            <span className="text-sm font-bold opacity-60 uppercase">分钟</span>
                        </div>
                        <div className="mt-6 flex gap-3 w-full">
                            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center">
                                <span className="text-[9px] font-bold opacity-50 uppercase">开始</span>
                                <input type="time" value={record.startTime} onChange={e => setRecord({...record, startTime: e.target.value})} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full"/>
                            </div>
                            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center">
                                <span className="text-[9px] font-bold opacity-50 uppercase">醒来</span>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-sm font-mono font-bold outline-none text-center w-full"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Environment & Quality */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> 午休地点</label>
                        <select 
                            value={record.location} 
                            onChange={e => setRecord({...record, location: e.target.value as any})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none appearance-none"
                        >
                            {NAP_LOCATIONS.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Leaf size={12}/> 是否自然醒</label>
                        <button 
                            onClick={() => setRecord({...record, naturalAwakening: !record.naturalAwakening})}
                            className={`w-full p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${record.naturalAwakening ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >
                            {record.naturalAwakening ? <Check size={14}/> : null}
                            {record.naturalAwakening ? '自然觉醒' : '闹钟惊醒'}
                        </button>
                    </div>
                </div>

                {/* 3. Quality Rating */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Star size={12}/> 午休质量反馈
                    </label>
                    <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setRecord({...record, quality: star})}
                                className={`flex-1 aspect-square rounded-2xl border-2 transition-all flex items-center justify-center ${record.quality === star ? 'bg-orange-50 border-orange-400 text-orange-600 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}
                            >
                                <Star size={24} fill={record.quality && record.quality >= star ? "currentColor" : "none"} strokeWidth={record.quality === star ? 3 : 2}/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Hardness Selector - Logic Fixed */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12}/> 午起生理反馈 (勃起硬度)
                    </label>
                    <HardnessSelector value={record.hardness || 0} onChange={h => setRecord({...record, hardness: h as any})} />
                    
                    <button 
                        onClick={() => setRecord({...record, hardness: isHardnessSelected ? null : 3})}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${isHardnessSelected ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'}`}
                    >
                        {isHardnessSelected ? <RotateCcw size={14}/> : <Plus size={14}/>}
                        {isHardnessSelected ? "重置生理记录" : "开启生理记录 (本次有勃起)"}
                    </button>
                    
                    {!isHardnessSelected && (
                        <p className="text-[10px] text-slate-400 text-center italic">若午起无明显生理反应，保持为空即可</p>
                    )}
                </div>

                {/* 5. Dreams */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={12}/> 梦境探测
                        </label>
                        <input 
                            type="checkbox" 
                            className="toggle-checkbox h-5 w-10" 
                            checked={record.hasDream} 
                            onChange={e => setRecord({...record, hasDream: e.target.checked})} 
                        />
                    </div>
                    {record.hasDream && (
                        <div className="flex flex-wrap gap-2 animate-in zoom-in-95 duration-300">
                            {DREAM_TYPES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleDreamType(t)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${record.dreamTypes?.includes(t) ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <textarea 
                        value={record.notes}
                        onChange={e => setRecord({...record, notes: e.target.value})}
                        placeholder="记录午休的心得，或者是周围环境对睡眠的影响（如：空调太冷、噪音等）..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-4 text-xs font-medium outline-none focus:border-orange-400 transition-all min-h-[100px]"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default NapRecordModal;