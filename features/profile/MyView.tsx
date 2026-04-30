
import React, { useRef, useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Settings, AlertTriangle, Archive, Database, History, Trash2, Smartphone, Moon, Sun, Share2, Pencil, X, FolderInput, Stethoscope, CheckCircle, Wrench, RotateCcw, ShieldCheck, ChevronRight, AlertCircle, ArrowRight, Tags } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AppSettings, LogEntry, Snapshot } from '../../domain';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { StorageService, db } from '../../core/storage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../../shared/ui';
import { DataHealthReport } from '../../utils/dataHealthCheck';
import { InstallButton } from '../../components/PWAInstallPrompt';

const TagManager = lazy(() => import('../tags').then((module) => ({ default: module.TagManager })));
const BackupSettings = lazy(() => import('../backup').then((module) => ({ default: module.BackupSettings })));

interface MyViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onShowVersionHistory: () => void;
  onNavigateToLog: (date: string) => void;
}

const StatBox = ({ label, value, colorClass, bgClass }: { label: string, value: number | string, colorClass: string, bgClass: string }) => (
    <div className={`aspect-square rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm border border-transparent dark:border-slate-800 ${bgClass}`}>
        <span className={`text-xs font-bold opacity-70 mb-1 ${colorClass}`}>{label}</span>
        <span className={`text-3xl font-black ${colorClass}`}>{value}</span>
    </div>
);

