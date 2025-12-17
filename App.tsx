
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-20">
        <div className="max-w-lg mx-auto">
           {/* 顶部工具栏 */}
           <div className="flex justify-end mb-4">
             <button 
               onClick={() => setIsDark(!isDark)}
               className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm"
             >
               {isDark ? '🌙' : '☀️'}
             </button>
           </div>
           
           <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default App;
