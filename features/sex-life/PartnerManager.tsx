
import React, { useState, useMemo } from 'react';
import type { PartnerProfile, PartnerType, LogEntry } from '../../domain';
import { Heart, Edit2, Trash2, Plus, ChevronRight, Ruler as RulerIcon, Cigarette, Wine, ThumbsUp, ThumbsDown, BrainCircuit, Flag, Clock } from 'lucide-react';
import { Modal, SafeDeleteModal } from '../../shared/ui';

interface PartnerManagerData {
    partners: PartnerProfile[];
    logs?: LogEntry[];
}

interface PartnerManagerActions {
    onSave: (partner: PartnerProfile) => void;
    onDelete: (id: string) => void;
}

interface PartnerManagerProps {
    isOpen: boolean;
    onClose: () => void;
    data: PartnerManagerData;
    actions: PartnerManagerActions;
}

const COLORS = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-rose-500', 'bg-orange-500'];

const SENSITIVE_SPOTS = [
    '阴蒂', '阴道G点', '乳头/乳晕', '后颈/脖子', '耳朵/耳垂',
    '大腿内侧', '嘴唇/舌头', '下背/腰窝', '阴毛际线', '臀部(下臀)',
    '腹部', '脚/足部', '手/手指', '会阴', '腋下', '全身皮肤'
];

const STIMULATION_METHODS = [
    '轻咬/啃噬', '舌舔', '深吻', '指尖爱抚', '吹气/哈气', 
    '温差(冰/热)', '拍打', '抓挠', '吮吸', '语言挑逗'
];

const TYPE_CONFIG: Record<PartnerType, { label: string; color: string; desc: string }> = {
    'stable': { label: '固定伴侣', color: 'bg-pink-500 border-pink-600', desc: '老婆/女友/长期' },
    'dating': { label: '约会/炮友', color: 'bg-purple-500 border-purple-600', desc: '情人/Py/Dating' },
    'casual': { label: '露水/偶遇', color: 'bg-blue-500 border-blue-600', desc: '一夜情/捡尸/艳遇' },
    'service': { label: '服务/交易', color: 'bg-slate-600 border-slate-700', desc: '技师/外围/交易' },
};

const ORIGIN_PRESETS = [
    '探探/Tinder', '夜店/酒吧', '洗浴/SPA', '外围经纪', '朋友介绍', '搭讪', '工作/同学'
];

const MILESTONE_PRESETS = ['第一次做爱', '第一次口交', '第一次足交', '第一次肛交', '第一次内射', '第一次过夜', '解锁新姿势'];

// --- Helper for Age/Status Tag ---
const getPartnerCategory = (p: PartnerProfile) => {
    if (p.isMarried) return { label: '人妻', color: 'bg-rose-50 text-white' };
    
    if (p.age !== undefined) {
        if (p.age < 25) return { label: '少女', color: 'bg-pink-400 text-white' };
        if (p.age <= 35) return { label: '少妇', color: 'bg-purple-500 text-white' };
        return { label: '熟妇', color: 'bg-amber-600 text-white' };
    }
    return null;
};

