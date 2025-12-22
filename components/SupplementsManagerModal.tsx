
import React, { useState } from 'react';
import { Plus, Check, Trash2, Pill, RefreshCcw, Power, Edit2 } from 'lucide-react';
import Modal from './Modal';
import { Supplement } from '../types';
import { useData } from '../contexts/DataContext';

interface SupplementsManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#475569'];

const SupplementsManagerModal: React.FC<SupplementsManagerModalProps> = ({ isOpen, onClose }) => {
    const { supplements, addOrUpdateSupplement, deleteSupplement } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Supplement>>({
        id: '', name: '', dosage: '', color: COLORS[0], startDate: new Date().toISOString().split('T')[0],
        cycleEnabled: false, daysOn: 5, daysOff: 2, totalCycleDays: 0, isActive: true
    });

    const handleCreate = () => {
        setFormData({
            id: Date.now().toString(), name: '', dosage: '', color: COLORS[Math.floor(Math.random() * COLORS.length)],
            startDate: new Date().toISOString().split('T')[0], cycleEnabled: false, daysOn: 5, daysOff: 2, totalCycleDays: 0, isActive: true
        });
        setIsEditing(true);
    };

    const handleEdit = (sup: Supplement) => {
        setFormData({ ...sup });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;
        await addOrUpdateSupplement(formData as Supplement);
        setIsEditing(false);
    };

    const toggleActive = async (sup: Supplement) => {
        await addOrUpdateSupplement({ ...sup, isActive: !sup.isActive });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="我的补剂柜">
            {isEditing ? (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">基本信息</label>
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold outline-none focus:border-brand-accent"
                            placeholder="补剂名称 (如: 锌镁片)"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold outline-none focus:border-brand-accent"
                            placeholder="默认剂量 (如: 50mg)"
                            value={formData.dosage}
                            onChange={e => setFormData({...formData, dosage: e.target.value})}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">主题色</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(c => (
                                <button 
                                    key={c} onClick={() => setFormData({...formData, color: c})}
                                    className={`w-10 h-10 rounded-full border-4 transition-all ${formData.color === c ? 'border-white dark:border-slate-900 ring-2 ring-brand-accent' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RefreshCcw size={16} className="text-brand-accent" />
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">周期模式</span>
                            </div>
                            <input 
                                type="checkbox" className="toggle-checkbox" 
                                checked={formData.cycleEnabled}
                                onChange={e => setFormData({...formData, cycleEnabled: e.target.checked})}
                            />
                        </div>

                        {formData.cycleEnabled && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">服用天数 (On)</label>
                                        <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-3 text-sm font-bold" value={formData.daysOn} onChange={e => setFormData({...formData, daysOn: parseInt(e.target.value)||0})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">停服天数 (Off)</label>
                                        <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-3 text-sm font-bold" value={formData.daysOff} onChange={e => setFormData({...formData, daysOff: parseInt(e.target.value)||0})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">起始日期</label>
                                    <input type="date" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-3 text-sm font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl">取消</button>
                        <button onClick={handleSave} className="flex-[2] py-4 bg-brand-accent text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2"><Check size={20}/> 保存配置</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">生效中 ({supplements.filter(s => s.isActive).length})</span>
                        <button onClick={handleCreate} className="text-xs font-black text-brand-accent flex items-center gap-1 hover:opacity-80 transition-all"><Plus size={14}/> 添加补剂</button>
                    </div>

                    <div className="space-y-3">
                        {supplements.length === 0 ? (
                            <div className="text-center py-10 text-slate-300 italic border-2 border-dashed border-slate-100 rounded-3xl">补剂柜空空如也</div>
                        ) : (
                            supplements.map(sup => (
                                <div key={sup.id} className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${sup.isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: sup.color }}>
                                            <Pill size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 dark:text-slate-100">{sup.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold">{sup.dosage} {sup.cycleEnabled ? `· ${sup.daysOn}On/${sup.daysOff}Off` : ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => toggleActive(sup)} className={`p-2 rounded-xl transition-colors ${sup.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}><Power size={18}/></button>
                                        <button onClick={() => handleEdit(sup)} className="p-2 text-slate-400 hover:text-brand-accent transition-colors"><Edit2 size={18}/></button>
                                        <button onClick={() => deleteSupplement(sup.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <button onClick={onClose} className="w-full py-4 mt-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-sm">返回</button>
                </div>
            )}
        </Modal>
    );
};

export default SupplementsManagerModal;
