import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
/* Added Droplets and User to fix 'Cannot find name' errors */
import { X, Check, Clock, Film, PenLine, Plus, Minus, Zap, Edit2, Trash2, MonitorPlay, ChevronDown, LayoutGrid, Activity, ChevronLeft, AlertTriangle, Info, Search, Settings, Droplets, User, Battery, BatteryMedium, BatteryFull } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem } from '../types';
import Modal from './Modal';
import { calculateInventory, LABELS } from '../utils/helpers';
import { XP_DIMENSIONS_LIST } from '../utils/constants';
import { useData } from '../contexts/DataContext';

const TagManager = lazy(() => import('./TagManager'));

interface MasturbationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MasturbationRecordDetails) => void;
  initialData?: MasturbationRecordDetails;
  dateStr: string;
  logs?: LogEntry[];
  partners?: PartnerProfile[];
}

const CONTENT_TYPES = ['视频', '直播', '图片', '小说', '回忆', '幻想', '音频', '漫画'];
const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];
const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const LUBRICANT_OPTIONS = ['无润滑', '水基润滑液', '硅基润滑液', '油基润滑液', '人体分泌', '唾液', '其他'];

const FORCE_LEVELS = [
    { lvl: 1, label: '滞留', desc: '几乎没出来，黏在根部' },
    { lvl: 2, label: '流出', desc: '缓缓流出，一张纸轻松搞定' },
    { lvl: 3, label: '喷射', desc: '有明显的喷射节奏' },
    { lvl: 4, label: '汹涌', desc: '量大浓厚，纸巾完全湿透' },
    { lvl: 5, label: '爆发', desc: '极强冲力，射穿或喷射极远' },
];

const SATISFACTION_LEVELS = [
    { lvl: 1, label: '毫无感觉', desc: '还是憋得慌', color: 'bg-slate-400' },
    { lvl: 2, label: '解压一般', desc: '完成了任务', color: 'bg-blue-300' },
    { lvl: 3, label: '基本达标', desc: '不怎么想了', color: 'bg-blue-400' },
    { lvl: 4, label: '非常舒爽', desc: '完全放松', color: 'bg-blue-500' },
    { lvl: 5, label: '灵魂升华', desc: '彻底清空，大贤者模式', color: 'bg-indigo-600' },
];

