
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Clock, PenLine, Play, Flag, Footprints, Smile, Frown, Meh, Zap, TrendingUp, Sparkles, Target, Flame } from 'lucide-react';
import { Modal } from '../../shared/ui';
import type { ExerciseRecord, ExerciseIntensity, LogEntry } from '../../domain';
import { analyzeUserPatterns } from './model/smartDefaults';

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
    { value: 'great', label: '状态极佳', icon: Zap, color: 'text-state-warning-text' },
    { value: 'ok', label: '还算不错', icon: Smile, color: 'text-state-success-text' },
    { value: 'tired', label: '有点累了', icon: Meh, color: 'text-state-warning-text' },
    { value: 'bad', label: '身体不适', icon: Frown, color: 'text-state-danger-text' },
];

type ExerciseRecordModalMode = 'create' | 'edit' | 'start' | 'finish';

interface ExerciseRecordModalData {
    initialData?: ExerciseRecord;
    mode?: ExerciseRecordModalMode;
    logs?: LogEntry[];
}

interface ExerciseRecordModalActions {
    onSave: (record: ExerciseRecord) => void;
}

interface ExerciseRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ExerciseRecordModalData;
    actions: ExerciseRecordModalActions;
}

const ExerciseRecordModal: React.FC<ExerciseRecordModalProps> = ({ isOpen, onClose, data, actions }) => {
    const {
        initialData,
        mode = 'create',
        logs
    } = data;
    const { onSave } = actions;

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>("步行");
    const [endTime, setEndTime] = useState('');
    const [smartTypeApplied, setSmartTypeApplied] = useState(false);
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
                setEndTime(d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
                setSmartTypeApplied(false);
            } else {
                const now = new Date();
                const nowStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
                const todayDow = DAYS[now.getDay()];
                const smartType = logs ? analyzeUserPatterns(logs, 'exerciseType', todayDow) : { value: null, confidence: 0, sampleSize: 0 };
                const useSmart = smartType.value && typeof smartType.value === 'string' && smartType.confidence > 0.5;
                const initialType = useSmart ? (smartType.value as string) : '';
                setRecord({
                    id: Date.now().toString(), type: initialType, startTime: nowStr, duration: 30, intensity: 'medium', bodyParts: [], steps: undefined, notes: '', feeling: 'ok'
                });
                setEndTime(endD.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
                setSmartTypeApplied(!!useSmart);
                if (useSmart) {
                    const cat = EXERCISE_CATEGORIES.find(c => c.items.includes(initialType));
                    if (cat) setExpandedCategory(cat.name);
                }
            }
        }
    }, [isOpen, initialData, logs]);

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
                    className={`w-full py-4 text-text-on-accent font-black rounded-2xl shadow-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${isStartMode ? 'bg-state-success-text' : 'bg-accent'}`}
                >
                    {isStartMode ? <Play size={20} fill="currentColor"/> : <Check size={20} strokeWidth={3}/>}
                    {isStartMode ? "开启运动" : "完成提交"}
                </button>
            }
        >
            <div className="space-y-6 pb-6">
                {isFinishMode ? (
                    /* 重构后的浅色模式友好卡片 */
                    <div className="bg-gradient-to-br from-state-success-bg/80 via-surface-card to-state-info-bg/60 border border-surface-border rounded-[2.5rem] p-8 relative overflow-hidden shadow-soft">
                        {/* 氛围光：浅色模式下更加淡雅 */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-state-success-text/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-state-info-text/10 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-state-success-text mb-4">
                                <Flame size={14} className="animate-pulse"/> WORKOUT ACCOMPLISHED
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-7xl font-black tabular-nums tracking-tighter text-text-primary drop-shadow-sm">{record.duration}</span>
                                <span className="text-lg font-black text-text-muted">分钟</span>
                            </div>

                            <div className="mt-8 flex gap-4 w-full">
                                <div className="flex-1 bg-surface-card/80 backdrop-blur-xl rounded-3xl p-5 text-center border border-surface-border shadow-inner">
                                    <div className="text-[10px] font-black text-text-muted uppercase mb-2 tracking-widest">START</div>
                                    <div className="text-xl font-mono font-bold text-text-secondary">{record.startTime}</div>
                                </div>
                                <div className="flex-1 bg-surface-card/80 backdrop-blur-xl rounded-3xl p-5 text-center border border-surface-border shadow-inner">
                                    <div className="text-[10px] font-black text-text-muted uppercase mb-2 tracking-widest">END</div>
                                    <div className="text-xl font-mono font-bold text-text-secondary">{endTime}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-muted p-4 rounded-3xl border border-surface-border transition-all focus-within:border-accent">
                             <label className="text-[10px] text-text-muted font-black uppercase mb-1 flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                             <input type="time" value={record.startTime} onChange={e => setRecord({...record, startTime: e.target.value})} className="bg-transparent font-mono text-2xl font-bold text-text-primary outline-none w-full"/>
                        </div>
                        {isStepBased ? (
                             <div className="bg-state-success-bg p-4 rounded-3xl border border-state-success-text/25">
                                 <label className="text-[10px] text-state-success-text font-black uppercase mb-1 flex items-center gap-1"><Footprints size={10}/> 今日步数</label>
                                 <input type="number" value={record.steps || ''} onChange={e => setRecord({...record, steps: parseInt(e.target.value)})} placeholder="0" className="bg-transparent font-mono text-2xl font-bold text-state-success-text outline-none w-full"/>
                             </div>
                        ) : !isStartMode && (
                            <div className="bg-surface-muted p-4 rounded-3xl border border-surface-border">
                                <label className="text-[10px] text-text-muted font-black uppercase mb-1 flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                                <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent font-mono text-2xl font-bold text-text-primary outline-none w-full"/>
                            </div>
                        )}
                    </div>
                )}

                {!isFinishMode && (
                    <div className="space-y-4">
                        {smartTypeApplied && record.type && (
                            <div className="flex items-center justify-between gap-2 rounded-2xl border border-state-success-text/25 bg-state-success-bg px-4 py-2 text-[11px] font-bold text-state-success-text">
                                <span className="flex items-center gap-1.5"><Sparkles size={12}/> 智能默认 · {record.type} · 可换</span>
                                <button
                                    type="button"
                                    onClick={() => { setRecord(r => ({ ...r, type: '' })); setSmartTypeApplied(false); }}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-black text-state-success-text underline-offset-2 hover:underline"
                                >清除</button>
                            </div>
                        )}
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
                            <input 
                                className="w-full bg-surface-muted border-none rounded-2xl py-4 pl-14 pr-4 text-sm font-bold focus:ring-2 focus:ring-accent/30 outline-none transition-all"
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
                                            <div className="flex items-center gap-2"><div className="w-1 h-3 bg-state-success-text rounded-full"></div><h4 className="text-xs font-black text-text-muted uppercase tracking-widest">{cat.name}</h4></div>
                                            {!searchTerm && (isExpanded ? <ChevronUp size={14} className="text-text-muted"/> : <ChevronDown size={14} className="text-text-muted"/>)}
                                        </button>
                                        {isExpanded && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-slow">
                                                {cat.items.map(item => (
                                                    <button key={item} onClick={() => { setRecord({...record, type: item}); setSmartTypeApplied(false); }} className={`p-4 rounded-3xl text-[13px] font-bold text-left transition-all flex items-center justify-between border-2 ${record.type === item ? 'border-state-success-text bg-state-success-bg text-state-success-text shadow-soft' : 'border-transparent bg-surface-card text-text-secondary hover:bg-surface-muted'}`}>
                                                        <span className="truncate pr-2">{item}</span>
                                                        {record.type === item && <div className="w-4 h-4 bg-state-success-text rounded-full flex items-center justify-center"><Check size={10} className="text-text-on-accent" strokeWidth={4}/></div>}
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
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><TrendingUp size={12}/> 训练强度评级</label>
                            <div className="flex gap-2">
                                {INTENSITY_OPTS.map(opt => {
                                    const isSel = record.intensity === opt.value;
                                    return (
                                        <button key={opt.value} onClick={() => setRecord({...record, intensity: opt.value})} className={`flex-1 py-4 px-2 rounded-2xl transition-all border-2 flex flex-col items-center justify-center gap-0.5 ${isSel ? 'border-accent bg-state-info-bg text-accent shadow-soft' : 'border-transparent bg-surface-muted text-text-muted'}`}>
                                            <span className="text-sm font-black">{opt.label}</span>
                                            <span className="text-[9px] font-bold opacity-60">{opt.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> 身心恢复感知</label>
                            <div className="grid grid-cols-4 gap-3">
                                {FEELING_OPTS.map(opt => {
                                    const isSel = record.feeling === opt.value;
                                    return (
                                        <button key={opt.value} onClick={() => setRecord({...record, feeling: opt.value})} className={`flex flex-col items-center justify-center py-5 rounded-3xl transition-all border-2 ${isSel ? 'border-state-success-text bg-state-success-bg shadow-soft ring-4 ring-state-success-text/5' : 'border-transparent bg-surface-muted opacity-60'}`}>
                                            <opt.icon size={28} className={isSel ? opt.color : 'text-text-muted'} />
                                            <span className={`text-[10px] font-black mt-2 ${isSel ? 'text-text-primary' : 'text-text-muted'}`}>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Target size={12}/> 重点训练部位 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(part => {
                                    const isSel = record.bodyParts?.includes(part);
                                    return (
                                        <button key={part} onClick={() => setRecord(p => ({...p, bodyParts: p.bodyParts?.includes(part) ? p.bodyParts.filter(x => x!==part) : [...(p.bodyParts||[]), part]}))} className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${isSel ? 'border-accent bg-accent text-text-on-accent shadow-soft' : 'border-transparent bg-surface-muted text-text-secondary hover:bg-surface-border'}`}>
                                            {part}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                <div className="relative group pt-4">
                    <div className="absolute left-5 top-8 text-text-muted group-focus-within:text-accent transition-colors"><PenLine size={18} /></div>
                    <textarea className="w-full bg-surface-muted border border-surface-border rounded-[1.5rem] py-4 pl-14 pr-4 text-xs font-medium outline-none focus:border-accent transition-all min-h-[100px]" placeholder="记录你的训练心得或感悟..." value={record.notes || ''} onChange={e => setRecord({...record, notes: e.target.value})}/>
                </div>
            </div>
        </Modal>
    );
};

export default ExerciseRecordModal;
