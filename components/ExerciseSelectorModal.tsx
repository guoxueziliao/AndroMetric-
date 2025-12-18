import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, Dumbbell, Clock, Activity, PenLine, Play, Flag, Footprints, Smile, Frown, Meh, Zap, ChevronRight, History, Star, TrendingUp, Timer } from 'lucide-react';
import Modal from './Modal';
import { ExerciseRecord, ExerciseIntensity, ExerciseFeeling } from '../types';

const EXERCISE_CATEGORIES = [
  {
    name: "热门",
    items: ["传统力量训练", "户外跑步", "日常步行", "高强度间歇训练", "瑜伽"]
  },
  {
    name: "步行与跑步",
    items: ["日常步行", "户外步行", "室内步行", "徒步", "户外跑步", "室内跑步", "越野跑"]
  },
  {
    name: "健身与工作室",
    items: ["高强度间歇训练", "传统力量训练", "功能性力量训练", "核心训练", "跳绳", "瑜伽", "普拉提", "混合有氧"]
  },
  {
    name: "球类与竞技",
    items: ["足球", "篮球", "羽毛球", "乒乓球", "网球", "游泳", "格斗运动"]
  }
];

const MUSCLE_GROUPS = ["全身", "胸", "背", "腿", "肩", "手臂", "腹部", "拉伸"];
const INTENSITY_OPTS: { value: ExerciseIntensity, label: string, color: string }[] = [
    {value: 'low', label: '轻度', color: 'bg-emerald-100 text-emerald-700'}, 
    {value: 'medium', label: '中度', color: 'bg-blue-100 text-blue-700'}, 
    {value: 'high', label: '高强', color: 'bg-orange-100 text-orange-700'}
];
const FEELING_OPTS: { value: ExerciseFeeling, label: string, icon: React.ElementType, color: string }[] = [
    { value: 'great', label: '超棒', icon: Zap, color: 'text-yellow-500' },
    { value: 'ok', label: '正常', icon: Smile, color: 'text-green-500' },
    { value: 'tired', label: '疲劳', icon: Meh, color: 'text-orange-500' },
    { value: 'bad', label: '不适', icon: Frown, color: 'text-red-500' },
];

interface ExerciseRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: ExerciseRecord) => void;
    initialData?: ExerciseRecord;
    mode?: 'create' | 'edit' | 'start' | 'finish';
}

