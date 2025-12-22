
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
        cycleEnabled: false, daysOn: 5, daysOff: 2, isActive: true
    });

    const handleCreate = () => {
        setFormData({ id: Date.now().toString(), name: '', dosage: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], startDate: new Date().toISOString().split('T')[0], cycleEnabled: false, daysOn: 5, daysOff: 2, isActive: true });
        setIsEditing(true);
    };

    const handleEdit = (sup: Supplement) => { setFormData({ ...sup }); setIsEditing(true); };
    const handleSave = async () => { if (!formData.name) return; await addOrUpdateSupplement(formData as Supplement); setIsEditing(false); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="我的补剂柜">
            {isEditing ? (
                <div className="space-y-6">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold outline-none" placeholder="补剂名称" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold outline-none" placeholder="默认剂量 (如: 1片)" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})}/>
                    <div className="flex flex-wrap gap-3">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-8 h-8 rounded-full border-4 ${formData.color === c ? 'border-brand-accent' : 'border-transparent'}`} style={{ backgroundColor: c }}/>
                        ))}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black">周期模式</span>
                            <input type="checkbox" className="toggle-checkbox" checked={formData.cycleEnabled} onChange={e => setFormData({...formData, cycleEnabled: e.target.checked})}/>
                        </div>
                        {formData.cycleEnabled && (
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="服N天" className="bg-white p-2 rounded-lg" value={formData.daysOn} onChange={e => setFormData({...formData, daysOn: parseInt(e.target.value)||0})}/>
                                <input type="number" placeholder="停N天" className="bg-white p-2 rounded-lg" value={formData.daysOff} onChange={e => setFormData({...formData, daysOff: parseInt(e.target.value)||0})}/>
                                <input type="date" className="col-span-2 bg-white p-2 rounded-lg" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}/>
                            </div>
                        )}
                    </div>
                    <button onClick={handleSave} className="w-full py-4 bg-brand-accent text-white font-black rounded-2xl">保存</button>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={handleCreate} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl">+ 添加补剂</button>
                    {supplements.map(sup => (
                        <div key={sup.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: sup.color }} />
                                <div><div className="font-bold">{sup.name}</div><div className="text-xs text-slate-400">{sup.dosage}</div></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(sup)}><Edit2 size={18} className="text-slate-400"/></button>
                                <button onClick={() => deleteSupplement(sup.id)}><Trash2 size={18} className="text-red-400"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default SupplementsManagerModal;
