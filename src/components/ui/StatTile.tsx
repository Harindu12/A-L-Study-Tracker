import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatTileProps {
  icon?: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  iconColor?: string;
  bgColor?: string;
  onClick?: () => void;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ 
  icon: Icon, 
  value, 
  label, 
  sublabel,
  onClick,
  className = ''
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-[#EBEBEB] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between flex-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D4D4D4] transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {Icon && (
        <div className="text-[#1A1A1A] mb-2 flex items-center justify-between">
          <Icon size={18} strokeWidth={2.2} />
        </div>
      )}
      <div>
        <div className="text-2xl sm:text-[1.65rem] font-extrabold font-sans text-[#1A1A1A] tracking-tight leading-tight">
          {value}
        </div>
        <div className="text-xs text-[#8A8A8A] font-sans font-medium mt-1 leading-snug">
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] sm:text-xs text-[#8A8A8A] font-sans mt-0.5 font-normal truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
