import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyTabProps {
  onDayClick: (date: string) => void;
}

export const MonthlyTab: React.FC<MonthlyTabProps> = ({ onDayClick }) => {
  const { dailyEntries, subjects, revisits } = useStore();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calendar Logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay(); // 0 is Sunday
  
  const days = [];
  
  // Pad previous month
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }
  
  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Pad next month
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const toDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6 px-2 pt-2">
        <button onClick={prevMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h2 className="font-caveat text-3xl font-bold text-[var(--accent)] m-0">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
          <ChevronRight size={26} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[0.65rem] md:text-xs font-sans font-bold text-[var(--ink-soft)] uppercase pb-2">
            {d}
          </div>
        ))}
        
        {days.map((dayObj, i) => {
          const dateStr = toDateString(dayObj.date);
          const isToday = dateStr === todayStr();
          const entry = dailyEntries[dateStr];
          
          const studied = entry ? entry.subjects.filter(s => s.studied || s.pastPaper).map(s => {
            const sub = subjects.find(x => x.id === s.subjectId);
            return sub ? sub.name.substring(0, 2).toUpperCase() : '?';
          }) : [];
          
          const hasRevisit = revisits.some(r => r.date === dateStr && !r.done);
          
          return (
            <div 
              key={i} 
              onClick={() => onDayClick(dateStr)}
              className={`min-h-[64px] md:min-h-[76px] p-1 rounded-[14px] flex flex-col items-center relative cursor-pointer transition-all active:scale-95
                ${!dayObj.isCurrentMonth ? 'opacity-40 bg-transparent' : 'bg-[#fffdf7] border border-[var(--line)] shadow-sm hover:border-[var(--accent)] hover:shadow-md'}
                ${isToday ? 'ring-2 ring-[var(--accent)] ring-inset shadow-md' : ''}
              `}
            >
              <span className={`font-sans text-xs md:text-sm font-bold ${isToday ? 'text-[var(--accent)] mt-0.5' : 'text-[var(--ink)] mt-0.5'}`}>
                {dayObj.date.getDate()}
              </span>

              {hasRevisit && (
                <div className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full bg-[var(--warn)] shadow-sm"></div>
              )}

              <div className="mt-auto flex gap-0.5 md:gap-1 justify-center flex-wrap w-full pb-0.5">
                {studied.map((abbr, idx) => (
                  <span key={idx} className="text-[8px] md:text-[10px] font-sans font-bold bg-[var(--accent-soft)] text-[var(--accent)] px-1 py-[1px] rounded-[4px] leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {abbr}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
