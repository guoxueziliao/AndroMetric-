
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronUp, Check, Dumbbell, Clock, Activity, PenLine, Play, Flag, Footprints, Smile, Frown, Meh, Zap, Timer, TrendingUp, Sparkles, Target, Flame, HeartPulse } from 'lucide-react';
import Modal from './Modal';
import { ExerciseRecord, ExerciseIntensity, ExerciseFeeling } from '../types';

const EXERCISE_CATEGORIES = [
  { name: "步行", items: ["日常步行", "户外步行", "室内步行", "徒步", "遛狗", "城市散步", "负重步行"] },
  { name: "跑步", items: ["户外跑步", "室内跑步", "越野跑", "带狗跑步", "推车跑步", "斯巴达障碍跑"] },
  { name: "骑行", items: ["户外骑行", "室内骑行", "电动自行车骑行", "砾石骑行", "山地自行车骑行", "小轮车", "手摇式骑行", "运输自行车骑行"] },
  { name: "球类运动", items: ["足球", "篮球", "橄榄球", "高尔夫", "棒球", "网球", "排球", "保龄球", "曲棍球", "腰旗橄榄球", "壁球", "羽毛球", "乒乓球", "手球", "匹克球", "板球", "长曲棍球"] },
  { name: "健身训练", items: ["高强度间歇训练", "交叉训练", "传统力量训练", "功能性力量训练", "核心训练", "混合有氧", "准备和恢复", "整理放松", "跳绳", "椭圆机", "踏步机", "楼梯", "柔韧度"] },
  { name: "工作室运动", items: ["瑜伽", "舞蹈", "普拉提", "柔缓冥想类运动"] },
  { name: "水上运动", items: ["泳池游泳", "开放水域游泳", "冲浪运动", "帆船运动", "皮划艇", "划船", "皮划艇运动", "水上运动"] },
  { name: "雪", items: ["高山滑雪", "单板滑雪", "越野滑雪", "户外滑冰", "室内滑冰", "雪上运动"] },
  { name: "格斗运动", items: ["踢拳", "拳击", "摔跤", "武术", "太极"] },
  { name: "其他", items: ["健身游戏", "钓鱼", "飞盘运动", "滑板", "攀岩", "马术运动", "啦啦队", "跑酷", "箭术", "剑术", "轮椅运动", "其他"] }
];

