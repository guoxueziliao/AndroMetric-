import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, RefreshCw, WifiOff, Share, PlusSquare } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { usePWA } from '../../hooks/usePWA';

const UPDATE_PROMPT_DISMISSED_KEY = 'pwa-update-dismissed-at';
const UPDATE_PROMPT_DEDUP_MS = 24 * 60 * 60 * 1000;

const getRecentlyDismissedUpdatePrompt = () => {
  const dismissedAt = localStorage.getItem(UPDATE_PROMPT_DISMISSED_KEY);
  if (!dismissedAt) return false;
  const dismissedTime = Number(dismissedAt);
  return Number.isFinite(dismissedTime) && Date.now() - dismissedTime < UPDATE_PROMPT_DEDUP_MS;
};

export const PWAInstallPrompt: React.FC = () => {
  const { isInstalled, canInstall, isOffline, installApp, isIOS, isSafari } = usePWA();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    if (installDismissed) {
      const dismissedTime = parseInt(installDismissed, 10);
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < weekInMs) {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if ((canInstall || (isIOS && isSafari)) && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed, isIOS, isSafari]);

  useEffect(() => {
    if (needRefresh && !getRecentlyDismissedUpdatePrompt()) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
    localStorage.setItem(UPDATE_PROMPT_DISMISSED_KEY, Date.now().toString());
  };

  return (
    <>
      {isInstalled && isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-state-warning-text text-text-on-accent text-center py-2 text-sm z-50 flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>离线模式 - 数据将在联网后同步</span>
        </div>
      )}

      {showUpdatePrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl border border-state-info-text/20 bg-surface-card p-4 shadow-2xl animate-in slide-in-from-bottom duration-slow">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-state-info-bg text-state-info-text">
              <RefreshCw size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-text-primary">新版本已就绪</h3>
              <p className="text-xs font-medium text-text-secondary">刷新后使用最新版本。</p>
            </div>
            <button
              onClick={handleDismissUpdate}
              aria-label="稍后提醒"
              className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-secondary"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDismissUpdate}
              className="flex-1 rounded-xl bg-surface-muted py-2.5 text-sm font-bold text-text-secondary"
            >
              稍后
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-text-on-accent"
            >
              刷新使用
            </button>
          </div>
        </div>
      )}

      {!isInstalled && showInstallPrompt && (
        <div className="fixed bottom-24 left-4 right-4 bg-surface-card rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-slow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-chart-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={24} className="text-text-on-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-text-primary">添加到主屏幕</h3>
                <button
                  onClick={handleDismiss}
                  aria-label="关闭安装提示"
                  className="p-1 hover:bg-surface-muted rounded-lg transition-colors"
                >
                  <X size={18} className="text-text-muted" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                {isIOS && isSafari
                  ? 'iOS 需要通过 Safari 分享菜单添加到主屏幕，安装后可全屏启动并离线使用。'
                  : '将&ldquo;硬度日记&rdquo;安装到主屏幕，随时随地快速记录，享受原生应用体验。'}
              </p>
              {isIOS && isSafari ? (
                <div className="mb-3 space-y-2 rounded-xl bg-surface-muted p-3 text-xs font-bold text-text-secondary">
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-text-on-accent text-[10px]">1</span>点击 Safari 底部 <Share size={14} className="text-accent" /> 分享按钮</div>
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-text-on-accent text-[10px]">2</span>选择 <PlusSquare size={14} className="text-accent" /> 添加到主屏幕</div>
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-text-on-accent text-[10px]">3</span>确认名称后点“添加”</div>
                </div>
              ) : null}
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-surface-muted text-text-secondary rounded-xl text-sm font-medium"
                >
                  暂不安装
                </button>
                {!isIOS || !isSafari ? (
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2.5 bg-accent text-text-on-accent rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    安装
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const InstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstalled, canInstall, installApp } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 text-state-success-text ${className}`}>
        <Smartphone size={18} />
        <span className="text-sm font-medium">已安装</span>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`flex items-center gap-2 bg-accent text-text-on-accent px-4 py-2 rounded-xl font-medium transition-all hover:bg-accent/90 disabled:opacity-50 ${className}`}
    >
      {isInstalling ? (
        <div className="w-5 h-5 border-2 border-text-on-accent/30 border-t-text-on-accent rounded-full animate-spin" />
      ) : (
        <Download size={18} />
      )}
      <span>安装应用</span>
    </button>
  );
};

export default PWAInstallPrompt;
