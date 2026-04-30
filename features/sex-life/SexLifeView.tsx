import React, { useMemo, useState } from 'react';
import type { LogEntry, MasturbationRecordDetails, PartnerProfile, SexRecordDetails, TagEntry, TagType } from '../../domain';
import { HeartHandshake, Clock, MapPin, Droplets, Hand, Users, ChevronDown, AlertTriangle, Film, Quote, Smartphone } from 'lucide-react';
import { ErrorBoundary } from '../../shared/ui';
import PartnerManager from './PartnerManager';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import { LABELS } from '../../shared/lib';

interface TimelineRecord {
    id: string;
    date: string;
    type: 'sex' | 'masturbation';
    startTime?: string;
    partner?: string; 
    duration?: number;
    location?: string;
    ejaculation: boolean;
    sexDetails?: SexRecordDetails; 
    mbDetails?: MasturbationRecordDetails;
    notes?: string;
}

interface SexLifeViewData {
    logs: LogEntry[];
    partners: PartnerProfile[];
    userTags: TagEntry[];
}

interface SexLifeViewActions {
    onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
    onAddOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
    onDeletePartner: (id: string) => Promise<void>;
    onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
    onDeleteTag: (name: string, category: TagType) => Promise<void>;
}

interface SexLifeViewProps {
    data: SexLifeViewData;
    actions: SexLifeViewActions;
}

const PAGE_SIZE = 20;

