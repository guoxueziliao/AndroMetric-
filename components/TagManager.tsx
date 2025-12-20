
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogEntry, TagType, TagEntry } from '../types';
import { Tag as TagIcon, Edit2, Trash2, X, Check, Activity, ShieldAlert, Stethoscope, Plus, Search, ChevronRight, ChevronDown, LayoutGrid, User, Zap, Sparkles, Shirt, Heart, MousePointer2 } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { validateTag } from '../utils/tagValidators';
import TagHealthCheck from './TagHealthCheck';

const XP_DIMENSIONS = [
    { id: '角色', icon: User, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { id: '身体', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: '装扮', icon: Shirt, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: '玩法', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: '剧情', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: '风格', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const SYSTEM_EVENTS = ['加班', '吵架', '出差', '聚会', '家庭烦心事', '生病'];
const SYSTEM_SYMPTOMS = ['头痛', '喉咙痛', '胃不适', '肌肉酸痛', '腹泻', '发烧', '鼻塞', '乏力', '咳嗽'];

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTag?: (tag: string) => void;
    initialSearch?: string;
    defaultTab?: TagType | 'health_check';
}

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, onSelectTag, initialSearch = '', defaultTab = 'xp' }) => {
    const { logs, addOrUpdateLog, userTags, addOrUpdateTag, deleteTag } = useData();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TagType | 'health_check'>(defaultTab as any);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    
    const [isCreating, setIsCreating] = useState(false);
    const [createInput, setCreateInput] = useState(initialSearch);
    const [selectedXpDim, setSelectedXpDim] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab as any);
            setSearchTerm(initialSearch);
            setCreateInput(initialSearch);
            setIsCreating(false);
            setSelectedXpDim(null);
        }
    }, [isOpen, defaultTab, initialSearch]);

    const tagsUsageMap = useMemo(() => {
        const usage: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                const tags = Array.from(new Set(m.contentItems?.flatMap(ci => ci.xpTags || []) || []));
                tags.forEach(c => usage[c] = (usage[c] || 0) + 1);
                // Legacy support
                const legacyTags = Array.from(new Set(m.assets?.categories || []));
                legacyTags.forEach(c => usage[c] = (usage[c] || 0) + 1);
            });
            (log.dailyEvents || []).forEach(e => usage[e] = (usage[e] || 0) + 1);
            (log.health?.symptoms || []).forEach(s => usage[s] = (usage[s] || 0) + 1);
        });
        return usage;
    }, [logs]);

    const handleCreate = async () => {
        const tagStr = createInput.trim();
        if (!tagStr) return;

        if (activeTab === 'xp' && !selectedXpDim) {
            showToast('请先选择一个维度类别', 'error');
            return;
        }

        const res = validateTag(tagStr, activeTab === 'health_check' ? 'xp' : (activeTab as TagType));
        if (res.level === 'P0') {
            showToast(`禁止创建: ${res.message}`, 'error');
            return;
        }

        if (activeTab === 'xp' && selectedXpDim) {
            await addOrUpdateTag({
                name: tagStr,
                category: 'xp',
                dimension: selectedXpDim,
                createdAt: Date.now()
            });
        }
        // 对于 Event 和 Symptom，目前逻辑是直接允许选择系统预设或在 LogForm 中动态生成
        // 如果需要统一管理，也可以在此处 addOrUpdateTag

        if (onSelectTag) {
            onSelectTag(tagStr);
            onClose();
        } else {
            showToast(`已添加标签 "${tagStr}"`, 'success');
            setSearchTerm(tagStr);
            setIsCreating(false);
            setSelectedXpDim(null);
        }
    };

    const handleRename = async () => {
        if (!editingTag || !newTagName.trim() || newTagName === editingTag) {
            setEditingTag(null);
            return;
        }

        const oldName = editingTag;
        const newName = newTagName.trim();
        
        // 查找旧标签以获取维度
        const oldTag = userTags.find(t => t.name === oldName && t.category === activeTab);
        if (oldTag) {
            await deleteTag(oldName, activeTab as TagType);
            await addOrUpdateTag({ ...oldTag, name: newName });
        }

        // 全量更新 Log 中的引用
        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };
            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    let mMod = false;
                    // 更新素材标签
                    if (m.contentItems) {
                        m.contentItems = m.contentItems.map(ci => {
                            if (ci.xpTags?.includes(oldName)) {
                                ci.xpTags = Array.from(new Set(ci.xpTags.map(t => t === oldName ? newName : t)));
                                mMod = true;
                            }
                            return ci;
                        });
                    }
                    // 更新旧版素材分类
                    if (m.assets?.categories?.includes(oldName)) {
                        m.assets.categories = Array.from(new Set(m.assets.categories.map(c => c === oldName ? newName : c)));
                        mMod = true;
                    }
                    if (mMod) modified = true;
                    return m;
                });
            }
            if (modified) {
                await addOrUpdateLog(newLog);
            }
        }

        showToast('标签已重命名', 'success');
        setEditingTag(null);
    };

    const handleDelete = async (tag: string) => {
        if (!confirm(`确定删除 "${tag}" 吗？此操作会从所有记录中移除它。`)) return;
        
        await deleteTag(tag, activeTab as TagType);

        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };
            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    let mMod = false;
                    if (m.contentItems) {
                        m.contentItems = m.contentItems.map(ci => {
                            if (ci.xpTags?.includes(tag)) {
                                ci.xpTags = ci.xpTags.filter(t => t !== tag);
                                mMod = true;
                            }
                            return ci;
                        });
                    }
                    if (m.assets?.categories?.includes(tag)) {
                        m.assets.categories = m.assets.categories.filter(c => c !== tag);
                        mMod = true;
                    }
                    if (mMod) modified = true;
                    return m;
                });
            }
            if (modified) await addOrUpdateLog(newLog);
        }
        showToast('标签已移除', 'success');
    };

    const scrollToDimension = (dimId: string) => {
        const element = document.getElementById(`dim-header-${dimId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const renderTagItem = (tag: string, count: number) => (
        <div key={tag} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-brand-accent/50 transition-colors">
            {editingTag === tag ? (
                <div className="flex-1 flex items-center gap-2">
                    <input autoFocus className="flex-1 bg-slate-50 dark:bg-slate-800 border border-brand-accent rounded px-2 py-1 text-sm outline-none" value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()}/>
                    <button onClick={handleRename} className="p-1.5 bg-green-500 text-white rounded"><Check size={14}/></button>
                    <button onClick={() => setEditingTag(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded"><X size={14}/></button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => onSelectTag?.(tag)}>
                        <span className={`font-bold text-sm ${count === 0 ? 'text-slate-400' : 'text-brand-text dark:text-slate-200'}`}>{tag}</span>
                        {count > 0 && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">{count}次</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTag(tag); setNewTagName(tag); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(tag)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={onSelectTag ? "选择或创建标签" : "标签管理"}>
            <div className="h-[75vh] flex flex-col -mt-2">
                {/* Tab Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-3 border border-slate-200 dark:border-slate-800 shrink-0">
                    <button onClick={() => {setActiveTab('xp'); setSearchTerm('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'xp' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><TagIcon size={14} /> 题材/XP</button>
                    <button onClick={() => {setActiveTab('event'); setSearchTerm('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'event' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><Activity size={14} /> 事件</button>
                    <button onClick={() => {setActiveTab('symptom'); setSearchTerm('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'symptom' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><ShieldAlert size={14} /> 症状</button>
                    <button onClick={() => {setActiveTab('health_check'); setSearchTerm('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'health_check' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><Stethoscope size={14} /> 体检</button>
                </div>

                {/* Search & Create Area */}
                <div className="mb-3 shrink-0">
                    {isCreating ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 animate-in fade-in">
                            {activeTab === 'xp' && (
                                <div className="mb-4">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">1. 选择归属维度</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {XP_DIMENSIONS.map(dim => (
                                            <button 
                                                key={dim.id} 
                                                onClick={() => setSelectedXpDim(dim.id)}
                                                className={`flex items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${selectedXpDim === dim.id ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-sm' : 'border-transparent bg-slate-100/50 dark:bg-slate-900/50 opacity-60'}`}
                                            >
                                                <dim.icon size={12} className={dim.color}/>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{dim.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">{activeTab === 'xp' ? '2. 输入标签名称' : '输入标签名称'}</label>
                            <div className="flex gap-2">
                                <input autoFocus className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500" value={createInput} onChange={e => setCreateInput(e.target.value)} placeholder="名称..." onKeyDown={e => e.key === 'Enter' && handleCreate()}/>
                                <button onClick={handleCreate} className="px-5 bg-blue-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/20">确认</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/10" placeholder="搜索现有标签..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                            <button onClick={() => setIsCreating(true)} className="px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-brand-accent rounded-2xl shadow-sm active:scale-95 transition-all"><Plus size={24}/></button>
                        </div>
                    )}
                </div>

                {/* Dimension Navigation Bar (Active in XP tab) */}
                {activeTab === 'xp' && !searchTerm && !isCreating && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1 shrink-0 sticky top-0 bg-white dark:bg-[#0f172a] z-20">
                        {XP_DIMENSIONS.map(dim => (
                            <button 
                                key={dim.id} 
                                onClick={() => scrollToDimension(dim.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95 whitespace-nowrap bg-white dark:bg-slate-800`}
                            >
                                <div className={`p-1 rounded-md ${dim.bg} ${dim.color}`}><dim.icon size={12}/></div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{dim.id}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Content Area */}
                <div 
                    className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10" 
                    ref={scrollContainerRef}
                    style={{ scrollPaddingTop: '50px' }}
                >
                    {activeTab === 'health_check' ? (
                        <TagHealthCheck logs={logs} onNavigateToTag={(t, ty) => { setActiveTab(ty); setSearchTerm(t); }} />
                    ) : activeTab === 'xp' ? (
                        <div className="space-y-8 pb-10">
                            {XP_DIMENSIONS.map(dim => {
                                // 核心修改：仅显示数据库中存在的且被使用过的标签
                                const dbInDim = userTags.filter(t => t.dimension === dim.id).map(t => t.name);
                                const allInDim = Array.from(new Set(dbInDim))
                                    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .sort((a,b) => (tagsUsageMap[b as string]||0) - (tagsUsageMap[a as string]||0));

                                if (allInDim.length === 0) {
                                    if (searchTerm) return null;
                                    return (
                                        <div key={dim.id} id={`dim-section-${dim.id}`} className="py-4 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{dim.id} 维度暂无标签</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={dim.id} className="space-y-3" id={`dim-section-${dim.id}`}>
                                        <div className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md z-10 py-2 border-b border-slate-50 dark:border-slate-800/50" id={`dim-header-${dim.id}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${dim.bg} ${dim.color}`}><dim.icon size={14}/></div>
                                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{dim.id}</h4>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">{allInDim.length}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            {allInDim.map(tag => renderTagItem(tag, tagsUsageMap[tag as string] || 0))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid gap-2 pb-10">
                            {(activeTab === 'event' ? [...SYSTEM_EVENTS] : [...SYSTEM_SYMPTOMS])
                                .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(tag => renderTagItem(tag, tagsUsageMap[tag as string] || 0))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default TagManager;
