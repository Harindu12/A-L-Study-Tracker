import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { DailyEntry, DailySubjectLog } from '../types';
import { todayStr, uid, addDays } from '../utils';
import { DateChipStrip } from './ui/DateChipStrip';
import { Sun, CloudSun, Moon, BookOpen, AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';

export const CalendarTab = () => {
  const { dailyEntries, updateDailyEntry, subjects, lessons, revisits, updateRevisit } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [saveMsg, setSaveMsg] = useState('');
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [modalMonth, setModalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const entry: DailyEntry = dailyEntries[selectedDate] || {
    date: selectedDate,
    hours: [],
    subjects: [],
    teachback: '',
    notes: ''
  };

  const updateEntry = (updates: Partial<DailyEntry>) => {
    updateDailyEntry(selectedDate, { ...entry, ...updates });
  };

  const handleSave = () => {
    setSaveMsg('Saved ✓');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addSubjectLog = () => {
    updateEntry({
      subjects: [...entry.subjects, { id: uid(), subjectId: '', lessonId: '', studied: false, pastPaper: false, confidence: 'M' }]
    });
  };

  const updateSubjectLog = (logId: string, updates: Partial<DailySubjectLog>) => {
    updateEntry({
      subjects: entry.subjects.map(s => s.id === logId ? { ...s, ...updates } : s)
    });
  };

  const getSubjectColor = (subjectId: string) => {
    const colors = ['bg-[#8B6F9E]', 'bg-[#d27575]', 'bg-[#639c89]', 'bg-[#dfa145]', 'bg-[#6a87b8]', 'bg-[#b67a9f]'];
    const idx = subjects.findIndex(s => s.id === subjectId);
    return idx >= 0 ? colors[idx % colors.length] : 'bg-[var(--ink-soft)]';
  };

  const dueRevisits = revisits.filter(r => r.date === selectedDate);

  // Time groupings
  const parseTime = (timeStr: string) => {
    const m = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
    if (!m) return 12; // default
    let h = parseInt(m[1], 10);
    const pm = m[3].toLowerCase() === 'pm';
    if (h === 12 && !pm) h = 0;
    if (h < 12 && pm) h += 12;
    return h;
  };

  const morningTasks = entry.hours.filter(h => {
    if (h.time === 'custom') return false;
    const hour = parseTime(h.time);
    return hour >= 5 && hour < 12;
  });

  const afternoonTasks = entry.hours.filter(h => {
    if (h.time === 'custom') return false;
    const hour = parseTime(h.time);
    return hour >= 12 && hour < 17;
  });

  const eveningTasks = entry.hours.filter(h => {
    if (h.time === 'custom') return true; // custom goes to evening for now
    const hour = parseTime(h.time);
    return hour >= 17 || hour < 5;
  });

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 50) setSelectedDate(addDays(selectedDate, 1));
    if (distance < -50) setSelectedDate(addDays(selectedDate, -1));
    setTouchStart(null);
  };

  // Month Modal Logic
  const prevMonth = () => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() - 1, 1));
  const nextMonth = () => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() + 1, 1));
  
  const renderMonthGrid = () => {
    const year = modalMonth.getFullYear();
    const month = modalMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    const toDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return (
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
          const dayEntry = dailyEntries[dateStr];
          
          const studiedSubjects = dayEntry ? dayEntry.subjects.filter(s => s.studied || s.pastPaper) : [];
          const hasRevisit = revisits.some(r => r.date === dateStr && !r.done);

          return (
            <div 
              key={i} 
              onClick={() => {
                setSelectedDate(dateStr);
                setIsMonthModalOpen(false);
              }}
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
              
              <div className="flex gap-1 mt-1 px-1 justify-center w-full max-w-[32px] flex-wrap">
                {hasRevisit && <div className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] shadow-sm"></div>}
                {studiedSubjects.slice(0, 3).map((s, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getSubjectColor(s.subjectId)} opacity-80`}></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTaskGroup = (title: string, icon: React.ReactNode, tasks: any[]) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          {icon}
          <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex flex-col gap-3 relative before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--line)] before:z-0">
          {tasks.map((h, i) => (
            <div key={h.id || i} className="flex gap-4 items-start relative z-10 group">
              <div className="w-[40px] pt-3 text-right">
                <span className="text-[0.65rem] font-sans font-bold text-[var(--ink-soft)] uppercase tracking-tight">{h.time.replace(':00', '')}</span>
              </div>
              <div className="w-[12px] pt-[15px] flex justify-center relative">
                <div className={`w-[10px] h-[10px] rounded-full border-2 ${h.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-white border-[var(--line)] group-hover:border-[var(--accent)]'} transition-colors z-10`} />
              </div>
              <div className={`flex-1 bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 shadow-sm transition-all hover:shadow-md ${h.done ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <input 
                      type="checkbox" 
                      checked={h.done} 
                      onChange={(e) => updateEntry({ hours: entry.hours.map(x => x.id === h.id ? { ...x, done: e.target.checked } : x) })}
                      className="mt-0.5 w-4 h-4 rounded-full border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <input 
                      type="text"
                      value={h.task}
                      onChange={(e) => updateEntry({ hours: entry.hours.map(x => x.id === h.id ? { ...x, task: e.target.value } : x) })}
                      placeholder="What are you doing?"
                      className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-[0.95rem] font-sans font-medium text-[var(--ink)] placeholder-[var(--ink-soft)] ${h.done ? 'line-through' : ''}`}
                    />
                  </div>
                  {h.time === 'custom' && (
                    <div className="ml-6">
                      <input 
                        type="text"
                        value={h.time}
                        onChange={(e) => updateEntry({ hours: entry.hours.map(x => x.id === h.id ? { ...x, time: e.target.value } : x) })}
                        className="!bg-[var(--paper)] !border !border-[var(--line)] !rounded-lg !text-[0.65rem] !font-sans !font-bold !text-[var(--ink-soft)] !px-1.5 !py-0.5 !w-[60px] !h-auto focus:!border-[var(--accent)]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col gap-4 pb-24 h-full"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header and Nav */}
      <div className="card !mb-0 border border-[var(--line)] shadow-sm sticky top-0 z-30 !pt-3 !pb-3 bg-white/95 backdrop-blur-md">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-caveat text-3xl font-bold text-[var(--accent)] m-0">Agenda</h2>
          <button 
            onClick={() => setIsMonthModalOpen(true)} 
            className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors flex items-center gap-2"
          >
            <CalendarIcon size={24} strokeWidth={2.5} />
          </button>
        </div>
        
        <DateChipStrip currentDate={selectedDate} onDateSelect={setSelectedDate} />

        {/* Quick Stat Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-full px-3 py-1.5 flex-shrink-0">
            <CheckCircle2 size={14} className="text-[var(--ink-soft)]" />
            <span className="text-[0.75rem] font-sans font-bold text-[var(--ink)]">{entry.hours.filter(h => h.done).length} tasks done</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-full px-3 py-1.5 flex-shrink-0">
            <BookOpen size={14} className="text-[var(--ink-soft)]" />
            <span className="text-[0.75rem] font-sans font-bold text-[var(--ink)]">{entry.subjects.length} subjects logged</span>
          </div>
          {dueRevisits.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#fffdf7] border border-[var(--accent-line)]/50 rounded-full px-3 py-1.5 flex-shrink-0">
              <AlertCircle size={14} className="text-[var(--warn)]" />
              <span className="text-[0.75rem] font-sans font-bold text-[var(--warn)]">{dueRevisits.length} revisits due</span>
            </div>
          )}
        </div>
      </div>

      {/* Agenda Content */}
      <div className="flex flex-col gap-2 mt-2 px-1">
        {renderTaskGroup("Morning", <Sun size={16} className="text-[#dfa145] opacity-90" strokeWidth={2.5} />, morningTasks)}
        {renderTaskGroup("Afternoon", <CloudSun size={16} className="text-[#d27575] opacity-90" strokeWidth={2.5} />, afternoonTasks)}
        {renderTaskGroup("Evening", <Moon size={16} className="text-[#8B6F9E] opacity-90" strokeWidth={2.5} />, eveningTasks)}
        
        <div className="pl-12 pr-2">
          <button className="text-[var(--accent)] text-sm font-sans font-bold px-4 py-2 bg-[var(--accent-soft)] rounded-full flex items-center gap-1 shadow-sm transition-transform active:scale-95" onClick={() => {
            updateEntry({ hours: [...entry.hours, { id: uid(), time: 'custom', task: '', done: false }] });
          }}>+ Add task block</button>
        </div>
        
        {/* Subject Logs */}
        <div className="mt-8 mb-2 px-1">
          <div className="flex items-center gap-2 mb-4 px-1">
            <BookOpen size={16} className="text-[var(--accent)] opacity-80" strokeWidth={2.5} />
            <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">Subject Logs</h3>
          </div>
          
          {entry.subjects.length === 0 ? (
            <div className="text-[0.75rem] text-[var(--ink-soft)] italic px-2 mb-4">No subjects logged today.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {entry.subjects.map((s, idx) => (
                <div key={s.id} className="bg-[#fffdf7] border border-[var(--line)] rounded-[20px] p-4 shadow-sm relative transition-all hover:shadow-md">
                  <div className="absolute top-4 right-4"> 
                    <div className={`w-3 h-3 rounded-full ${getSubjectColor(s.subjectId)} shadow-sm`}></div>
                  </div>
                  <div className="flex gap-4 flex-wrap mb-4 pr-6">
                    <div className="flex-1 min-w-[140px]">
                      <label className="!text-[0.7rem] !mb-1">Subject</label>
                      <select value={s.subjectId} onChange={e => updateSubjectLog(s.id, { subjectId: e.target.value, lessonId: '' })} className="!text-sm !py-1.5">
                        <option value="">-- subject --</option>
                        {subjects.map(subj => <option key={subj.id} value={subj.id}>{subj.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="!text-[0.7rem] !mb-1">Lesson</label>
                      <select value={s.lessonId} onChange={e => updateSubjectLog(s.id, { lessonId: e.target.value })} className="!text-sm !py-1.5">
                        <option value="">-- lesson --</option>
                        {s.subjectId && lessons.filter(l => l.subjectId === s.subjectId).map(l => (
                          <option key={l.id} value={l.id}>{l.name} {l.done ? '✓' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center mt-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-0">
                      <input type="checkbox" checked={s.studied} onChange={e => updateSubjectLog(s.id, { studied: e.target.checked })} className="w-4 h-4" />
                      <span className="mt-0.5 text-sm font-sans font-medium text-[var(--ink)]">Studied</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer mb-0">
                      <input type="checkbox" checked={s.pastPaper} onChange={e => updateSubjectLog(s.id, { pastPaper: e.target.checked })} className="w-4 h-4" />
                      <span className="mt-0.5 text-sm font-sans font-medium text-[var(--ink)]">Past paper</span>
                    </label>
                  </div>
                  <div className="mt-2 pt-3 border-t border-dashed border-[var(--line)]">
                    <label className="!text-[0.7rem] !mb-2">Confidence Rating</label>
                    <div className="flex gap-2">
                      {(['L', 'M', 'H'] as const).map(level => (
                        <button 
                          key={level}
                          type="button"
                          onClick={() => updateSubjectLog(s.id, { confidence: level })}
                          className={`font-sans font-bold text-[0.8rem] w-[32px] h-[32px] rounded-full border cursor-pointer transition-colors
                            ${s.confidence === level ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm' : 'bg-[var(--paper)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)]'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="text-[var(--accent)] text-sm font-sans font-bold px-2 mt-3 flex items-center gap-1 hover:underline" onClick={addSubjectLog}>+ Add subject log</button>
        </div>

        {/* Revisits */}
        <div className="mt-6 mb-2 px-1">
          <div className="flex items-center gap-2 mb-4 px-1">
            <AlertCircle size={16} className="text-[var(--warn)] opacity-80" strokeWidth={2.5} />
            <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">Revisits due today</h3>
          </div>
          
          {dueRevisits.length === 0 ? (
            <div className="text-[0.75rem] text-[var(--ink-soft)] italic px-2 mb-4">Nothing due today.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {dueRevisits.map(r => {
                const subject = subjects.find(s => s.id === r.subjectId);
                const lesson = lessons.find(l => l.id === r.lessonId);
                return (
                  <div key={r.id} className={`bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 flex items-start gap-3 shadow-sm transition-all hover:shadow-md ${r.done ? 'opacity-60' : ''}`}>
                    <div className="pt-0.5">
                      <input type="checkbox" checked={r.done} onChange={(e) => updateRevisit(r.id, { done: e.target.checked })} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getSubjectColor(r.subjectId)}`}></div>
                        <div className={`font-sans font-bold text-[0.9rem] text-[var(--ink)] leading-tight ${r.done ? 'line-through' : ''}`}>
                          {subject?.name} — {lesson?.name}
                        </div>
                      </div>
                      <div className="mt-1.5 flex">
                        <span className="tag bg-[#fef2f2] text-[#d27575] border-[#fecaca] px-2 py-0.5 rounded-md">{r.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes & Summaries */}
        <div className="mt-6 card !mb-0 shadow-sm border border-[var(--line)]">
          <h2 className="section !text-sm">Teach-back summary</h2>
          <textarea 
            className="mb-4 !bg-transparent border border-[var(--line)] focus:border-[var(--accent)] transition-colors rounded-xl min-h-[80px]"
            value={entry.teachback} 
            onChange={e => updateEntry({ teachback: e.target.value })} 
            placeholder="Write 3-4 lines from memory..."
          />
          <h2 className="section !text-sm mt-2">Notes / fix tomorrow</h2>
          <textarea 
            className="!bg-transparent border border-[var(--line)] focus:border-[var(--accent)] transition-colors rounded-xl min-h-[80px]"
            value={entry.notes} 
            onChange={e => updateEntry({ notes: e.target.value })} 
            placeholder="Any areas of struggle?"
          />
        </div>
      </div>
      
      {/* Floating Save Button */}
      <div className="fixed bottom-[84px] left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-end">
          <button className="btn shadow-lg px-6 py-3 text-[0.9rem] rounded-full flex items-center justify-center gap-2 pointer-events-auto" onClick={handleSave}>
            Save Changes {saveMsg && <span className="font-sans font-normal opacity-90">{saveMsg}</span>}
          </button>
        </div>
      </div>

      {/* Month Picker Modal */}
      {isMonthModalOpen && (
        <div className="fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsMonthModalOpen(false)}>
          <div className="bg-[#fffdf7] rounded-3xl shadow-xl border border-[var(--line)] w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              <h2 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">
                {modalMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={nextMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
                <ChevronRight size={24} strokeWidth={2.5} />
              </button>
            </div>
            {renderMonthGrid()}
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setIsMonthModalOpen(false)}
                className="text-[var(--ink-soft)] font-sans font-bold text-sm px-4 py-2 hover:bg-[var(--line)] rounded-full transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
