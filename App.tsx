
import React from 'react';
import { Layout, Rocket, Code, Smartphone } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-white/5 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600 dark:text-blue-400">
          <Rocket size={40} />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight mb-4">
          项目已准备就绪
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
          空白项目模板已创建。你可以开始在 <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">App.tsx</code> 中编写你的代码了。
        </p>

        <div className="grid grid-cols-1 gap-4 text-left">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
              <Code size={18} className="text-indigo-500" />
            </div>
            <span className="text-sm font-bold">TypeScript + React 18</span>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
              <Layout size={18} className="text-emerald-500" />
            </div>
            <span className="text-sm font-bold">Tailwind CSS (JIT)</span>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
              <Smartphone size={18} className="text-orange-500" />
            </div>
            <span className="text-sm font-bold">PWA 支持已就绪</span>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Ready for your brilliance
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
