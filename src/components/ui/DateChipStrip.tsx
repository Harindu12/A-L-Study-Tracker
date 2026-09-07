import React, { useRef, useEffect } from 'react';
import { mondayOf, addDays } from '../../utils';

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
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1" ref={scrollRef}>
      {days.map(d => {
        const isSelected = d === currentDate;
        const dateObj = new Date(d);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = dateObj.getDate();
        
        return (
          <button
            key={d}
            onClick={() => onDateSelect(d)}
            className={`flex flex-col items-center justify-center min-w-[48px] py-2 rounded-2xl transition-colors
              ${isSelected ? 'bg-[var(--accent)] text-white shadow-md' : 'bg-transparent text-[var(--ink-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'}`}
          >
            <span className={`text-[0.65rem] font-sans font-bold uppercase tracking-wider ${isSelected ? 'opacity-90' : ''}`}>{dayName}</span>
            <span className={`text-lg font-sans font-bold leading-tight ${isSelected ? '' : 'text-[var(--ink)]'}`}>{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
};
