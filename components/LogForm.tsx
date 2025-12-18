
import React, { useState } from 'react';
import { Coffee, Plus } from 'lucide-react';
import BeverageModal from './BeverageModal';
import { LogEntry, CaffeineItem, PartnerProfile } from '../types';

// Fix: Added missing props to LogFormProps to match App.tsx usage
interface LogFormProps {
  onSave: (log: LogEntry) => void;
  existingLog: LogEntry | null;
  logDate: string | null;
  onDirtyStateChange: (isDirty: boolean) => void;
  logs: LogEntry[];
  partners: PartnerProfile[];
}

const LogForm: React.FC<LogFormProps> = ({ 
  onSave, 
  existingLog, 
  logDate, 
  onDirtyStateChange, 
  logs, 
  partners 
}) => {
    // Fix: Ensure default log state is a complete LogEntry object to satisfy TS
    const [log, setLog] = useState<LogEntry>(existingLog || { 
        date: logDate || '', 
        status: 'completed', 
        updatedAt: Date.now(),
        exercise: [],
        sex: [],
        masturbation: [],
        dailyEvents: [],
        tags: [],
        changeHistory: []
    } as LogEntry);
    const [isBevModalOpen, setIsBevModalOpen] = useState(false);

    const handleAddBeverage = (item: CaffeineItem) => {
        const current = log.caffeineRecord || { totalCount: 0, items: [] };
        const newItems = [...current.items, item];
        const updatedLog = {
            ...log,
            caffeineRecord: {
                totalCount: newItems.length,
                items: newItems
            }
        };
        setLog(updatedLog);
        // Fix: Signal that the form state is now dirty
        onDirtyStateChange(true);
    };

    return (
        <div className="space-y-6">
            {/* 提神饮品模块入口 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        < Coffee size={16} /> 提神与补剂
                    </h3>
                    <button 
                        type="button"
                        onClick={() => setIsBevModalOpen(true)}
                        className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-transform"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    {log.caffeineRecord?.items.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-orange-500 shadow-sm text-xs font-black">
                                    {item.name[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.time} · {item.volume}ml</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!log.caffeineRecord || log.caffeineRecord.items.length === 0) && (
                        <div className="text-center py-6 text-xs text-slate-300 font-bold italic">
                            暂无饮用记录，点击右上角添加
                        </div>
                    )}
                </div>
            </div>

            <BeverageModal 
                isOpen={isBevModalOpen} 
                onClose={() => setIsBevModalOpen(false)} 
                onSave={handleAddBeverage} 
            />
            
            {/* Fix: Added explicit save button to Form to utilize onSave prop */}
            <div className="mt-8">
                <button 
                    onClick={() => onSave(log)}
                    className="w-full py-4 bg-brand-accent text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform"
                >
                    保存记录
                </button>
            </div>
        </div>
    );
};

export default LogForm;
