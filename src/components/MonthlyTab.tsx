import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../utils';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface MonthlyTabProps {
  onDayClick: (date: string) => void;
}

export const MonthlyTab: React.FC<MonthlyTabProps> = ({ onDayClick }) => {
  const { dailyEntries, subjects, revisits } = useStore();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());

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
  
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const toDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const selectedEntry = dailyEntries[selectedDate];
  const selectedDateObj = new Date(selectedDate);
  const selectedDateHeading = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const getSubjectColor = (subjectId: string) => {
    const colors = ['bg-[#8B6F9E]', 'bg-[#d27575]', 'bg-[#639c89]', 'bg-[#dfa145]', 'bg-[#6a87b8]', 'bg-[#b67a9f]'];
    const idx = subjects.findIndex(s => s.id === subjectId);
    return idx >= 0 ? colors[idx % colors.length] : 'bg-[var(--ink-soft)]';
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="card !mb-0 border border-[var(--line)] shadow-sm">
        <div className="flex justify-between items-center mb-6 px-2 pt-2">
          <button onClick={prevMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <h2 className="font-caveat text-3xl font-bold text-[var(--accent)] m-0">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[0.65rem] font-sans font-bold text-[var(--ink-soft)] uppercase pb-2">
              {d}
            </div>
          ))}
          
          {days.map((dayObj, i) => {
            const dateStr = toDateString(dayObj.date);
            const isToday = dateStr === todayStr();
            const isSelected = dateStr === selectedDate;
            const entry = dailyEntries[dateStr];
            
            const studiedSubjects = entry ? entry.subjects.filter(s => s.studied || s.pastPaper) : [];
            const hasRevisit = revisits.some(r => r.date === dateStr && !r.done);
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(dateStr)}
                className="flex flex-col items-center justify-start h-[44px] cursor-pointer"
              >
                <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all
                  ${!dayObj.isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'}
                  ${isToday && !isSelected ? 'ring-1 ring-[var(--accent)] text-[var(--accent)] font-bold' : ''}
                `}>
                  <span className={`font-sans text-[0.85rem] ${isSelected ? 'font-bold' : 'font-medium'}`}>
                    {dayObj.date.getDate()}
                  </span>
                </div>
                
                {/* Dots under the date */}
                <div className="flex gap-1 mt-1 px-1 justify-center w-full max-w-[32px] flex-wrap">
                  {hasRevisit && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] shadow-sm"></div>
                  )}
                  {studiedSubjects.slice(0, 3).map((s, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getSubjectColor(s.subjectId)} opacity-80`}></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda View */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-sans font-bold text-[0.85rem] text-[var(--ink-soft)] uppercase tracking-wider">{selectedDateHeading}</h3>
          <button 
            onClick={() => onDayClick(selectedDate)}
            className="text-[var(--accent)] text-xs font-sans font-bold flex items-center gap-1 hover:underline"
          >
            View full day <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {(!selectedEntry || (selectedEntry.hours.length === 0 && selectedEntry.subjects.length === 0)) ? (
            <div className="bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-6 text-center text-[var(--ink-soft)] text-sm font-sans italic shadow-sm">
              No entries logged for this day.
            </div>
          ) : (
            <>
              {selectedEntry.hours.filter(h => h.task).map(h => (
                <div key={h.id} className="bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${h.done ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`}></div>
                    <span className={`font-sans font-bold text-[0.9rem] text-[var(--ink)] ${h.done ? 'line-through opacity-60' : ''}`}>{h.task}</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <span className="text-[0.7rem] font-sans text-[var(--ink-soft)] font-medium border border-[var(--line)] rounded-md px-1.5 py-0.5">{h.time}</span>
                  </div>
                </div>
              ))}
              
              {selectedEntry.subjects.map(s => {
                const subj = subjects.find(x => x.id === s.subjectId);
                if (!subj) return null;
                return (
                  <div key={s.id} className="bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getSubjectColor(s.subjectId)}`}></div>
                      <span className="font-sans font-bold text-[0.9rem] text-[var(--ink)]">{subj.name}</span>
                    </div>
                    <div className="flex items-center ml-4 gap-2">
                      <span className="text-[0.7rem] font-sans text-[var(--ink-soft)] font-medium">Logged study</span>
                      {s.pastPaper && <span className="tag !text-[0.6rem] !py-0.5">Past paper</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
