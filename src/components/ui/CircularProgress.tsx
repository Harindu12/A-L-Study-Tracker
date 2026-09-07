import React from 'react';

interface CircularProgressProps {
  progress: number;
  label: string;
  subtitle?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ progress, label, subtitle }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center w-[90px] h-[90px]">
        <svg width="90" height="90" className="-rotate-90">
          <circle cx="45" cy="45" r={radius} stroke="var(--accent-soft)" strokeWidth="8" fill="none" />
          <circle 
            cx="45" cy="45" r={radius} 
            stroke="var(--accent)" 
            strokeWidth="8" 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-bold text-xl text-[var(--ink)] font-sans leading-none">{progress}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[0.95rem] font-bold text-[var(--ink)] font-sans leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{label}</div>
        {subtitle && <div className="text-[0.75rem] text-[var(--ink-soft)] font-sans mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
};