const SexLifeView: React.FC<SexLifeViewProps> = ({
    data,
    actions
}) => {
    const {
        logs: rawLogs,
        partners,
        userTags
    } = data;

    const {
        onAddOrUpdateLog,
        onAddOrUpdatePartner,
        onDeletePartner,
        onAddOrUpdateTag,
        onDeleteTag
    } = actions;

    const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
    
    const [isPartnerManagerOpen, setIsPartnerManagerOpen] = useState(false);
    const [isSexModalOpen, setIsSexModalOpen] = useState(false);
    const [isMbModalOpen, setIsMbModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<TimelineRecord | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const timeline = useMemo(() => {
        const allRecords: TimelineRecord[] = [];
        if (logs && Array.isArray(logs)) {
            logs.forEach(log => {
                if (log.sex && Array.isArray(log.sex)) {
                    log.sex.forEach(record => {
                        allRecords.push({
                            id: record.id, date: log.date, type: 'sex', startTime: record.startTime,
                            partner: record.interactions?.[0]?.partner || record.partner,
                            duration: record.duration, location: record.location,
                            ejaculation: record.ejaculation, sexDetails: record, notes: record.notes
                        });
                    });
                }
                if (log.masturbation && Array.isArray(log.masturbation)) {
                    log.masturbation.forEach(record => {
                        allRecords.push({
                            id: record.id, date: log.date, type: 'masturbation', startTime: record.startTime, 
                            partner: '自慰', ejaculation: record.ejaculation, duration: record.duration,
                            location: record.location,
                            mbDetails: record, notes: record.notes
                        });
                    });
                }
            });
        }
        return allRecords.sort((a, b) => {
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return (b.startTime || '23:59').localeCompare(a.startTime || '23:59');
        });
    }, [logs]);

    const visibleTimeline = useMemo(() => timeline.slice(0, visibleCount), [timeline, visibleCount]);

    const stats = useMemo(() => {
        let sexCount = 0;
        let sexEjaculationCount = 0;
        let mbCount = 0;
        let mbEjaculationCount = 0;

        timeline.forEach(r => {
            if (r.type === 'sex') {
                sexCount++;
                if (r.ejaculation) sexEjaculationCount++;
            } else if (r.type === 'masturbation') {
                mbCount++;
                if (r.ejaculation) mbEjaculationCount++;
            }
        });

        const formatRate = (count: number, total: number) => {
            if (total === 0) return '--';
            return Math.round((count / total) * 100) + '%';
        };

        return {
            sexCount,
            mbCount,
            sexEjacRate: formatRate(sexEjaculationCount, sexCount),
            mbEjacRate: formatRate(mbEjaculationCount, mbCount),
            totalActs: sexCount + mbCount
        };
    }, [timeline]);

    const handleRecordClick = (record: TimelineRecord) => {
        setEditingRecord(record);
        record.type === 'sex' ? setIsSexModalOpen(true) : setIsMbModalOpen(true);
    };

    const handleSaveSexRecord = async (updatedDetails: SexRecordDetails) => {
        if (!editingRecord) return;
        const logToUpdate = logs.find(l => l.date === editingRecord.date);
        if (!logToUpdate) return;
        const newSexList = (logToUpdate.sex || []).map(s => s.id === updatedDetails.id ? updatedDetails : s);
        await onAddOrUpdateLog({ ...logToUpdate, sex: newSexList });
    };

    const handleSaveMbRecord = async (updatedDetails: MasturbationRecordDetails) => {
        if (!editingRecord) return;
        const logToUpdate = logs.find(l => l.date === editingRecord.date);
        if (!logToUpdate) return;
        const newMbList = (logToUpdate.masturbation || []).map(m => m.id === updatedDetails.id ? updatedDetails : m);
        await onAddOrUpdateLog({ ...logToUpdate, masturbation: newMbList });
    };

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 flex items-center tracking-tight">
                        <HeartHandshake className="mr-2 text-pink-500" size={28} /> 
                        性爱日记
                    </h2>
                    <button onClick={() => setIsPartnerManagerOpen(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-white dark:bg-slate-900 text-brand-text dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                        <Users size={14} />
                        <span>伴侣档案</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1 opacity-70">自慰/MB</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-blue-700 dark:text-blue-300">{stats.mbCount}</span>
                            <span className="text-xs font-bold text-blue-500 dark:text-blue-500">次</span>
                        </div>
                        <p className="text-[10px] text-blue-400 font-bold mt-1">射精率 {stats.mbEjacRate}</p>
                    </div>
                    <div className="bg-pink-50/50 dark:bg-pink-900/10 p-4 rounded-3xl border border-pink-100 dark:border-pink-900/30">
                        <p className="text-[10px] text-pink-600 dark:text-pink-400 font-black uppercase tracking-widest mb-1 opacity-70">性生活/SEX</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-pink-700 dark:text-pink-300">{stats.sexCount}</span>
                            <span className="text-xs font-bold text-pink-500 dark:text-pink-500">次</span>
                        </div>
                        <p className="text-[10px] text-pink-400 font-bold mt-1">射精率 {stats.sexEjacRate}</p>
                    </div>
                </div>

                {stats.totalActs === 0 ? (
                    <div className="bg-brand-secondary dark:bg-slate-950 p-12 rounded-[2.5rem] shadow-sm text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-800">
                        <HeartHandshake size={64} className="mx-auto text-slate-300 dark:text-slate-800" />
                        <p className="text-slate-400 font-medium">暂无记录，点击 "+" 开始记录你的性生活</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 pb-10">
                        {visibleTimeline.map((record) => {
                            const isSex = record.type === 'sex';
                            const accentColor = isSex ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400';
                            const bgColor = isSex ? 'bg-pink-50/50 dark:bg-pink-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10';
                            const borderColor = isSex ? 'border-pink-100 dark:border-pink-900/30' : 'border-blue-100 dark:border-blue-900/30';
                            
                            // 收集所有标签
                            const allTags: string[] = (isSex 
                                ? record.sexDetails?.interactions?.flatMap(i => [...(i.costumes || []), ...(i.toys || []), ...i.chain.map(c => c.name)]) || []
                                : record.mbDetails?.contentItems?.flatMap(ci => ci.xpTags || []) || record.mbDetails?.assets?.categories || []) as string[];

                            return (
                                <div key={`${record.date}-${record.id}`} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {/* 时间轴圆点 */}
                                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 z-10 ${isSex ? 'bg-pink-500' : 'bg-blue-500 shadow-glow'}`}></div>
                                    
                                    <div className="flex items-baseline justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-brand-text dark:text-slate-100">{new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                                            {record.startTime && <span className="text-xs text-brand-muted font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{record.startTime}</span>}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">ID: {record.id.slice(-4)}</span>
                                    </div>

                                    <div 
                                        onClick={() => handleRecordClick(record)} 
                                        className={`p-5 rounded-[2rem] shadow-soft border group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900/80 active:scale-[0.98] ${borderColor}`}
                                    >
                                        {/* 卡片头部：主信息与状态 */}
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${bgColor} ${accentColor} shadow-inner`}>
                                                    {isSex ? <Users size={20} /> : <Hand size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-base">{isSex ? (record.partner || '多人互动') : '自慰记录'}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center text-[10px] text-slate-400 font-bold"><Clock size={12} className="mr-1 opacity-70"/> {record.duration} 分钟</div>
                                                        {record.location && <div className="flex items-center text-[10px] text-slate-400 font-bold"><MapPin size={12} className="mr-1 opacity-70"/> {record.location}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5">
                                                {record.ejaculation ? (
                                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black ${isSex ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'}`}>
                                                        <Droplets size={12} />
                                                        {record.type === 'masturbation' && record.mbDetails?.volumeForceLevel ? `射精 Lv.${record.mbDetails.volumeForceLevel}` : '已射精'}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-wider">Edging</div>
                                                )}
                                                {record.mbDetails?.satisfactionLevel && (
                                                    <span className="text-[9px] font-bold text-slate-400">满意度: {LABELS.satisfaction[record.mbDetails.satisfactionLevel]}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 素材详情区域 (Masterbation 专用) */}
                                        {!isSex && record.mbDetails?.contentItems && record.mbDetails.contentItems.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 mb-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 px-1">
                                                    <Film size={10} /> 观看素材 ({record.mbDetails.contentItems.length})
                                                </div>
                                                {record.mbDetails.contentItems.map(item => (
                                                    <div key={item.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                                                            <Smartphone size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase">{item.type}</span>
                                                                <span className="text-[10px] font-black text-slate-400 truncate">{item.platform}</span>
                                                            </div>
                                                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                                                                {item.title || '未命名素材'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 标签汇总展示 - 自动剥离 # 符号 */}
                                        {allTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {Array.from(new Set(allTags)).map((tag, i) => (
                                                    <span key={i} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${isSex ? 'bg-pink-50/30 text-pink-600 border-pink-100 dark:bg-pink-900/10 dark:text-pink-400 dark:border-pink-900/30' : 'bg-blue-50/30 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30'}`}>
                                                        {tag.replace(/^#/, '')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 打断状态展示 */}
                                        {!isSex && record.mbDetails?.interrupted && (
                                            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 mb-4 animate-pulse">
                                                <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-orange-700 dark:text-orange-400">中途被打断</span>
                                                    <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/60 leading-tight">
                                                        原因：{record.mbDetails.interruptionReasons?.join(', ') || '未注明'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 备注区域 */}
                                        {record.notes && (
                                            <div className="relative p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-slate-200 dark:border-slate-700">
                                                <Quote size={12} className="absolute -top-2 -left-1 text-slate-300 dark:text-slate-600 fill-current" />
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                                                    {record.notes}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* 空白状态填充提示 */}
                                        {!record.notes && allTags.length === 0 && (!record.mbDetails?.contentItems?.length) && (
                                            <div className="flex items-center justify-center py-4 border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-2xl opacity-40">
                                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">点击补充详情</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* 底部装饰 */}
                        <div className="absolute -left-[5px] bottom-0 w-2.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                    </div>
                )}

                {visibleCount < timeline.length && (
                    <div className="text-center pt-2 pb-12">
                        <button 
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-3xl text-xs font-black shadow-soft border border-slate-100 dark:border-slate-800 active:scale-95 transition-all hover:bg-slate-50"
                        >
                            加载更多历史数据 <ChevronDown size={14}/>
                        </button>
                    </div>
                )}
            </div>
            
            <PartnerManager isOpen={isPartnerManagerOpen} onClose={() => setIsPartnerManagerOpen(false)} partners={partners} onSave={onAddOrUpdatePartner} onDelete={onDeletePartner} logs={logs} />
            <SexRecordModal isOpen={isSexModalOpen} onClose={() => { setIsSexModalOpen(false); setEditingRecord(null); }} onSave={handleSaveSexRecord} initialData={editingRecord?.sexDetails} dateStr={editingRecord?.date || ''} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={isMbModalOpen} onClose={() => { setIsMbModalOpen(false); setEditingRecord(null); }} onSave={handleSaveMbRecord} initialData={editingRecord?.mbDetails} dateStr={editingRecord?.date || ''} logs={logs} partners={partners} userTags={userTags} onAddOrUpdateLog={onAddOrUpdateLog} onAddOrUpdateTag={onAddOrUpdateTag} onDeleteTag={onDeleteTag} />
        </ErrorBoundary>
    );
};

export default SexLifeView;
