
import { X, Check, Clock, Film, PenLine, Plus, Minus, Zap, Edit2, Trash2, MonitorPlay, ChevronDown, LayoutGrid, Activity, ChevronLeft, AlertTriangle, Info, Search, Settings, Droplets, User, Battery, BatteryMedium, BatteryFull, PhoneOff, UserX, HeartOff, Flag, MapPin, Bed, Monitor, Sofa, Home, Car, Star } from 'lucide-react';
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem } from '../types';
import Modal from './Modal';
import { calculateInventory, LABELS } from '../utils/helpers';
import { XP_DIMENSIONS_LIST } from '../utils/constants';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { validateTag } from '../utils/tagValidators';

const TagManager = lazy(() => import('./TagManager'));

interface MasturbationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MasturbationRecordDetails) => void;
  initialData?: MasturbationRecordDetails;
  dateStr: string;
  partners?: PartnerProfile[];
  logs?: LogEntry[];
}

const CONTENT_TYPES = ['视频', '直播', '图片', '小说', '回忆', '幻想', '音频', '漫画'];
const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];
const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const LUBRICANT_OPTIONS = ['无润滑', '水基润滑液', '硅基润滑液', '油基润滑液', '人体分泌', '唾液', '其他'];

// 新增：地点选项配置
const LOCATION_OPTIONS = [
    { label: '卧室/床上', icon: Bed },
    { label: '书桌/电脑前', icon: Monitor },
    { label: '浴室/洗手间', icon: Droplets },
    { label: '客厅/沙发', icon: Sofa },
    { label: '酒店/宾馆', icon: Home },
    { label: '私家车内', icon: Car },
    { label: '其他', icon: MapPin }
];

const FORCE_LEVELS = [
    { lvl: 1, label: '滞留', desc: '几乎没出来，黏在根部' },
    { lvl: 2, label: '流出', desc: '缓缓流出，一张纸轻松搞定' },
    { lvl: 3, label: '喷射', desc: '有明显的喷射节奏' },
    { lvl: 4, label: '汹涌', desc: '量大浓厚，纸巾完全湿透' },
    { lvl: 5, label: '爆发', desc: '极强冲力，射穿或喷射极远' },
];

const ORGASM_LABELS: Record<number, { label: string, color: string }> = {
    1: { label: '无感', color: 'text-slate-400' },
    2: { label: '一般', color: 'text-blue-400' },
    3: { label: '舒服', color: 'text-amber-500' },
    4: { label: '很爽', color: 'text-orange-500' },
    5: { label: '极致', color: 'text-pink-500' },
};

const SATISFACTION_LEVELS = [
    { lvl: 1, label: '毫无感觉', desc: '还是憋得慌', color: 'bg-slate-400' },
    { lvl: 2, label: '解压一般', desc: '完成了任务', color: 'bg-blue-300' },
    { lvl: 3, label: '基本达标', desc: '不怎么想了', color: 'bg-blue-400' },
    { lvl: 4, label: '非常舒爽', desc: '完全放松', color: 'bg-blue-500' },
    { lvl: 5, label: '灵魂升华', desc: '彻底清空，大贤者模式', color: 'bg-indigo-600' },
];

