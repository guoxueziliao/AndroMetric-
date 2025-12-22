
import React, { useRef, useState, useMemo, lazy, Suspense } from 'react';
import { Settings, Download, Smartphone, Moon, Sun, Palette, Share2, Pencil, Book, Database, History, ChevronRight, Tags, Pill } from 'lucide-react';
import { AppSettings, Snapshot } from '../types';
import Modal from './Modal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import DeveloperManualModal from './DeveloperManualModal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { StorageService } from '../services/StorageService';
import { useLiveQuery } from 'dexie-react-hooks';

const TagManager = lazy(() => import('./TagManager'));
const SupplementsManagerModal = lazy(() => import('./SupplementsManagerModal')); // 新增

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

const MyView: React.FC<MyViewProps> = ({ settings, onUpdateSettings, installPrompt, onShowVersionHistory, onNavigateToLog }) => {
  const { logs, supplements } = useData();
  const { showToast } = useToast();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false); // 新增
  const [userName, setUserName] = useLocalStorage('userName', 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isBackedUp = useMemo(() => {
      if (!settings.lastExportAt) return false;
      const daysSinceBackup = (Date.now() - settings.lastExportAt) / (1000 * 60 * 60 * 24);
      return daysSinceBackup < 7;
  }, [settings.lastExportAt]);
  
  const stats = useMemo(() => {
      return {
          totalDays: logs.length,
          morningWood: logs.filter(l => l.morning?.wokeWithErection).length,
          sex: logs.reduce((acc, l) => acc + (l.sex?.length || 0), 0),
          masturbation: logs.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0),
          exercise: logs.reduce((acc, l) => acc + (l.exercise?.length || 0), 0),
          goodSleep: logs.filter(l => (l.sleep?.quality || 0) >= 4).length
      };
  }, [logs]);

  return (
    <>
      <div className="space-y-6">
        <div className="text-center pt-4 pb-2"><h1 className="text-2xl font-bold text-brand-text dark:text-slate-100 tracking-tight">留在自己空间的记录</h1></div>
        
        <div className="bg-gradient-to-br from-palette-ice to-palette-pink dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-6 shadow-md relative overflow-hidden text-brand-text dark:text-white">
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">🧐</div>
                    <div>
                        <div className="flex items-center space-x-2">
                            {isEditingName ? (
                                <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={() => {setUserName(tempName); setIsEditingName(false)}} className="bg-transparent border-b border-brand-text/50 font-bold text-xl w-24 outline-none"/>
                            ) : (
                                <h2 className="text-xl font-bold" onClick={() => setIsEditingName(true)}>{userName}</h2>
                            )}
                        </div>
                        <p className="text-sm opacity-70">已坚持记录 {stats.totalDays} 天</p>
                    </div>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/30 hover:bg-white/50 rounded-full transition-colors"><Settings size={20}/></button>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            <StatBox label="记录" value={stats.totalDays} colorClass="text-slate-600 dark:text-slate-400" bgClass="bg-slate-100 dark:bg-slate-900"/>
            <StatBox label="晨勃" value={stats.morningWood} colorClass="text-brand-accent dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20"/>
            <StatBox label="补剂" value={supplements.filter(s => s.isActive).length} colorClass="text-indigo-500 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/20"/>
        </div>

        <div className="space-y-3">
            {/* 1. 补剂管理（新增） */}
            <button onClick={() => setIsSupplementsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Pill size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">补剂柜 & 周期管理</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">配置药物、补剂与服用周期</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-slate-400"/>
            </button>

            {/* 2. 数据维护（原有） */}
            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><Database size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">数据维护 & 备份</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">体检 / 修复 / 导入导出</p>
                    </div>
                </div>
                <div className="flex items-center text-slate-400 text-xs">
                    {isBackedUp ? <span className="text-green-500 mr-2">已备份</span> : <span className="text-orange-500 mr-2">未备份</span>}
                    <ChevronRight size={18}/>
                </div>
            </button>

            {/* 3. 版本记录（原有） */}
            <button onClick={onShowVersionHistory} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><History size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">版本记录</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">查看更新与新功能 (v{settings.version})</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-slate-400"/>
            </button>

            {/* 4. 开发者手册（原有） */}
            <button onClick={() => setIsManualOpen(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"><Book size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">开发者手册</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">设计哲学与架构文档</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-slate-400"/>
            </button>
        </div>
      </div>

      <DeveloperManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      
      <Suspense fallback={null}>
          <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
          <SupplementsManagerModal isOpen={isSupplementsOpen} onClose={() => setIsSupplementsOpen(false)} />
      </Suspense>
    </>
  );
};

export default MyView;
