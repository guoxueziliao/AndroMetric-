import React, { useState, useEffect, useMemo } from 'react';
import { Check, Clock, Film, PenLine, Plus, Minus, Zap, Edit2, Trash2, MonitorPlay, ChevronDown, LayoutGrid, Activity, Droplets, BatteryFull, PhoneOff, HeartOff, Flag, MapPin } from 'lucide-react';
import type { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem, TagEntry, TagType } from '../../domain';
import { Modal } from '../../shared/ui';
import { calculateInventory } from '../../shared/lib';
import { useMasturbationTagTools } from './model/useMasturbationTagTools';
import { analyzeUserPatterns } from '../daily-log/model/smartDefaults';
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
        edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true,
        orgasmIntensity: null,
        satisfactionLevel: null,
        mood: 'neutral', stressLevel: null, energyLevel: null, interrupted: false, interruptionReasons: [], notes: '',
        volumeForceLevel: undefined, postMood: undefined, fatigue: undefined, location: undefined
    });

    const [endTime, setEndTime] = useState('');
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [activeTagTab, setActiveTagTab] = useState<string>('常用');
    const [tagSearch, setTagSearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [smartLocationApplied, setSmartLocationApplied] = useState(false);

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

    const handleDurationChange = (newDuration: number) => {
        const safeDuration = Math.max(0, newDuration);
        if (!data.startTime) {
            setData(prev => ({ ...prev, duration: safeDuration }));
            return;
        }
        const [h, m] = data.startTime.split(':').map(Number);
        const base = new Date();
        base.setHours(h, m + safeDuration, 0, 0);
        const newEnd = base.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        setEndTime(newEnd);
        setData(prev => ({ ...prev, duration: safeDuration }));
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
                    edgingCount: initialData.edgingCount ?? 0,
                    lubricant: initialData.lubricant || '无润滑',
                    useCondom: initialData.useCondom || false,
                    interrupted: initialData.interrupted || false,
                    interruptionReasons: initialData.interruptionReasons || [],
                    duration: calculatedDuration
                });
                setEndTime(calculatedEndTime);
            } else {
                const lastLocResult = analyzeUserPatterns(logs, 'lastMasturbationLocation');
                const smartLocation = (lastLocResult.value && lastLocResult.confidence > 0.5)
                    ? (lastLocResult.value as string)
                    : undefined;
                setSmartLocationApplied(!!smartLocation);
                setData({
                    id: Date.now().toString(),
                    startTime: nowStr,
                    duration: 0, status: 'completed', tools: ['手'], contentItems: [],
                    edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true,
                    orgasmIntensity: null,
                    satisfactionLevel: null,
                    mood: 'neutral', stressLevel: null, energyLevel: null, interrupted: false, interruptionReasons: [], notes: '',
                    volumeForceLevel: undefined, postMood: undefined, fatigue: undefined, location: smartLocation
                });
                setEndTime(nowStr);
            }
        }
    }, [isOpen, initialData]);

    const updateData = (fields: Partial<MasturbationRecordDetails>) => {
        if ('location' in fields) setSmartLocationApplied(false);
        setData(prev => ({ ...prev, ...fields }));
    };

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
                <button onClick={handleSave} className="w-full py-4 bg-accent text-text-on-accent font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Check size={20} strokeWidth={3}/> 保存记录
                </button>
            }
        >
            <div className="space-y-6 pb-10 animate-in fade-in duration-slow">

                {/* 0. Inventory Header */}
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5 text-text-muted ">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">当前蓄力 (INVENTORY)</span>
                    </div>
                    <span className="text-sm font-black text-text-primary ">{inventory}</span>
                </div>

                {/* 1. Time Grid */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-muted  p-4 rounded-2xl border border-surface-border  flex flex-col gap-2 transition-all focus-within:border-accent/50">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                            <input type="time" value={data.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-text-primary  outline-none w-full"/>
                        </div>
                        <div className="bg-surface-muted  p-4 rounded-2xl border border-surface-border  flex flex-col gap-2 transition-all focus-within:border-accent/50">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                            <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-text-primary  outline-none w-full"/>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">持续时长 (分钟)</span>
                            <div className="text-xs text-blue-400 font-bold mt-0.5">根据起止时间自动计算</div>
                        </div>
                        <div className="flex items-center gap-4 bg-surface-card  p-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm">
                            <button onClick={() => handleDurationChange(data.duration - 1)} aria-label="减少 1 分钟" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"><Minus size={18} strokeWidth={3}/></button>
                            <span className="text-xl font-black text-text-primary  tabular-nums min-w-[2rem] text-center">{data.duration}</span>
                            <button onClick={() => handleDurationChange(data.duration + 1)} aria-label="增加 1 分钟" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:text-blue-500 transition-colors"><Plus size={18} strokeWidth={3}/></button>
                        </div>
                    </div>
                </div>

                {/* 2. Materials */}
                <div className="bg-surface-muted/50  border border-surface-border  rounded-3xl p-4 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} className="text-text-muted" />
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">施法素材</span>
                        </div>
                        <span className="text-[10px] font-bold bg-surface-border  text-text-muted px-1.5 rounded-full">{data.contentItems.length}</span>
                    </div>

                    <div className="space-y-2">
                        {data.contentItems.map(item => (
                            <div key={item.id} className="bg-surface-card  p-3 rounded-2xl border border-surface-border  flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface-muted  rounded-xl text-text-muted"><Film size={16}/></div>
                                    <div>
                                        <div className="text-xs font-black text-text-secondary ">{item.title || item.type}</div>
                                        <div className="text-[9px] text-text-muted font-bold">{item.platform}</div>
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
                                    <button onClick={() => setEditingItem(item)} aria-label="编辑素材" className="p-2 text-text-muted hover:text-accent min-w-[44px] min-h-[44px] flex items-center justify-center"><Edit2 size={14}/></button>
                                    <button onClick={() => updateData({contentItems: data.contentItems.filter(i => i.id !== item.id)})} aria-label="删除素材" className="p-2 text-text-muted hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => setEditingItem({ id: Math.random().toString(36).substr(2, 9), actors: [], xpTags: [], type: '', platform: '', title: '' })}
                            className="w-full py-8 border-2 border-dashed border-surface-border  rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-accent/50 transition-all bg-surface-card "
                        >
                            <MonitorPlay size={32} className="text-text-muted group-hover:text-accent transition-colors" />
                            <div className="text-center">
                                <div className="text-xs font-bold text-text-muted group-hover:text-text-muted">暂无素材详情</div>
                                <div className="text-[10px] text-text-muted mt-1">添加具体的视频、演员或标签</div>
                            </div>
                            <div className="mt-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-accent text-xs font-black rounded-lg border border-blue-100 dark:border-blue-900">
                                + 添加素材
                            </div>
                        </button>
                    </div>
                </div>

                {/* 3. Location */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                        <MapPin size={12} className="text-text-muted" /> 地点 (LOCATION)
                        {smartLocationApplied && (
                            <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded normal-case tracking-normal">智能默认 · 可换</span>
                        )}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {LOCATION_OPTIONS.map(loc => {
                            const isSel = data.location === loc.id;
                            return (
                                <button
                                    key={loc.id}
                                    onClick={() => updateData({location: loc.id})}
                                    className={`flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${isSel ? 'border-accent bg-blue-50 dark:bg-blue-900/20 text-accent shadow-md' : 'border-transparent bg-surface-muted  text-text-muted hover:bg-surface-muted'}`}
                                >
                                    <loc.icon size={20} className={`mb-1.5 ${isSel ? 'text-accent' : 'text-text-muted'}`} />
                                    <span className="text-[10px] font-black text-center">{loc.id}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-3 text-text-muted"><Edit2 size={12}/></div>
                        <input
                            placeholder="其他具体地点描述..."
                            value={data.location || ''}
                            onChange={e => updateData({location: e.target.value})}
                            className="w-full bg-surface-muted  border border-surface-border  rounded-xl p-2.5 pl-8 text-[11px] font-bold outline-none focus:border-accent transition-all"
                        />
                    </div>
                </div>

                {/* 4. Tools & Lubricant */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest px-1">辅助工具 (TOOLS)</label>
                    <div className="flex flex-wrap gap-2">
                        {TOOL_OPTIONS.map(tool => {
                            const isSel = data.tools.includes(tool);
                            return (
                                <button key={tool} onClick={() => updateData({tools: isSel ? data.tools.filter(t => t !== tool) : [...data.tools, tool]})} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSel ? 'bg-blue-900/20 text-accent border-accent' : 'bg-surface-muted  text-text-muted border-transparent'}`}>
                                    {tool}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <select value={data.lubricant} onChange={e => updateData({lubricant: e.target.value})} className="w-full bg-surface-muted  border border-surface-border  rounded-xl p-3 pl-8 text-xs font-bold appearance-none outline-none focus:border-accent">
                                {LUBRICANT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <Droplets size={14} className="absolute left-3 top-3.5 text-blue-500" />
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-text-muted pointer-events-none" />
                        </div>
                        <button onClick={() => updateData({useCondom: !data.useCondom})} className={`px-5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${data.useCondom ? 'bg-surface-card dark:bg-surface-muted text-text-on-accent  border-slate-900' : 'bg-surface-muted  text-text-muted border-surface-border '}`}>
                            <div className={`w-2 h-2 rounded-full border border-current ${data.useCondom ? 'bg-current' : 'bg-transparent'}`}></div> 戴套
                        </button>
                    </div>
                </div>

                {/* 5. Edging */}
                <div className="bg-surface-muted  p-4 rounded-3xl border border-surface-border  flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Activity size={20}/></div>
                        <div>
                            <div className="text-xs font-black text-text-secondary ">边缘控制 (Edging)</div>
                            <div className="text-[10px] text-text-muted font-bold">快射时停下</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-surface-card  p-1.5 rounded-2xl border border-surface-border ">
                        <button onClick={() => updateData({edgingCount: Math.max(0, data.edgingCount - 1)})} className="p-2 bg-surface-muted  rounded-full text-text-muted"><Minus size={16}/></button>
                        <span className="text-base font-black text-text-primary  w-4 text-center tabular-nums">{data.edgingCount}</span>
                        <button onClick={() => updateData({edgingCount: data.edgingCount + 1})} className="p-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-full"><Plus size={16}/></button>
                    </div>
                </div>

                {/* 6. Interruption */}
                <div className={`bg-surface-muted  p-5 rounded-[2.5rem] border transition-all ${data.interrupted ? 'border-orange-200 dark:border-orange-900/30' : 'border-surface-border '}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${data.interrupted ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' : 'bg-surface-border  text-text-muted'}`}>
                                <PhoneOff size={18}/>
                            </div>
                            <div>
                                <div className="text-xs font-black text-text-secondary ">中途被打断</div>
                                <div className="text-[10px] text-text-muted font-bold">意外状况或心不在焉</div>
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
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${isSel ? 'bg-orange-500 text-text-on-accent border-orange-600' : 'bg-surface-card  text-text-muted border-surface-border '}`}
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
                <div className="bg-surface-muted  p-5 rounded-[2.5rem] border border-surface-border  space-y-6">
                    <div className="flex flex-col gap-4 border-b border-surface-border  pb-5">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">最终结局</span>
                        <div className="flex p-1 bg-surface-border  rounded-2xl">
                            <button
                                onClick={() => updateData({ejaculation: true})}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${data.ejaculation ? 'bg-blue-600 text-text-on-accent shadow-lg' : 'text-text-muted'}`}
                            >
                                <Droplets size={14} className={data.ejaculation ? 'animate-pulse' : ''}/> 已射精
                            </button>
                            <button
                                onClick={() => updateData({ejaculation: false})}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${!data.ejaculation ? 'bg-surface-muted text-text-on-accent shadow-lg' : 'text-text-muted'}`}
                            >
                                <HeartOff size={14}/> 未射精 (Edging)
                            </button>
                        </div>
                    </div>

                    {data.ejaculation && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Droplets size={12}/> 射精强度 (量/力)</label>
                                <span className="text-[10px] font-bold text-text-muted bg-surface-muted  px-2 py-0.5 rounded-full">{data.volumeForceLevel ? `Lv.${data.volumeForceLevel}` : '未评'}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {FORCE_LEVELS.map(f => {
                                    const isSel = data.volumeForceLevel === f.lvl;
                                    return (
                                        <button key={f.lvl} onClick={() => updateData({volumeForceLevel: f.lvl})} className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'border-transparent bg-surface-card  text-text-muted opacity-40'}`}>
                                            <div className={`w-2 h-2 rounded-full mb-2 ${isSel ? 'bg-blue-500 shadow-glow' : 'bg-surface-border dark:bg-surface-muted'}`}></div>
                                            <span className="text-[10px] font-black">{f.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-text-muted text-center italic mt-2">"{FORCE_LEVELS.find(f => f.lvl === data.volumeForceLevel)?.desc}"</p>
                        </div>
                    )}
                    <div className="space-y-4 pt-2 border-t border-surface-border  pt-4">
                        <div className="flex justify-between text-[10px] font-black text-text-muted uppercase px-1">
                            <span>爽度评分 ({data.orgasmIntensity ?? '未设'})</span>
                            <span className={`${orgasmLabelInfo.color} flex items-center gap-1 transition-colors duration-slow`}>{data.orgasmIntensity ? orgasmLabelInfo.label : '点击下方滑块评分'}</span>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={data.orgasmIntensity ?? 3} onChange={e => updateData({orgasmIntensity: parseInt(e.target.value)})} className={`w-full h-1.5 bg-surface-border  rounded-full appearance-none accent-pink-500 ${data.orgasmIntensity === null ? 'opacity-40' : ''}`} />
                    </div>
                </div>

                {/* 8. Sage Mode */}
                <div className="bg-surface-muted  p-5 rounded-[2.5rem] border border-surface-border  space-y-6">
                    <div className="flex items-center gap-2 text-text-muted ">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">贤者时间 (SAGE MODE)</span>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase px-1">心理状态</label>
                        <div className="flex flex-wrap gap-2">
                            {POST_MOOD_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => updateData({postMood: opt})} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${data.postMood === opt ? 'bg-blue-900  text-text-on-accent border-blue-900 shadow-md' : 'bg-surface-card  text-text-muted border-surface-border '}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black text-text-muted uppercase px-1">身体疲劳度</label>
                        <div className="flex flex-wrap gap-2">
                            {FATIGUE_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => updateData({fatigue: opt})} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${data.fatigue === opt ? 'bg-amber-600 dark:bg-amber-900/40 text-text-on-accent border-amber-600 shadow-md' : 'bg-surface-card  text-text-muted border-surface-border '}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 9. Satisfaction */}
                <div className="bg-surface-muted  p-5 rounded-[2.5rem] border border-surface-border  space-y-6">
                    <div className="flex items-center gap-2 text-text-muted ">
                        <BatteryFull size={16} className="text-accent"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">生理需求满足感 (SATISFACTION)</span>
                    </div>
                    <div className="space-y-4">
                        <div className="relative h-12 w-full bg-surface-border  rounded-2xl overflow-hidden flex border border-surface-border  shadow-inner">
                            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-slow ease-out opacity-80" style={{ width: `${(data.satisfactionLevel || 0) * 20}%` }} />
                            {SATISFACTION_LEVELS.map((lvl) => (
                                <button key={lvl.lvl} onClick={() => updateData({ satisfactionLevel: lvl.lvl })} className="flex-1 relative z-10 h-full border-r last:border-0 border-surface-card/10" aria-label={lvl.label} />
                            ))}
                        </div>
                        <div className="flex flex-col items-center animate-in fade-in duration-slow">
                            {data.satisfactionLevel ? (
                                <>
                                    <span className={`text-sm font-black ${SATISFACTION_LEVELS[data.satisfactionLevel - 1].color.replace('bg-', 'text-')}`}>
                                        {SATISFACTION_LEVELS[data.satisfactionLevel - 1].label}
                                    </span>
                                    <span className="text-[10px] font-bold text-text-muted mt-0.5">
                                        {SATISFACTION_LEVELS[data.satisfactionLevel - 1].desc}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs font-bold text-text-muted">点击上方色块评分</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 10. Notes */}
                <div className="relative group">
                    <div className="absolute left-4 top-4 text-text-muted group-focus-within:text-accent transition-colors"><PenLine size={18} /></div>
                    <textarea className="w-full bg-surface-muted  border border-surface-border  rounded-[1.5rem] p-5 pl-12 text-xs font-medium outline-none focus:border-accent min-h-[140px] shadow-inner" placeholder="更多备注 / 链接 / 特殊感受..." value={data.notes} onChange={e => updateData({notes: e.target.value})} />
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
