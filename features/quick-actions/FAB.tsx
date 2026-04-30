
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
  const subButtonClass = "w-12 h-12 rounded-full flex items-center justify-center shadow-md mb-4 transition-all transform hover:scale-110 text-brand-text font-bold";

  return (
    <>
      <div className="fixed bottom-24 right-6 flex flex-col items-center z-50 pointer-events-none">
        <div className={`flex flex-col items-center mb-2 pointer-events-auto transition-all duration-200 origin-bottom ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
          {onAlcohol && (
              <button
                onClick={() => { onAlcohol(); setIsOpen(false); }}
                className={`${subButtonClass} ${isAlcoholOngoing ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-100 hover:bg-amber-200'} focus:ring-amber-300`}
                aria-label="记录饮酒"
              >
                <Beer size={20} className={isAlcoholOngoing ? "text-white" : "text-amber-600"}/>
              </button>
          )}
          <button onClick={() => { onExercise(); setIsOpen(false); }} className={`${subButtonClass} ${isExerciseOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-yellow-100'} focus:ring-yellow-300`}><Dumbbell size={20} className={isExerciseOngoing ? "text-white" : "text-yellow-600"} /></button>
          <button onClick={() => { onMasturbation(); setIsOpen(false); }} className={`${subButtonClass} ${isMbOngoing ? 'bg-blue-500 text-white animate-pulse' : 'bg-sky-100'} focus:ring-sky-300`}><Banana size={20} className={isMbOngoing ? "text-white" : "text-sky-600"} /></button>
          <button onClick={() => { onSex(); setIsOpen(false); }} className={`${subButtonClass} bg-pink-100 focus:ring-pink-300`}><Users size={20} className="text-pink-600" /></button>
          <button onClick={() => { onNap(); setIsOpen(false); }} className={`${subButtonClass} ${isNapOngoing ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-100'} focus:ring-orange-300`}><Sofa size={20} className={isNapOngoing ? "text-white" : "text-orange-600"}/></button>
          <button onClick={() => { onSleep(); setIsOpen(false); }} className={`${subButtonClass} ${isSleepPending ? 'bg-red-500 text-white' : 'bg-purple-100'} focus:ring-purple-300`}><Bed size={20} className={isSleepPending ? "text-white" : "text-purple-600"} /></button>
        </div>
        <button onClick={toggleOpen} className={`${baseButtonClass} ${isOpen ? 'bg-brand-text rotate-45' : 'bg-brand-accent'} pointer-events-auto`}><Plus size={32} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} /></button>
      </div>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default FAB;
