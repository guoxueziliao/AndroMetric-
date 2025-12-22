
import React, { useRef, useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Upload, Download, Info, Settings, Save, AlertTriangle, GitMerge, Replace, Archive, Database, History, Trash2, FileSpreadsheet, Smartphone, Moon, Sun, Palette, Share2, Pencil, X, Book, AppWindow, FolderInput, Clock, Bug, Stethoscope, CheckCircle, Wrench, RotateCcw, ShieldCheck, ChevronRight, AlertCircle, ArrowRight, Tags, Pill } from 'lucide-react';
import { LogEntry, AppSettings, PartnerProfile, Snapshot, Supplement } from '../types';
import Modal from './Modal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import DeveloperManualModal from './DeveloperManualModal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { StorageService } from '../services/StorageService';
import { useLiveQuery } from 'dexie-react-hooks';
import { DataHealthReport } from '../utils/dataHealthCheck';
import { db } from '../db';

const TagManager = lazy(() => import('./TagManager'));
const SupplementsManagerModal = lazy(() => import('./SupplementsManagerModal')); // New

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
  const { logs, partners, importLogs, supplements } = useData();
  /* Fix: Corrected variable declaration from showToast() to useToast() */
  const { showToast } = useToast();
  
  const snapshots = (useLiveQuery(StorageService.snapshots.queries.all) as Snapshot[]) || [];
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false); // New
  const [userName, setUserName] = useLocalStorage('userName', 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  
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

  const handleExportData = async (exportType: 'export' | 'backup') => {
    try {
        const jsonStr = await StorageService.createSnapshot();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `硬度日记-备份-${Date.now()}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('导出成功', 'success');
    } catch (e: any) {
        showToast('导出失败', 'error');
    }
  };

  const handleClearAllData = async () => {
    await StorageService.clearAllData();
    window.location.reload();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
       if (typeof text === 'string') {
          try {
              await StorageService.restoreSnapshot(text, 'merge');
              showToast('导入成功', 'success');
          } catch (error: any) { 
              showToast('导入失败', 'error'); 
          }
      }
    };
    reader.readAsText(file);
  };

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
            <button onClick={() => setIsSupplementsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Pill size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">补剂柜 & 周期管理</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">配置药物、补剂与服用周期</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-slate-400"/>
            </button>

            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><Database size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">数据维护 & 备份</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">体检 / 修复 / 导入导出</p>
                    </div>
                </div>
                <div className="flex items-center text-slate-400 text-xs">
                    {isBackedUp ? <span className="flex items-center text-green-500 mr-2"><ShieldCheck size={12} className="mr-1"/>已备份</span> : <span className="flex items-center text-orange-500 mr-2"><AlertTriangle size={12} className="mr-1"/>未备份</span>}
                    <ChevronRight size={18}/>
                </div>
            </button>
        </div>
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="设置与数据" footer={null}>
          <div className="space-y-8 pb-4">
              <section>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">外观</h3>
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                      {['system', 'light', 'dark'].map(opt => (
                          <button key={opt} onClick={() => onUpdateSettings({ ...settings, theme: opt as any })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.theme === opt ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm' : 'text-slate-500'}`}>{opt === 'system' ? '系统' : opt === 'light' ? '浅色' : '深色'}</button>
                      ))}
                  </div>
              </section>
              <section>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">数据迁移</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleExportData('export')} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center"><Share2 size={24} className="text-brand-accent mb-2"/><span className="text-xs font-bold">导出</span></button>
                      <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center"><FolderInput size={24} className="text-brand-accent mb-2"/><span className="text-xs font-bold">导入</span></button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                  </div>
              </section>
          </div>
      </Modal>

      <DeveloperManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      
      <Suspense fallback={null}>
          <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
          <SupplementsManagerModal isOpen={isSupplementsOpen} onClose={() => setIsSupplementsOpen(false)} />
      </Suspense>
    </>
  );
};

export default MyView;
