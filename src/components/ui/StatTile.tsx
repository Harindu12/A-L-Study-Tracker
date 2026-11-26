import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatTileProps {
  icon?: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon: Icon,
  value,
  label,
  sublabel,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between flex-1 shadow-[0_1px_2px_rgba(24,23,21,0.03)] hover:border-[#CBC5B9] transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {Icon && (
        <div className="text-[#78716C] mb-2.5 flex items-center justify-between">
          <Icon size={17} strokeWidth={2} />
        </div>
      )}
      <div>
        <div className="text-2xl sm:text-[1.65rem] font-extrabold font-sans text-[#181715] tracking-tight leading-none tabular-nums">
          {value}
        </div>
        <div className="text-xs text-[#78716C] font-sans font-medium mt-1.5 leading-snug">
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] text-[#78716C] font-sans mt-0.5 font-normal truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
