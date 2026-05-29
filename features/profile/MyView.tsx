
import React, { useRef, useState, useMemo, lazy, Suspense } from 'react';
import { Settings, AlertTriangle, Archive, Database, Trash2, Smartphone, Moon, Sun, Share2, Pencil, FolderInput, Stethoscope, CheckCircle, Wrench, RotateCcw, ShieldCheck, ChevronRight, AlertCircle, ArrowRight, Tags, FlaskConical, Fingerprint, LockKeyhole, FileSpreadsheet, Info } from 'lucide-react';
import type { AppLockSettings, AppSettings, AutoBackupIntervalHours, AutoSafetySnapshotLimit, AutoSafetySnapshotSizeLimitMB, LogEntry, TagEntry, TagType } from '../../domain';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../../shared/ui';
import { canUseWebAuthn, createWebAuthnCredential, pathToLabel } from '../../shared/lib';
import { APP_VERSION } from '../../app/appConfig';
import {
  AUTO_BACKUP_INTERVAL_HOUR_OPTIONS,
  AUTO_SAFETY_SNAPSHOT_LIMIT_OPTIONS,
  AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_OPTIONS_MB,
  normalizeBackupRetention,
  normalizeBackupSchedule
} from '../../core/storage';
import { InstallButton } from '../pwa';
import PinSetupModal from './PinSetupModal';
import { useProfileMaintenance } from './model/useProfileMaintenance';
import ImportPreviewModal from './ui/ImportPreviewModal';
import AboutModal from './AboutModal';
import ExportOptionsModal from './ExportOptionsModal';

const TagManager = lazy(() => import('../tags').then((module) => ({ default: module.TagManager })));
const BackupSettings = lazy(() => import('../backup').then((module) => ({ default: module.BackupSettings })));
const SimulationLabPanel = lazy(() => import('../simulation-lab').then((module) => ({ default: module.SimulationLabPanel })));

const ANALYTICS_LABELS: Record<string, string> = {
  hardness: '硬度',
  sleep: '睡眠',
  stress: '压力',
  exercise: '运动',
  alcohol: '饮酒',
  masturbation: '自慰',
  sex: '性爱'
};

interface MyViewData {
  settings: AppSettings;
  logs: LogEntry[];
  userTags: TagEntry[];
}

interface MyViewActions {
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onNavigateToLog: (date: string) => void;
}

interface MyViewProps {
  data: MyViewData;
  actions: MyViewActions;
}

const StatBox = ({ label, value, colorClass, bgClass }: { label: string, value: number | string, colorClass: string, bgClass: string }) => (
    <div className={`aspect-square rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm border border-transparent ${bgClass}`}>
        <span className={`text-xs font-bold opacity-70 mb-1 ${colorClass}`}>{label}</span>
        <span className={`text-3xl font-black ${colorClass}`}>{value}</span>
    </div>
);