const MUSCLE_GROUPS = ["胸", "背", "腿", "肩", "手臂", "腹", "臀", "拉伸", "有氧"];
const INTENSITY_OPTS: { value: ExerciseIntensity, label: string, desc: string }[] = [
    {value: 'low', label: '轻度', desc: '呼吸平稳'}, 
    {value: 'medium', label: '中度', desc: '微微出汗'}, 
    {value: 'high', label: '高强', desc: '竭尽全力'}
];
const FEELING_OPTS: { value: 'great' | 'ok' | 'tired' | 'bad', label: string, icon: React.ElementType, color: string }[] = [
    { value: 'great', label: '状态极佳', icon: Zap, color: 'text-yellow-500' },
    { value: 'ok', label: '还算不错', icon: Smile, color: 'text-green-500' },
    { value: 'tired', label: '有点累了', icon: Meh, color: 'text-orange-500' },
    { value: 'bad', label: '身体不适', icon: Frown, color: 'text-red-500' },
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
    const [expandedCategory, setExpandedCategory] = useState<string | null>("步行");
    const [endTime, setEndTime] = useState('');
    const [record, setRecord] = useState<ExerciseRecord>({
        id: '', type: '', startTime: '', duration: 30, intensity: 'medium', bodyParts: [], steps: undefined, notes: '', feeling: 'ok'
    });

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            if (initialData) {
                setRecord({ ...initialData, feeling: initialData.feeling || 'ok' });
                const [h, m] = (initialData.startTime || '00:00').split(':').map(Number);
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

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return EXERCISE_CATEGORIES;
        return EXERCISE_CATEGORIES.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.includes(searchTerm))
        })).filter(cat => cat.items.length > 0);
    }, [searchTerm]);

    const toggleCategory = (name: string) => {
        setExpandedCategory(prev => prev === name ? null : name);
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isFinishMode ? "训练报告" : isStartMode ? "开始训练" : "编辑训练记录"}
            footer={
                <button 
                    onClick={() => { onSave(record); onClose(); }} 
                    disabled={!record.type || (isStepBased && !record.steps)}
                    className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${isStartMode ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-brand-accent shadow-blue-500/30'}`}
                >
                    {isStartMode ? <Play size={20} fill="currentColor"/> : <Check size={20} strokeWidth={3}/>}
                    {isStartMode ? "开启运动" : "完成提交"}
                </button>
            }
        >
            <div className="space-y-6 pb-6">
                {isFinishMode ? (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-white/10 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl ring-1 ring-white/5">
                        {/* 动态背景修饰：使用更高的模糊度与更明亮的颜色，解决死沉的黑白冲突 */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-4 opacity-100">
                                <Flame size={14} className="animate-pulse"/> WORKOUT ACCOMPLISHED
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-7xl font-black tabular-nums tracking-tighter drop-shadow-glow-white">{record.duration}</span>
                                <span className="text-lg font-black text-white/40">分钟</span>
                            </div>

                            <div className="mt-8 flex gap-4 w-full">
                                <div className="flex-1 bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 text-center border border-white/[0.08] shadow-inner">
                                    <div className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">START</div>
                                    <div className="text-xl font-mono font-bold text-white/90">{record.startTime}</div>
                                </div>
                                <div className="flex-1 bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 text-center border border-white/[0.08] shadow-inner">
                                    <div className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">END</div>
                                    <div className="text-xl font-mono font-bold text-white/90">{endTime}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-white/5 transition-all focus-within:border-emerald-500">
                             <label className="text-[10px] text-slate-400 font-black uppercase mb-1 flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                             <input type="time" value={record.startTime} onChange={e => setRecord({...record, startTime: e.target.value})} className="bg-transparent font-mono text-2xl font-bold text-brand-text dark:text-slate-100 outline-none w-full"/>
                        </div>
                        {isStepBased ? (
                             <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                                 <label className="text-[10px] text-emerald-500 font-black uppercase mb-1 flex items-center gap-1"><Footprints size={10}/> 今日步数</label>
                                 <input type="number" value={record.steps || ''} onChange={e => setRecord({...record, steps: parseInt(e.target.value)})} placeholder="0" className="bg-transparent font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 outline-none w-full"/>
                             </div>
                        ) : !isStartMode && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                                <label className="text-[10px] text-slate-400 font-black uppercase mb-1 flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent font-mono text-2xl font-bold text-brand-text dark:text-slate-100 outline-none w-full"/>
                            </div>
                        )}
                    </div>
                )}

                {!isFinishMode && (
                    <div className="space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                            <input 
                                className="w-full bg-slate-100 dark:bg-slate-800/80 border-none rounded-2xl py-4 pl-14 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                                placeholder="查找运动项..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-6">
                            {filteredCategories.map(cat => {
                                const isExpanded = searchTerm ? true : expandedCategory === cat.name;
                                return (
                                    <div key={cat.name} className="space-y-3">
                                        <button onClick={() => toggleCategory(cat.name)} className="w-full flex items-center justify-between px-1 hover:opacity-80">
                                            <div className="flex items-center gap-2"><div className="w-1 h-3 bg-emerald-500 rounded-full"></div><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{cat.name}</h4></div>
                                            {!searchTerm && (isExpanded ? <ChevronUp size={14} className="text-slate-300"/> : <ChevronDown size={14} className="text-slate-300"/>)}
                                        </button>
                                        {isExpanded && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                                {cat.items.map(item => (
                                                    <button key={item} onClick={() => setRecord({...record, type: item})} className={`p-4 rounded-3xl text-[13px] font-bold text-left transition-all flex items-center justify-between border-2 ${record.type === item ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-md shadow-emerald-500/10' : 'border-transparent bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}>
                                                        <span className="truncate pr-2">{item}</span>
                                                        {record.type === item && <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={4}/></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(isFinishMode || (!isStartMode && record.type)) && !isStepBased && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={12}/> 训练强度评级</label>
                            <div className="flex gap-2">
                                {INTENSITY_OPTS.map(opt => {
                                    const isSel = record.intensity === opt.value;
                                    return (
                                        <button key={opt.value} onClick={() => setRecord({...record, intensity: opt.value})} className={`flex-1 py-4 px-2 rounded-2xl transition-all border-2 flex flex-col items-center justify-center gap-0.5 ${isSel ? 'border-brand-accent bg-blue-50 dark:bg-blue-900/20 text-brand-accent shadow-lg shadow-blue-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                            <span className="text-sm font-black">{opt.label}</span>
                                            <span className="text-[9px] font-bold opacity-60">{opt.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> 身心恢复感知</label>
                            <div className="grid grid-cols-4 gap-3">
                                {FEELING_OPTS.map(opt => {
                                    const isSel = record.feeling === opt.value;
                                    return (
                                        <button key={opt.value} onClick={() => setRecord({...record, feeling: opt.value})} className={`flex flex-col items-center justify-center py-5 rounded-3xl transition-all border-2 ${isSel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-4 ring-emerald-500/5' : 'border-transparent bg-slate-50 dark:bg-slate-800 opacity-60'}`}>
                                            <opt.icon size={28} className={isSel ? opt.color : 'text-slate-400'} />
                                            <span className={`text-[10px] font-black mt-2 ${isSel ? 'text-brand-text dark:text-slate-100' : 'text-slate-500 dark:text-slate-600'}`}>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> 重点训练部位 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(part => {
                                    const isSel = record.bodyParts?.includes(part);
                                    return (
                                        <button key={part} onClick={() => setRecord(p => ({...p, bodyParts: p.bodyParts?.includes(part) ? p.bodyParts.filter(x => x!==part) : [...(p.bodyParts||[]), part]}))} className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${isSel ? 'border-brand-accent bg-brand-accent text-white shadow-md' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                                            {part}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                <div className="relative group pt-4">
                    <div className="absolute left-5 top-8 text-slate-400 group-focus-within:text-brand-accent transition-colors"><PenLine size={18} /></div>
                    <textarea className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-[1.5rem] py-4 pl-14 pr-4 text-xs font-medium outline-none focus:border-brand-accent transition-all min-h-[100px]" placeholder="记录你的训练心得或感悟..." value={record.notes || ''} onChange={e => setRecord({...record, notes: e.target.value})}/>
                </div>
            </div>
        </Modal>
    );
};

export default ExerciseRecordModal;
