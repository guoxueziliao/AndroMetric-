import React, { useState, useEffect, useMemo } from 'react';
import { Check, Clock, Film, PenLine, Plus, Minus, Zap, Edit2, Trash2, MonitorPlay, ChevronDown, LayoutGrid, Activity, Droplets, BatteryFull, PhoneOff, HeartOff, Flag, MapPin } from 'lucide-react';
import type { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem, TagEntry, TagType } from '../../domain';
import { Modal } from '../../shared/ui';
import { calculateInventory } from '../../shared/lib';
import { useMasturbationTagTools } from './model/useMasturbationTagTools';
import {
  FORCE_LEVELS,
  FATIGUE_OPTIONS,
  INTERRUPTION_REASONS,
  LOCATION_OPTIONS,
  LUBRICANT_OPTIONS,
  ORGASM_LABELS,
  POST_MOOD_OPTIONS,
  SATISFACTION_LEVELS,
  TOOL_OPTIONS,
  calculateDurationFromTimes
} from './model/masturbationModalData';
import MasturbationContentItemEditor from './MasturbationContentItemEditor';

interface MasturbationRecordModalData {
  partners?: PartnerProfile[];
  logs?: LogEntry[];
  userTags: TagEntry[];
}

interface MasturbationRecordModalActions {
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
}

