import React, { lazy, Suspense, useMemo, useState } from 'react';
import type { LogEntry, MasturbationRecordDetails, PartnerProfile, SexRecordDetails, TagEntry, TagType } from '../../domain';
import { HeartHandshake, Clock, MapPin, Droplets, Hand, Users, ChevronDown, AlertTriangle, Film, Quote, Smartphone, CalendarHeart } from 'lucide-react';
import { ErrorBoundary } from '../../shared/ui';
import PartnerManager from './PartnerManager';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import { LABELS, getActivityTargetDate } from '../../shared/lib';

const ReproductivePanel = lazy(() => import('../reproductive/ReproductivePanel'));

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
    const [showReproductive, setShowReproductive] = useState(false);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

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

        // 色情使用：统计最近 30 天内有记录的天数（来自每日记录的 pornConsumption）。
        // cutoff 用生理日口径派生本地日期，与 log.date 的生成方式一致，避免跨时区早晨时段 off-by-one。
        const todayStr = getActivityTargetDate(new Date());
        const cutoffDate = new Date(todayStr + 'T12:00:00');
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        const cutoffStr = getActivityTargetDate(cutoffDate);
        const pornDays = logs.filter(
            (l) => l.date >= cutoffStr && l.pornConsumption && l.pornConsumption !== 'none',
        ).length;

        const formatRate = (count: number, total: number) => {
            if (total === 0) return '--';
            return Math.round((count / total) * 100) + '%';
        };

        return {
            sexCount,
            mbCount,
            sexEjacRate: formatRate(sexEjaculationCount, sexCount),
            mbEjacRate: formatRate(mbEjaculationCount, mbCount),
            pornDays,
            totalActs: sexCount + mbCount
        };
    }, [timeline, logs]);

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
                    <h2 className="text-2xl font-black text-text-primary  flex items-center tracking-tight">
                        <HeartHandshake className="mr-2 text-accent-vivid" size={28} />
                        性爱日记
                    </h2>
                    <button onClick={() => setIsPartnerManagerOpen(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-surface-card  text-text-primary  border border-surface-border  rounded-2xl text-xs font-bold hover:bg-surface-muted dark:hover:bg-surface-muted transition-all shadow-sm active:scale-95">
                        <Users size={14} />
                        <span>伴侣档案</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowReproductive(s => !s)}
                    className="w-full bg-accent-vivid dark:bg-accent-vivid/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-4 flex items-center justify-between hover:bg-accent-vivid/40 dark:hover:bg-accent-vivid/20 transition-colors active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-card  rounded-xl shadow-sm">
                            <CalendarHeart size={18} className="text-rose-500"/>
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-black text-rose-700 dark:text-rose-300">伴侣周期</div>
                            <div className="text-[10px] font-bold text-rose-500 dark:text-rose-400 mt-0.5">月经 · 排卵 · 孕期事件追踪</div>
                        </div>
                    </div>
                    <ChevronDown size={18} className={`text-rose-400 transition-transform ${showReproductive ? 'rotate-180' : ''}`}/>
                </button>
                {showReproductive && (
                    <div className="animate-in slide-in-from-top-2 duration-slow">
                        <Suspense fallback={<div className="p-6 text-center text-xs text-text-muted">加载周期面板...</div>}>
                            <ReproductivePanel date={today}/>
                        </Suspense>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-chart-primary/50 dark:bg-chart-primary/10 p-4 rounded-3xl border border-chart-primary dark:border-chart-primary/30">
                        <p className="text-[10px] text-chart-primary dark:text-chart-primary font-black uppercase tracking-widest mb-1 opacity-70">自慰/MB</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-chart-primary dark:text-chart-primary">{stats.mbCount}</span>
                            <span className="text-xs font-bold text-chart-primary dark:text-chart-primary">次</span>
                        </div>
                        <p className="text-[10px] text-chart-primary font-bold mt-1">射精率 {stats.mbEjacRate}</p>
                    </div>
                    <div className="bg-accent-vivid/50 dark:bg-accent-vivid/10 p-4 rounded-3xl border border-accent-vivid dark:border-accent-vivid/30">
                        <p className="text-[10px] text-accent-vivid dark:text-accent-vivid font-black uppercase tracking-widest mb-1 opacity-70">性生活/SEX</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-accent-vivid dark:text-accent-vivid">{stats.sexCount}</span>
                            <span className="text-xs font-bold text-accent-vivid dark:text-accent-vivid">次</span>
                        </div>
                        <p className="text-[10px] text-accent-vivid font-bold mt-1">射精率 {stats.sexEjacRate}</p>
                    </div>
                </div>

                {/* 色情使用：主归属在性生活，记录入口在每日记录 */}
                <div className="bg-surface-card border border-surface-border rounded-3xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-muted rounded-xl">
                            <Film size={18} className="text-text-secondary" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-text-primary">色情使用</div>
                            <div className="text-[10px] font-bold text-text-muted mt-0.5">
                                近 30 天 {stats.pornDays} 天有记录 · 在每日记录中标记
                            </div>
                        </div>
                    </div>
                </div>

                {stats.totalActs === 0 ? (
                    <div className="bg-surface-elevated  p-12 rounded-[2.5rem] shadow-sm text-center space-y-4 border border-dashed border-surface-border ">
                        <HeartHandshake size={64} className="mx-auto text-text-muted " />
                        <p className="text-text-muted font-medium">暂无记录，点击 "+" 开始记录你的性生活</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-surface-border  ml-4 space-y-8 pb-10">
                        {visibleTimeline.map((record) => {
                            const isSex = record.type === 'sex';
                            const accentColor = isSex ? 'text-accent-vivid dark:text-accent-vivid' : 'text-chart-primary dark:text-chart-primary';
                            const bgColor = isSex ? 'bg-accent-vivid/50 dark:bg-accent-vivid/10' : 'bg-chart-primary/50 dark:bg-chart-primary/10';
                            const borderColor = isSex ? 'border-accent-vivid dark:border-accent-vivid/30' : 'border-chart-primary dark:border-chart-primary/30';
                            
                            // 收集所有标签
                            const allTags: string[] = (isSex 
                                ? record.sexDetails?.interactions?.flatMap(i => [...(i.costumes || []), ...(i.toys || []), ...i.chain.map(c => c.name)]) || []
                                : record.mbDetails?.contentItems?.flatMap(ci => ci.xpTags || []) || record.mbDetails?.assets?.categories || []) as string[];

                            return (
                                <div key={`${record.date}-${record.id}`} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-slow">
                                    {/* 时间轴圆点 */}
                                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-surface-card  z-10 ${isSex ? 'bg-accent-vivid' : 'bg-chart-primary shadow-glow'}`}></div>
                                    
                                    <div className="flex items-baseline justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-text-primary ">{new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                                            {record.startTime && <span className="text-xs text-text-muted font-mono bg-surface-muted  px-1.5 py-0.5 rounded">{record.startTime}</span>}
                                        </div>
                                        <span className="text-[10px] font-black text-text-muted  uppercase tracking-widest">ID: {record.id.slice(-4)}</span>
                                    </div>

                                    <div 
                                        onClick={() => handleRecordClick(record)} 
                                        className={`p-5 rounded-[2rem] shadow-soft border group cursor-pointer hover:shadow-xl transition-all duration-slow bg-surface-card  active:scale-[0.98] ${borderColor}`}
                                    >
                                        {/* 卡片头部：主信息与状态 */}
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${bgColor} ${accentColor} shadow-inner`}>
                                                    {isSex ? <Users size={20} /> : <Hand size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-text-primary  text-base">{isSex ? (record.partner || '多人互动') : '自慰记录'}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center text-[10px] text-text-muted font-bold"><Clock size={12} className="mr-1 opacity-70"/> {record.duration} 分钟</div>
                                                        {record.location && <div className="flex items-center text-[10px] text-text-muted font-bold"><MapPin size={12} className="mr-1 opacity-70"/> {record.location}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5">
                                                {record.ejaculation ? (
                                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black ${isSex ? 'bg-accent-vivid text-accent-vivid dark:bg-accent-vivid/50 dark:text-accent-vivid' : 'bg-chart-primary text-text-on-accent shadow-md shadow-glow'}`}>
                                                        <Droplets size={12} />
                                                        {record.type === 'masturbation' && record.mbDetails?.volumeForceLevel ? `射精 Lv.${record.mbDetails.volumeForceLevel}` : '已射精'}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 rounded-xl bg-surface-muted  text-text-muted text-[10px] font-black uppercase tracking-wider">Edging</div>
                                                )}
                                                {record.mbDetails?.satisfactionLevel && (
                                                    <span className="text-[9px] font-bold text-text-muted">满意度: {LABELS.satisfaction[record.mbDetails.satisfactionLevel]}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 素材详情区域 (Masterbation 专用) */}
                                        {!isSex && record.mbDetails?.contentItems && record.mbDetails.contentItems.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 mb-4 bg-surface-muted  p-3 rounded-2xl border border-surface-border ">
                                                <div className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1 px-1">
                                                    <Film size={10} /> 观看素材 ({record.mbDetails.contentItems.length})
                                                </div>
                                                {record.mbDetails.contentItems.map(item => (
                                                    <div key={item.id} className="flex items-center gap-2 bg-surface-card  p-2.5 rounded-xl border border-surface-border dark:border-surface-card/5 shadow-sm">
                                                        <div className="p-1.5 bg-chart-primary dark:bg-chart-primary/20 rounded-lg text-chart-primary">
                                                            <Smartphone size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[9px] font-black bg-chart-primary dark:bg-chart-primary text-chart-primary dark:text-chart-primary px-1.5 py-0.5 rounded uppercase">{item.type}</span>
                                                                <span className="text-[10px] font-black text-text-muted truncate">{item.platform}</span>
                                                            </div>
                                                            <div className="text-[11px] font-bold text-text-secondary  truncate mt-0.5">
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
                                                    <span key={i} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${isSex ? 'bg-accent-vivid/30 text-accent-vivid border-accent-vivid dark:bg-accent-vivid/10 dark:text-accent-vivid dark:border-accent-vivid/30' : 'bg-chart-primary/30 text-chart-primary border-chart-primary dark:bg-chart-primary/10 dark:text-chart-primary dark:border-chart-primary/30'}`}>
                                                        {tag.replace(/^#/, '')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 打断状态展示 */}
                                        {!isSex && record.mbDetails?.interrupted && (
                                            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-state-warning dark:bg-state-warning/20 border border-state-warning dark:border-state-warning/30 mb-4 animate-pulse">
                                                <AlertTriangle size={14} className="text-state-warning mt-0.5 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-state-warning dark:text-state-warning">中途被打断</span>
                                                    <span className="text-[10px] font-bold text-state-warning/70 dark:text-state-warning/60 leading-tight">
                                                        原因：{record.mbDetails.interruptionReasons?.join(', ') || '未注明'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 备注区域 */}
                                        {record.notes && (
                                            <div className="relative p-3 bg-surface-muted  rounded-2xl border-l-4 border-surface-border ">
                                                <Quote size={12} className="absolute -top-2 -left-1 text-text-muted  fill-current" />
                                                <p className="text-[11px] text-text-secondary  font-medium leading-relaxed italic">
                                                    {record.notes}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* 空白状态填充提示 */}
                                        {!record.notes && allTags.length === 0 && (!record.mbDetails?.contentItems?.length) && (
                                            <div className="flex items-center justify-center py-4 border-2 border-dashed border-surface-border  rounded-2xl opacity-40">
                                                <span className="text-[10px] font-black text-text-muted  uppercase tracking-[0.2em]">点击补充详情</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* 底部装饰 */}
                        <div className="absolute -left-[5px] bottom-0 w-2.5 h-2.5 rounded-full bg-surface-muted "></div>
                    </div>
                )}

                {visibleCount < timeline.length && (
                    <div className="text-center pt-2 pb-12">
                        <button 
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-surface-card  text-text-muted  rounded-3xl text-xs font-black shadow-soft border border-surface-border  active:scale-95 transition-all hover:bg-surface-muted"
                        >
                            加载更多历史数据 <ChevronDown size={14}/>
                        </button>
                    </div>
                )}
            </div>
            
            <PartnerManager
                isOpen={isPartnerManagerOpen}
                onClose={() => setIsPartnerManagerOpen(false)}
                data={{
                    partners,
                    logs
                }}
                actions={{
                    onSave: onAddOrUpdatePartner,
                    onDelete: onDeletePartner
                }}
            />
            <SexRecordModal
                isOpen={isSexModalOpen}
                onClose={() => { setIsSexModalOpen(false); setEditingRecord(null); }}
                onSave={handleSaveSexRecord}
                initialData={editingRecord?.sexDetails}
                dateStr={editingRecord?.date || ''}
                data={{
                    partners,
                    logs
                }}
                onAddPartner={async (name: string) => {
                    const colors = ['bg-accent-vivid', 'bg-chart-tertiary', 'bg-chart-primary', 'bg-chart-secondary', 'bg-state-warning', 'bg-accent-vivid'];
                    const newPartner = {
                        id: `partner_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                        name,
                        avatarColor: colors[partners.length % colors.length]
                    } as PartnerProfile;
                    await onAddOrUpdatePartner(newPartner);
                    return newPartner;
                }}
            />
            <MasturbationRecordModal
                isOpen={isMbModalOpen}
                onClose={() => { setIsMbModalOpen(false); setEditingRecord(null); }}
                onSave={handleSaveMbRecord}
                initialData={editingRecord?.mbDetails}
                dateStr={editingRecord?.date || ''}
                data={{
                    logs,
                    partners,
                    userTags
                }}
                actions={{
                    onAddOrUpdateLog,
                    onAddOrUpdateTag,
                    onDeleteTag
                }}
            />
        </ErrorBoundary>
    );
};

export default SexLifeView;
