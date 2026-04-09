import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, RefreshCw, WifiOff } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import Modal from './Modal';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstalled, canInstall, isOffline, installApp, updateAvailable, updateApp } = usePWA();
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
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed]);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [updateAvailable]);

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
    updateApp();
  };

  if (isInstalled) {
    return (
      <>
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm z-50 flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span>离线模式 - 数据将在联网后同步</span>
          </div>
        )}

        <Modal
          isOpen={showUpdatePrompt}
          onClose={() => setShowUpdatePrompt(false)}
          title="发现新版本"
          footer={
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                稍后更新
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                立即更新
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <RefreshCw size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-center text-slate-600 dark:text-slate-400">
              新版本已准备就绪，更新后将获得更好的体验和功能。
            </p>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      {showInstallPrompt && (
        <div className="fixed bottom-24 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white">添加到主屏幕</h3>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                将"硬度日记"安装到主屏幕，随时随地快速记录，享受原生应用体验。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium"
                >
                  暂不安装
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  安装
                </button>
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
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
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
      className={`flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl font-medium transition-all hover:bg-blue-600 disabled:opacity-50 ${className}`}
    >
      {isInstalling ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Download size={18} />
      )}
      <span>安装应用</span>
    </button>
  );
};

export default PWAInstallPrompt;
