
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { Tag, Edit2, Trash2, X, Check, FolderOpen, Hash, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

type TagType = 'xp' | 'event' | 'symptom';

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose }) => {
    const { logs, addOrUpdateLog } = useData();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TagType>('xp');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');

    const tagsMap = useMemo(() => {
        const xp: Record<string, number> = {};
        const events: Record<string, number> = {};
        const symptoms: Record<string, number> = {};

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
        const map = tagsMap[activeTab];
        return Object.entries(map)
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b[1] - a[1]);
    }, [tagsMap, activeTab, searchTerm]);

    const handleRename = async () => {
        if (!editingTag || !newTagName.trim() || newTagName === editingTag) {
            setEditingTag(null);
            return;
        }

        const oldName = editingTag;
        const newName = newTagName.trim();
        let updateCount = 0;

        // Perform Bulk Update
        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };

            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(oldName)) {
                        const newCats = m.assets.categories.map(c => c === oldName ? newName : c);
                        // Deduplicate in case of merge
                        const uniqueCats = Array.from(new Set(newCats));
                        modified = true;
                        return { ...m, assets: { ...m.assets, categories: uniqueCats } };
                    }
                    return m;
                });
            } else if (activeTab === 'event' && newLog.dailyEvents?.includes(oldName)) {
                const newEvts = newLog.dailyEvents.map(e => e === oldName ? newName : e);
                newLog.dailyEvents = Array.from(new Set(newEvts));
                modified = true;
            } else if (activeTab === 'symptom' && newLog.health?.symptoms?.includes(oldName)) {
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
        for (const log of logs) {
            let modified = false;
            let newLog = { ...log };

            if (activeTab === 'xp' && newLog.masturbation) {
                newLog.masturbation = newLog.masturbation.map(m => {
                    if (m.assets?.categories?.includes(tag)) {
                        modified = true;
                        return { ...m, assets: { ...m.assets, categories: m.assets.categories.filter(c => c !== tag) } };
                    }
                    return m;
                });
            } else if (activeTab === 'event' && newLog.dailyEvents?.includes(tag)) {
                newLog.dailyEvents = newLog.dailyEvents.filter(e => e !== tag);
                modified = true;
            } else if (activeTab === 'symptom' && newLog.health?.symptoms?.includes(tag)) {
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

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="标签管理"
            footer={
                <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">关闭</button>
            }
        >
            <div className="h-[60vh] flex flex-col">
                {/* Tabs */}
                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveTab('xp')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'xp' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Hash size={14} /> 性癖 / 类型
                    </button>
                    <button onClick={() => setActiveTab('event')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'event' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Activity size={14} /> 特别事件
                    </button>
                    <button onClick={() => setActiveTab('symptom')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'symptom' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400 hover:text-slate-600'}`}>
                        <ShieldAlert size={14} /> 症状
                    </button>
                </div>

                {/* Search */}
                <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm mb-4 outline-none focus:border-brand-accent"
                    placeholder="搜索标签..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {currentTags.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">暂无相关标签</div>
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
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-brand-text dark:text-slate-200 text-sm">{tag}</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{count}次</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingTag(tag); setNewTagName(tag); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-lg"><Edit2 size={14}/></button>
                                            <button onClick={() => handleDelete(tag)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={14}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default TagManager;
