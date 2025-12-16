
import React, { useMemo, useState } from 'react';
import { SexRecordDetails, MasturbationRecordDetails } from '../types';
import { HeartHandshake, Calendar, Clock, MapPin, User, Droplets, Hand, Users, ArrowRight, ShieldCheck, Layers, ChevronDown, AlertTriangle } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import PartnerManager from './PartnerManager';
import SexRecordModal from './SexRecordModal';
import MasturbationRecordModal from './MasturbationRecordModal';
import { useData } from '../contexts/DataContext';

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

const PAGE_SIZE = 20;

const SexLifeView: React.FC = () => {
    const { logs, partners, addOrUpdatePartner, deletePartner, addOrUpdateLog } = useData();
    
    const [isPartnerManagerOpen, setIsPartnerManagerOpen] = useState(false);
    const [isSexModalOpen, setIsSexModalOpen] = useState(false);
    const [isMbModalOpen, setIsMbModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<TimelineRecord | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const timeline = useMemo(() => {
        const allRecords: TimelineRecord[] = [];
        logs.forEach(log => {
            if (log.sex) {
                log.sex.forEach(record => {
                    allRecords.push({
                        id: record.id, date: log.date, type: 'sex', startTime: record.startTime,
                        partner: record.interactions?.[0]?.partner || record.partner,
                        duration: record.duration, location: record.location,
                        ejaculation: record.ejaculation, sexDetails: record, notes: record.notes
                    });
                });
            }
            if (log.masturbation) {
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
        await addOrUpdateLog({ ...logToUpdate, sex: newSexList });
    };

    const handleSaveMbRecord = async (updatedDetails: MasturbationRecordDetails) => {
        if (!editingRecord) return;
        const logToUpdate = logs.find(l => l.date === editingRecord.date);
        if (!logToUpdate) return;
        const newMbList = (logToUpdate.masturbation || []).map(m => m.id === updatedDetails.id ? updatedDetails : m);
        await addOrUpdateLog({ ...logToUpdate, masturbation: newMbList });
    };

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text dark:text-slate-200 flex items-center"><HeartHandshake className="mr-2 text-pink-500" /> 性爱日记</h2>
                    <button onClick={() => setIsPartnerManagerOpen(true)} className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-brand-text dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"><Users size={14} /><span>伴侣档案</span></button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Masturbation Stats - Blue Theme */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold opacity-80">自慰次数</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.mbCount}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold opacity-80">自慰射精率</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.mbEjacRate}</p>
                    </div>

                    {/* Sex Stats - Pink Theme */}
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-center border border-pink-100 dark:border-pink-900">
                        <p className="text-xs text-pink-600 dark:text-pink-400 font-bold opacity-80">性生活次数</p>
                        <p className="text-2xl font-black text-pink-700 dark:text-pink-300">{stats.sexCount}</p>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-center border border-pink-100 dark:border-pink-900">
                        <p className="text-xs text-pink-600 dark:text-pink-400 font-bold opacity-80">性生活射精率</p>
                        <p className="text-2xl font-black text-pink-700 dark:text-pink-300">{stats.sexEjacRate}</p>
                    </div>
                </div>

                {stats.totalActs === 0 ? (
                    <div className="bg-brand-secondary dark:bg-slate-900 p-8 rounded-lg shadow-sm text-center space-y-4 border border-slate-200 dark:border-slate-800"><HeartHandshake size={48} className="mx-auto text-brand-accent opacity-50" /><p className="text-brand-muted">暂无记录，请点击右下角 "+" 按钮添加。</p></div>
                ) : (
                    <>
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
                            {visibleTimeline.map((record) => (
                                <div key={`${record.date}-${record.id}`} className="relative pl-6 animate-fade-in">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 ${record.type === 'sex' ? 'bg-brand-accent' : 'bg-blue-400'}`}></div>
                                    <div className="flex items-baseline space-x-2 mb-2"><span className="text-lg font-bold text-brand-text dark:text-slate-200">{new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>{record.startTime && <span className="text-sm text-brand-muted font-mono">{record.startTime}</span>}</div>
                                    <div onClick={() => handleRecordClick(record)} className={`p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${record.type === 'sex' ? 'bg-brand-secondary dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-blue-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-2">
                                                <div className={`${record.type === 'sex' ? 'bg-pink-100 dark:bg-pink-900/40' : 'bg-blue-100 dark:bg-blue-900/40'} p-1.5 rounded-full`}>{record.type === 'sex' ? <User size={16} className="text-pink-600 dark:text-pink-400"/> : <Hand size={16} className="text-blue-600 dark:text-blue-400"/>}</div>
                                                <span className="font-semibold text-brand-text dark:text-slate-200">{record.type === 'sex' ? (record.partner || '多人/未知') : '自慰'}</span>
                                            </div>
                                            <div className="flex space-x-1">{record.ejaculation ? <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center ${record.type === 'sex' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}><Droplets size={10} className="mr-1"/> 射精</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">Edging</span>}</div>
                                        </div>
                                        {record.type === 'sex' && record.sexDetails ? (
                                            <div className="text-sm text-brand-muted"><Clock size={14} className="inline mr-1 opacity-70"/> {record.duration} 分钟</div>
                                        ) : record.mbDetails && (
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm text-brand-muted"><Clock size={14} className="inline mr-1 opacity-70"/> {record.duration} 分钟</div>
                                                {record.location && <div className="text-xs text-brand-muted"><MapPin size={12} className="inline mr-1 opacity-70"/> {record.location}</div>}
                                                {record.mbDetails.interrupted && (
                                                    <div className="text-xs font-bold text-orange-500 flex items-center mt-1">
                                                        <AlertTriangle size={12} className="mr-1"/>
                                                        被打断: {record.mbDetails.interruptionReasons?.join(', ') || '未知'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {visibleCount < timeline.length && (
                            <div className="text-center pb-8">
                                <button 
                                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                                    className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center mx-auto"
                                >
                                    加载更多 <ChevronDown size={16} className="ml-1"/>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <PartnerManager isOpen={isPartnerManagerOpen} onClose={() => setIsPartnerManagerOpen(false)} partners={partners} onSave={addOrUpdatePartner} onDelete={deletePartner} logs={logs} />
            <SexRecordModal isOpen={isSexModalOpen} onClose={() => { setIsSexModalOpen(false); setEditingRecord(null); }} onSave={handleSaveSexRecord} initialData={editingRecord?.sexDetails} dateStr={editingRecord?.date || ''} partners={partners} logs={logs} />
            <MasturbationRecordModal isOpen={isMbModalOpen} onClose={() => { setIsMbModalOpen(false); setEditingRecord(null); }} onSave={handleSaveMbRecord} initialData={editingRecord?.mbDetails} dateStr={editingRecord?.date || ''} logs={logs} partners={partners} />
        </ErrorBoundary>
    );
};

export default SexLifeView;
