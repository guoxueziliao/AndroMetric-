
import React, { useState, useEffect } from 'react';
import { CloudSun, Clock, Play, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { NapRecord } from '../types';

interface NapRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: NapRecord) => void;
    initialData?: NapRecord;
}

const DREAM_TYPES = ['情色', '噩梦', '普通梦', '模糊梦'];

const NapRecordModal: React.FC<NapRecordModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    
    // v0.0.5 Dream Support
    const [hasDream, setHasDream] = useState(false);
    const [dreamTypes, setDreamTypes] = useState<string[]>([]);
    
    // Calculate duration for display and saving
    const duration = React.useMemo(() => {
        if (!startTime || !endTime) return 0;
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = endTime.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60; // Handle midnight crossing
        return diff;
    }, [startTime, endTime]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setStartTime(initialData.startTime || '');
                setEndTime(initialData.endTime || '');
                setHasDream(initialData.hasDream || false);
                setDreamTypes(initialData.dreamTypes || []);
                
                // If existing record has duration but no endTime, calculate it
                if (initialData.duration && !initialData.endTime && initialData.startTime) {
                    const [h, m] = initialData.startTime.split(':').map(Number);
                    const d = new Date(); d.setHours(h); d.setMinutes(m + initialData.duration);
                    setEndTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                }
            } else {
                const now = new Date();
                setStartTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                
                const endD = new Date(now); endD.setMinutes(now.getMinutes() + 30);
                setEndTime(endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                
                setHasDream(false);
                setDreamTypes([]);
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        onSave({
            id: initialData?.id || Date.now().toString(),
            startTime,
            endTime,
            duration,
            ongoing: false, // Manual entry implies completed
            hasDream,
            dreamTypes: hasDream ? dreamTypes : []
        });
        onClose();
    };
    
    const toggleDreamType = (t: string) => {
        setDreamTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "编辑午休" : "补录午休"}
            footer={
                <div className="flex w-full gap-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl">取消</button>
                    <button 
                        onClick={handleSave} 
                        className="flex-1 py-3 text-white font-bold rounded-xl shadow-md flex items-center justify-center bg-orange-500"
                    >
                        <CloudSun size={18} className="mr-2"/>
                        保存
                    </button>
                </div>
            }
        >
            <div className="space-y-6 py-4">
                <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                         <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">开始时间</label>
                         <input 
                            type="time" 
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="bg-transparent font-mono text-xl font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                        />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">结束时间</label>
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="bg-transparent font-mono text-xl font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                        />
                    </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-1">
                         <Clock size={18} className="text-orange-500"/>
                         <span className="font-bold text-sm text-brand-text dark:text-slate-200">总时长</span>
                    </div>
                    <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                        {duration} <span className="text-sm font-bold text-slate-400">分钟</span>
                    </div>
                </div>
                
                {/* Dream Section (v0.0.5) */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                            <Sparkles size={14} className="mr-1.5"/> 午休梦境
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" className="toggle-checkbox h-4 w-8" checked={hasDream} onChange={e => setHasDream(e.target.checked)} />
                        </div>
                    </div>
                    {hasDream && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in">
                            {DREAM_TYPES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleDreamType(t)}
                                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${dreamTypes.includes(t) ? 'bg-purple-500 text-white border-purple-600' : 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800 text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-xs text-brand-muted text-center italic">
                    "建议使用首页右下角的快速按钮进行实时记录，就像记录睡眠一样。"
                </div>
            </div>
        </Modal>
    );
};

export default NapRecordModal;
