import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isOffline: boolean;
  canInstall: boolean;
  installPrompt: Event | null;
  swVersion: string;
  updateAvailable: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    isOffline: !navigator.onLine,
    canInstall: false,
    installPrompt: null,
    swVersion: '',
    updateAvailable: false,
    isAndroid: /Android/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });

        if (registration.active) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            if (event.data?.version) {
              setState(prev => ({ ...prev, swVersion: event.data.version }));
            }
          };
          registration.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
        }
      });
    }

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

  const updateApp = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      window.location.reload();
    }
  }, []);

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
    updateApp,
    requestNotificationPermission,
    scheduleNotification,
    registerPeriodicSync
  };
}

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  }
}
