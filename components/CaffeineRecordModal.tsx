
import React, { useState, useEffect } from 'react';
import { Clock, Check, CupSoda, PenLine } from 'lucide-react';
import Modal from './Modal';
import { CaffeineItem } from '../types';

interface CaffeineRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: CaffeineItem) => void;
}

const PRESETS = [
    { name: '美式咖啡', volume: 350, icon: '☕' },
    { name: '拿铁/奶咖', volume: 350, icon: '🥛' },
    { name: '浓缩/Espresso', volume: 40, icon: '🤏' },
    { name: '原叶茶', volume: 300, icon: '🍵' },
    { name: '奶茶/果茶', volume: 500, icon: '🧋' },
    { name: '功能饮料', volume: 250, icon: '⚡' },
    { name: '可乐/苏打', volume: 330, icon: '🥤' },
    { name: '冷萃咖啡', volume: 300, icon: '🧊' },
    { name: '抹茶', volume: 250, icon: '🍵' },
];

const CaffeineRecordModal: React.FC<CaffeineRecordModalProps> = ({ isOpen, onClose, onSave }) => {
    const [time, setTime] = useState('');
    const [name, setName] = useState('美式咖啡');
    const [volume, setVolume] = useState(350);

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setName('美式咖啡');
            setVolume(350);
        }
    }, [isOpen]);

    const handleSelectPreset = (p: typeof PRESETS[0]) => {
        setName(p.name);
        setVolume(p.volume);
    };

    const handleSave = () => {
        if (!time || !name) return;
        const newItem: CaffeineItem = {
            id: Date.now().toString(),
            name: name,
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
            title="记录提神饮品"
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

                {/* Name Input */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">饮品名称</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如：龙井、红牛..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm font-bold text-brand-text dark:text-slate-200 outline-none focus:border-amber-500 transition-colors"
                        />
                        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                            <PenLine size={16}/>
                        </div>
                    </div>
                </div>

                {/* Presets Grid */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">快速选择</label>
                    <div className="grid grid-cols-3 gap-3">
                        {PRESETS.map(p => (
                            <button
                                key={p.name}
                                onClick={() => handleSelectPreset(p)}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                    name === p.name 
                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-800 dark:text-amber-400 ring-1 ring-amber-500 shadow-sm' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className="text-xl">{p.icon}</span>
                                <span className="text-[10px] font-bold truncate w-full text-center">{p.name}</span>
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
                        step="10" 
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>50ml (一口)</span>
                        <span>500ml (一瓶)</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CaffeineRecordModal;