const MyView: React.FC<MyViewProps> = ({ data, actions }) => {
  const {
    settings,
    logs: rawLogs,
    userTags
  } = data;

  const {
    onAddOrUpdateLog,
    onAddOrUpdateTag,
    onDeleteTag,
    onUpdateSettings,
    onNavigateToLog
  } = actions;

  const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'enable' | 'change' | 'disable' | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSimulationLabOpen, setIsSimulationLabOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const isDevMode = typeof window !== 'undefined' && window.localStorage?.getItem('devMode') === '1';
  const [userName, setUserName] = useLocalStorage('userName', 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [clearDataConfirmText, setClearDataConfirmText] = useState('');
  const canConfirmClearData = clearDataConfirmText === '删除';
  const backupRetention = normalizeBackupRetention(settings.backupRetention);
  const backupSchedule = normalizeBackupSchedule(settings.backupSchedule);

  const {
    snapshots,
    dbMeta,
    healthReport,
    isRepairing,
    isExportOptionsOpen,
    exportOptions,
    exportSourceCounts,
    exportFilteredCounts,
    exportTagOptions,
    isExporting,
    isEncryptedExport,
    importStatus,
    importPreview,
    importStrategy,
    importConflictResolution,
    snapshotFeedback,
    canUseFileSystem,
    onRunHealthCheck,
    onRepairData,
    onExportClick,
    onCsvExportClick,
    onEncryptedExportClick,
    onChangeExportOptions,
    onCloseExportOptions,
    onConfirmExport,
    onFileSystemBackup,
    onCreateSnapshot,
    onChangeBackupRetention,
    onChangeBackupSchedule,
    onRestoreSnapshot,
    onDeleteSnapshot,
    onFileChange,
    onCancelImportPreview,
    onConfirmImport,
    onChangeImportStrategy,
    onChangeImportConflictResolution,
    backupMetadata,
    backupStatus,
    onClearAllData,
    onExportAndClear
  } = useProfileMaintenance({
    settings,
    logs,
    onUpdateSettings
  });
  
  // Backup Status Check (Replaces persistence check)
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

  const handleClearAnyway = () => {
    if (!canConfirmClearData) return;
    setIsClearDataModalOpen(false);
    setClearDataConfirmText('');
    onClearAllData();
  };

  const handleExportAndClear = async () => {
    if (!canConfirmClearData) return;
    await onExportAndClear();
    setIsClearDataModalOpen(false);
    setClearDataConfirmText('');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const updateAppLock = (appLock: AppLockSettings) => onUpdateSettings({ ...settings, appLock });

  const handlePinComplete = (result: { pinHash: string; pinSalt: string } | null) => {
    if (!result) {
      updateAppLock({ enabled: false, autoLockMinutes: settings.appLock?.autoLockMinutes ?? 5 });
      setPinModalMode(null);
      setBiometricStatus(null);
      return;
    }
    updateAppLock({
      enabled: true,
      pinHash: result.pinHash,
      pinSalt: result.pinSalt,
      autoLockMinutes: settings.appLock?.autoLockMinutes ?? 5,
      webAuthnCredentialId: settings.appLock?.webAuthnCredentialId
    });
    setPinModalMode(null);
  };

  const handleEnableBiometric = async () => {
    if (!settings.appLock?.enabled || biometricBusy) return;
    setBiometricBusy(true);
    setBiometricStatus(null);
    try {
      const credentialId = await createWebAuthnCredential();
      updateAppLock({ ...settings.appLock, webAuthnCredentialId: credentialId });
      setBiometricStatus('已启用生物识别解锁');
    } catch {
      setBiometricStatus('生物识别设置失败或已取消');
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleDisableBiometric = () => {
    if (!settings.appLock) return;
    const { webAuthnCredentialId: _removed, ...nextLock } = settings.appLock;
    updateAppLock(nextLock);
    setBiometricStatus('已关闭生物识别解锁');
  };

  const handleJumpToIssue = (date: string) => {
      setIsSettingsOpen(false);
      onNavigateToLog(date);
  };

  const formatRelativeDays = (timestamp: number): string => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 30) return `${days} 天前`;
    if (days < 365) return `${Math.floor(days / 30)} 月前`;
    return `${Math.floor(days / 365)} 年前`;
  };

  const formatRelativeHours = (timestamp: number): string => {
    if (!timestamp) return '从未';
    const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    if (hours <= 0) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    return formatRelativeDays(timestamp);
  };

  const ecosystemHints: string[] = (() => {
    const hints: string[] = [];
    const exportDays = settings.lastExportAt
      ? (Date.now() - settings.lastExportAt) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (exportDays > 30) hints.push('已超过 30 天未导出，建议手动备份一次。');
    if (snapshots.length === 0) hints.push('暂无内部快照，重要操作前可创建一个保护点。');
    if (backupStatus.needsReauthorization) hints.push('自动备份目录授权失效，请到下方重新授权。');
    if (healthReport && healthReport.canRepair) hints.push('发现可自动修复的数据问题，建议运行一键修复。');
    if (healthReport && !healthReport.canRepair && healthReport.issues.length > 0) hints.push('发现需要手动检查的数据问题。');
    return hints;
  })();

  return (
    <>
      <div className="space-y-6">
        <div className="text-center pt-4 pb-2"><h1 className="text-2xl font-bold text-text-primary  tracking-tight">留在自己空间的记录</h1></div>
        
        {/* User Card */}
        <div className="bg-gradient-to-br from-surface-muted to-accent-vivid dark:from-surface-muted dark:to-surface-card rounded-[2rem] p-6 shadow-md relative overflow-hidden text-text-primary dark:text-text-on-accent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-surface-card/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-surface-card rounded-full flex items-center justify-center text-3xl shadow-sm">
                        🧐
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            {isEditingName ? (
                                <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={() => {setUserName(tempName); setIsEditingName(false)}} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="bg-transparent border-b border-text-primary/50 font-bold text-xl w-24 outline-none"/>
                            ) : (
                                <h2 className="text-xl font-bold" onClick={() => setIsEditingName(true)}>{userName}</h2>
                            )}
                            <button onClick={() => setIsEditingName(true)} className="opacity-50 hover:opacity-100"><Pencil size={14}/></button>
                        </div>
                        <p className="text-sm opacity-70">已坚持记录 {stats.totalDays} 天</p>
                    </div>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-surface-card/30 hover:bg-surface-card/50 rounded-full transition-colors"><Settings size={20}/></button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <StatBox label="记录" value={stats.totalDays} colorClass="text-text-secondary " bgClass="bg-surface-muted "/>
            <StatBox label="晨勃" value={stats.morningWood} colorClass="text-accent" bgClass="bg-state-info-bg"/>
            <StatBox label="性生活" value={stats.sex} colorClass="text-accent-vivid" bgClass="bg-surface-muted"/>
            <StatBox label="自慰" value={stats.masturbation} colorClass="text-chart-tertiary" bgClass="bg-surface-muted"/>
            <StatBox label="运动" value={stats.exercise} colorClass="text-state-warning-text" bgClass="bg-state-warning-bg"/>
            <StatBox label="好梦" value={stats.goodSleep} colorClass="text-chart-quaternary" bgClass="bg-surface-muted"/>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-surface-card  p-4 rounded-2xl flex items-center justify-between border border-surface-border  shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-state-success-bg text-state-success-text rounded-xl"><Database size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-text-primary ">设置与数据</h3>
                        <p className="text-xs text-text-muted ">外观 / 隐私 / 体检 / 备份 / 导入导出</p>
                    </div>
                </div>
                <div className="flex items-center text-text-muted text-xs">
                    {isBackedUp ? <span className="flex items-center text-state-success-text mr-2"><ShieldCheck size={12} className="mr-1"/>已备份</span> : <span className="flex items-center text-state-warning-text mr-2"><AlertTriangle size={12} className="mr-1"/>未备份</span>}
                    <ChevronRight size={18}/>
                </div>
            </button>

            <button onClick={() => setIsAboutOpen(true)} className="w-full bg-surface-card  p-4 rounded-2xl flex items-center justify-between border border-surface-border  shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-state-info-bg text-state-info-text rounded-xl"><Info size={20}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-text-primary ">关于</h3>
                        <p className="text-xs text-text-muted ">版本 / 数据版本 / 更新历史 (v{APP_VERSION})</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-text-muted"/>
            </button>

<InstallButton className="w-full" />
        </div>
      </div>

      {/* --- Settings / Data Modal --- */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="设置与数据" footer={null}>
          <div className="space-y-8 pb-4">
              
              {/* 1. Theme Settings */}
              <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">外观</h3>
                  <div className="bg-surface-muted  p-1 rounded-xl flex">
	                      {([
	                          { id: 'system', icon: Smartphone, label: '跟随系统' },
	                          { id: 'light', icon: Sun, label: '浅色' },
	                          { id: 'dark', icon: Moon, label: '深色' }
	                      ] satisfies Array<{ id: AppSettings['theme']; icon: typeof Smartphone; label: string }>).map(opt => (
	                          <button
	                            key={opt.id}
	                            onClick={() => onUpdateSettings({ ...settings, theme: opt.id })}
                            className={`flex-1 py-2 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${settings.theme === opt.id ? 'bg-surface-card  text-accent shadow-sm' : 'text-text-muted'}`}
                          >
                              <opt.icon size={14} className="mr-1.5"/>{opt.label}
                          </button>
                      ))}
                  </div>
              </section>

              {/* 1b. Privacy Settings */}
              <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">隐私</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-surface-card  border border-surface-border  rounded-2xl space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-surface-muted  text-accent"><LockKeyhole size={18} /></div>
                          <div>
                            <p className="text-sm font-bold text-text-primary ">应用锁</p>
                            <p className="text-xs text-text-muted  mt-0.5">离开一段时间后用 4 位 PIN 解锁</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPinModalMode(settings.appLock?.enabled ? 'disable' : 'enable')}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${settings.appLock?.enabled ? 'bg-state-danger-bg text-state-danger-text' : 'bg-accent text-text-on-accent'}`}
                        >
                          {settings.appLock?.enabled ? '关闭' : '开启'}
                        </button>
                      </div>
                      {settings.appLock?.enabled && (
                        <>
                          <div className="flex items-center justify-between gap-3 border-t border-surface-border  pt-3">
                            <button type="button" onClick={() => setPinModalMode('change')} className="text-xs font-black text-accent">修改 PIN</button>
                            <label className="flex items-center gap-2 text-xs font-bold text-text-muted ">
                              自动锁定
                              <select
                                value={settings.appLock.autoLockMinutes}
                                onChange={(e) => updateAppLock({ ...settings.appLock!, autoLockMinutes: Number(e.target.value) })}
                                className="rounded-xl border border-surface-border bg-surface-muted px-2 py-1 text-xs font-bold text-text-primary outline-none   "
                              >
                                <option value={1}>1 分钟</option>
                                <option value={5}>5 分钟</option>
                                <option value={15}>15 分钟</option>
                                <option value={30}>30 分钟</option>
                              </select>
                            </label>
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-surface-border  pt-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-text-muted ">
                              <Fingerprint size={16} className="text-accent" />
                              生物识别
                            </div>
                            {canUseWebAuthn() ? (
                              <button
                                type="button"
                                onClick={settings.appLock.webAuthnCredentialId ? handleDisableBiometric : handleEnableBiometric}
                                disabled={biometricBusy}
                                className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-black text-text-primary transition-colors disabled:opacity-50  "
                              >
                                {biometricBusy ? '处理中...' : settings.appLock.webAuthnCredentialId ? '关闭' : '启用'}
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-text-muted">当前环境不支持</span>
                            )}
                          </div>
                          {biometricStatus && <p className="text-[11px] font-bold text-text-muted">{biometricStatus}</p>}
                        </>
                      )}
                    </div>
                  </div>
              </section>

              {/* 2. Health Check & Repair */}
              <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center">
                      <Stethoscope size={14} className="mr-1.5 text-state-success-text"/> 数据健康 (v{dbMeta.dataVersion})
                  </h3>
                  <div className="bg-surface-card  border border-surface-border  rounded-2xl p-4 shadow-sm">
                      {!healthReport ? (
                          <div className="text-center py-2">
                              <p className="text-sm text-text-muted mb-3">定期检查数据结构，确保记录完整可用。</p>
                              <button onClick={onRunHealthCheck} className="px-4 py-2 bg-state-success-bg text-state-success-text font-bold rounded-xl text-sm hover:bg-state-success-bg/80 transition-colors">
                                  开始体检
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="flex justify-between items-center pb-2 border-b border-surface-border ">
                                  <span className="text-sm font-medium">综合评分</span>
                                  <span className={`text-xl font-black ${healthReport.score >= 90 ? 'text-state-success-text' : healthReport.score >= 60 ? 'text-state-warning-text' : 'text-state-danger-text'}`}>{healthReport.score}</span>
                              </div>
                              <div className="text-xs space-y-1 text-text-muted">
                                  <div className="flex justify-between"><span>总记录数</span><span>{healthReport.totalRecords}</span></div>
                                  <div className="flex justify-between"><span>发现问题</span><span className={healthReport.issues.length > 0 ? 'text-state-danger-text font-bold' : 'text-state-success-text'}>{healthReport.issues.length}</span></div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                                      <div className="text-[10px] text-text-muted font-bold">结构</div>
                                      <div className="text-sm font-black text-text-secondary ">{healthReport.scores.structure}</div>
                                  </div>
                                  <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                                      <div className="text-[10px] text-text-muted font-bold">完整度</div>
                                      <div className="text-sm font-black text-text-secondary ">{healthReport.scores.completeness}</div>
                                  </div>
                                  <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                                      <div className="text-[10px] text-text-muted font-bold">分析可用度</div>
                                      <div className="text-sm font-black text-text-secondary ">{healthReport.scores.analytics}</div>
                                  </div>
                              </div>
                              <div className="text-xs space-y-1 text-text-muted rounded-xl bg-surface-muted  p-3 border border-surface-border ">
                                  <div className="flex justify-between"><span>已追踪字段</span><span>{healthReport.stats.completeness.trackedFields}</span></div>
                                  <div className="flex justify-between"><span>有效字段</span><span>{healthReport.stats.completeness.recordedFields}</span></div>
                                  <div className="flex justify-between"><span>缺失/默认字段</span><span>{healthReport.stats.completeness.missingFields}</span></div>
                              </div>
                              <div className="rounded-xl bg-surface-muted  p-3 border border-surface-border ">
                                  <h4 className="text-xs font-bold text-text-muted mb-2">分析样本</h4>
                                  <div className="space-y-1 text-xs text-text-muted">
                                      {Object.entries(healthReport.stats.analyticsAvailability).map(([key, item]) => (
                                          <div key={key} className="flex justify-between">
                                              <span>{ANALYTICS_LABELS[key] || key}</span>
                                              <span>{item.usableSamples}/{item.totalRecords}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                              {/* Display Issues List */}
                              {healthReport.issues.length > 0 && (
                                  <div className="mt-2 bg-surface-muted  rounded-xl p-3 border border-surface-border ">
                                      <h4 className="text-xs font-bold text-text-muted mb-2 flex items-center">
                                          <AlertCircle size={12} className="mr-1 text-state-danger-text"/>
                                          问题详情 ({healthReport.issues.length})
                                      </h4>
                                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                          {healthReport.issues.map((issue) => (
                                              <div
                                                key={issue.id}
                                                onClick={() => handleJumpToIssue(issue.date)}
                                                className="bg-surface-card  p-3 rounded-lg border border-surface-border  text-xs flex flex-col gap-1.5 cursor-pointer hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors group"
                                              >
                                                  <div className="flex justify-between items-center">
                                                      <div className="flex items-center gap-2">
                                                          <span className="font-bold text-text-primary  font-mono bg-surface-muted  px-1.5 rounded text-[10px]">{issue.date}</span>
                                                          <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${
                                                              issue.severity === 'high' ? 'bg-state-danger-bg text-state-danger-text' :
                                                              issue.severity === 'medium' ? 'bg-state-warning-bg text-state-warning-text' : 'bg-state-info-bg text-state-info-text'
                                                          }`}>{issue.type}</span>
                                                      </div>
                                                      <div className="flex items-center text-accent">
                                                          <span className="font-bold mr-1">前往修复</span>
                                                          <ArrowRight size={12}/>
                                                      </div>
                                                  </div>
                                                  <p className="text-text-secondary  leading-tight">{issue.message}</p>
                                                  {issue.path && (
                                                      <p className="text-[10px] text-accent font-medium">
                                                          需要检查：{pathToLabel(issue.path)}
                                                      </p>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              {healthReport.canRepair && (
                                  <button 
                                    onClick={onRepairData}
                                    disabled={isRepairing}
                                    className="w-full py-2 bg-accent text-text-on-accent font-bold rounded-xl flex items-center justify-center disabled:opacity-50"
                                  >
                                      {isRepairing ? <RotateCcw size={16} className="animate-spin mr-2"/> : <Wrench size={16} className="mr-2"/>}
                                      {isRepairing ? '修复中...' : '一键修复'}
                                  </button>
                              )}
                              {!healthReport.canRepair && healthReport.issues.length > 0 && (
                                  <div className="text-center text-xs text-state-warning-text font-bold flex items-center justify-center pt-2">
                                      <AlertCircle size={14} className="mr-1"/> 发现需要手动检查的问题
                                  </div>
                              )}
                              {!healthReport.canRepair && healthReport.issues.length === 0 && (
                                  <div className="text-center text-xs text-state-success-text font-bold flex items-center justify-center pt-2">
                                      <CheckCircle size={14} className="mr-1"/> 数据健康，无需修复
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </section>

              {/* Data Ecosystem Overview */}
              <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center">
                      <ShieldCheck size={14} className="mr-1.5 text-state-success-text"/> 数据生态
                  </h3>
                  <div className="bg-surface-card  border border-surface-border  rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                              <div className="text-[10px] text-text-muted font-bold">最近导出</div>
                              <div className="text-xs font-black text-text-primary ">
                                  {settings.lastExportAt ? formatRelativeDays(settings.lastExportAt) : '从未'}
                              </div>
                          </div>
                          <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                              <div className="text-[10px] text-text-muted font-bold">内部快照</div>
                              <div className="text-xs font-black text-text-primary ">{snapshots.length} 个</div>
                          </div>
                          <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                              <div className="text-[10px] text-text-muted font-bold">自动备份</div>
                              <div className="text-xs font-black text-text-primary ">
                                  {backupStatus.isReady && backupMetadata?.lastBackupAt
                                      ? formatRelativeDays(backupMetadata.lastBackupAt)
                                      : backupStatus.needsReauthorization ? '需重授权' : '未启用'}
                              </div>
                          </div>
                          <div className="rounded-xl bg-surface-muted  p-2 border border-surface-border ">
                              <div className="text-[10px] text-text-muted font-bold">数据版本</div>
                              <div className="text-xs font-black text-text-primary ">v{dbMeta.dataVersion}</div>
                          </div>
                      </div>
                      {ecosystemHints.length > 0 && (
                          <ul className="space-y-1 text-[11px] text-text-muted ">
                              {ecosystemHints.map((hint) => (
                                  <li key={hint} className="flex items-start gap-1.5">
                                      <span className="mt-1 inline-block h-1 w-1 rounded-full bg-accent"/>
                                      <span>{hint}</span>
                                  </li>
                              ))}
                          </ul>
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
          className="w-full p-4 bg-surface-card  border border-surface-border  rounded-2xl flex items-center justify-between hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-muted text-chart-tertiary rounded-xl">
              <Tags size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-text-primary ">标签管理</h3>
              <p className="text-xs text-text-muted ">重命名或合并 XP、事件标签</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
      </section>

      {isDevMode && (
        <section>
          <button
          onClick={() => { setIsSettingsOpen(false); setIsSimulationLabOpen(true); }}
          className="w-full p-4 bg-surface-card  border border-surface-border  rounded-2xl flex items-center justify-between hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-state-info-bg text-state-info-text rounded-xl">
              <FlaskConical size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-text-primary ">虚拟回测实验室</h3>
              <p className="text-xs text-text-muted ">仅供开发验证的合成人群回测工具</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
        </section>
      )}

              {/* 3. Snapshots */}
              <section>
                  <div className="flex justify-between items-end mb-3">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center"><Archive size={14} className="mr-1.5 text-state-info-text"/> 数据快照</h3>
                      <button onClick={onCreateSnapshot} className="text-[10px] bg-state-info-bg text-state-info-text px-2 py-1 rounded font-bold hover:bg-state-info-bg/80">+ 创建快照</button>
                  </div>
                  <div className="mb-3 rounded-2xl border border-surface-border bg-surface-card p-3 shadow-sm   space-y-3">
                      <div className="flex items-center justify-between gap-3">
                          <div>
                              <p className="text-sm font-bold text-text-primary ">idle 自动备份</p>
                              <p className="text-xs text-text-muted  mt-0.5">上次：{formatRelativeHours(dbMeta.lastAutoBackupAt)}</p>
                          </div>
                          <span className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={backupSchedule.enabled}
                                onChange={(event) => onChangeBackupSchedule({ ...backupSchedule, enabled: event.target.checked })}
                                className="sr-only peer"
                              />
                              <span className="w-11 h-6 bg-surface-border  rounded-full peer peer-checked:bg-accent transition-colors"></span>
                              <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-surface-card rounded-full transition-transform peer-checked:translate-x-5"></span>
                          </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <label className="block text-xs font-bold text-text-muted ">
                              自动间隔
                              <select
                                value={backupSchedule.intervalHours}
                                disabled={!backupSchedule.enabled}
                                onChange={(event) => onChangeBackupSchedule({ ...backupSchedule, intervalHours: Number(event.target.value) as AutoBackupIntervalHours })}
                                className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-muted px-3 text-sm font-black text-text-primary outline-none disabled:opacity-50   "
                              >
                                {AUTO_BACKUP_INTERVAL_HOUR_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option} 小时</option>
                                ))}
                              </select>
                          </label>
                          <label className="block text-xs font-bold text-text-muted ">
                              保留方式
                              <select
                                value={backupRetention.mode}
                                onChange={(event) => onChangeBackupRetention(event.target.value === 'size'
                                  ? { mode: 'size', autoSafetyMaxMB: 20 }
                                  : { mode: 'count', autoSafetyMaxCount: 7 })}
                                className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-muted px-3 text-sm font-black text-text-primary outline-none   "
                              >
                                <option value="count">按个数</option>
                                <option value="size">按容量</option>
                              </select>
                          </label>
                      </div>
                      {backupRetention.mode === 'count' ? (
                        <label className="block text-xs font-bold text-text-muted ">
                            自动快照保留数
                            <select
                              value={backupRetention.autoSafetyMaxCount}
                              onChange={(event) => onChangeBackupRetention({ mode: 'count', autoSafetyMaxCount: Number(event.target.value) as AutoSafetySnapshotLimit })}
                              className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-muted px-3 text-sm font-black text-text-primary outline-none   "
                            >
                              {AUTO_SAFETY_SNAPSHOT_LIMIT_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option} 个</option>
                              ))}
                            </select>
                        </label>
                      ) : (
                        <label className="block text-xs font-bold text-text-muted ">
                            自动快照容量上限
                            <select
                              value={backupRetention.autoSafetyMaxMB}
                              onChange={(event) => onChangeBackupRetention({ mode: 'size', autoSafetyMaxMB: Number(event.target.value) as AutoSafetySnapshotSizeLimitMB })}
                              className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-muted px-3 text-sm font-black text-text-primary outline-none   "
                            >
                              {AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_OPTIONS_MB.map((option) => (
                                <option key={option} value={option}>{option} MB</option>
                              ))}
                            </select>
                        </label>
                      )}
                      <p className="text-[11px] font-bold text-text-muted">修复、导入和文件恢复前的安全快照不受此开关影响。</p>
                  </div>
                  <div className="bg-surface-card  border border-surface-border  rounded-2xl p-1 max-h-40 overflow-y-auto custom-scrollbar">
                      {snapshots.length === 0 ? (
                          <div className="text-center py-6 text-xs text-text-muted">暂无快照，建议定期备份。</div>
                      ) : (
                          snapshots.map(snap => (
                              <div key={snap.id} className="flex items-center justify-between p-3 border-b border-surface-border  last:border-0 hover:bg-surface-muted dark:hover:bg-surface-muted rounded-xl group transition-colors">
                                  <div className="flex-1 min-w-0 pr-2">
                                      <div className="font-bold text-xs truncate text-text-primary ">
                                        {snap.description}
                                        {snap.kind === 'auto-safety' && <span className="ml-2 rounded-full bg-state-info-bg px-1.5 py-0.5 text-[9px] font-black text-state-info-text">自动</span>}
                                      </div>
                                      <div className="text-[10px] text-text-muted">{new Date(snap.timestamp).toLocaleString()} • v{snap.dataVersion}</div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => onRestoreSnapshot(snap.id!)} aria-label="还原快照" className="p-2 bg-state-info-bg text-state-info-text rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="还原"><RotateCcw size={14}/></button>
                                      <button onClick={() => onDeleteSnapshot(snap.id!)} aria-label="删除快照" className="p-2 bg-state-danger-bg text-state-danger-text rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="删除"><Trash2 size={14}/></button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  {snapshotFeedback && <p className="text-xs text-state-success-text text-center mt-2 animate-fade-in">{snapshotFeedback}</p>}
              </section>

              {/* 4. Import / Export */}
              <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">迁移与备份</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={onExportClick} className="flex flex-col items-center justify-center p-4 bg-surface-card  border border-surface-border  rounded-2xl hover:border-accent transition-colors">
                          <Share2 size={24} className="text-accent mb-2"/>
                          <span className="text-xs font-bold text-text-primary ">导出 JSON</span>
                      </button>
                      <button onClick={onEncryptedExportClick} className="flex flex-col items-center justify-center p-4 bg-surface-card  border border-surface-border  rounded-2xl hover:border-accent transition-colors">
                          <ShieldCheck size={24} className="text-state-success-text mb-2"/>
                          <span className="text-xs font-bold text-text-primary ">加密导出</span>
                      </button>
                      <button onClick={onCsvExportClick} className="flex flex-col items-center justify-center p-4 bg-surface-card  border border-surface-border  rounded-2xl hover:border-accent transition-colors">
                          <FileSpreadsheet size={24} className="text-state-success-text mb-2"/>
                          <span className="text-xs font-bold text-text-primary ">导出 CSV</span>
                      </button>
                      <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-4 bg-surface-card  border border-surface-border  rounded-2xl hover:border-accent transition-colors">
                          {importStatus === 'importing' ? <RotateCcw className="animate-spin text-accent mb-2" size={24}/> : <FolderInput size={24} className="text-accent mb-2"/>}
                          <span className="text-xs font-bold text-text-primary ">{importStatus === 'success' ? '导入成功' : '导入 JSON'}</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".json,.hdenc.json" className="hidden" />
                      
                      {canUseFileSystem && (
                          <button onClick={onFileSystemBackup} className="col-span-2 flex items-center justify-center p-3 bg-surface-muted  border border-surface-border  rounded-2xl text-xs font-bold text-text-secondary  hover:bg-surface-muted dark:hover:bg-surface-muted">
                              <Archive size={16} className="mr-2"/> 保存到本地文件系统
                          </button>
                      )}
                  </div>
              </section>

              {/* 5. Danger Zone */}
              <section>
                  <button onClick={() => setIsClearDataModalOpen(true)} className="w-full py-3 text-xs font-bold text-state-danger-text bg-state-danger-bg rounded-xl hover:bg-state-danger-bg/80 transition-colors">
                      清除所有数据
                  </button>
              </section>
              
              <div className="text-center text-[10px] text-text-muted pt-4">
                  Hardness Diary v{APP_VERSION} • Local Storage
              </div>
          </div>
      </Modal>
      
      {/* Tag Manager Modal */}
      <Suspense fallback={null}>
          <TagManager
            isOpen={isTagManagerOpen}
            onClose={() => setIsTagManagerOpen(false)}
            data={{
              logs,
              userTags
            }}
            actions={{
              onAddOrUpdateLog,
              onAddOrUpdateTag,
              onDeleteTag
            }}
          />
      </Suspense>

      <Modal
        isOpen={isSimulationLabOpen}
        onClose={() => setIsSimulationLabOpen(false)}
        title="虚拟回测实验室"
        footer={null}
      >
        <Suspense fallback={null}>
          <SimulationLabPanel />
        </Suspense>
      </Modal>

      <PinSetupModal
        isOpen={pinModalMode !== null}
        onClose={() => setPinModalMode(null)}
        mode={pinModalMode || 'enable'}
        currentPinHash={settings.appLock?.pinHash}
        currentPinSalt={settings.appLock?.pinSalt}
        onComplete={handlePinComplete}
      />

      <ImportPreviewModal
        preview={importPreview}
        status={importStatus}
        strategy={importStrategy}
        conflictResolution={importConflictResolution}
        onClose={onCancelImportPreview}
        onConfirm={onConfirmImport}
        onChangeStrategy={onChangeImportStrategy}
        onChangeConflictResolution={onChangeImportConflictResolution}
      />

      <ExportOptionsModal
        isOpen={isExportOptionsOpen}
        options={exportOptions}
        sourceCounts={exportSourceCounts}
        filteredCounts={exportFilteredCounts}
        tagOptions={exportTagOptions}
        isExporting={isExporting}
        encrypted={isEncryptedExport}
        onChange={onChangeExportOptions}
        onClose={onCloseExportOptions}
        onConfirm={onConfirmExport}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        dataVersion={dbMeta.dataVersion}
      />

      {/* Clear Data Confirmation */}
      <Modal isOpen={isClearDataModalOpen} onClose={() => { setIsClearDataModalOpen(false); setClearDataConfirmText(''); }} title="⚠️ 危险操作" footer={
          <div className="flex flex-col w-full gap-2">
              <button onClick={handleExportAndClear} disabled={!canConfirmClearData} className="w-full min-h-[44px] py-3 bg-accent text-text-on-accent font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">先备份，再清除 (推荐)</button>
              <button onClick={handleClearAnyway} disabled={!canConfirmClearData} className="w-full min-h-[44px] py-3 bg-transparent text-text-muted font-medium text-xs hover:text-state-danger-text disabled:opacity-40 disabled:cursor-not-allowed">不备份，直接清除</button>
          </div>
      }>
          <div className="text-center py-4 space-y-4">
              <AlertTriangle size={48} className="mx-auto text-state-danger-text" />
              <div>
                <p className="text-sm text-text-primary  font-bold mb-1">您确定要清除所有数据吗？</p>
                <p className="text-xs text-text-muted">此操作将删除所有日志、设置及伴侣档案，且<span className="text-state-danger-text font-bold">无法撤销</span>。</p>
              </div>
              <div className="bg-state-danger-bg border border-state-danger-text/20 p-3 rounded-lg text-left">
                  <label className="block text-xs font-bold text-state-danger-text mb-1">
                      请输入 "删除" 以解锁操作
                  </label>
                  <input
                      type="text"
                      value={clearDataConfirmText}
                      onChange={e => setClearDataConfirmText(e.target.value)}
                      placeholder="删除"
                      className="w-full min-h-[44px] bg-surface-card border border-state-danger-text/30 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-state-danger-text"
                  />
              </div>
          </div>
      </Modal>
    </>
  );
};

export default MyView;
