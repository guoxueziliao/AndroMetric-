import React from 'react';

interface QualityScoreRingProps {
  score: number;
}

/**
 * LogForm 顶部的数据完整度评分圆环。0-100 的数值映射成可视化进度环。
 */
export const QualityScoreRing: React.FC<QualityScoreRingProps> = ({ score }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-orange-500 transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[9px] font-black text-slate-400 leading-none uppercase">质量</span>
        <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">{score}</span>
      </div>
    </div>
  );
};

export default QualityScoreRing;
