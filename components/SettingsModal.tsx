
import React from 'react';
import Modal from './Modal';
import { Smartphone, Sun, Moon, Database, Tags, Plus, Download, Upload, FileText, Trash2, HeartPulse, ChevronRight } from 'lucide-react';
import { AppSettings } from '../types';
import { StorageService } from '../services/StorageService';
import { useToast } from '../contexts/ToastContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
    const { showToast } = useToast();

    const handleExport = async () => {
        try {
            const json = await StorageService.createSnapshot();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hardness_diary_v38_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            showToast('备份导出成功', 'success');
        } catch (e) { showToast('导出失败', 'error'); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="设置与数据">
            <div className="space-y-8 py-2">
                {/* 外观切换 */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">外观 (APPEARANCE)</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button onClick={() => onUpdateSettings({...settings, theme: 'system'})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-accent' : 'text-slate-400'}`}>
                            <Smartphone size={14}/> 跟随系统
                        </button>
                        <button onClick={() => onUpdateSettings({...settings, theme: 'light'})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white shadow-md text-brand-accent' : 'text-slate-400'}`}>
                            <Sun size={14}/> 浅色
                        </button>
                        <button onClick={() => onUpdateSettings({...settings, theme: 'dark'})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-700 shadow-md text-brand-accent' : 'text-slate-400'}`}>
                            <Moon size={14}/> 深色
                        </button>
                    </div>
                </div>

                {/* 数据健康 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase px-1">
                        <HeartPulse size={14}/> 数据健康 (V38)
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
                        <p className="text-xs text-slate-500 font-medium">定期检查数据结构，确保记录完整可用。</p>
                        <button className="px-8 py-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-black text-sm active:scale-95 transition-all">开始体检</button>
                    </div>
                    
                    <button className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl dark:bg-purple-900/30"><Tags size={20}/></div>
                            <div className="text-left"><div className="font-bold text-sm">标签管理</div><div className="text-[10px] text-slate-400 font-bold">重命名或合并 XP、事件标签</div></div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300"/>
                    </button>
                </div>

                {/* 数据快照 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase"><Database size={14}/> 数据快照</div>
                        <button className="text-[10px] font-black text-blue-500">+ 创建快照</button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
                        <p className="text-xs text-slate-400 font-bold">暂无快照，建议定期备份。</p>
                    </div>
                </div>

                {/* 迁移与备份 */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">迁移与备份</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExport} className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all">
                            <Download size={24} className="text-blue-500" />
                            <span className="text-xs font-black">导出 JSON</span>
                        </button>
                        <button className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all">
                            <Upload size={24} className="text-blue-500" />
                            <span className="text-xs font-black">导入 JSON</span>
                        </button>
                    </div>
                    <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
                        <FileText size={16}/> 保存到本地文件系统
                    </button>
                </div>

                <button onClick={() => confirm('确定清空所有数据吗？不可撤销！') && StorageService.clearAllData().then(() => location.reload())} className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 font-black rounded-2xl text-xs uppercase tracking-widest active:bg-red-100">清除所有数据</button>
                
                <div className="text-center text-[10px] text-slate-300 font-bold py-2 uppercase">Hardness Diary v{settings.version} • Local Storage</div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
