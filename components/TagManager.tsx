
import React, { useState, useMemo, Suspense } from 'react';
import { LogEntry } from '../types';
import { Tag, Edit2, Trash2, X, Check, Activity, ShieldAlert, Hash, Stethoscope, Plus, Search } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { validateTag } from '../utils/tagValidators';
import TagHealthCheck from './TagHealthCheck';
import { XP_GROUPS } from '../utils/constants';

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTag?: (tag: string) => void; // If present, runs in "Selection/Creation Mode"
    initialSearch?: string;
}

type TagType = 'xp' | 'event' | 'symptom' | 'health_check';

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, onSelectTag, initialSearch = '' }) => {
    const { logs, addOrUpdateLog } = useData();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TagType>('xp');
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    
    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [createInput, setCreateInput] = useState(initialSearch);

    const tagsMap = useMemo(() => {
        const xp: Record<string, number> = {};
        const events: Record<string, number> = {};
        const symptoms: Record<string, number> = {};

        // 1. Initialize XP map with all system presets (count 0)
        // This ensures they are visible even if unused
        Object.values(XP_GROUPS).forEach(group => {
            group.forEach(tag => {
                xp[tag] = 0;
            });
        });

        // 2. Count usage from logs
        logs.forEach(log => {
            // XP (Masturbation Categories)
            log.masturbation?.forEach(m => {
                m.assets?.categories?.forEach(c => xp[c] = (xp[c] || 0) + 1);
            });
            // Events (Daily Events)
            log.dailyEvents?.forEach(e => events[e] = (events[e] || 0) + 1);
            // Symptoms (Health)
            log.health?.symptoms?.forEach(s => symptoms[s] = (symptoms[s] || 0) + 1);
        });

        return { xp, event: events, symptom: symptoms };
    }, [logs]);

    const currentTags = useMemo(() => {
        if (activeTab === 'health_check') return [];
        const map = tagsMap[activeTab];
        return Object.entries(map)
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
            // Sort: High frequency first, then unused (0)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
    }, [tagsMap, activeTab, searchTerm]);

    const handleCreate = () => {
        const tag = createInput.trim();
        if (!tag) return;

        // 1. Check if exists
        if (tagsMap[activeTab][tag] !== undefined) {
            if (onSelectTag) {
                onSelectTag(tag);
                onClose();
            } else {
                showToast('标签已存在', 'info');
                setSearchTerm(tag);
                setIsCreating(false);
            }
            return;
        }

        // 2. Validate
        const res = validateTag(tag);
        if (res.level === 'P0') {
            showToast(`禁止创建: ${res.message}`, 'error');
            return;
        }
        if (res.level === 'P1') {
            if (!confirm(`⚠️ 警告: ${res.message}\n\n确定要创建这个标签吗？`)) return;
        }
        if (res.level === 'P2') {
            showToast(`提示: ${res.message}`, 'info');
        }

        // 3. Action
        if (onSelectTag) {
            // Selection Mode: Return the new tag to caller (who will save it to a log, thus persisting it)
            onSelectTag(tag);
            onClose();
        } else {
            // Management Mode: Cannot persist unused tag without schema change
            // Just show feedback
            showToast('提示: 标签仅在被记录使用时才会保存。请在记录页面添加。', 'info');
            setIsCreating(false);
        }
    };

    const handleRename = async () => {
        if (!editingTag || !newTagName.trim() || newTagName === editingTag) {
            setEditingTag(null);
            return;
        }

        const oldName = editingTag;
        const newName = newTagName.trim();

        // 1. Run Validation
        if (activeTab === 'xp') {
            const res = validateTag(newName);
            if (res.level === 'P0') {
                showToast(`无效名称: ${res.message}`, 'error');
                return;
            }
            if (res.level === 'P1') {
                if (!confirm(`⚠️ 警告: ${res.message}\n\n确定要使用这个名称吗？`)) return;
            }
            if (res.level === 'P2') {
                showToast(`提示: ${res.message}`, 'info');
            }
        }
        
        // Check merge
        const existingTags = Object.keys(tagsMap[activeTab]);
        const targetExists = existingTags.some(t => t.toLowerCase() === newName.toLowerCase());
        
        if (targetExists) {
            if (!confirm(`标签 "${newName}" 已存在。\n确定要将 "${oldName}" 合并到 "${newName}" 吗？\n此操作不可撤销。`)) return;
        }

        let updateCount = 0;
        const targetType = activeTab;

        // Perform Bulk Update
        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };

            if (targetType === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(oldName)) {
                        const newCats = m.assets.categories.map(c => c === oldName ? newName : c);
                        const uniqueCats = Array.from(new Set(newCats));
                        modified = true;
                        return { ...m, assets: { ...m.assets, categories: uniqueCats } };
                    }
                    return m;
                });
            } else if (targetType === 'event' && newLog.dailyEvents?.includes(oldName)) {
                const newEvts = newLog.dailyEvents.map(e => e === oldName ? newName : e);
                newLog.dailyEvents = Array.from(new Set(newEvts));
                modified = true;
            } else if (targetType === 'symptom' && newLog.health?.symptoms?.includes(oldName)) {
                const newSyms = newLog.health.symptoms.map(s => s === oldName ? newName : s);
                newLog.health.symptoms = Array.from(new Set(newSyms));
                modified = true;
            }

            if (modified) {
                await addOrUpdateLog(newLog);
                updateCount++;
            }
        }

        showToast(`已更新 ${updateCount} 条记录`, 'success');
        setEditingTag(null);
        setNewTagName('');
    };

    const handleDelete = async (tag: string) => {
        if (!confirm(`确定要删除标签 "${tag}" 吗？这会从所有历史记录中移除它。`)) return;

        let updateCount = 0;
        const targetType = activeTab;

        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };

            if (targetType === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(tag)) {
                        modified = true;
                        return { ...m, assets: { ...m.assets, categories: m.assets.categories.filter(c => c !== tag) } };
                    }
                    return m;
                });
            } else if (targetType === 'event' && newLog.dailyEvents?.includes(tag)) {
                newLog.dailyEvents = newLog.dailyEvents.filter(e => e !== tag);
                modified = true;
            } else if (targetType === 'symptom' && newLog.health?.symptoms?.includes(tag)) {
                newLog.health.symptoms = newLog.health.symptoms.filter(s => s !== tag);
                modified = true;
            }

            if (modified) {
                await addOrUpdateLog(newLog);
                updateCount++;
            }
        }
        showToast(`已从 ${updateCount} 条记录中移除`, 'success');
    };

    const handleNavigateToTag = (tag: string) => {
        setActiveTab('xp');
        setSearchTerm(tag);
        setEditingTag(tag);
        setNewTagName(tag);
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={onSelectTag ? "选择或创建标签" : "标签管理"}
            footer={
                <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">关闭</button>
            }
        >
            <div className="h-[65vh] flex flex-col">
                {/* Tabs */}
                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-800 shrink-0">
                    <button onClick={() => setActiveTab('xp')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'xp' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Hash size={14} /> 性癖/XP
                    </button>
                    <button onClick={() => setActiveTab('event')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'event' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Activity size={14} /> 事件
                    </button>
                    <button onClick={() => setActiveTab('symptom')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'symptom' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <ShieldAlert size={14} /> 症状
                    </button>
                    <button onClick={() => setActiveTab('health_check')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'health_check' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Stethoscope size={14} /> 体检
                    </button>
                </div>

                {activeTab === 'health_check' ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <TagHealthCheck logs={logs} onNavigateToTag={handleNavigateToTag} />
                    </div>
                ) : (
                    <>
                        {/* Creation / Search Area */}
                        <div className="mb-4 shrink-0">
                            {isCreating ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in">
                                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 block">新标签名称</label>
                                    <div className="flex gap-2">
                                        <input 
                                            autoFocus
                                            className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 text-sm outline-none"
                                            value={createInput}
                                            onChange={e => setCreateInput(e.target.value)}
                                            placeholder="输入标签名..."
                                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                        />
                                        <button onClick={handleCreate} className="px-4 bg-brand-accent text-white rounded-lg font-bold text-xs">确认</button>
                                        <button onClick={() => setIsCreating(false)} className="px-3 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg"><X size={16}/></button>
                                    </div>
                                    <p className="text-[10px] text-blue-400 mt-2">请避免使用平台名、纯动词或过度复杂的描述。</p>
                                </div>
                            ) : (
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-accent"
                                            placeholder="搜索标签..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {onSelectTag && (
                                        <button onClick={() => { setIsCreating(true); setCreateInput(searchTerm); }} className="px-3 bg-brand-accent text-white rounded-xl shadow-md">
                                            <Plus size={20}/>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {currentTags.length === 0 && !isCreating ? (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    {searchTerm ? '未找到相关标签' : '暂无数据'}
                                    {onSelectTag && searchTerm && (
                                        <div className="mt-2">
                                            <button onClick={() => { setIsCreating(true); setCreateInput(searchTerm); }} className="text-brand-accent font-bold hover:underline">
                                                创建 "{searchTerm}" ?
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                currentTags.map(([tag, count]) => (
                                    <div key={tag} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-brand-accent/50 transition-colors">
                                        {editingTag === tag ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input 
                                                    autoFocus
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-brand-accent rounded px-2 py-1 text-sm outline-none"
                                                    value={newTagName}
                                                    onChange={e => setNewTagName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                />
                                                <button onClick={handleRename} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"><Check size={14}/></button>
                                                <button onClick={() => setEditingTag(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded hover:bg-slate-300"><X size={14}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div 
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                    onClick={() => {
                                                        if (onSelectTag) {
                                                            onSelectTag(tag);
                                                            onClose();
                                                        }
                                                    }}
                                                >
                                                    <span className={`font-bold text-sm ${count === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-brand-text dark:text-slate-200'}`}>
                                                        {tag}
                                                    </span>
                                                    {count > 0 ? (
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">{count}次</span>
                                                    ) : (
                                                        <span className="text-[10px] bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-full text-slate-300 border border-slate-100 dark:border-slate-800">系统预设</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Rename allowed on all tags, Delete only on used tags */}
                                                    <button onClick={() => { setEditingTag(tag); setNewTagName(tag); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-lg"><Edit2 size={14}/></button>
                                                    {count > 0 && <button onClick={() => handleDelete(tag)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={14}/></button>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default TagManager;
