import React, { useRef } from 'react';
import { mondayOf, addDays, parseLocalDate } from '../../utils';

interface DateChipStripProps {
  currentDate: string;
  onDateSelect: (d: string) => void;
}

export const DateChipStrip: React.FC<DateChipStripProps> = ({ currentDate, onDateSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Always center on the current date week
  const monday = mondayOf(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="flex gap-1.5 justify-between items-center py-2 px-0.5" ref={scrollRef}>
      {days.map((d) => {
        const isSelected = d === currentDate;
        const dateObj = parseLocalDate(d);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = dateObj.getDate();
        
        return (
          <button
            key={d}
            onClick={() => onDateSelect(d)}
            className={`flex flex-col items-center justify-center flex-1 py-2.5 px-1 rounded-2xl transition-all cursor-pointer select-none
              ${isSelected 
                ? 'bg-[#111111] text-[#FFFFFF] shadow-sm scale-102 font-bold' 
                : 'bg-transparent text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F0F0F0]'}`}
          >
            <span className={`text-[0.68rem] font-sans font-medium uppercase tracking-wider ${isSelected ? 'text-[#FFFFFF]/80' : 'text-[#8A8A8A]'}`}>
              {dayName}
            </span>
            <span className={`text-base font-sans font-bold leading-tight mt-0.5 ${isSelected ? 'text-[#FFFFFF]' : 'text-[#111111]'}`}>
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
};
