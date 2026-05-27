
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
  const baseButtonClass = "w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-text-on-accent transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-base";
  const subButtonClass = "min-w-[56px] min-h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-md transition-all transform hover:scale-105 active:scale-95 text-text-primary font-bold";

  return (
    <>
      <div className="fixed bottom-24 right-6 flex flex-col items-end z-50 pointer-events-none">
        <div className={`mb-3 pointer-events-auto transition-all duration-normal origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
          <div className="grid grid-cols-2 gap-2 p-2 bg-surface-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-border/50">
            <button
              onClick={() => { onSleep(); setIsOpen(false); }}
              aria-label={isSleepPending ? '取消睡眠' : '记录睡眠'}
              className={`${subButtonClass} ${isSleepPending ? 'bg-state-danger-text text-text-on-accent' : 'bg-chart-tertiary/15 text-chart-tertiary'} focus:ring-chart-tertiary/40`}
            >
              <Bed size={20} className={isSleepPending ? "text-text-on-accent" : "text-chart-tertiary"} />
              <span className="text-[10px] leading-none">{isSleepPending ? '取消' : '睡眠'}</span>
            </button>
            <button
              onClick={() => { onNap(); setIsOpen(false); }}
              aria-label={isNapOngoing ? '结束午休' : '开始午休'}
              className={`${subButtonClass} ${isNapOngoing ? 'bg-state-warning-text text-text-on-accent animate-pulse' : 'bg-state-warning-bg text-state-warning-text'} focus:ring-state-warning-text/40`}
            >
              <Sofa size={20} className={isNapOngoing ? "text-text-on-accent" : "text-state-warning-text"}/>
              <span className="text-[10px] leading-none">{isNapOngoing ? '结束' : '午休'}</span>
            </button>
            <button
              onClick={() => { onSex(); setIsOpen(false); }}
              aria-label="记录性生活"
              className={`${subButtonClass} bg-accent-vivid/15 text-accent-vivid focus:ring-accent-vivid/40`}
            >
              <Users size={20} className="text-accent-vivid" />
              <span className="text-[10px] leading-none">性生活</span>
            </button>
            <button
              onClick={() => { onMasturbation(); setIsOpen(false); }}
              aria-label={isMbOngoing ? '结束自慰' : '开始自慰'}
              className={`${subButtonClass} ${isMbOngoing ? 'bg-state-info-text text-text-on-accent animate-pulse' : 'bg-state-info-bg text-state-info-text'} focus:ring-state-info-text/40`}
            >
              <Banana size={20} className={isMbOngoing ? "text-text-on-accent" : "text-state-info-text"} />
              <span className="text-[10px] leading-none">{isMbOngoing ? '结束' : '自慰'}</span>
            </button>
            <button
              onClick={() => { onExercise(); setIsOpen(false); }}
              aria-label={isExerciseOngoing ? '结束运动' : '开始运动'}
              className={`${subButtonClass} ${isExerciseOngoing ? 'bg-state-success-text text-text-on-accent animate-pulse' : 'bg-state-success-bg text-state-success-text'} focus:ring-state-success-text/40`}
            >
              <Dumbbell size={20} className={isExerciseOngoing ? "text-text-on-accent" : "text-state-success-text"} />
              <span className="text-[10px] leading-none">{isExerciseOngoing ? '结束' : '运动'}</span>
            </button>
            {onAlcohol && (
              <button
                onClick={() => { onAlcohol(); setIsOpen(false); }}
                aria-label={isAlcoholOngoing ? '结束饮酒' : '记录饮酒'}
                className={`${subButtonClass} ${isAlcoholOngoing ? 'bg-state-warning-text text-text-on-accent animate-pulse' : 'bg-state-warning-bg text-state-warning-text'} focus:ring-state-warning-text/40`}
              >
                <Beer size={20} className={isAlcoholOngoing ? "text-text-on-accent" : "text-state-warning-text"}/>
                <span className="text-[10px] leading-none">{isAlcoholOngoing ? '结束' : '饮酒'}</span>
              </button>
            )}
          </div>
        </div>
        <button
          onClick={toggleOpen}
          aria-label={isOpen ? '收起快捷记录' : '展开快捷记录'}
          aria-expanded={isOpen}
          className={`${baseButtonClass} ${isOpen ? 'bg-surface-inverted rotate-45' : 'bg-accent'} pointer-events-auto`}
        >
          <Plus size={32} className={`transition-transform duration-normal ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
      {isOpen && <div className="fixed inset-0 z-40 bg-overlay-scrim/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default FAB;
