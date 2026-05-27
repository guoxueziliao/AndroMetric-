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

    return (
        <div>
            <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>
            <button
                type="button"
                onClick={openModal}
                className="w-full bg-surface-muted border border-surface-border rounded-lg p-3 text-left focus:ring-accent focus:border-accent flex justify-between items-center"
            >
                <span className="text-text-primary font-medium">{formatRelativeDateTime(value)}</span>
                <Calendar size={20} className="text-text-muted" />
            </button>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`设置${label}`}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-surface-muted hover:bg-surface-border text-text-secondary">取消</button>
                        <button onClick={handleConfirm} className="px-4 py-2 rounded-md bg-accent hover:bg-accent/90 text-text-on-accent font-semibold">确认</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="bg-surface-muted border border-surface-border rounded-md p-3 min-h-[44px] text-text-primary focus:ring-accent focus:border-accent"/>
                        <input type="time" value={tempTime} onChange={(e) => setTempTime(e.target.value)} className="bg-surface-muted border border-surface-border rounded-md p-3 min-h-[44px] text-text-primary focus:ring-accent focus:border-accent"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: '现在', getDate: () => new Date() },
                            { label: '-1 小时', getDate: () => { const d = new Date(); d.setHours(d.getHours() - 1); return d; } },
                            { label: '-2 小时', getDate: () => { const d = new Date(); d.setHours(d.getHours() - 2); return d; } },
                            { label: '昨晚 22:00', getDate: () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(22, 0, 0, 0); return d; } },
                        ].map(preset => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                    const d = preset.getDate();
                                    const parts = getDateTimeParts(d.toISOString());
                                    setTempDate(parts.date);
                                    setTempTime(parts.time);
                                }}
                                className="min-h-[44px] flex items-center justify-center gap-1.5 bg-surface-muted hover:bg-surface-border rounded-md text-xs font-bold text-text-muted"
                            >
                                <Clock size={14}/> {preset.label}
                            </button>
                        ))}
                    </div>
                    {quickOptions && quickOptions.length > 0 && (
                        <div>
                            <p className="text-xs text-text-muted mb-2">快捷选项:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickOptions.map(opt => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => handleQuickOption(opt.date)}
                                        className="px-3 py-1.5 text-sm bg-state-info-bg text-state-info-text rounded-full hover:bg-state-info-bg/80 transition-colors"
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