const POST_MOOD_OPTIONS = ['满足/愉悦', '平静/贤者', '空虚/后悔', '焦虑/负罪', '恶心/厌恶'];
const FATIGUE_OPTIONS = ['精神焕发', '无明显疲劳', '轻微困倦', '身体沉重', '秒睡'];
const INTERRUPTION_REASONS = ['电话/消息', '有人敲门/进入', '突然没兴致', '身体不适', '环境干扰', '被迫中止'];

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, logs = [] }) => {
    const { userTags, addOrUpdateTag } = useData();
    const { showToast } = useToast();
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

    const tagUsageMap = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                m.contentItems?.forEach(ci => {
                    ci.xpTags?.forEach(tag => counts[tag] = (counts[tag] || 0) + 1);
                });
            });
        });
        return counts;
    }, [logs]);

    const calculateDurationFromTimes = (start: string, end: string) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        if (isNaN(h1) || isNaN(h2)) return 0;
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        return diff;
    };

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
            const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            if (initialData) {
                let calculatedEndTime = nowStr;
                let calculatedDuration = initialData.duration || 0;

                if (initialData.status === 'inProgress' && initialData.startTime) {
                    calculatedDuration = calculateDurationFromTimes(initialData.startTime, nowStr);
                } else if (initialData.startTime && initialData.duration) {
                    const [h, m] = initialData.startTime.split(':').map(Number);
                    const d = new Date(); d.setHours(h); d.setMinutes(m + initialData.duration);
                    calculatedEndTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
        
        const res = validateTag(tagStr, 'xp');
        if (res.level === 'P0') {
            showToast(`禁止创建: ${res.message}`, 'error');
            return;
        }

        await addOrUpdateTag({
            name: tagStr,
            category: 'xp',
            dimension: activeTagTab,
            createdAt: Date.now()
        });

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
        let pool = [];
        
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
                    .sort((a,b) => (tagUsageMap[b.name]||0) - (tagUsageMap[a.name]||0))
                    .map(t => t.name);
            }
        }
        return Array.from(new Set(pool));
    }, [userTags, activeTagTab, tagSearch, tagUsageMap]);

    if (!isOpen) return null;

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
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">当前蓄力</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{inventory}</span>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> 开始时间</label>
                            <input type="time" value={data.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none w-full"/>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Flag size={10}/> 结束时间</label>
                            <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className="bg-transparent text-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none w-full"/>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">持续时长</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm">
                            <button onClick={() => updateData({duration: Math.max(0, data.duration - 1)})} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Minus size={18} strokeWidth={3}/></button>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums min-w-[2rem] text-center">{data.duration}</span>
                            <button onClick={() => updateData({duration: data.duration + 1})} className="p-1.5 text-blue-600 hover:text-blue-500 transition-colors"><Plus size={18} strokeWidth={3}/></button>
                        </div>
                    </div>
                </div>

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
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400"><Film size={16}/></div>
                                    <div>
                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">{item.title || item.type}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">{item.platform}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-400 hover:text-brand-accent"><Edit2 size={14}/></button>
                                    <button onClick={() => updateData({contentItems: data.contentItems.filter(i => i.id !== item.id)})} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => setEditingItem({ id: Math.random().toString(36).substr(2, 9), actors: [], xpTags: [], type: '', platform: '', title: '' })}
                            className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-brand-accent/50 transition-all bg-white dark:bg-slate-900/40"
                        >
                            <MonitorPlay size={32} className="text-slate-300 group-hover:text-brand-accent transition-colors" />
                            <div className="mt-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-brand-accent text-xs font-black rounded-lg border border-blue-100 dark:border-blue-900">
                                + 添加素材
                            </div>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">辅助工具</label>
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
                </div>

                {/* 新增：发生地点选择组 */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">发生地点</label>
                    <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 -mx-1 px-1">
                        {LOCATION_OPTIONS.map(loc => {
                            const isSel = data.location === loc.label;
                            const Icon = loc.icon;
                            return (
                                <button 
                                    key={loc.label} 
                                    onClick={() => updateData({location: loc.label})}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-4 rounded-2xl border-2 transition-all ${isSel ? 'border-brand-accent bg-blue-50 dark:bg-blue-900/20 text-brand-accent shadow-md' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <Icon size={20} className={isSel ? 'text-brand-accent' : 'text-slate-300'} />
                                    <span className="text-[10px] font-black mt-2 text-center leading-tight">{loc.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Activity size={20}/></div>
                        <div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">边缘控制 (Edging)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <button onClick={() => updateData({edgingCount: Math.max(0, data.edgingCount - 1)})} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400"><Minus size={16}/></button>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 w-4 text-center tabular-nums">{data.edgingCount}</span>
                        <button onClick={() => updateData({edgingCount: data.edgingCount + 1})} className="p-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-full"><Plus size={16}/></button>
                    </div>
                </div>

                <div className={`bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border transition-all ${data.interrupted ? 'border-orange-200 dark:border-orange-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${data.interrupted ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                <PhoneOff size={18}/>
                            </div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">中途被打断</div>
                        </div>
                        <input type="checkbox" className="toggle-checkbox" checked={data.interrupted} onChange={e => updateData({interrupted: e.target.checked})} />
                    </div>
                    {data.interrupted && (
                        <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2">
                            {INTERRUPTION_REASONS.map(reason => {
                                const isSel = data.interruptionReasons?.includes(reason);
                                return (
                                    <button key={reason} onClick={() => toggleInterruptionReason(reason)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${isSel ? 'bg-orange-500 text-white border-orange-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{reason}</button>
                                );
                            })}
                        </div>
                    )}
                </div>

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
                                <HeartOff size={14}/> 未射精/Edging
                            </button>
                        </div>
                    </div>

                    {data.ejaculation && (
                        <div className="space-y-4 animate-in fade-in">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Activity size={12}/> 射精强度评级</label>
                            <div className="grid grid-cols-5 gap-1.5">
                                {FORCE_LEVELS.map(f => (
                                    <button key={f.lvl} onClick={() => updateData({volumeForceLevel: f.lvl})} className={`flex flex-col items-center py-3 rounded-xl border transition-all ${data.volumeForceLevel === f.lvl ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'}`}>
                                        <span className="text-sm font-black">{f.lvl}</span>
                                        <span className="text-[8px] font-bold mt-0.5">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Star size={12}/> 生理满足程度</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 gap-1">
                            {SATISFACTION_LEVELS.map(s => (
                                <button key={s.lvl} onClick={() => updateData({satisfactionLevel: s.lvl})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${data.satisfactionLevel === s.lvl ? `${s.color} text-white shadow-lg` : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">贤者心理</label>
                            <select value={data.postMood} onChange={e => updateData({postMood: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold appearance-none outline-none">
                                {POST_MOOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">贤者生理</label>
                            <select value={data.fatigue} onChange={e => updateData({fatigue: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold appearance-none outline-none">
                                {FATIGUE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute left-5 top-4 text-slate-400 group-focus-within:text-brand-accent transition-colors"><PenLine size={18} /></div>
                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] py-4 pl-14 pr-4 text-xs font-medium outline-none focus:border-brand-accent transition-all min-h-[120px] resize-none" placeholder="记录感悟..." value={data.notes} onChange={e => updateData({notes: e.target.value})}/>
                </div>
            </div>

            <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title={editingItem?.title ? "编辑素材详情" : "添加新素材"}>
                {editingItem && (
                    <div className="space-y-6 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">素材类型</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold" value={editingItem.type} onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}>
                                    <option value="">选择类型</option>
                                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">来源平台</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold" value={editingItem.platform} onChange={e => setEditingItem({ ...editingItem, platform: e.target.value })}>
                                    <option value="">选择平台</option>
                                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase">标题 / 作品 ID</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-bold" placeholder="输入作品名" value={editingItem.title || ''} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} />
                        </div>
                        <button onClick={() => {
                            const next = data.contentItems.find(i => i.id === editingItem.id) ? data.contentItems.map(i => i.id === editingItem.id ? editingItem : i) : [...data.contentItems, editingItem];
                            updateData({ contentItems: next });
                            setEditingItem(null);
                        }} className="w-full py-3 bg-brand-accent text-white rounded-xl text-xs font-bold">保存素材</button>
                    </div>
                )}
            </Modal>

            <Suspense fallback={null}>
                <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} onSelectTag={(tag) => { toggleXpTag(tag); setIsTagManagerOpen(false); }} />
            </Suspense>
        </Modal>
    );
};

export default MasturbationRecordModal;
