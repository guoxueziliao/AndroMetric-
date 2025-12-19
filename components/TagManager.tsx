import React, { useState, useMemo, useEffect } from 'react';
import { LogEntry } from '../types';
import { Tag, Edit2, Trash2, X, Check, Activity, ShieldAlert, Stethoscope, Plus, Search, ChevronRight, ChevronDown, LayoutGrid, User, Zap, Sparkles, Shirt, Heart } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { validateTag, TagType } from '../utils/tagValidators';
import TagHealthCheck from './TagHealthCheck';
import { XP_GROUPS } from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type { TagType };

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
    defaultTab?: TagType;
}

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, onSelectTag, initialSearch = '', defaultTab = 'xp' }) => {
    const { logs, addOrUpdateLog } = useData();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TagType>(defaultTab);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    
    const [customXpTags, setCustomXpTags] = useLocalStorage<Record<string, string[]>>('custom_xp_tags_v2', {
        '角色': [], '身体': [], '装扮': [], '玩法': [], '剧情': [], '风格': []
    });
    const [customEventTags, setCustomEventTags] = useLocalStorage<string[]>('custom_event_tags', []);
    const [customSymptomTags, setCustomSymptomTags] = useLocalStorage<string[]>('custom_symptom_tags', []);
    
    const [isCreating, setIsCreating] = useState(false);
    const [createInput, setCreateInput] = useState(initialSearch);
    const [selectedXpDim, setSelectedXpDim] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab);
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
                (m.assets?.categories || []).forEach(c => usage[c] = (usage[c] || 0) + 1);
            });
            (log.dailyEvents || []).forEach(e => usage[e] = (usage[e] || 0) + 1);
            (log.health?.symptoms || []).forEach(s => usage[s] = (usage[s] || 0) + 1);
        });
        return usage;
    }, [logs]);

    const handleCreate = () => {
        const tag = createInput.trim();
        if (!tag) return;

        if (activeTab === 'xp' && !selectedXpDim) {
            showToast('请先选择一个维度类别', 'error');
            return;
        }

        const res = validateTag(tag, activeTab === 'health_check' ? 'xp' : activeTab);
        if (res.level === 'P0') {
            showToast(`禁止创建: ${res.message}`, 'error');
            return;
        }

        if (activeTab === 'xp' && selectedXpDim) {
            setCustomXpTags(prev => ({
                ...prev,
                [selectedXpDim]: [...(prev[selectedXpDim] || []), tag]
            }));
        } else if (activeTab === 'event') {
            setCustomEventTags(prev => [...prev, tag]);
        } else if (activeTab === 'symptom') {
            setCustomSymptomTags(prev => [...prev, tag]);
        }

        if (onSelectTag) {
            onSelectTag(tag);
            onClose();
        } else {
            showToast(`已添加标签 "${tag}"`, 'success');
            setSearchTerm(tag);
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
        let updateCount = 0;

        // 更新持久化列表
        if (activeTab === 'xp') {
            setCustomXpTags(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(dim => {
                    next[dim] = next[dim].map(t => t === oldName ? newName : t);
                });
                return next;
            });
        }

        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };
            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(oldName)) {
                        m.assets.categories = Array.from(new Set(m.assets.categories.map(c => c === oldName ? newName : c)));
                        modified = true;
                    }
                    return m;
                });
            }
            if (modified) {
                await addOrUpdateLog(newLog);
                updateCount++;
            }
        }

        showToast('标签已重命名', 'success');
        setEditingTag(null);
    };

    const handleDelete = async (tag: string) => {
        if (!confirm(`确定删除 "${tag}" 吗？此操作会从所有记录中移除它。`)) return;
        
        if (activeTab === 'xp') {
            setCustomXpTags(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(dim => next[dim] = next[dim].filter(t => t !== tag));
                return next;
            });
        }

        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };
            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(tag)) {
                        m.assets.categories = m.assets.categories.filter(c => c !== tag);
                        modified = true;
                    }
                    return m;
                });
            }
            if (modified) await addOrUpdateLog(newLog);
        }
        showToast('标签已移除', 'success');
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
            <div className="h-[70vh] flex flex-col -mt-2">
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-800 shrink-0">
                    <button onClick={() => setActiveTab('xp')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'xp' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><Tag size={14} /> 题材/XP</button>
                    <button onClick={() => setActiveTab('event')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'event' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><Activity size={14} /> 事件</button>
                    <button onClick={() => setActiveTab('symptom')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'symptom' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><ShieldAlert size={14} /> 症状</button>
                    <button onClick={() => setActiveTab('health_check')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'health_check' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}><Stethoscope size={14} /> 体检</button>
                </div>

                <div className="mb-4 shrink-0">
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

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {activeTab === 'health_check' ? (
                        <TagHealthCheck logs={logs} onNavigateToTag={(t, ty) => { setActiveTab(ty); setSearchTerm(t); }} />
                    ) : activeTab === 'xp' ? (
                        <div className="space-y-6 pb-6">
                            {XP_DIMENSIONS.map(dim => {
                                const systemTags = XP_GROUPS[dim.id] || [];
                                const userTags = customXpTags[dim.id] || [];
                                const allInDim = Array.from(new Set([...systemTags, ...userTags]))
                                    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .sort((a,b) => (tagsUsageMap[b]||0) - (tagsUsageMap[a]||0));

                                if (allInDim.length === 0 && searchTerm) return null;

                                return (
                                    <div key={dim.id} className="space-y-3">
                                        <div className="flex items-center justify-between sticky top-0 bg-brand-bg dark:bg-slate-950 z-10 py-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${dim.bg} ${dim.color}`}><dim.icon size={14}/></div>
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{dim.id}</h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{allInDim.length}个</span>
                                        </div>
                                        <div className="grid gap-2">
                                            {allInDim.map(tag => renderTagItem(tag, tagsUsageMap[tag] || 0))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid gap-2 pb-6">
                            {(activeTab === 'event' ? [...SYSTEM_EVENTS, ...customEventTags] : [...SYSTEM_SYMPTOMS, ...customSymptomTags])
                                .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(tag => renderTagItem(tag, tagsUsageMap[tag] || 0))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default TagManager;