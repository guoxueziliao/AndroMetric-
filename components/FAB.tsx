
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
  isAlcoholOngoing?: boolean; // New prop
}

const FAB: React.FC<FABProps> = ({ onSleep, onSex, onMasturbation, onExercise, onNap, onAlcohol, isSleepPending, isExerciseOngoing, isNapOngoing, isMbOngoing, isAlcoholOngoing }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const baseButtonClass = "w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const subButtonClass = "w-12 h-12 rounded-full flex items-center justify-center shadow-md mb-4 transition-all transform hover:scale-110 text-brand-text font-bold";

  return (
    <>
      <div className="fixed bottom-24 right-6 flex flex-col items-center z-50 pointer-events-none">
        {/* Sub Buttons Container - pointer-events-auto allows clicking them while container passes through clicks when empty */}
        <div className={`flex flex-col items-center mb-2 pointer-events-auto transition-all duration-200 origin-bottom ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
          
          {/* Group 3: Lifestyle (Top) */}
          {onAlcohol && (
              <button
                onClick={() => { onAlcohol(); setIsOpen(false); }}
                className={`${subButtonClass} ${isAlcoholOngoing ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-100 hover:bg-amber-200'} focus:ring-amber-300`}
                aria-label={isAlcoholOngoing ? "饮酒中" : "记录饮酒"}
                title={isAlcoholOngoing ? "饮酒中" : "记录饮酒"}
              >
                <Beer size={20} className={isAlcoholOngoing ? "text-white" : "text-amber-600"}/>
              </button>
          )}

          <button
            onClick={() => { onExercise(); setIsOpen(false); }}
            className={`${subButtonClass} ${isExerciseOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-yellow-100 hover:bg-yellow-200'} focus:ring-yellow-300`}
            aria-label="记录运动"
            title="记录运动"
          >
            <Dumbbell size={20} className={isExerciseOngoing ? "text-white" : "text-yellow-600"} />
          </button>

          {/* Group 2: Sexual Activity (Middle) */}
          <button
            onClick={() => { onMasturbation(); setIsOpen(false); }}
            className={`${subButtonClass} ${isMbOngoing ? 'bg-blue-500 text-white animate-pulse' : 'bg-sky-100 hover:bg-sky-200'} focus:ring-sky-300`}
            aria-label={isMbOngoing ? "结束自慰" : "记录自慰"}
            title={isMbOngoing ? "结束自慰" : "记录自慰"}
          >
            <Banana size={20} className={isMbOngoing ? "text-white" : "text-sky-600"} />
          </button>
          
          <button
            onClick={() => { onSex(); setIsOpen(false); }}
            className={`${subButtonClass} bg-pink-100 hover:bg-pink-200 focus:ring-pink-300`}
            aria-label="记录性爱"
            title="记录性爱"
          >
            <Users size={20} className="text-pink-600" />
          </button>
          
          {/* Group 1: Rest (Bottom - Most accessible) */}
          <button
            onClick={() => { onNap(); setIsOpen(false); }}
            className={`${subButtonClass} ${isNapOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-100 hover:bg-orange-200'} focus:ring-orange-300`}
            aria-label={isNapOngoing ? "结束午休" : "开始午休"}
            title={isNapOngoing ? "结束午休" : "开始午休"}
          >
            <Sofa size={20} className={isNapOngoing ? "text-white" : "text-orange-600"}/>
          </button>

          <button
            onClick={() => { onSleep(); setIsOpen(false); }}
            className={`${subButtonClass} ${isSleepPending ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-100 hover:bg-purple-200'} focus:ring-purple-300`}
            aria-label={isSleepPending ? '取消睡眠' : '记录睡眠'}
            title={isSleepPending ? '取消睡眠' : '记录睡眠'}
          >
            <Bed size={20} className={isSleepPending ? "text-white" : "text-purple-600"} />
          </button>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={toggleOpen}
          className={`${baseButtonClass} ${isOpen ? 'bg-brand-text rotate-45' : 'bg-brand-accent'} pointer-events-auto`}
          aria-label="快速记录"
        >
          <Plus size={32} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {/* Backdrop to close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FAB;