interface MasturbationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MasturbationRecordDetails) => void;
  initialData?: MasturbationRecordDetails;
  dateStr: string;
  data: MasturbationRecordModalData;
  actions: MasturbationRecordModalActions;
}

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, data: modalData, actions }) => {
    const {
        logs = [],
        userTags
    } = modalData;

    const {
        onAddOrUpdateLog,
        onAddOrUpdateTag,
        onDeleteTag
    } = actions;

    const [data, setData] = useState<MasturbationRecordDetails>({
        id: '', startTime: '', duration: 15, status: 'completed', tools: ['手'], contentItems: [],
        edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true, orgasmIntensity: 3,
        satisfactionLevel: 3,
        mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
        volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳', location: '卧室/床上'
    });

    const [endTime, setEndTime] = useState('');
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [activeTagTab, setActiveTagTab] = useState<string>('常用');
    const [tagSearch, setTagSearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const inventory = useMemo(() => calculateInventory(logs), [logs, isOpen]);

    const {
        tagUsageMap,
        createXpTag
    } = useMasturbationTagTools({
        logs,
        onAddOrUpdateTag
    });

    const handleStartTimeChange = (newStart: string) => {
        const newDuration = calculateDurationFromTimes(newStart, endTime);
        setData(prev => ({ ...prev, startTime: newStart, duration: newDuration }));
    };

    const handleEndTimeChange = (newEnd: string) => {
        setEndTime(newEnd);
        const newDuration = calculateDurationFromTimes(data.startTime, newEnd);
        setData(prev => ({ ...prev, duration: newDuration }));
    };

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const nowStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (initialData) {
                let calculatedEndTime = nowStr;
                let calculatedDuration = initialData.duration || 0;

                if (initialData.status === 'inProgress' && initialData.startTime) {
                    calculatedDuration = calculateDurationFromTimes(initialData.startTime, nowStr);
                } else if (initialData.startTime && initialData.duration) {
                    const [h, m] = initialData.startTime.split(':').map(Number);
                    const d = new Date(); d.setHours(h); d.setMinutes(m + initialData.duration);
                    calculatedEndTime = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
                }

                setData({
                    ...initialData,
                    contentItems: initialData.contentItems || [],
                    volumeForceLevel: initialData.volumeForceLevel || (initialData.ejaculation ? 3 : undefined),
                    satisfactionLevel: initialData.satisfactionLevel || (initialData.ejaculation ? 3 : 1),
                    postMood: initialData.postMood || '平静/贤者',
                    fatigue: initialData.fatigue || '无明显疲劳',
                    orgasmIntensity: initialData.orgasmIntensity ?? 3,
                    edgingCount: initialData.edgingCount ?? 0,
                    lubricant: initialData.lubricant || '无润滑',
                    useCondom: initialData.useCondom || false,
                    interrupted: initialData.interrupted || false,
                    interruptionReasons: initialData.interruptionReasons || [],
                    duration: calculatedDuration,
                    location: initialData.location || '卧室/床上'
                });
                setEndTime(calculatedEndTime);
            } else {
                setData({
                    id: Date.now().toString(),
                    startTime: nowStr,
                    duration: 0, status: 'completed', tools: ['手'], contentItems: [],
                    edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true, orgasmIntensity: 3,
                    satisfactionLevel: 3,
                    mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
                    volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳', location: '卧室/床上'
                });
                setEndTime(nowStr);
            }
        }
    }, [isOpen, initialData]);

    const updateData = (fields: Partial<MasturbationRecordDetails>) => setData(prev => ({ ...prev, ...fields }));

    const handleSave = () => {
        onSave({ ...data, status: 'completed' });
        onClose();
    };

    const toggleXpTag = (tag: string) => {
        if (!editingItem) return;
        const current = editingItem.xpTags || [];
        const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
        setEditingItem({ ...editingItem, xpTags: next });
    };

    const handleQuickCreateTag = async () => {
        const tagStr = tagSearch.trim();
        if (!tagStr || !activeTagTab || activeTagTab === '常用') return;

        const created = await createXpTag(tagStr, activeTagTab);
        if (!created) return;

        toggleXpTag(tagStr);
        setTagSearch('');
    };

    const toggleInterruptionReason = (reason: string) => {
        const current = data.interruptionReasons || [];
        const next = current.includes(reason) ? current.filter(r => r !== reason) : [...current, reason];
        updateData({ interruptionReasons: next });
    };

    const displayTags = useMemo(() => {
        const xpTagsOnly = userTags.filter(t => t.category === 'xp');
        let pool: string[] = [];

        if (tagSearch) {
            pool = xpTagsOnly
                .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                .sort((a, b) => (tagUsageMap[b.name] || 0) - (tagUsageMap[a.name] || 0))
                .map(t => t.name);
        } else {
            if (activeTagTab === '常用') {
                pool = xpTagsOnly
                    .filter(t => (tagUsageMap[t.name] || 0) > 0)
                    .sort((a, b) => tagUsageMap[b.name] - tagUsageMap[a.name])
                    .slice(0, 20)
                    .map(t => t.name);
            } else {
                pool = xpTagsOnly
                    .filter(t => t.dimension === activeTagTab)
                    .sort((a, b) => (tagUsageMap[b.name] || 0) - (tagUsageMap[a.name] || 0))
                    .map(t => t.name);
            }
        }
        return Array.from(new Set(pool));
    }, [userTags, activeTagTab, tagSearch, tagUsageMap]);

    if (!isOpen) return null;

    const orgasmLabelInfo = ORGASM_LABELS[data.orgasmIntensity || 3] || ORGASM_LABELS[3];

    const handleSaveEditingItem = () => {
        if (!editingItem) return;
        const nextItems = data.contentItems.find(i => i.id === editingItem.id)
            ? data.contentItems.map(i => i.id === editingItem.id ? editingItem : i)
            : [...data.contentItems, editingItem];
        updateData({ contentItems: nextItems });
        setEditingItem(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "编辑自慰记录" : "记录施法"}
            footer={
                <button onClick={handleSave} className="w-full py-4 bg-brand-accent text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Check size={20} strokeWidth={3}/> 保存记录
                </button>
            }
        >
            <div className="space-y-6 pb-10 animate-in fade-in duration-300">

                {/* 0. Inventory Header */}
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">当前蓄力 (INVENTORY)</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{inventory}</span>
                </div>

                {/* 1. Time Grid */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 transition-all focus-within:border-brand-accent/50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                            <input type="time" value={data.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none w-full"/>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 transition-all focus-within:border-brand-accent/50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                            <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none w-full"/>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">持续时长 (分钟)</span>
                            <div className="text-xs text-blue-400 font-bold mt-0.5">根据起止时间自动计算</div>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm">
                            <button onClick={() => updateData({duration: Math.max(0, data.duration - 1)})} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Minus size={18} strokeWidth={3}/></button>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums min-w-[2rem] text-center">{data.duration}</span>
                            <button onClick={() => updateData({duration: data.duration + 1})} className="p-1.5 text-blue-600 hover:text-blue-500 transition-colors"><Plus size={18} strokeWidth={3}/></button>
                        </div>
                    </div>
                </div>

                {/* 2. Materials */}
                <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">施法素材</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 rounded-full">{data.contentItems.length}</span>
                    </div>

                    <div className="space-y-2">
                        {data.contentItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400"><Film size={16}/></div>
                                    <div>
                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">{item.title || item.type}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">{item.platform}</div>
                                        {item.xpTags && item.xpTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.xpTags.map(tag => (
                                                    <span key={tag} className="text-[8px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1 rounded border border-blue-100 dark:border-blue-900/50">
                                                        {tag.replace(/^#/, '')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setEditingItem(item)} aria-label="编辑素材" className="p-2 text-slate-400 hover:text-brand-accent min-w-[44px] min-h-[44px] flex items-center justify-center"><Edit2 size={14}/></button>
                                    <button onClick={() => updateData({contentItems: data.contentItems.filter(i => i.id !== item.id)})} aria-label="删除素材" className="p-2 text-slate-400 hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => setEditingItem({ id: Math.random().toString(36).substr(2, 9), actors: [], xpTags: [], type: '', platform: '', title: '' })}
                            className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-brand-accent/50 transition-all bg-white dark:bg-slate-900/40"
                        >
                            <MonitorPlay size={32} className="text-slate-300 group-hover:text-brand-accent transition-colors" />
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400 group-hover:text-slate-500">暂无素材详情</div>
                                <div className="text-[10px] text-slate-300 mt-1">添加具体的视频、演员或标签</div>
                            </div>
                            <div className="mt-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-brand-accent text-xs font-black rounded-lg border border-blue-100 dark:border-blue-900">
                                + 添加素材
                            </div>
                        </button>
                    </div>
                </div>

                {/* 3. Location */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" /> 地点 (LOCATION)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {LOCATION_OPTIONS.map(loc => {
                            const isSel = data.location === loc.id;
                            return (
                                <button
                                    key={loc.id}
                                    onClick={() => updateData({location: loc.id})}
                                    className={`flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${isSel ? 'border-brand-accent bg-blue-50 dark:bg-blue-900/20 text-brand-accent shadow-md' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <loc.icon size={20} className={`mb-1.5 ${isSel ? 'text-brand-accent' : 'text-slate-400'}`} />
                                    <span className="text-[10px] font-black text-center">{loc.id}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-3 text-slate-300"><Edit2 size={12}/></div>
                        <input
                            placeholder="其他具体地点描述..."
                            value={LOCATION_OPTIONS.some(o => o.id === data.location) ? '' : data.location}
                            onChange={e => updateData({location: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pl-8 text-[11px] font-bold outline-none focus:border-brand-accent transition-all"
                        />
                    </div>
                </div>

                {/* 4. Tools & Lubricant */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">辅助工具 (TOOLS)</label>
                    <div className="flex flex-wrap gap-2">
                        {TOOL_OPTIONS.map(tool => {
                            const isSel = data.tools.includes(tool);
                            return (
                                <button key={tool} onClick={() => updateData({tools: isSel ? data.tools.filter(t => t !== tool) : [...data.tools, tool]})} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSel ? 'bg-blue-900/20 text-brand-accent border-brand-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'}`}>
                                    {tool}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <select value={data.lubricant} onChange={e => updateData({lubricant: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-8 text-xs font-bold appearance-none outline-none focus:border-brand-accent">
                                {LUBRICANT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <Droplets size={14} className="absolute left-3 top-3.5 text-blue-500" />
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                        </div>
                        <button onClick={() => updateData({useCondom: !data.useCondom})} className={`px-5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${data.useCondom ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                            <div className={`w-2 h-2 rounded-full border border-current ${data.useCondom ? 'bg-current' : 'bg-transparent'}`}></div> 戴套
                        </button>
                    </div>
                </div>

                {/* 5. Edging */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Activity size={20}/></div>
                        <div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">边缘控制 (Edging)</div>
                            <div className="text-[10px] text-slate-400 font-bold">快射时停下</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <button onClick={() => updateData({edgingCount: Math.max(0, data.edgingCount - 1)})} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400"><Minus size={16}/></button>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 w-4 text-center tabular-nums">{data.edgingCount}</span>
                        <button onClick={() => updateData({edgingCount: data.edgingCount + 1})} className="p-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-full"><Plus size={16}/></button>
                    </div>
                </div>

                {/* 6. Interruption */}
                <div className={`bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border transition-all ${data.interrupted ? 'border-orange-200 dark:border-orange-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${data.interrupted ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                <PhoneOff size={18}/>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-700 dark:text-slate-200">中途被打断</div>
                                <div className="text-[10px] text-slate-400 font-bold">意外状况或心不在焉</div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle-checkbox"
                            checked={data.interrupted}
                            onChange={e => updateData({interrupted: e.target.checked, interruptionReasons: e.target.checked ? data.interruptionReasons : []})}
                        />
                    </div>
                    {data.interrupted && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest px-1">打断原因 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {INTERRUPTION_REASONS.map(reason => {
                                    const isSel = data.interruptionReasons?.includes(reason);
                                    return (
                                        <button
                                            key={reason}
                                            onClick={() => toggleInterruptionReason(reason)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${isSel ? 'bg-orange-500 text-white border-orange-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {reason}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 7. End Result */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">最终结局</span>
                        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl">
                            <button
                                onClick={() => updateData({ejaculation: true, volumeForceLevel: data.volumeForceLevel || 3})}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${data.ejaculation ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                                <Droplets size={14} className={data.ejaculation ? 'animate-pulse' : ''}/> 已射精
                            </button>
                            <button
                                onClick={() => updateData({ejaculation: false})}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${!data.ejaculation ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                                <HeartOff size={14}/> 未射精 (Edging)
                            </button>
                        </div>
                    </div>

                    {data.ejaculation && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Droplets size={12}/> 射精强度 (量/力)</label>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Lv.{data.volumeForceLevel}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {FORCE_LEVELS.map(f => {
                                    const isSel = data.volumeForceLevel === f.lvl;
                                    return (
                                        <button key={f.lvl} onClick={() => updateData({volumeForceLevel: f.lvl})} className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400 opacity-40'}`}>
                                            <div className={`w-2 h-2 rounded-full mb-2 ${isSel ? 'bg-blue-500 shadow-glow' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                            <span className="text-[10px] font-black">{f.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 text-center italic mt-2">"{FORCE_LEVELS.find(f => f.lvl === data.volumeForceLevel)?.desc}"</p>
                        </div>
                    )}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase px-1">
                            <span>爽度评分 ({data.orgasmIntensity})</span>
                            <span className={`${orgasmLabelInfo.color} flex items-center gap-1 transition-colors duration-300`}>{orgasmLabelInfo.label}</span>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={data.orgasmIntensity} onChange={e => updateData({orgasmIntensity: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-pink-500" />
                    </div>
                </div>

                {/* 8. Sage Mode */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">贤者时间 (SAGE MODE)</span>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">心理状态</label>
                        <div className="flex flex-wrap gap-2">
                            {POST_MOOD_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => updateData({postMood: opt})} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${data.postMood === opt ? 'bg-blue-900 dark:bg-slate-700 text-white border-blue-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">身体疲劳度</label>
                        <div className="flex flex-wrap gap-2">
                            {FATIGUE_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => updateData({fatigue: opt})} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${data.fatigue === opt ? 'bg-amber-600 dark:bg-amber-900/40 text-white border-amber-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 9. Satisfaction */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <BatteryFull size={16} className="text-brand-accent"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">生理需求满足感 (SATISFACTION)</span>
                    </div>
                    <div className="space-y-4">
                        <div className="relative h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden flex border border-slate-300 dark:border-slate-700 shadow-inner">
                            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-500 ease-out opacity-80" style={{ width: `${(data.satisfactionLevel || 0) * 20}%` }} />
                            {SATISFACTION_LEVELS.map((lvl) => (
                                <button key={lvl.lvl} onClick={() => updateData({ satisfactionLevel: lvl.lvl })} className="flex-1 relative z-10 h-full border-r last:border-0 border-white/10" aria-label={lvl.label} />
                            ))}
                        </div>
                        <div className="flex flex-col items-center animate-in fade-in duration-300">
                            <span className={`text-sm font-black ${SATISFACTION_LEVELS[(data.satisfactionLevel || 1) - 1].color.replace('bg-', 'text-')}`}>
                                {SATISFACTION_LEVELS[(data.satisfactionLevel || 1) - 1].label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {SATISFACTION_LEVELS[(data.satisfactionLevel || 1) - 1].desc}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 10. Notes */}
                <div className="relative group">
                    <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-accent transition-colors"><PenLine size={18} /></div>
                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 pl-12 text-xs font-medium outline-none focus:border-brand-accent min-h-[140px] shadow-inner" placeholder="更多备注 / 链接 / 特殊感受..." value={data.notes} onChange={e => updateData({notes: e.target.value})} />
                </div>
            </div>

            <MasturbationContentItemEditor
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                onClose={() => setEditingItem(null)}
                onSave={handleSaveEditingItem}
                tagSearch={tagSearch}
                setTagSearch={setTagSearch}
                activeTagTab={activeTagTab}
                setActiveTagTab={setActiveTagTab}
                displayTags={displayTags}
                toggleXpTag={toggleXpTag}
                onQuickCreateTag={handleQuickCreateTag}
                isTagManagerOpen={isTagManagerOpen}
                setIsTagManagerOpen={setIsTagManagerOpen}
                logs={logs}
                userTags={userTags}
                onAddOrUpdateLog={onAddOrUpdateLog}
                onAddOrUpdateTag={onAddOrUpdateTag}
                onDeleteTag={onDeleteTag}
            />
        </Modal>
    );
};

export default MasturbationRecordModal;
