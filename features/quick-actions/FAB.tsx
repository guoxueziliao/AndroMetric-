
import React, { useState } from 'react';
import { Plus, Bed, Users, Banana, Dumbbell, Sofa, Beer } from 'lucide-react';

interface FABProps {
  onSleep: () => void;
  onSex: () => void;
  onMasturbation: () => void;
  onExercise: () => void;
  onNap: () => void;
  onAlcohol?: () => void;
  isSleepPending: boolean;
  isExerciseOngoing?: boolean;
  isNapOngoing?: boolean;
  isMbOngoing?: boolean;
  isAlcoholOngoing?: boolean;
}

const FAB: React.FC<FABProps> = ({ onSleep, onSex, onMasturbation, onExercise, onNap, onAlcohol, isSleepPending, isExerciseOngoing, isNapOngoing, isMbOngoing, isAlcoholOngoing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  const baseButtonClass = "w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const subButtonClass = "min-w-[56px] min-h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-md transition-all transform hover:scale-105 active:scale-95 text-brand-text font-bold";

  return (
    <>
      <div className="fixed bottom-24 right-6 flex flex-col items-end z-50 pointer-events-none">
        <div className={`mb-3 pointer-events-auto transition-all duration-200 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
          <div className="grid grid-cols-2 gap-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => { onSleep(); setIsOpen(false); }}
              aria-label={isSleepPending ? '取消睡眠' : '记录睡眠'}
              className={`${subButtonClass} ${isSleepPending ? 'bg-red-500 text-white' : 'bg-purple-100 dark:bg-purple-900/40'} focus:ring-purple-300`}
            >
              <Bed size={20} className={isSleepPending ? "text-white" : "text-purple-600 dark:text-purple-300"} />
              <span className="text-[10px] leading-none">{isSleepPending ? '取消' : '睡眠'}</span>
            </button>
            <button
              onClick={() => { onNap(); setIsOpen(false); }}
              aria-label={isNapOngoing ? '结束午休' : '开始午休'}
              className={`${subButtonClass} ${isNapOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-100 dark:bg-orange-900/40'} focus:ring-orange-300`}
            >
              <Sofa size={20} className={isNapOngoing ? "text-white" : "text-orange-600 dark:text-orange-300"}/>
              <span className="text-[10px] leading-none">{isNapOngoing ? '结束' : '午休'}</span>
            </button>
            <button
              onClick={() => { onSex(); setIsOpen(false); }}
              aria-label="记录性生活"
              className={`${subButtonClass} bg-pink-100 dark:bg-pink-900/40 focus:ring-pink-300`}
            >
              <Users size={20} className="text-pink-600 dark:text-pink-300" />
              <span className="text-[10px] leading-none">性生活</span>
            </button>
            <button
              onClick={() => { onMasturbation(); setIsOpen(false); }}
              aria-label={isMbOngoing ? '结束自慰' : '开始自慰'}
              className={`${subButtonClass} ${isMbOngoing ? 'bg-blue-500 text-white animate-pulse' : 'bg-sky-100 dark:bg-sky-900/40'} focus:ring-sky-300`}
            >
              <Banana size={20} className={isMbOngoing ? "text-white" : "text-sky-600 dark:text-sky-300"} />
              <span className="text-[10px] leading-none">{isMbOngoing ? '结束' : '自慰'}</span>
            </button>
            <button
              onClick={() => { onExercise(); setIsOpen(false); }}
              aria-label={isExerciseOngoing ? '结束运动' : '开始运动'}
              className={`${subButtonClass} ${isExerciseOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-yellow-100 dark:bg-yellow-900/40'} focus:ring-yellow-300`}
            >
              <Dumbbell size={20} className={isExerciseOngoing ? "text-white" : "text-yellow-600 dark:text-yellow-300"} />
              <span className="text-[10px] leading-none">{isExerciseOngoing ? '结束' : '运动'}</span>
            </button>
            {onAlcohol && (
              <button
                onClick={() => { onAlcohol(); setIsOpen(false); }}
                aria-label={isAlcoholOngoing ? '结束饮酒' : '记录饮酒'}
                className={`${subButtonClass} ${isAlcoholOngoing ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-100 dark:bg-amber-900/40'} focus:ring-amber-300`}
              >
                <Beer size={20} className={isAlcoholOngoing ? "text-white" : "text-amber-600 dark:text-amber-300"}/>
                <span className="text-[10px] leading-none">{isAlcoholOngoing ? '结束' : '饮酒'}</span>
              </button>
            )}
          </div>
        </div>
        <button
          onClick={toggleOpen}
          aria-label={isOpen ? '收起快捷记录' : '展开快捷记录'}
          aria-expanded={isOpen}
          className={`${baseButtonClass} ${isOpen ? 'bg-brand-text rotate-45' : 'bg-brand-accent'} pointer-events-auto`}
        >
          <Plus size={32} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default FAB;
