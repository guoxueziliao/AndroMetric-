
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronUp, Check, Dumbbell, Clock, Activity, PenLine, Play, Flag, Footprints, Smile, Frown, Meh, Zap } from 'lucide-react';
import Modal from './Modal';
import { ExerciseRecord, ExerciseIntensity, ExerciseFeeling } from '../types';

const EXERCISE_CATEGORIES = [
  {
    name: "步行",
    items: ["日常步行", "户外步行", "室内步行", "徒步", "遛狗", "城市散步", "负重步行"]
  },
  {
    name: "跑步",
    items: ["户外跑步", "室内跑步", "越野跑", "带狗跑步", "推车跑步", "斯巴达障碍跑"]
  },
  {
    name: "骑行",
    items: ["户外骑行", "室内骑行", "电动自行车骑行", "砾石骑行", "山地自行车骑行", "小轮车", "手摇式骑行", "运输自行车骑行"]
  },
  {
    name: "球类运动",
    items: ["足球", "篮球", "橄榄球", "高尔夫", "棒球", "网球", "排球", "保龄球", "曲棍球", "腰旗橄榄球", "壁球", "羽毛球", "乒乓球", "手球", "匹克球", "板球", "长曲棍球"]
  },
  {
    name: "健身训练",
    items: ["高强度间歇训练", "交叉训练", "传统力量训练", "功能性力量训练", "核心训练", "混合有氧", "准备和恢复", "整理放松", "跳绳", "椭圆机", "踏步机", "楼梯", "柔韧度"]
  },
  {
    name: "工作室运动",
    items: ["瑜伽", "舞蹈", "普拉提", "柔缓冥想类运动"]
  },
  {
    name: "水上运动",
    items: ["泳池游泳", "开放水域游泳", "冲浪运动", "帆船运动", "皮划艇", "划船", "皮划艇运动", "水上运动"]
  },
  {
    name: "雪",
    items: ["高山滑雪", "单板滑雪", "越野滑雪", "户外滑冰", "室内滑冰", "雪上运动"]
  },
  {
    name: "格斗运动",
    items: ["踢拳", "拳击", "摔跤", "武术", "太极"]
  },
  {
    name: "其他",
    items: ["健身游戏", "钓鱼", "飞盘运动", "滑板", "攀岩", "马术运动", "啦啦队", "跑酷", "箭术", "剑术", "轮椅运动", "其他"]
  }
];

const MUSCLE_GROUPS = ["胸", "背", "腿", "肩", "斜方肌", "二头", "三头", "前臂", "腹", "臀", "小腿", "拉伸", "有氧"];
const INTENSITY_OPTS: { value: ExerciseIntensity, label: string }[] = [{value: 'low', label: '轻度'}, {value: 'medium', label: '中度'}, {value: 'high', label: '高强'}];
const FEELING_OPTS: { value: ExerciseFeeling, label: string, icon: React.ElementType, color: string }[] = [
    { value: 'great', label: '爽爆', icon: Zap, color: 'text-yellow-500' },
    { value: 'ok', label: '正常', icon: Smile, color: 'text-green-500' },
    { value: 'tired', label: '累爆', icon: Meh, color: 'text-orange-500' },
    { value: 'bad', label: '不适', icon: Frown, color: 'text-red-500' },
];

interface ExerciseRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: ExerciseRecord) => void;
    initialData?: ExerciseRecord;
    mode?: 'create' | 'edit' | 'start' | 'finish'; // 'start' hides duration/end time
}

