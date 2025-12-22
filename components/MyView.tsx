
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Settings, Database, History, ChevronRight, Book, Pill, User, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import DeveloperManualModal from './DeveloperManualModal';
import SettingsModal from './SettingsModal';
import { useData } from '../contexts/DataContext';

const SupplementsManagerModal = lazy(() => import('./SupplementsManagerModal'));

interface MyViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  installPrompt: any;
  onShowVersionHistory: () => void;
  onNavigateToLog: (date: string) => void;
}

const StatBox = ({ label, value, colorClass, bgClass }: { label: string, value: number | string, colorClass: string, bgClass: string }) => (
    <div className={`aspect-square rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm border border-transparent dark:border-slate-800 ${bgClass}`}>
        <span className={`text-xs font-bold opacity-70 mb-1 ${colorClass}`}>{label}</span>
        <span className={`text-3xl font-black ${colorClass}`}>{value}</span>
    </div>
);

const MyView: React.FC<MyViewProps> = ({ settings, onUpdateSettings, onShowVersionHistory }) => {
  const { logs, supplements } = useData();
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center pt-2 pb-1">
            <h1 className="text-2xl font-black text-brand-text dark:text-slate-100 tracking-tight">留在自己空间的记录</h1>
        </div>

        <div className="bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-900 dark:to-slate-800 rounded-[2.5rem] p-8 border border-white/40 dark:border-white/5 shadow-soft flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-100 dark:border-white/10">🧐</div>
                <div>
                    <h2 className="text-2xl font-black">User</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">已坚持记录 {logs.length} 天</p>
                </div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10"><Settings size={20}/></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
            <StatBox label="记录" value={logs.length} colorClass="text-slate-600 dark:text-slate-400" bgClass="bg-slate-100 dark:bg-slate-900"/>
            <StatBox label="晨勃" value={logs.filter(l=>l.morning?.wokeWithErection).length} colorClass="text-brand-accent dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20"/>
            <StatBox label="补剂" value={supplements.filter(s=>s.isActive).length} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/20"/>
        </div>

        <div className="space-y-3">
            {/* 1. 补剂入口 */}
            <button onClick={() => setIsSupplementsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-soft group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl dark:bg-indigo-900/30"><Pill size={24}/></div>
                    <div className="text-left"><div className="font-black text-slate-800 dark:text-slate-100">补剂柜 & 周期管理</div><div className="text-xs text-slate-400 font-bold">配置药物、补剂与服用周期</div></div>
                </div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>

            {/* 2. 数据维护 (设置面板) */}
            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-soft group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl dark:bg-emerald-900/30"><Database size={24}/></div>
                    <div className="text-left"><div className="font-black text-slate-800 dark:text-slate-100">数据维护 & 备份</div><div className="text-xs text-slate-400 font-bold">体检 / 修复 / 导入导出</div></div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1"><AlertTriangle size={10}/> 未备份</span>
                    <ChevronRight size={20} className="text-slate-300"/>
                </div>
            </button>

            {/* 3. 版本记录 */}
            <button onClick={onShowVersionHistory} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-soft group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl dark:bg-blue-900/30"><History size={24}/></div>
                    <div className="text-left"><div className="font-black text-slate-800 dark:text-slate-100">版本记录</div><div className="text-xs text-slate-400 font-bold">查看更新与新功能 (v{settings.version})</div></div>
                </div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>

            {/* 4. 手册 */}
            <button onClick={() => setIsManualOpen(true)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl flex items-center justify-between border shadow-soft group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl dark:bg-slate-800"><Book size={24}/></div>
                    <div className="text-left"><div className="font-black text-slate-800 dark:text-slate-100">开发者手册</div><div className="text-xs text-slate-400 font-bold">设计哲学与架构文档</div></div>
                </div>
                <ChevronRight size={20} className="text-slate-300"/>
            </button>
        </div>

        <DeveloperManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={onUpdateSettings} />
        <Suspense fallback={null}><SupplementsManagerModal isOpen={isSupplementsOpen} onClose={() => setIsSupplementsOpen(false)} /></Suspense>
    </div>
  );
};

export default MyView;
