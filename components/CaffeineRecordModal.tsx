
import React, { useState, useEffect } from 'react';
import { Coffee, Clock, Check, Plus, CupSoda } from 'lucide-react';
import Modal from './Modal';
import { CaffeineItem } from '../types';

interface CaffeineRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: CaffeineItem) => void;
}

const PRESETS = [
    { name: '美式咖啡', volume: 350, icon: '☕', mg: 150 },
    { name: '拿铁/卡布', volume: 350, icon: '🥛', mg: 100 },
    { name: '浓缩 (Espresso)', volume: 30, icon: '🤏', mg: 60 },
    { name: '茶', volume: 250, icon: '🍵', mg: 40 },
    { name: '功能饮料', volume: 250, icon: '⚡', mg: 80 },
    { name: '冷萃', volume: 300, icon: '🧊', mg: 180 },
];

const CaffeineRecordModal: React.FC<CaffeineRecordModalProps> = ({ isOpen, onClose, onSave }) => {
    const [time, setTime] = useState('');
    const [selectedName, setSelectedName] = useState('美式咖啡');
    const [volume, setVolume] = useState(350);

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setSelectedName('美式咖啡');
            setVolume(350);
        }
    }, [isOpen]);

    const handleSelectPreset = (p: typeof PRESETS[0]) => {
        setSelectedName(p.name);
        setVolume(p.volume);
    };

    const handleSave = () => {
        if (!time) return;
        const newItem: CaffeineItem = {
            id: Date.now().toString(),
            name: selectedName,
            time: time,
            count: 1,
            volume: volume
        };
        onSave(newItem);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="添加咖啡因"
            footer={
                <button 
                    onClick={handleSave} 
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center"
                >
                    <Check size={20} className="mr-2"/> 记录
                </button>
            }
        >
            <div className="space-y-6 py-2">
                {/* Time Input */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase">
                        <Clock size={16}/> 饮用时间
                    </div>
                    <input 
                        type="time" 
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none text-right"
                    />
                </div>

                {/* Presets Grid */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">常见饮品</label>
                    <div className="grid grid-cols-3 gap-3">
                        {PRESETS.map(p => (
                            <button
                                key={p.name}
                                onClick={() => handleSelectPreset(p)}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                    selectedName === p.name 
                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-800 dark:text-amber-400 ring-1 ring-amber-500' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className="text-2xl">{p.icon}</span>
                                <span className="text-xs font-bold">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Volume */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <CupSoda size={14}/> 容量 (ml)
                        </label>
                        <span className="text-xl font-black text-brand-text dark:text-slate-200">{volume}</span>
                    </div>
                    <input 
                        type="range" 
                        min="50" 
                        max="1000" 
                        step="50" 
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>50ml</span>
                        <span>500ml</span>
                        <span>1000ml</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CaffeineRecordModal;