const ExerciseRecordModal: React.FC<ExerciseRecordModalProps> = ({ isOpen, onClose, onSave, initialData, mode = 'create' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [endTime, setEndTime] = useState('');
    
    // Form State
    const [record, setRecord] = useState<ExerciseRecord>({
        id: '',
        type: '',
        startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        duration: 30,
        intensity: 'medium',
        bodyParts: [],
        steps: undefined,
        notes: '',
        feeling: 'ok'
    });

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            if (initialData) {
                setRecord({
                    ...initialData,
                    feeling: initialData.feeling || 'ok'
                });
                const cat = EXERCISE_CATEGORIES.find(c => c.items.includes(initialData.type));
                if (cat) setExpandedCategory(cat.name);
                
                // Initialize End Time from Duration
                const [h, m] = initialData.startTime.split(':').map(Number);
                const d = new Date(); d.setHours(h); d.setMinutes(m + (initialData.duration || 0));
                setEndTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            } else {
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                // Default end time = start + 30m
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                const endStr = endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                setRecord({
                    id: Date.now().toString(),
                    type: '',
                    startTime: nowStr,
                    duration: 30,
                    intensity: 'medium',
                    bodyParts: [],
                    steps: undefined,
                    notes: '',
                    feeling: 'ok'
                });
                setEndTime(endStr);
                // Default expand the first category
                setExpandedCategory("步行"); 
            }
        }
    }, [isOpen, initialData]);

    const handleSelectType = (type: string) => {
        setRecord(prev => ({ ...prev, type }));
    };

    const toggleBodyPart = (part: string) => {
        setRecord(prev => {
            const parts = prev.bodyParts || [];
            if (parts.includes(part)) {
                return { ...prev, bodyParts: parts.filter(p => p !== part) };
            } else {
                return { ...prev, bodyParts: [...parts, part] };
            }
        });
    };
    
    // Sync Duration when End Time changes
    const handleEndTimeChange = (newEndTime: string) => {
        setEndTime(newEndTime);
        if (!record.startTime || !newEndTime) return;
        
        const [h1, m1] = record.startTime.split(':').map(Number);
        const [h2, m2] = newEndTime.split(':').map(Number);
        
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60; // Handle midnight crossing
        setRecord(prev => ({ ...prev, duration: diff }));
    };

    // Sync End Time when Duration changes
    const handleDurationChange = (newDuration: number) => {
        setRecord(prev => ({ ...prev, duration: newDuration }));
        const [h, m] = record.startTime.split(':').map(Number);
        const d = new Date(); d.setHours(h); d.setMinutes(m + newDuration);
        setEndTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    const isFitnessTraining = useMemo(() => {
        const fitnessCat = EXERCISE_CATEGORIES.find(c => c.name === "健身训练");
        return fitnessCat?.items.includes(record.type) || record.type === "健身训练"; 
    }, [record.type]);
    
    // Updated: Only "日常步行" triggers the step-count mode
    const isStepBased = record.type === '日常步行';

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return EXERCISE_CATEGORIES;
        return EXERCISE_CATEGORIES.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.includes(searchTerm))
        })).filter(cat => cat.items.length > 0);
    }, [searchTerm]);

    if (!isOpen) return null;

    const isStartMode = mode === 'start';
    const isFinishMode = mode === 'finish';
    const title = isStartMode ? "开始运动" : isFinishMode ? "完成运动" : initialData ? "编辑运动" : "记录运动";
    
    // Adjust button label for StepBased (Daily Walking) records
    const saveLabel = (isStartMode && !isStepBased) ? "开始" : (isFinishMode || isStepBased) ? "完成" : "保存";
    const saveIcon = (isStartMode && !isStepBased) ? <Play size={16} className="mr-1"/> : (isFinishMode || isStepBased) ? <Flag size={16} className="mr-1"/> : null;
    const buttonBgClass = (isStartMode && !isStepBased) ? 'bg-orange-500' : 'bg-brand-accent';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex w-full gap-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl">取消</button>
                    <button 
                        onClick={() => { onSave(record); onClose(); }} 
                        disabled={!record.type}
                        className={`flex-1 py-3 text-white font-bold rounded-xl disabled:opacity-50 shadow-md flex items-center justify-center ${buttonBgClass}`}
                    >
                        {saveIcon}
                        {saveLabel}
                    </button>
                </div>
            }
        >
            <div className="h-[75vh] flex flex-col">
                {/* 1. Time & Duration OR Steps (Dynamic Switch) */}
                {isStepBased ? (
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 mb-4 animate-in fade-in">
                        <div className="flex items-center gap-2 mb-2">
                             <Footprints size={18} className="text-orange-500"/>
                             <span className="font-bold text-sm text-brand-text dark:text-slate-200">每日步数总计</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={record.steps || ''}
                                onChange={e => setRecord({...record, steps: parseInt(e.target.value) || 0})}
                                placeholder="输入步数 (例如 8000)"
                                className="flex-1 text-2xl font-black text-orange-600 dark:text-orange-400 bg-transparent outline-none placeholder-slate-300"
                                autoFocus
                            />
                            <span className="text-sm font-bold text-slate-400">步</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 mb-4 flex-none animate-in fade-in">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                             <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">开始时间</label>
                             <input 
                                type="time" 
                                value={record.startTime}
                                onChange={e => {
                                    setRecord({...record, startTime: e.target.value});
                                    // Recalc duration if end time is set
                                    const [h1, m1] = e.target.value.split(':').map(Number);
                                    const [h2, m2] = endTime.split(':').map(Number);
                                    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                    if (diff < 0) diff += 24 * 60;
                                    setRecord(p => ({...p, startTime: e.target.value, duration: diff}));
                                }}
                                className="bg-transparent font-mono text-lg font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                            />
                        </div>
                        
                        {!isStartMode && (
                            <>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">结束时间</label>
                                    <input 
                                        type="time" 
                                        value={endTime}
                                        onChange={e => handleEndTimeChange(e.target.value)}
                                        className="bg-transparent font-mono text-lg font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                                    />
                                </div>
                                <div className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-center items-center">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">时长</span>
                                    <span className="text-lg font-bold font-mono">{record.duration}m</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 2. Type Selector (Scrollable) */}
                <div className="flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 mb-4">
                     <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-brand-accent outline-none"
                                placeholder="搜索运动类型..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {filteredCategories.map(cat => (
                            <div key={cat.name} className="overflow-hidden rounded-lg">
                                <button 
                                    onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <span className="font-bold text-sm text-brand-text dark:text-slate-200">{cat.name}</span>
                                    {expandedCategory === cat.name || searchTerm ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                                </button>
                                
                                {(expandedCategory === cat.name || searchTerm) && (
                                    <div className="p-2 grid grid-cols-2 gap-2 bg-slate-50/30 dark:bg-slate-800/30">
                                        {cat.items.map(item => (
                                            <button
                                                key={item}
                                                onClick={() => handleSelectType(item)}
                                                className={`text-left text-xs p-2 rounded-lg border transition-all flex justify-between items-center ${
                                                    record.type === item 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-brand-accent text-brand-accent font-bold shadow-sm' 
                                                    : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                <span>{item}</span>
                                                {record.type === item && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

                {/* 3. Details (Intensity & Body Parts) */}
                {!isStepBased && (
                <div className="flex-none space-y-3 animate-in fade-in">
                    {/* Intensity & Feeling */}
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-[10px] text-slate-500 font-bold mb-1 block">强度</label>
                             <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {INTENSITY_OPTS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRecord({...record, intensity: opt.value})}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${record.intensity === opt.value ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 font-bold mb-1 block">体感</label>
                             <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {FEELING_OPTS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRecord({...record, feeling: opt.value})}
                                        className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${record.feeling === opt.value ? `bg-white dark:bg-slate-700 shadow-sm ${opt.color}` : 'text-slate-400 opacity-60'}`}
                                    >
                                        <opt.icon size={16}/>
                                    </button>
                                ))}
                             </div>
                         </div>
                     </div>

                     {/* Body Parts - Only if relevant */}
                     {(isFitnessTraining || (record.bodyParts && record.bodyParts.length > 0)) && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider">
                                <Dumbbell size={14} /> 训练部位 (可选)
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(part => (
                                    <button
                                        key={part}
                                        onClick={() => toggleBodyPart(part)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            record.bodyParts?.includes(part)
                                            ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {part}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                )}
                    
                {/* Notes */}
                <div className="relative mt-3">
                    <PenLine size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent"
                        placeholder="运动备注..."
                        value={record.notes || ''}
                        onChange={e => setRecord({...record, notes: e.target.value})}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ExerciseRecordModal;
