import React from 'react';

interface CircularProgressProps {
  progress?: number;
  percentage?: number;
  centerText?: string;
  label?: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  progress, 
  percentage, 
  centerText,
  label, 
  subtitle,
  size = 90,
  strokeWidth = 8,
  onClick,
  className = ''
}) => {
  const actualProgress = Math.min(100, Math.max(0, progress ?? percentage ?? 0));
  const radius = (size / 2) - (strokeWidth / 2) - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualProgress / 100) * circumference;
  const isComplete = actualProgress >= 100;
  
  const strokeColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const trackColor = isComplete ? 'rgba(91, 130, 102, 0.15)' : 'var(--accent-soft)';

  return (
    <div 
      className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer group select-none' : ''} ${className}`}
      onClick={onClick}
    >
      <div 
        className={`relative flex items-center justify-center transition-transform duration-200 ${onClick ? 'group-hover:scale-105 group-active:scale-95' : ''}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            stroke={trackColor} 
            strokeWidth={strokeWidth} 
            fill="none" 
          />
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            stroke={strokeColor} 
            strokeWidth={strokeWidth} 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center px-1">
          <span 
            className={`font-bold font-sans leading-none ${isComplete ? 'text-[var(--ok)]' : 'text-[var(--ink)]'} ${centerText && centerText.length > 4 ? 'text-xs' : size < 70 ? 'text-sm' : 'text-lg'}`}
          >
            {centerText ?? `${actualProgress}%`}
          </span>
        </div>
      </div>
      {(label || subtitle) && (
        <div className="text-center">
          {label && (
            <div className={`text-[0.85rem] font-bold text-[var(--ink)] font-sans leading-tight text-center break-words max-w-[110px] ${onClick ? 'group-hover:text-[var(--accent)] transition-colors' : ''}`}>
              {label}
            </div>
          )}
          {subtitle && <div className="text-[0.75rem] text-[var(--ink-soft)] font-sans mt-0.5">{subtitle}</div>}
        </div>
      )}
    </div>
  );
};
