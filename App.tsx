import React from 'react';
import { Layout, Code2, Database, Palette } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 max-w-lg w-full animate-in fade-in zoom-in duration-500">
        
        {/* Logo/Icon Header */}
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center text-brand-accent mx-auto mb-8 shadow-inner border border-blue-100 dark:border-blue-900/30">
          <Layout size={48} strokeWidth={1.5} />
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-black text-brand-text dark:text-slate-100 mb-3 tracking-tight">
          项目已就绪
        </h1>
        <p className="text-brand-muted text-sm font-medium mb-10 leading-relaxed">
          「硬度日记」基础环境已成功初始化。
          <br />
          所有配置、类型定义与核心服务均已保留，您可以开始补充业务逻辑。
        </p>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 text-left flex items-center justify-between group hover:border-brand-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <Database size={18} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">数据层 (Dexie)</div>
                <div className="text-[10px] text-slate-400 font-bold">IndexedDB 数据库已连接</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 text-left flex items-center justify-between group hover:border-brand-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-brand-accent rounded-lg">
                <Palette size={18} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">样式引擎 (Tailwind)</div>
                <div className="text-[10px] text-slate-400 font-bold">JIT 模式与配色方案已生效</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 text-left flex items-center justify-between group hover:border-brand-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <Code2 size={18} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">开发语言 (TSX)</div>
                <div className="text-[10px] text-slate-400 font-bold">严格类型检查已开启</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          </div>
        </div>

        {/* Action Suggestion */}
        <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
           <p className="text-[11px] font-bold text-slate-400 italic">
             请在 App.tsx 中通过编辑来开始您的创作。
           </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 flex flex-col items-center gap-2 opacity-30 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Hardness Diary
        </p>
        <div className="h-px w-8 bg-slate-300 dark:bg-slate-700"></div>
        <p className="text-[9px] font-bold text-slate-400">v0.0.7-blank</p>
      </div>
    </div>
  );
};

export default App;