const PartnerManager: React.FC<PartnerManagerProps> = ({ isOpen, onClose, data, actions }) => {
    const {
        partners,
        logs = []
    } = data;

    const {
        onSave,
        onDelete
    } = actions;

    const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
    const [activePartner, setActivePartner] = useState<PartnerProfile | null>(null);
    const [formData, setFormData] = useState<Partial<PartnerProfile>>({});
    const [editStep, setEditStep] = useState(1);
    const [tempMilestone, setTempMilestone] = useState({ name: '', date: '' });
    
    // Deletion State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Calculate last interaction date for each partner
    const partnerStats = useMemo(() => {
        const stats: Record<string, { lastDate: string; daysAgo: number; myCum: number; partnerCum: number }> = {};
        const today = new Date();
        
        if (logs && Array.isArray(logs)) {
            logs.forEach(log => {
                if (log.sex) {
                    log.sex.forEach(record => {
                        const partnersInRecord = new Set<string>();
                        if (record.interactions) {
                            record.interactions.forEach(i => { if(i.partner) partnersInRecord.add(i.partner); });
                        } else if (record.partner) {
                            partnersInRecord.add(record.partner);
                        }
                        
                        partnersInRecord.forEach(name => {
                            const logDate = new Date(log.date);
                            
                            if (!stats[name]) stats[name] = { lastDate: log.date, daysAgo: 0, myCum: 0, partnerCum: 0 };
                            
                            // Counts
                            if (record.ejaculation) stats[name].myCum++;
                            if (record.indicators.partnerOrgasm) stats[name].partnerCum++;

                            // Find most recent
                            if (logDate >= new Date(stats[name].lastDate)) {
                                const diffTime = Math.abs(today.getTime() - logDate.getTime());
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
                                stats[name].lastDate = log.date;
                                stats[name].daysAgo = diffDays;
                            }
                        });
                    });
                }
            });
        }
        return stats;
    }, [logs]);

    // Sort partners: Active (<30 days) first, then by recency, then inactive (>30 days)
    const sortedPartners = useMemo(() => {
        return [...partners].sort((a, b) => {
            const statsA = partnerStats[a.name];
            const statsB = partnerStats[b.name];
            
            // If one has stats and other doesn't, prioritize the one with stats
            if (statsA && !statsB) return -1;
            if (!statsA && statsB) return 1;
            if (!statsA && !statsB) return 0;

            // Both have stats
            const isInactiveA = statsA.daysAgo > 30;
            const isInactiveB = statsB.daysAgo > 30;

            if (isInactiveA && !isInactiveB) return 1; // A is inactive, put after B
            if (!isInactiveA && isInactiveB) return -1; // A is active, put before B
            
            // Both active or both inactive, sort by days ago (asc)
            return statsA.daysAgo - statsB.daysAgo;
        });
    }, [partners, partnerStats]);

    if (!isOpen) return null;

    const handleCreate = () => {
        setFormData({ 
            id: Date.now().toString(), 
            avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
            sensitiveSpots: [],
            stimulationPreferences: [],
            likedPositions: [],
            dislikedActs: [],
            socialTags: [],
            type: 'stable', 
            isMarried: false,
            smoking: 'none',
            alcohol: 'none',
            milestones: {}
        });
        setTempMilestone({ name: '', date: '' });
        setEditStep(1);
        setView('edit');
    };

    const handleEdit = (partner: PartnerProfile) => {
        setFormData({ ...partner });
        setTempMilestone({ name: '', date: '' });
        setEditStep(1);
        setView('edit');
    };

    const handleView = (partner: PartnerProfile) => {
        setActivePartner(partner);
        setView('detail');
    };

    const handleSubmit = () => {
        if (!formData.name) return alert('请输入名字');
        onSave(formData as PartnerProfile);
        setView('list');
    };
    
    const handleDeleteRequest = (id: string) => setDeleteId(id);
    const handleConfirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
            setView('list');
        }
    };

    const toggleArrayItem = (field: keyof PartnerProfile, value: string) => {
        const current = (formData[field] as string[]) || [];
        if (current.includes(value)) {
            setFormData({ ...formData, [field]: current.filter(v => v !== value) });
        } else {
            setFormData({ ...formData, [field]: [...current, value] });
        }
    };

    // --- Sub-View: List ---
    const renderList = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">伴侣档案 ({partners.length})</h3>
                <button onClick={handleCreate} className="flex items-center px-3 py-1.5 bg-brand-accent text-white rounded-full text-sm font-medium hover:bg-brand-accent-hover">
                    <Plus size={16} className="mr-1"/> 新建档案
                </button>
            </div>
            
            <div className="grid gap-3">
                {sortedPartners.length === 0 ? (
                    <div className="text-center py-10 text-brand-muted text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        暂无伴侣档案，点击新建添加。
                    </div>
                ) : (
                    sortedPartners.map(p => {
                        const typeInfo = p.type ? TYPE_CONFIG[p.type] : null;
                        const cat = getPartnerCategory(p);
                        const stats = partnerStats[p.name];
                        const isInactive = stats && stats.daysAgo > 30;

                        return (
                            <div key={p.id} onClick={() => handleView(p)} className={`border p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer transition-colors ${isInactive ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-70' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-accent'}`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${isInactive ? 'bg-slate-400' : (p.avatarColor || 'bg-slate-400')}`}>
                                        {p.name[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${isInactive ? 'text-slate-500' : 'text-brand-text dark:text-slate-200'}`}>{p.name}</h4>
                                            {cat && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isInactive ? 'bg-slate-200 text-slate-500' : cat.color}`}>{cat.label}</span>}
                                            {typeInfo && <span className={`text-[10px] text-white px-1.5 py-0.5 rounded ${isInactive ? 'bg-slate-400' : typeInfo.color}`}>{typeInfo.label}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {p.origin && <span className="text-[10px] text-brand-muted bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{p.origin}</span>}
                                            {stats && (
                                                <span className={`text-[10px] flex items-center ${isInactive ? 'text-slate-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    <Clock size={10} className="mr-0.5"/> {stats.daysAgo === 0 ? '今天' : `${stats.daysAgo}天前`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isInactive && <span className="text-[10px] text-slate-400 block mb-1">已沉寂</span>}
                                    <ChevronRight size={20} className="text-slate-300 inline-block" />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );

    // --- Sub-View: Detail ---
    const renderDetail = () => {
        if (!activePartner) return null;
        const p = activePartner;
        const typeInfo = p.type ? TYPE_CONFIG[p.type] : null;
        const cat = getPartnerCategory(p);
        const stats = partnerStats[p.name];

        return (
            <div className="space-y-6 animate-in slide-in-from-right">
                {/* Header Card */}
                <div className={`${p.avatarColor || 'bg-slate-500'} rounded-2xl p-6 text-white shadow-md relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold">{p.name}</h2>
                                {cat && <span className="text-xs bg-black/30 px-2 py-0.5 rounded border border-white/20 font-bold">{cat.label}</span>}
                                {typeInfo && <span className="text-xs bg-black/20 px-2 py-0.5 rounded border border-white/20">{typeInfo.label}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {p.age && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.age}岁</span>}
                                {p.height && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.height}cm</span>}
                                {p.weight && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.weight}kg</span>}
                                {p.cupSize && <span className="bg-pink-500/80 px-2 py-0.5 rounded text-sm">{p.cupSize}</span>}
                            </div>
                            <div className="mt-3 text-xs opacity-90 flex flex-col gap-1">
                                {p.firstEncounterDate && <span>📅 初次见面: {p.firstEncounterDate}</span>}
                                {p.origin && <span>📍 来源: {p.origin}</span>}
                                {stats && <span>⏳ 最近互动: {stats.lastDate} ({stats.daysAgo}天前)</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(p)} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><Edit2 size={18}/></button>
                            <button onClick={() => handleDeleteRequest(p.id)} className="p-2 bg-white/20 rounded-full hover:bg-red-500/50"><Trash2 size={18}/></button>
                        </div>
                    </div>
                    {/* Persona Contrast */}
                    {(p.contrastDaily || p.contrastBedroom) && (
                        <div className="mt-4 flex rounded-lg overflow-hidden text-xs border border-white/20">
                            <div className="flex-1 bg-white/90 text-slate-800 p-2 flex flex-col items-center justify-center">
                                <span className="opacity-50 font-bold mb-1">☀️ 日常</span>
                                <span className="font-bold">{p.contrastDaily || '-'}</span>
                            </div>
                            <div className="flex-1 bg-black/40 text-white p-2 flex flex-col items-center justify-center">
                                <span className="opacity-50 font-bold mb-1">🌙 床上</span>
                                <span className="font-bold">{p.contrastBedroom || '-'}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Satisfaction Ratio (New) */}
                {stats && (stats.myCum > 0 || stats.partnerCum > 0) && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-around">
                        <div className="text-center">
                            <span className="text-xs text-brand-muted block mb-1">让她高潮</span>
                            <span className="text-xl font-black text-pink-500">{stats.partnerCum}次</span>
                        </div>
                        <div className="text-slate-300 font-light text-2xl">VS</div>
                        <div className="text-center">
                            <span className="text-xs text-brand-muted block mb-1">自己射精</span>
                            <span className="text-xl font-black text-blue-500">{stats.myCum}次</span>
                        </div>
                    </div>
                )}

                {/* Milestones Timeline */}
                {p.milestones && Object.keys(p.milestones).length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Flag size={16} className="mr-2 text-yellow-500"/> 纪念日 / 里程碑</h3>
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 space-y-4 py-1">
                            {Object.entries(p.milestones)
                                .sort(([,dA], [,dB]) => new Date(dA as string).getTime() - new Date(dB as string).getTime())
                                .map(([name, date]) => (
                                <div key={name} className="relative pl-4">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-white dark:border-slate-900"></div>
                                    <p className="text-xs text-brand-muted font-mono">{date as React.ReactNode}</p>
                                    <p className="text-sm font-bold text-brand-text dark:text-slate-200">{name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Body & Sensitivity */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Heart size={16} className="mr-2 text-pink-500"/> 身体密码</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-brand-muted block mb-2 font-medium">敏感点</span>
                            <div className="flex flex-wrap gap-1.5">
                                {p.sensitiveSpots?.length ? p.sensitiveSpots.map(s => <span key={s} className="text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 px-2 py-1 rounded-full border border-pink-100 dark:border-pink-900">{s}</span>) : <span className="text-xs text-slate-400">未知</span>}
                            </div>
                        </div>
                        {p.stimulationPreferences && p.stimulationPreferences.length > 0 && (
                            <div>
                                <span className="text-xs text-brand-muted block mb-2 font-medium">喜好的刺激</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {p.stimulationPreferences.map(s => <span key={s} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-900">{s}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Capability */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><RulerIcon size={16} className="mr-2 text-indigo-500"/> 开发与能力</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center">
                            <span className="text-xs text-brand-muted">深喉等级</span>
                            <div className="font-bold text-indigo-500 text-lg">Lv.{p.deepThroatLevel || 0}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center">
                            <span className="text-xs text-brand-muted">高潮难度</span>
                            <div className="font-bold text-indigo-500 text-lg">{p.orgasmDifficulty === 'easy' ? '易' : p.orgasmDifficulty === 'hard' ? '难' : '中'}</div>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {p.analDeveloped && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-2 py-1 rounded border border-purple-200">✅ 后庭已开发</span>}
                        {p.squirtingAbility && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-2 py-1 rounded border border-blue-200">💦 潮吹体质</span>}
                    </div>
                </div>

                {/* Inner World & Notes */}
                {(p.primaryValues || p.petPeeves || p.notes) && (
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><BrainCircuit size={16} className="mr-2 text-purple-500"/> 内心与备注</h3>
                        <div className="space-y-3">
                            {p.primaryValues && (
                                <div>
                                    <span className="text-xs text-brand-muted flex items-center mb-1"><ThumbsUp size={12} className="mr-1"/> 最看重 / 喜欢</span>
                                    <p className="text-sm font-medium text-brand-text dark:text-slate-200">{p.primaryValues}</p>
                                </div>
                            )}
                            {p.petPeeves && (
                                <div>
                                    <span className="text-xs text-brand-muted flex items-center mb-1"><ThumbsDown size={12} className="mr-1"/> 最讨厌 / 雷点</span>
                                    <p className="text-sm font-medium text-brand-text dark:text-slate-200">{p.petPeeves}</p>
                                </div>
                            )}
                            {p.notes && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm italic text-brand-muted mt-2">
                                    "{p.notes}"
                                </div>
                            )}
                        </div>
                     </div>
                )}
            </div>
        );
    };

    // --- Sub-View: Edit Form ---
    const renderEdit = () => (
        <div className="flex flex-col h-full">
            {/* Step Indicators */}
            <div className="flex space-x-1 mb-6">
                {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`h-1 flex-1 rounded-full ${editStep >= step ? 'bg-brand-accent' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-6">
                
                {/* Step 1: Basic & Social */}
                {editStep === 1 && (
                    <div className="space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">基本资料 & 关系属性</h3>
                        
                        {/* Name */}
                        <div>
                            <label className="text-xs text-brand-muted">姓名 / 代号</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 focus:border-brand-accent outline-none" 
                                value={formData.name || ''} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="输入姓名或代号 (如: 8号技师)" 
                                autoFocus 
                            />
                        </div>

                        {/* Relationship Type */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-brand-muted">关系性质</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="isMarried"
                                        className="w-4 h-4 rounded border-slate-300 accent-rose-500"
                                        checked={formData.isMarried || false}
                                        onChange={e => setFormData({...formData, isMarried: e.target.checked})}
                                    />
                                    <label htmlFor="isMarried" className="text-xs font-bold text-rose-500">已婚状态 (人妻)</label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(TYPE_CONFIG) as PartnerType[]).map(typeKey => {
                                    const conf = TYPE_CONFIG[typeKey];
                                    const isSelected = formData.type === typeKey;
                                    return (
                                        <button 
                                            key={typeKey}
                                            onClick={() => setFormData({...formData, type: typeKey})}
                                            className={`text-left p-2 rounded border transition-all ${isSelected ? `${conf.color} text-white` : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-brand-muted'}`}
                                        >
                                            <div className="text-sm font-bold">{conf.label}</div>
                                            <div className="text-[10px] opacity-80">{conf.desc}</div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Origin & Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-brand-muted">相识途径</label>
                                <input 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" 
                                    value={formData.origin || ''} 
                                    onChange={e => setFormData({...formData, origin: e.target.value})} 
                                    placeholder="e.g. 探探" 
                                    list="origin-options"
                                />
                                <datalist id="origin-options">
                                    {ORIGIN_PRESETS.map(o => <option key={o} value={o}/>)}
                                </datalist>
                                {/* Quick chips */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {['洗浴/SPA', '夜店', '探探', '外围'].map(o => (
                                        <span key={o} onClick={() => setFormData({...formData, origin: o})} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-200 text-brand-muted">{o}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-brand-muted">初次经历</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" 
                                        value={formData.firstEncounterDate || ''} 
                                        onChange={e => setFormData({...formData, firstEncounterDate: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                         {/* Milestones Editor */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 block flex items-center gap-1">
                                <Flag size={12}/> 关键里程碑
                            </label>
                            
                            {/* List existing */}
                            {formData.milestones && Object.entries(formData.milestones).map(([name, date]) => (
                                <div key={name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded mb-2">
                                    <div>
                                        <div className="text-xs font-bold text-brand-text dark:text-slate-200">{name}</div>
                                        <div className="text-[10px] text-brand-muted font-mono">{date as React.ReactNode}</div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newM = { ...formData.milestones };
                                            delete newM[name];
                                            setFormData({ ...formData, milestones: newM });
                                        }}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add New */}
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <input 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm" 
                                        placeholder="名称 (e.g. 第一次)" 
                                        value={tempMilestone.name}
                                        onChange={e => setTempMilestone({...tempMilestone, name: e.target.value})}
                                        list="milestone-presets"
                                    />
                                    <datalist id="milestone-presets">
                                        {MILESTONE_PRESETS.map(p => <option key={p} value={p}/>)}
                                    </datalist>
                                </div>
                                <div className="w-32">
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm" 
                                        value={tempMilestone.date}
                                        onChange={e => setTempMilestone({...tempMilestone, date: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        if(tempMilestone.name && tempMilestone.date) {
                                            setFormData({
                                                ...formData,
                                                milestones: { ...formData.milestones, [tempMilestone.name]: tempMilestone.date }
                                            });
                                            setTempMilestone({ name: '', date: '' });
                                        }
                                    }}
                                    className="p-2 bg-brand-accent text-white rounded hover:bg-brand-accent-hover"
                                >
                                    <Plus size={18}/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Physical Body */}
                {editStep === 2 && (
                    <div className="space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">身体密码 & 敏感带</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs text-brand-muted">年龄</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)||undefined})} /></div>
                            <div><label className="text-xs text-brand-muted">罩杯</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.cupSize || ''} onChange={e => setFormData({...formData, cupSize: e.target.value})} /></div>
                            <div><label className="text-xs text-brand-muted">身高(cm)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.height || ''} onChange={e => setFormData({...formData, height: parseInt(e.target.value)||undefined})} /></div>
                            <div><label className="text-xs text-brand-muted">体重(kg)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)||undefined})} /></div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2 block">敏感点 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {SENSITIVE_SPOTS.map(spot => (
                                    <button 
                                        key={spot}
                                        onClick={() => toggleArrayItem('sensitiveSpots', spot)}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${formData.sensitiveSpots?.includes(spot) ? 'bg-pink-500 text-white border-pink-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        {spot}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">喜欢的刺激方式 (多选)</label>
                            <div className="flex flex-wrap gap-2">
                                {STIMULATION_METHODS.map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => toggleArrayItem('stimulationPreferences', m)}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${formData.stimulationPreferences?.includes(m) ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Capability & XP */}
                {editStep === 3 && (
                     <div className="space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">开发程度 & XP</h3>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className="text-xs text-brand-muted flex justify-between">
                                    <span>深喉能力 (Level {formData.deepThroatLevel || 0})</span>
                                    <span>0=不行, 3=到底</span>
                                </label>
                                <input 
                                    type="range" min="0" max="3" step="1" 
                                    value={formData.deepThroatLevel || 0}
                                    onChange={e => setFormData({...formData, deepThroatLevel: parseInt(e.target.value) as any})}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-brand-muted mb-2 block">高潮难度</label>
                                <div className="flex bg-slate-200 dark:bg-slate-700 rounded p-1">
                                    {['easy', 'medium', 'hard'].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setFormData({...formData, orgasmDifficulty: d as any})}
                                            className={`flex-1 text-xs py-1 rounded ${formData.orgasmDifficulty === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            {d === 'easy' ? '易高潮' : d === 'medium' ? '普通' : '难高潮'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <input type="checkbox" checked={formData.analDeveloped || false} onChange={e => setFormData({...formData, analDeveloped: e.target.checked})} className="rounded text-indigo-500"/>
                                    后庭开发
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <input type="checkbox" checked={formData.squirtingAbility || false} onChange={e => setFormData({...formData, squirtingAbility: e.target.checked})} className="rounded text-blue-500"/>
                                    潮吹体质
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 block">反差设定</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] text-slate-400">日常人设</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.contrastDaily || ''} onChange={e => setFormData({...formData, contrastDaily: e.target.value})} placeholder="e.g. 高冷女上司"/></div>
                                <div><label className="text-[10px] text-slate-400">床上人设</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.contrastBedroom || ''} onChange={e => setFormData({...formData, contrastBedroom: e.target.value})} placeholder="e.g. 淫乱母狗"/></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Inner World & Social */}
                {editStep === 4 && (
                    <div className="space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">内在与社会属性</h3>
                        
                        <div className="space-y-3">
                            <div><label className="text-xs text-brand-muted">职业</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} /></div>
                            <div>
                                <label className="text-xs text-brand-muted">烟酒习惯</label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                        <Cigarette size={16} className="text-slate-400"/>
                                        <select className="bg-transparent text-sm outline-none w-full" value={formData.smoking || 'none'} onChange={e => setFormData({...formData, smoking: e.target.value as any})}>
                                            <option value="none">不抽烟</option>
                                            <option value="occasional">偶尔</option>
                                            <option value="frequent">老烟枪</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                        <Wine size={16} className="text-slate-400"/>
                                        <select className="bg-transparent text-sm outline-none w-full" value={formData.alcohol || 'none'} onChange={e => setFormData({...formData, alcohol: e.target.value as any})}>
                                            <option value="none">不喝酒</option>
                                            <option value="occasional">小酌</option>
                                            <option value="frequent">酒鬼</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-brand-muted">价值观 / 看重</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.primaryValues || ''} onChange={e => setFormData({...formData, primaryValues: e.target.value})} placeholder="e.g. 钱, 忠诚, 情绪价值"/>
                            </div>
                            <div>
                                <label className="text-xs text-brand-muted">雷点 / 讨厌</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.petPeeves || ''} onChange={e => setFormData({...formData, petPeeves: e.target.value})} placeholder="e.g. 迟到, 体味"/>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-brand-muted">备注</label>
                            <textarea 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm h-24" 
                                value={formData.notes || ''} 
                                onChange={e => setFormData({...formData, notes: e.target.value})} 
                                placeholder="其他需要记录的信息..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={() => editStep > 1 ? setEditStep(editStep - 1) : setView('list')}
                    className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                    {editStep > 1 ? '上一步' : '取消'}
                </button>
                <button 
                    onClick={() => editStep < 4 ? setEditStep(editStep + 1) : handleSubmit()}
                    className="px-6 py-2 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30"
                >
                    {editStep < 4 ? '下一步' : '保存档案'}
                </button>
            </div>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={view === 'edit' ? (formData.id ? '编辑档案' : '新建档案') : view === 'detail' ? '伴侣详情' : '伴侣管理'}
            footer={null}
        >
            <div className="h-[70vh] flex flex-col">
                {view === 'list' && renderList()}
                
                {view === 'detail' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar pr-2">
                            {renderDetail()}
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setView('list')} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-200 font-bold rounded-xl">返回列表</button>
                        </div>
                    </div>
                )}

                {view === 'edit' && renderEdit()}
            </div>
            
            {/* Delete Confirmation */}
            <SafeDeleteModal 
                isOpen={!!deleteId} 
                onClose={() => setDeleteId(null)} 
                onConfirm={handleConfirmDelete}
                message="确定删除此伴侣档案吗？这将不会删除已关联的历史日记，但会移除档案关联。"
            />
        </Modal>
    );
};

export default PartnerManager;
