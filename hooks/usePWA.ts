import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isOffline: boolean;
  canInstall: boolean;
  installPrompt: Event | null;
  isAndroid: boolean;
  isIOS: boolean;
  isSafari: boolean;
}

export function usePWA() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(userAgent);

  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    isOffline: !navigator.onLine,
    canInstall: false,
    installPrompt: null,
    isAndroid: /Android/i.test(userAgent),
    isIOS,
    isSafari
  });

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setState(prev => ({ ...prev, isStandalone: standalone, isInstalled: standalone }));
    };

    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({ ...prev, canInstall: true, installPrompt: e }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isStandalone: true,
        canInstall: false,
        installPrompt: null
      }));
    };

    checkStandalone();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!state.installPrompt) return false;

    const promptEvent = state.installPrompt as any;
    promptEvent.prompt();

    const result = await promptEvent.userChoice;
    setState(prev => ({ ...prev, canInstall: false, installPrompt: null }));

    return result.outcome === 'accepted';
  }, [state.installPrompt]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const scheduleNotification = useCallback((title: string, options?: NotificationOptions, delay?: number) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    if (delay) {
      setTimeout(() => {
        new Notification(title, options);
      }, delay);
    } else {
      new Notification(title, options);
    }
  }, []);

  const registerPeriodicSync = useCallback(async (tag: string, minInterval: number) => {
    if (!('serviceWorker' in navigator) || !('periodicSync' in (await navigator.serviceWorker.ready))) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register(tag, { minInterval });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    installApp,
    requestNotificationPermission,
    scheduleNotification,
    registerPeriodicSync
  };
}