const MyView: React.FC<MyViewProps> = ({ settings, onUpdateSettings, onShowVersionHistory, onNavigateToLog }) => {
  const { logs: rawLogs } = useData();
  const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
  const { showToast } = useToast();
  
  // Queries
  const snapshots = (useLiveQuery(StorageService.snapshots.queries.all) as Snapshot[]) || [];
  
  // Version Metadata Query
  const dbMeta = useLiveQuery(async () => {
      const dv = await db.meta.get('dataVersion');
      const df = await db.meta.get('dataFixVersion');
      return { 
          dataVersion: dv?.value || 0, 
          dataFixVersion: df?.value || 0 
      };
  }) || { dataVersion: 0, dataFixVersion: 0 };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [userName, setUserName] = useLocalStorage('userName', 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportButtonText, setExportButtonText] = useState('导出为通用 JSON');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  
  const [snapshotFeedback, setSnapshotFeedback] = useState('');
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  
  // Backup Status Check (Replaces persistence check)
  const isBackedUp = useMemo(() => {
      if (!settings.lastExportAt) return false;
      const daysSinceBackup = (Date.now() - settings.lastExportAt) / (1000 * 60 * 60 * 24);
      return daysSinceBackup < 7;
  }, [settings.lastExportAt]);
  
  // Health Check State
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(() => {
      if (typeof navigator === 'undefined') return false;
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  });

  useEffect(() => {
      const checkMobile = () => {
          const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
          setIsMobile(isTouch || isMobileUA);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleRunHealthCheck = async () => {
      const report = await StorageService.runHealthCheck();
      setHealthReport(report);
      if (report.issues.length === 0) {
          showToast(`数据完整，健康评分 ${report.score}`, 'success');
      } else {
          showToast(`发现 ${report.issues.length} 个潜在问题，评分 ${report.score}`, 'error');
      }
  };

  const handleRepairData = async () => {
      if (!confirm('系统将自动创建当前数据的备份快照，随后尝试修复数据结构错误。\n\n确定要开始修复吗？')) return;
      
      setIsRepairing(true);
      try {
          showToast('正在创建安全备份...', 'info');
          await StorageService.snapshots.create(`系统自动备份 - v${settings.version} 修复前`);
          const count = await StorageService.repairData();
          await db.meta.put({ key: 'dataFixVersion', value: 1 });
          
          if (count > 0) {
              showToast(`修复成功: 已修正 ${count} 条记录`, 'success');
          } else {
              showToast('扫描完成: 未发现需修复的数据', 'success');
          }
          await handleRunHealthCheck();
      } catch (e: any) {
          showToast('修复流程中断: ' + e.message, 'error');
      } finally {
          setIsRepairing(false);
      }
  };

  const handleExportData = async (exportType: 'export' | 'backup') => {
    if (logs.length === 0) {
        showToast('没有数据可导出', 'error');
        return;
    }
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0] + '_' + now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = exportType === 'backup' ? `硬度日记-应用内备份-${timestamp}.json` : `硬度日记-数据导出-${logs[0]?.date || 'data'}.json`;
    
    try {
        const jsonStr = await StorageService.createSnapshot();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (exportType === 'backup') {
             showToast('备份文件已生成', 'success');
        } else {
             showToast('导出成功', 'success');
        }
    } catch (e: any) {
        showToast('导出失败: ' + e.message, 'error');
    }
  };

  const handleClearAllData = async () => {
    try {
      localStorage.removeItem('appSettings');
      localStorage.removeItem('userName');
      await StorageService.clearAllData();
      alert('数据已清除，应用将刷新。');
      window.location.reload();
    } catch (e) { showToast('清除失败', 'error'); }
  };

  const handleClearAnyway = () => {
    setIsClearDataModalOpen(false);
    handleClearAllData();
  };

  const handleExportAndClear = async () => {
    await handleExportData('backup');
    setTimeout(() => {
        handleClearAnyway();
    }, 500);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleExportClick = () => {
    handleExportData('export');
    onUpdateSettings({ ...settings, lastExportAt: Date.now() });
    setExportButtonText('已导出！');
    setTimeout(() => setExportButtonText('导出为通用 JSON'), 2000);
  };
  
  const handleFileSystemBackup = async () => {
      if (isMobile) {
          alert('手机浏览器对本地文件系统支持有限，请使用"导出为通用 JSON"功能。');
          return;
      }
      
      if (!('showDirectoryPicker' in window)) { alert('浏览器不支持文件系统访问'); return; }
      try {
          const timestamp = new Date().toISOString().split('T')[0] + '_' + new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
          const filename = `硬度日记-本地备份-${timestamp}.json`;
          const content = await StorageService.createSnapshot();
          
          // @ts-ignore
          const dirHandle = await window.showDirectoryPicker({ id: 'hardness-diary-backup', mode: 'readwrite', startIn: 'documents' });
          // @ts-ignore
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          // @ts-ignore
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          onUpdateSettings({ ...settings, lastExportAt: Date.now() });
          alert(`✅ 备份成功！\n文件已保存至: ${filename}`);
      } catch (error: any) {
          if (error.name !== 'AbortError') { 
              console.error('FileSystem Backup Error:', error); 
              alert('备份失败: ' + error.message + '\n\n建议使用下方的 "导出为通用 JSON" 功能。'); 
          }
      }
  };
  
  const handleCreateSnapshot = async () => {
    try {
        await StorageService.snapshots.create('手动备份');
        setSnapshotFeedback('快照已创建');
        setTimeout(() => setSnapshotFeedback(''), 2000);
    } catch (e: any) {
        showToast('创建失败: ' + e.message, 'error');
    }
  };

  const handleRestoreSnapshot = async (id: number) => {
      if (confirm('还原将覆盖当前所有数据。确定要回滚到此版本吗？')) {
          try {
              await StorageService.snapshots.restore(id);
              showToast('回滚成功', 'success');
          } catch (e: any) {
              showToast('回滚失败: ' + e.message, 'error');
          }
      }
  };

  const handleDeleteSnapshot = async (id: number) => {
      if (confirm('删除此还原点？')) {
          await StorageService.snapshots.delete(id);
      }
  };
  


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus('importing');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
       if (typeof text === 'string') {
          try {
              await StorageService.restoreSnapshot(text, 'merge');
              setImportStatus('success'); 
              showToast('导入成功', 'success');
              setTimeout(() => setImportStatus('idle'), 2000);
          } catch (error: any) { 
              setImportStatus('error'); 
              showToast(error.message || '导入失败', 'error'); 
              setTimeout(() => setImportStatus('idle'), 3000); 
          }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleJumpToIssue = (date: string) => {
      setIsSettingsOpen(false);
      onNavigateToLog(date);
  };
  
  const canUseFileSystem = 'showDirectoryPicker' in window && !isMobile;

  return (
    <>
      <div className="space-y-6">
        <div className="text-center pt-4 pb-2"><h1 className="text-2xl font-bold text-brand-text dark:text-slate-100 tracking-tight">留在自己空间的记录</h1></div>
        
        {/* User Card */}
        <div className="bg-gradient-to-br from-palette-ice to-palette-pink dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-6 shadow-md relative overflow-hidden text-brand-text dark:text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
                        🧐
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            {isEditingName ? (
                                <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={() => {setUserName(tempName); setIsEditingName(false)}} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="bg-transparent border-b border-brand-text/50 font-bold text-xl w-24 outline-none"/>
                            ) : (
                                <h2 className="text-xl font-bold" onClick={() => setIsEditingName(true)}>{userName}</h2>
                            )}
                            <button onClick={() => setIsEditingName(true)} className="opacity-50 hover:opacity-100"><Pencil size={14}/></button>
                        </div>
                        <p className="text-sm opacity-70">已坚持记录 {stats.totalDays} 天</p>
                    </div>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/30 hover:bg-white/50 rounded-full transition-colors"><Settings size={20}/></button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <StatBox label="记录" value={stats.totalDays} colorClass="text-slate-600 dark:text-slate-400" bgClass="bg-slate-100 dark:bg-slate-900"/>
            <StatBox label="晨勃" value={stats.morningWood} colorClass="text-brand-accent dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20"/>
            <StatBox label="性生活" value={stats.sex} colorClass="text-pink-500 dark:text-pink-400" bgClass="bg-pink-50 dark:bg-pink-900/20"/>
            <StatBox label="自慰" value={stats.masturbation} colorClass="text-indigo-500 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/20"/>
            <StatBox label="运动" value={stats.exercise} colorClass="text-orange-500 dark:text-orange-400" bgClass="bg-orange-50 dark:bg-orange-900/20"/>
            <StatBox label="好梦" value={stats.goodSleep} colorClass="text-purple-500 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-900/20"/>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
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

            <button onClick={onShowVersionHistory} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><History size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-brand-text dark:text-slate-200">版本记录</h3>
                        <p className="text-xs text-brand-muted dark:text-slate-500">查看更新与新功能 (v{settings.version})</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-slate-400"/>
            </button>

<InstallButton className="w-full" />
        </div>
      </div>

      {/* --- Settings / Data Modal --- */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="设置与数据" footer={null}>
          <div className="space-y-8 pb-4">
              
              {/* 1. Theme Settings */}
              <section>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">外观</h3>
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                      {[
                          { id: 'system', icon: Smartphone, label: '跟随系统' },
                          { id: 'light', icon: Sun, label: '浅色' },
                          { id: 'dark', icon: Moon, label: '深色' }
                      ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => onUpdateSettings({ ...settings, theme: opt.id as any })}
                            className={`flex-1 py-2 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${settings.theme === opt.id ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm' : 'text-slate-500'}`}
                          >
                              <opt.icon size={14} className="mr-1.5"/>{opt.label}
                          </button>
                      ))}
                  </div>
              </section>

              {/* 2. Health Check & Repair */}
              <section>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center">
                      <Stethoscope size={14} className="mr-1.5 text-green-500"/> 数据健康 (v{dbMeta.dataVersion})
                  </h3>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                      {!healthReport ? (
                          <div className="text-center py-2">
                              <p className="text-sm text-brand-muted mb-3">定期检查数据结构，确保记录完整可用。</p>
                              <button onClick={handleRunHealthCheck} className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold rounded-xl text-sm hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                                  开始体检
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                                  <span className="text-sm font-medium">健康评分</span>
                                  <span className={`text-xl font-black ${healthReport.score >= 90 ? 'text-green-500' : healthReport.score >= 60 ? 'text-orange-500' : 'text-red-500'}`}>{healthReport.score}</span>
                              </div>
                              <div className="text-xs space-y-1 text-slate-500">
                                  <div className="flex justify-between"><span>总记录数</span><span>{healthReport.totalRecords}</span></div>
                                  <div className="flex justify-between"><span>发现问题</span><span className={healthReport.issues.length > 0 ? 'text-red-500 font-bold' : 'text-green-500'}>{healthReport.issues.length}</span></div>
                              </div>
                              
                              {/* Display Issues List */}
                              {healthReport.issues.length > 0 && (
                                  <div className="mt-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                                      <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center">
                                          <AlertCircle size={12} className="mr-1 text-red-500"/> 
                                          问题详情 ({healthReport.issues.length})
                                      </h4>
                                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                          {healthReport.issues.map((issue) => (
                                              <div 
                                                key={issue.id} 
                                                onClick={() => handleJumpToIssue(issue.date)}
                                                className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex flex-col gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                              >
                                                  <div className="flex justify-between items-center">
                                                      <div className="flex items-center gap-2">
                                                          <span className="font-bold text-brand-text dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-[10px]">{issue.date}</span>
                                                          <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${
                                                              issue.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                                              issue.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                          }`}>{issue.type}</span>
                                                      </div>
                                                      <div className="flex items-center text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <span className="font-bold mr-1">前往修复</span>
                                                          <ArrowRight size={12}/>
                                                      </div>
                                                  </div>
                                                  <p className="text-slate-600 dark:text-slate-400 leading-tight">{issue.message}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              {healthReport.canRepair && (
                                  <button 
                                    onClick={handleRepairData} 
                                    disabled={isRepairing}
                                    className="w-full py-2 bg-brand-accent text-white font-bold rounded-xl flex items-center justify-center disabled:opacity-50"
                                  >
                                      {isRepairing ? <RotateCcw size={16} className="animate-spin mr-2"/> : <Wrench size={16} className="mr-2"/>}
                                      {isRepairing ? '修复中...' : '一键修复'}
                                  </button>
                              )}
                              {!healthReport.canRepair && healthReport.score === 100 && (
                                  <div className="text-center text-xs text-green-500 font-bold flex items-center justify-center pt-2">
                                      <CheckCircle size={14} className="mr-1"/> 数据非常健康
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </section>

{/* Auto Backup Settings */}
      <section>
        <Suspense fallback={null}>
          <BackupSettings logs={logs} />
        </Suspense>
      </section>

      {/* Tag Management */}
      <section>
        <button
          onClick={() => { setIsSettingsOpen(false); setIsTagManagerOpen(true); }}
          className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Tags size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-brand-text dark:text-slate-200">标签管理</h3>
              <p className="text-xs text-brand-muted dark:text-slate-500">重命名或合并 XP、事件标签</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      </section>

              {/* 3. Snapshots */}
              <section>
                  <div className="flex justify-between items-end mb-3">
                      <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center"><Archive size={14} className="mr-1.5 text-blue-500"/> 数据快照</h3>
                      <button onClick={handleCreateSnapshot} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50">+ 创建快照</button>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 max-h-40 overflow-y-auto custom-scrollbar">
                      {snapshots.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">暂无快照，建议定期备份。</div>
                      ) : (
                          snapshots.map(snap => (
                              <div key={snap.id} className="flex items-center justify-between p-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl group transition-colors">
                                  <div className="flex-1 min-w-0 pr-2">
                                      <div className="font-bold text-xs truncate text-brand-text dark:text-slate-300">{snap.description}</div>
                                      <div className="text-[10px] text-slate-400">{new Date(snap.timestamp).toLocaleString()} • v{snap.dataVersion}</div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleRestoreSnapshot(snap.id!)} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg" title="还原"><RotateCcw size={14}/></button>
                                      <button onClick={() => handleDeleteSnapshot(snap.id!)} className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg" title="删除"><Trash2 size={14}/></button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  {snapshotFeedback && <p className="text-xs text-green-500 text-center mt-2 animate-fade-in">{snapshotFeedback}</p>}
              </section>

              {/* 4. Import / Export */}
              <section>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">迁移与备份</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleExportClick} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-accent transition-colors">
                          <Share2 size={24} className="text-brand-accent mb-2"/>
                          <span className="text-xs font-bold text-brand-text dark:text-slate-300">导出 JSON</span>
                      </button>
                      <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-accent transition-colors">
                          {importStatus === 'importing' ? <RotateCcw className="animate-spin text-brand-accent mb-2" size={24}/> : <FolderInput size={24} className="text-brand-accent mb-2"/>}
                          <span className="text-xs font-bold text-brand-text dark:text-slate-300">{importStatus === 'success' ? '导入成功' : '导入 JSON'}</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                      
                      {canUseFileSystem && (
                          <button onClick={handleFileSystemBackup} className="col-span-2 flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Archive size={16} className="mr-2"/> 保存到本地文件系统
                          </button>
                      )}
                  </div>
              </section>

              {/* 5. Danger Zone */}
              <section>
                  <button onClick={() => setIsClearDataModalOpen(true)} className="w-full py-3 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                      清除所有数据
                  </button>
              </section>
              
              <div className="text-center text-[10px] text-slate-300 pt-4">
                  Hardness Diary v{settings.version} • Local Storage
              </div>
          </div>
      </Modal>
      
      {/* Tag Manager Modal */}
      <Suspense fallback={null}>
          <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
      </Suspense>

      {/* Clear Data Confirmation */}
      <Modal isOpen={isClearDataModalOpen} onClose={() => setIsClearDataModalOpen(false)} title="⚠️ 危险操作" footer={
          <div className="flex flex-col w-full gap-2">
              <button onClick={handleExportAndClear} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl">先备份，再清除 (推荐)</button>
              <button onClick={handleClearAnyway} className="w-full py-3 bg-transparent text-slate-400 font-medium text-xs hover:text-red-500">不备份，直接清除</button>
          </div>
      }>
          <div className="text-center py-4">
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
              <p className="text-sm text-brand-text dark:text-slate-200 font-bold mb-2">您确定要清除所有数据吗？</p>
              <p className="text-xs text-brand-muted">此操作将删除所有日志、设置及伴侣档案，且<span className="text-red-500 font-bold">无法撤销</span>。</p>
          </div>
      </Modal>
    </>
  );
};

export default MyView;
