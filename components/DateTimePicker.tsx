
import React, { useState } from 'react';
import Modal from './Modal';
import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string; // ISO string
  onChange: (isoString: string) => void;
  quickOptions?: { label: string; date: Date }[];
}

const getDateTimeParts = (isoString?: string): { date: string, time: string } => {
    if (!isoString) {
        const now = new Date();
        return {
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5),
        };
    }
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) throw new Error("Invalid date");
        
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;

        return { date, time };
    } catch {
        const now = new Date();
        return {
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5),
        };
    }
};

const formatRelativeDateTime = (isoString: string): string => {
    if (!isoString) return '未设置';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    let datePart = '';
    if (isToday) {
        datePart = '今天';
    } else if (isYesterday) {
        datePart = '昨天';
    } else {
        datePart = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }

    const timePart = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${datePart} ${timePart}`;
};


const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, quickOptions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempDate, setTempDate] = useState(getDateTimeParts(value).date);
    const [tempTime, setTempTime] = useState(getDateTimeParts(value).time);

    const openModal = () => {
        const parts = getDateTimeParts(value);
        setTempDate(parts.date);
        setTempTime(parts.time);
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        const [year, month, day] = tempDate.split('-').map(Number);
        const [hours, minutes] = tempTime.split(':').map(Number);
        const newDate = new Date(year, month - 1, day, hours, minutes);
        onChange(newDate.toISOString());
        setIsModalOpen(false);
    };

    const handleQuickOption = (date: Date) => {
        onChange(date.toISOString());
        setIsModalOpen(false);
    }
    
    const handleSetToNow = () => {
        const now = new Date();
        const parts = getDateTimeParts(now.toISOString());
        setTempDate(parts.date);
        setTempTime(parts.time);
    }

    return (
        <div>
            <label className="block text-sm font-medium text-brand-muted dark:text-slate-400 mb-1">{label}</label>
            <button
                type="button"
                onClick={openModal}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-left focus:ring-2 focus:ring-brand-accent focus:border-transparent flex justify-between items-center transition-colors"
            >
                <span className="text-brand-text dark:text-slate-200 font-medium">{formatRelativeDateTime(value)}</span>
                <Calendar size={20} className="text-brand-muted dark:text-slate-500" />
            </button>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`设置${label}`}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">取消</button>
                        <button onClick={handleConfirm} className="px-4 py-2 rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold shadow-md transition-colors">确认</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent text-brand-text dark:text-slate-200"/>
                        <input type="time" value={tempTime} onChange={(e) => setTempTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent text-brand-text dark:text-slate-200"/>
                        <button type="button" onClick={handleSetToNow} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Clock size={20}/></button>
                    </div>
                    {quickOptions && quickOptions.length > 0 && (
                        <div>
                            <p className="text-xs text-brand-muted dark:text-slate-500 mb-2">快捷选项:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickOptions.map(opt => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => handleQuickOption(opt.date)}
                                        className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-brand-accent dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default DateTimePicker;
