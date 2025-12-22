
import React, { useRef, useState, useMemo, lazy, Suspense } from 'react';
import { Settings, Smartphone, Moon, Sun, Database, History, ChevronRight, Book, Pill } from 'lucide-react';
import { AppSettings } from '../types';
import Modal from './Modal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import DeveloperManualModal from './DeveloperManualModal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { StorageService } from '../services/StorageService';

const SupplementsManagerModal = lazy(() => import('./SupplementsManagerModal'));

interface MyViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  installPrompt: any;
  onShowVersionHistory: () => void;
  onNavigateToLog: (date: string) => void;
}

const MyView: React.FC<MyViewProps> = ({ settings, onUpdateSettings, installPrompt, onShowVersionHistory }) => {
  const { logs, supplements } = useData();
  const { showToast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-start">
            <div><h2 className="text-3xl font-black">User</h2><p className="opacity-70 mt-1">已坚持记录 {logs.length} 天</p></div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/20 rounded-full"><Settings size={20}/></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-100 p-4 rounded-3xl text-center"><div className="text-xs text-slate-400 font-bold">记录</div><div className="text-2xl font-black">{logs.length}</div></div>
            <div className="bg-blue-50 p-4 rounded-3xl text-center"><div className="text-xs text-blue-400 font-bold">晨勃</div><div className="text-2xl font-black text-blue-600">{logs.filter(l=>l.morning?.wokeWithErection).length}</div></div>
            <div className="bg-indigo-50 p-4 rounded-3xl text-center"><div className="text-xs text-indigo-400 font-bold">补剂</div><div className="text-2xl font-black text-indigo-600">{supplements.filter(s=>s.isActive).length}</div></div>
        </div>

        <div className="space-y-3">
            {/* 1. 补剂入口 */}
            <button onClick={() => setIsSupplementsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-4"><div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Pill size={24}/></div><div><div className="font-bold">补剂柜 & 周期管理</div><div className="text-xs text-slate-400">配置药物、补剂与服用周期</div></div></div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>

            {/* 2. 数据维护 */}
            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-4"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Database size={24}/></div><div><div className="font-bold">数据维护 & 备份</div><div className="text-xs text-slate-400">导入/导出/清理数据</div></div></div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>

            {/* 3. 版本记录 */}
            <button onClick={onShowVersionHistory} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-4"><div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><History size={24}/></div><div><div className="font-bold">版本记录</div><div className="text-xs text-slate-400">查看更新日志 (v{settings.version})</div></div></div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>

            {/* 4. 手册 */}
            <button onClick={() => setIsManualOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-4"><div className="p-3 bg-slate-100 text-slate-600 rounded-2xl"><Book size={24}/></div><div><div className="font-bold">开发者手册</div><div className="text-xs text-slate-400">设计哲学与架构规范</div></div></div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>
        </div>

        <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="设置与维护">
            <div className="space-y-6">
                <button onClick={async () => { const json = await StorageService.createSnapshot(); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `hardness_backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); showToast('导出成功', 'success'); }} className="w-full py-4 bg-slate-100 rounded-2xl font-bold">导出 JSON 备份</button>
                <div className="flex items-center justify-between py-4 border-t">
                    <span className="font-bold">深色模式</span>
                    <button onClick={() => onUpdateSettings({...settings, theme: settings.theme === 'dark' ? 'light' : 'dark'})} className="p-2 bg-slate-100 rounded-full">{settings.theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}</button>
                </div>
            </div>
        </Modal>

        <DeveloperManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
        <Suspense fallback={null}><SupplementsManagerModal isOpen={isSupplementsOpen} onClose={() => setIsSupplementsOpen(false)} /></Suspense>
    </div>
  );
};

export default MyView;
