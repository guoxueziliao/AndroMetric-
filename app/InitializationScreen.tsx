import React from 'react';
import { Database } from 'lucide-react';

const InitializationScreen: React.FC = () => (
  <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col items-center justify-center">
    <div className="relative w-20 h-20 mb-6">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent animate-spin" />
      <Database className="absolute inset-0 m-auto text-brand-accent" size={32} />
    </div>
    <h2 className="text-xl font-bold text-brand-text dark:text-slate-200 mb-2">正在升级数据库</h2>
  </div>
);

export default InitializationScreen;