const POST_MOOD_OPTIONS = ['满足/愉悦', '平静/贤者', '空虚/后悔', '焦虑/负罪', '恶心/厌恶'];
const FATIGUE_OPTIONS = ['精神焕发', '无明显疲劳', '轻微困倦', '身体沉重', '秒睡'];

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, logs = [] }) => {
    const { userTags } = useData();
    const [data, setData] = useState<MasturbationRecordDetails>({
        id: '', startTime: '', duration: 15, status: 'completed', tools: ['手'], contentItems: [],
        edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true, orgasmIntensity: 3,
        satisfactionLevel: 3,
        mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
        volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳'
    });

    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [activeTagTab, setActiveTagTab] = useState<string>('常用');
    const [tagSearch, setTagSearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const inventory = useMemo(() => calculateInventory(logs), [logs, isOpen]);

    // 计算标签使用频次
    const tagUsageMap = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                // 从现代素材列表中提取
                m.contentItems?.forEach(ci => {
                    ci.xpTags?.forEach(tag => counts[tag] = (counts[tag] || 0) + 1);
                });
                // 兼容旧版素材分类
                m.assets?.categories?.forEach(tag => counts[tag] = (counts[tag] || 0) + 1);
            });
        });
        return counts;
    }, [logs]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
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
                    useCondom: initialData.useCondom || false
                });
            } else {
                const now = new Date();
                setData({
                    id: Date.now().toString(),
                    startTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    duration: 0, status: 'completed', tools: ['手'], contentItems: [],
                    edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false, ejaculation: true, orgasmIntensity: 3,
                    satisfactionLevel: 3,
                    mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
                    volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳'
                });
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

    const displayTags = useMemo(() => {
        const xpTagsOnly = userTags.filter(t => t.category === 'xp');
        
        let filtered = [];
        if (activeTagTab === '常用') {
            // “常用”仅显示在记录中出现过的标签，按频次降序
            filtered = xpTagsOnly
                .filter(t => (tagUsageMap[t.name] || 0) > 0)
                .sort((a, b) => tagUsageMap[b.name] - tagUsageMap[a.name])
                .slice(0, 20)
                .map(t => t.name);
        } else {
            // 其他维度显示库中该维度的所有标签，按使用频次辅助排序
            filtered = xpTagsOnly
                .filter(t => t.dimension === activeTagTab)
                .sort((a,b) => (tagUsageMap[b.name]||0) - (tagUsageMap[a.name]||0))
                .map(t => t.name);
        }

        if (tagSearch) {
            filtered = filtered.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));
        }
        return filtered;
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
                
                {/* 0. Inventory Header */}
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">当前蓄力 (INVENTORY)</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{inventory}</span>
                </div>

                {/* 1. Time Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">开始时间</label>
                        <div className="flex items-center justify-between">
                            <input type="time" value={data.startTime} onChange={e => updateData({startTime: e.target.value})} className="bg-transparent text-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none w-full"/>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">持续时长 (分)</label>
                        <div className="flex items-center justify-between">
                            <button onClick={() => updateData({duration: Math.max(0, data.duration - 1)})} className="text-slate-400 hover:text-brand-accent p-1"><Minus size={18}/></button>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{data.duration}</span>
                            <button onClick={() => updateData({duration: data.duration + 1})} className="text-slate-400 hover:text-brand-accent p-1"><Plus size={18}/></button>
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
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                {/* 3. Tools & Lubricant Row */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">辅助工具 (TOOLS)</label>
                    <div className="flex flex-wrap gap-2">
                        {TOOL_OPTIONS.map(tool => {
                            const isSel = data.tools.includes(tool);
                            return (
                                <button 
                                    key={tool}
                                    onClick={() => updateData({tools: isSel ? data.tools.filter(t => t !== tool) : [...data.tools, tool]})}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSel ? 'bg-blue-900/20 text-brand-accent border-brand-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'}`}
                                >
                                    {tool}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <select 
                                value={data.lubricant} 
                                onChange={e => updateData({lubricant: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-8 text-xs font-bold appearance-none outline-none focus:border-brand-accent"
                            >
                                {LUBRICANT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <Droplets size={14} className="absolute left-3 top-3.5 text-blue-500" />
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                        </div>
                        <button 
                            onClick={() => updateData({useCondom: !data.useCondom})}
                            className={`px-5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${data.useCondom ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
                        >
                            <div className={`w-2 h-2 rounded-full border border-current ${data.useCondom ? 'bg-current' : 'bg-transparent'}`}></div> 戴套
                        </button>
                    </div>
                </div>

                {/* 4. Edging Box */}
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

                {/* New: Satisfaction Energy Tank (Plan A) */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <BatteryMedium size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">生理需求满足感 (SATISFACTION)</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="relative h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden flex border border-slate-300 dark:border-slate-700">
                            {/* Filling Effect */}
                            <div 
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-500 ease-out opacity-80"
                                style={{ width: `${(data.satisfactionLevel || 0) * 20}%` }}
                            />
                            
                            {/* Tap Targets */}
                            {SATISFACTION_LEVELS.map((lvl) => (
                                <button
                                    key={lvl.lvl}
                                    onClick={() => updateData({ satisfactionLevel: lvl.lvl })}
                                    className="flex-1 relative z-10 h-full border-r last:border-0 border-white/10"
                                    aria-label={lvl.label}
                                />
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

                {/* 5. End Result Card */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">最终结局</span>
                        <button 
                            onClick={() => updateData({ejaculation: !data.ejaculation})}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${data.ejaculation ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                            {data.ejaculation ? '已射精' : 'Edging'}
                        </button>
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
                            <span className="text-amber-500 flex items-center gap-1">舒服</span>
                        </div>
                        <input 
                            type="range" min="1" max="5" step="1" 
                            value={data.orgasmIntensity} 
                            onChange={e => updateData({orgasmIntensity: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-pink-500"
                        />
                    </div>
                </div>

                {/* 6. Sage Mode Section */}
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

                {/* 7. Notes */}
                <div className="relative group">
                    <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-accent transition-colors"><PenLine size={18} /></div>
                    <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 pl-12 text-xs font-medium outline-none focus:border-brand-accent min-h-[140px] shadow-inner" 
                        placeholder="更多备注 / 链接 / 特殊感受..." 
                        value={data.notes} 
                        onChange={e => updateData({notes: e.target.value})}
                    />
                </div>
            </div>

            {/* 素材编辑子弹窗 */}
            <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="编辑素材详情">
                 {editingItem && (
                     <div className="flex flex-col h-[75vh] -mx-4 -mt-4 bg-white dark:bg-slate-950 overflow-hidden">
                         {/* Header: Back Button & Notices */}
                         <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-800">
                             <button 
                                onClick={() => setEditingItem(null)}
                                className="flex items-center gap-1 text-slate-400 hover:text-brand-accent text-sm font-bold mb-4"
                             >
                                <ChevronLeft size={18} /> 返回
                             </button>

                             <div className="space-y-2">
                                 {!editingItem.type && (
                                     <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex items-center justify-between">
                                         <div className="flex items-start gap-2">
                                             <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                                             <div>
                                                 <div className="text-xs font-black text-amber-700 dark:text-amber-400">未选择素材类型</div>
                                                 <div className="text-[10px] text-amber-600/70 dark:text-amber-400/50">分类统计失效</div>
                                             </div>
                                         </div>
                                         <button className="text-[10px] font-black text-amber-700 border border-amber-200 px-2 py-1 rounded bg-white">去选择</button>
                                     </div>
                                 )}
                                 {!editingItem.platform && !['回忆', '幻想'].includes(editingItem.type || '') && (
                                     <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex items-center justify-between">
                                         <div className="flex items-start gap-2">
                                             <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                                             <div>
                                                 <div className="text-xs font-black text-amber-700 dark:text-amber-400">未选择来源平台</div>
                                                 <div className="text-[10px] text-amber-600/70 dark:text-amber-400/50">平台统计失效</div>
                                             </div>
                                         </div>
                                         <button className="text-[10px] font-black text-amber-700 border border-amber-200 px-2 py-1 rounded bg-white">去选择</button>
                                     </div>
                                 )}
                                 {!editingItem.title && (
                                     <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between">
                                         <div className="flex items-start gap-2">
                                             <Info size={16} className="text-slate-400 mt-0.5" />
                                             <div>
                                                 <div className="text-xs font-black text-slate-600 dark:text-slate-300">未填写素材备注</div>
                                                 <div className="text-[10px] text-slate-400">回顾困难</div>
                                             </div>
                                         </div>
                                         <button className="text-[10px] font-black text-slate-500 border border-slate-200 px-2 py-1 rounded bg-white">去补充</button>
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Body: Form Fields */}
                         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                             {/* 1. Content Type Grid */}
                             <div className="space-y-3">
                                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest">素材类型 (必选)</label>
                                 <div className="grid grid-cols-4 gap-2">
                                     {CONTENT_TYPES.map(t => (
                                         <button 
                                            key={t}
                                            onClick={() => setEditingItem({...editingItem, type: t})}
                                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${editingItem.type === t ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                                         >
                                             {t}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             {/* 2. Platform Selector (Conditional) */}
                             {!['回忆', '幻想'].includes(editingItem.type || '') && (
                                 <div className="space-y-3">
                                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest">来源平台</label>
                                     <div className="grid grid-cols-3 gap-2">
                                         {PLATFORMS.map(p => (
                                             <button 
                                                key={p}
                                                onClick={() => setEditingItem({...editingItem, platform: p})}
                                                className={`py-2 rounded-xl text-[11px] font-bold transition-all border ${editingItem.platform === p ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-slate-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                                             >
                                                 {p}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {/* 3. Title & Actors */}
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest">标题 / 编号</label>
                                     <div className="relative group">
                                         <div className="absolute left-3 top-3.5 text-slate-300 font-bold">#</div>
                                         <input 
                                            value={editingItem.title || ''} 
                                            onChange={e => setEditingItem({...editingItem, title: e.target.value})} 
                                            placeholder="输入标题、编号或链接..." 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-8 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                                         />
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest">主演 / 角色</label>
                                     <div className="relative group">
                                         <User size={16} className="absolute left-3 top-3.5 text-slate-300" />
                                         <input 
                                            value={editingItem.actors?.join(' ') || ''} 
                                            onChange={e => setEditingItem({...editingItem, actors: e.target.value.split(/\s+/)})} 
                                            placeholder="多个演员用空格分隔..." 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-9 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                                         />
                                     </div>
                                 </div>
                             </div>

                             {/* 4. XP Tags Selection */}
                             <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                 <div className="flex justify-between items-center mb-4">
                                     <div className="flex items-center gap-2">
                                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">XP 标签 ({editingItem.xpTags?.length || 0})</label>
                                     </div>
                                     <button 
                                        onClick={() => setIsTagManagerOpen(true)}
                                        className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-brand-accent rounded-lg flex items-center gap-1 text-[10px] font-black"
                                     >
                                        <Settings size={12}/> 管理
                                     </button>
                                 </div>

                                 <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 mb-4 border-b border-slate-100 dark:border-slate-800">
                                     {['常用', ...XP_DIMENSIONS_LIST].map(tab => (
                                         <button 
                                            key={tab} 
                                            onClick={() => setActiveTagTab(tab)}
                                            className={`pb-2 px-1 text-xs font-black transition-all relative ${activeTagTab === tab ? 'text-brand-accent' : 'text-slate-400'}`}
                                         >
                                             {tab}
                                             {activeTagTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full"></div>}
                                         </button>
                                     ))}
                                 </div>

                                 <div className="relative mb-4">
                                     <Search size={14} className="absolute left-3 top-3 text-slate-300" />
                                     <input 
                                        value={tagSearch}
                                        onChange={e => setTagSearch(e.target.value)}
                                        placeholder="搜索标签..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold outline-none"
                                     />
                                 </div>

                                 <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                     {displayTags.length > 0 ? (
                                         displayTags.map(tag => {
                                            const isSel = editingItem.xpTags?.includes(tag);
                                            return (
                                                <button 
                                                    key={tag}
                                                    onClick={() => toggleXpTag(tag)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSel ? 'bg-blue-500 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                         })
                                     ) : (
                                         <div className="w-full py-10 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">
                                                 {activeTagTab} 分类下暂无标签
                                             </span>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>

                         {/* Bottom: Save Button */}
                         <div className="flex-none p-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                             <button 
                                onClick={() => {
                                    const nextItems = data.contentItems.find(i => i.id === editingItem.id) 
                                        ? data.contentItems.map(i => i.id === editingItem.id ? editingItem : i)
                                        : [...data.contentItems, editingItem];
                                    updateData({contentItems: nextItems});
                                    setEditingItem(null);
                                }}
                                className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-[0.98] transition-all"
                             >保存素材信息</button>
                         </div>
                     </div>
                 )}
            </Modal>
            
            {/* 标签管理器弹窗 */}
            <Suspense fallback={null}>
                <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
            </Suspense>
        </Modal>
    );
};

export default MasturbationRecordModal;