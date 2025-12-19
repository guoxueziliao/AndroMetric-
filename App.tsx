
import React, { useState, useEffect } from 'react';
import { AppSettings } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Database, Layout, Settings as SettingsIcon } from 'lucide-react';

const APP_VERSION = '0.0.6';

const defaultSettings: AppSettings = {
  version: APP_VERSION,
  theme: 'system',
  privacyMode: false,
  enableNotifications: false,
  notificationTime: { morning: '08:00', evening: '23:00' },
  hiddenFields: []
};

const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (settings.theme === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200 transition-colors duration-500">
      <div className="container mx-auto max-w-lg p-6">
        <header className="flex justify-between items-center mb-10 pt-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">硬度日记</h1>
            <p className="text-brand-muted text-sm font-medium">v{APP_VERSION} · 空白模板</p>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
              <Database size={20} className="text-brand-accent"/>
            </button>
            <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
              <SettingsIcon size={20} className="text-brand-muted"/>
            </button>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center text-brand-accent animate-pulse">
            <Layout size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">准备就绪</h2>
            <p className="text-sm text-brand-muted max-w-xs mx-auto">
              项目已初始化为 v0.0.6 版本。您可以开始在 <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-pink-500 font-mono">App.tsx</code> 中补充您的代码逻辑了。
            </p>
          </div>
          
          <button 
            onClick={() => alert('代码补充后即可使用')}
            className="px-8 py-4 bg-brand-accent text-white font-black rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            开始构建功能
          </button>
        </main>
      </div>
    </div>
  );
};

export default App;
