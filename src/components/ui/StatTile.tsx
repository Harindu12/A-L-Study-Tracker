import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatTileProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  bgColor?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ 
  icon: Icon, 
  value, 
  label, 
  iconColor = 'text-[var(--warn)]', 
  bgColor = 'bg-[#fffdf7]' 
}) => {
  return (
    <div className={`${bgColor} border border-[var(--line)] rounded-2xl p-4 flex flex-col gap-2 flex-1 shadow-sm`}>
      <div className={iconColor}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-2xl font-bold font-sans text-[var(--ink)] leading-tight">{value}</div>
        <div className="text-xs text-[var(--ink-soft)] font-sans font-medium">{label}</div>
      </div>
    </div>
  );
};