const ExerciseRecordModal: React.FC<ExerciseRecordModalProps> = ({ isOpen, onClose, onSave, initialData, mode = 'create' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [endTime, setEndTime] = useState('');
    
    const [record, setRecord] = useState<ExerciseRecord>({
        id: '', type: '', startTime: '', duration: 30, intensity: 'medium', bodyParts: [], steps: undefined, notes: '', feeling: 'ok'
    });

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            if (initialData) {
                setRecord({ ...initialData, feeling: initialData.feeling || 'ok' });
                const [h, m] = initialData.startTime.split(':').map(Number);
                const d = new Date(); d.setHours(h); d.setMinutes(m + (initialData.duration || 0));
                setEndTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            } else {
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                setRecord({
                    id: Date.now().toString(), type: '', startTime: nowStr, duration: 30, intensity: 'medium', bodyParts: [], steps: undefined, notes: '', feeling: 'ok'
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

    const isStepBased = record.type === '日常步行';
    const isStartMode = mode === 'start';
    const isFinishMode = mode === 'finish';

    const filteredItems = useMemo(() => {
        if (!searchTerm) return null;
        const allItems = new Set<string>();
        EXERCISE_CATEGORIES.forEach(c => c.items.forEach(i => allItems.add(i)));
        return Array.from(allItems).filter(i => i.includes(searchTerm));
    }, [searchTerm]);

    if (!isOpen) return null;

    const title = isFinishMode ? "完成训练" : isStartMode ? "准备训练" : "记录运动";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <button 
                    onClick={() => { onSave(record); onClose(); }} 
                    disabled={!record.type || (isStepBased && !record.steps)}
                    className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${isStartMode ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-brand-accent shadow-blue-500/20'}`}
                >
                    {isStartMode ? <Play size={20} fill="currentColor"/> : <Check size={20} strokeWidth={3}/>}
                    {isStartMode ? "开启运动" : "完成训练"}
                </button>
            }
        >
            <div className="space-y-6 pb-4">
                {/* 1. Header: Time or Summary */}
                {isFinishMode ? (
                    <div className="bg-gradient-to-br from-brand-accent to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                                <Timer size={14}/> 训练计时
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">{record.duration}</span>
                                <span className="text-sm font-bold opacity-80">MINUTES</span>
                            </div>
                            <div className="mt-4 flex gap-4 text-xs font-medium">
                                <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                                    开始 {record.startTime}
                                </div>
                                <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                                    结束 {endTime}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                             <label className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                             <input type="time" value={record.startTime} onChange={e => setRecord({...record, startTime: e.target.value})} className="bg-transparent font-mono text-xl font-bold text-brand-text dark:text-slate-200 outline-none w-full"/>
                        </div>
                        {isStepBased ? (
                             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                 <label className="text-[10px] text-orange-500 font-black uppercase mb-1 flex items-center gap-1"><Footprints size={10}/> 步数统计</label>
                                 <input type="number" value={record.steps || ''} onChange={e => setRecord({...record, steps: parseInt(e.target.value)})} placeholder="0" className="bg-transparent font-mono text-xl font-bold text-orange-600 outline-none w-full"/>
                             </div>
                        ) : !isStartMode && (
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent font-mono text-xl font-bold text-brand-text dark:text-slate-200 outline-none w-full"/>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Type Selection (Only in Start/Create mode) */}
                {!isFinishMode && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="搜索训练、运动..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-6">
                            {searchTerm ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredItems?.map(item => (
                                        <button key={item} onClick={() => setRecord({...record, type: item})} className={`p-4 rounded-2xl text-sm font-bold text-left transition-all border-2 ${record.type === item ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-600'}`}>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                EXERCISE_CATEGORIES.map(cat => (
                                    <div key={cat.name} className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{cat.name}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {cat.items.map(item => (
                                                <button 
                                                    key={item} 
                                                    onClick={() => setRecord({...record, type: item})}
                                                    className={`p-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between border-2 ${record.type === item ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
                                                >
                                                    {item}
                                                    {record.type === item && <Check size={14} className="text-emerald-500"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Feedback (Only in Finish mode) */}
                {(isFinishMode || (!isStartMode && record.type)) && !isStepBased && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><TrendingUp size={12}/> 训练强度</label>
                                <div className="flex flex-col gap-2">
                                    {INTENSITY_OPTS.map(opt => (
                                        <button 
                                            key={opt.value}
                                            onClick={() => setRecord({...record, intensity: opt.value})}
                                            className={`py-3 px-4 rounded-2xl text-xs font-black transition-all text-center border-2 ${record.intensity === opt.value ? 'border-brand-accent bg-blue-50 text-brand-accent' : 'border-transparent bg-slate-50 text-slate-500'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Activity size={12}/> 训练状态</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FEELING_OPTS.map(opt => (
                                        <button 
                                            key={opt.value}
                                            onClick={() => setRecord({...record, feeling: opt.value})}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${record.feeling === opt.value ? 'border-green-500 bg-green-50 shadow-sm' : 'border-transparent bg-slate-50 opacity-60'}`}
                                        >
                                            <opt.icon size={20} className={opt.color} />
                                            <span className="text-[10px] font-bold mt-1 text-slate-600">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Dumbbell size={12}/> 核心部位 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(part => (
                                    <button 
                                        key={part} 
                                        onClick={() => setRecord(p => ({...p, bodyParts: p.bodyParts?.includes(part) ? p.bodyParts.filter(x => x!==part) : [...(p.bodyParts||[]), part]}))}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${record.bodyParts?.includes(part) ? 'border-brand-accent bg-blue-50 text-brand-accent' : 'border-transparent bg-slate-50 text-slate-500'}`}
                                    >
                                        {part}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <PenLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-brand-accent transition-all"
                        placeholder="训练心得或器械详情..."
                        value={record.notes || ''}
                        onChange={e => setRecord({...record, notes: e.target.value})}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ExerciseRecordModal;