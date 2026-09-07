import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { DailyEntry, DailySubjectLog, HourBlock } from '../types';
import { todayStr, uid, addDays, mondayOf } from '../utils';
import { 
  Sun, 
  CloudSun, 
  Moon, 
  CheckCircle2, 
  Clock, 
  Search, 
  PenTool, 
  Plus, 
  Check, 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  BookOpen
} from 'lucide-react';

interface CalendarTabProps {
  onNavigateToRevisit?: () => void;
}

interface AgendaTask {
  id: string;
  source: 'hour' | 'subject';
  originalId: string;
  title: string;
  detail?: string;
  duration: string;
  period: 'morning' | 'afternoon' | 'evening';
  done: boolean;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ onNavigateToRevisit }) => {
  const { dailyEntries, saveDailyEntry, updateDailyEntry, subjects, lessons } = useStore();
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Top header actions state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Month navigation state
  const [modalMonth, setModalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Week offset state (allows moving weeks forward/back)
  const [weekOffset, setWeekOffset] = useState(0);

  // Add modal form state
  const [targetPeriod, setTargetPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [addMode, setAddMode] = useState<'task' | 'subject'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('50 min');

  // Subject log form state
  const [newSubjId, setNewSubjId] = useState('');
  const [newLessonId, setNewLessonId] = useState('');
  const [newSubjStudied, setNewSubjStudied] = useState(true);
  const [newSubjPastPaper, setNewSubjPastPaper] = useState(false);
  const [newSubjConfidence, setNewSubjConfidence] = useState<'L' | 'M' | 'H'>('M');

  // Current entry for selected date
  const entry: DailyEntry = dailyEntries[selectedDate] || {
    date: selectedDate,
    hours: [],
    subjects: [],
    teachback: '',
    notes: '',
    wakeTime: '',
    sleepTime: '',
  };

  // Safe persist helper to store
  const persistEntry = (updated: DailyEntry) => {
    if (saveDailyEntry) {
      saveDailyEntry(selectedDate, updated);
    } else if (updateDailyEntry) {
      updateDailyEntry(selectedDate, updated);
    }
  };

  // Helper to parse time string to 24-hr hour
  const parseTimeToHour = (timeStr: string) => {
    const m = (timeStr || '').match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
    if (!m) return 9;
    let h = parseInt(m[1], 10);
    const pm = m[3].toLowerCase() === 'pm';
    if (h === 12 && !pm) h = 0;
    if (h < 12 && pm) h += 12;
    return h;
  };

  // Parse duration string into decimal hours (e.g. "50 min" -> 0.83, "1 hr" -> 1.0)
  const parseDurationToHours = (dur: string): number => {
    if (!dur) return 0.83;
    const minMatch = dur.match(/(\d+)\s*min/i);
    if (minMatch) return parseInt(minMatch[1], 10) / 60;
    const hrMatch = dur.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)/i);
    if (hrMatch) return parseFloat(hrMatch[1]);
    const numOnly = parseFloat(dur);
    if (!isNaN(numOnly)) {
      return numOnly > 10 ? numOnly / 60 : numOnly;
    }
    return 0.83;
  };

  // Build unified task list from actual hourly schedule and subject logs for selectedDate
  const allTasks: AgendaTask[] = useMemo(() => {
    const tasks: AgendaTask[] = [];

    // 1. Hourly schedule blocks
    (entry.hours || []).forEach((h) => {
      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      const hour = parseTimeToHour(h.time || '');
      if (hour >= 5 && hour < 12) {
        period = 'morning';
      } else if (hour >= 12 && hour < 17) {
        period = 'afternoon';
      } else {
        period = 'evening';
      }

      let title = h.task;
      let detail: string | undefined = undefined;
      const colonIdx = h.task.indexOf(':');
      if (colonIdx > -1) {
        title = h.task.slice(0, colonIdx).trim();
        detail = h.task.slice(colonIdx + 1).trim();
      }

      const duration = (h as any).duration || '50 min';

      tasks.push({
        id: `h_${h.id}`,
        source: 'hour',
        originalId: h.id,
        title,
        detail,
        duration,
        period: (h as any).period || period,
        done: !!h.done,
      });
    });

    // 2. Subject study logs
    (entry.subjects || []).forEach((s, idx) => {
      const subj = subjects.find((sub) => sub.id === s.subjectId);
      const lesson = lessons.find((l) => l.id === s.lessonId);
      const subjName = subj ? subj.name : 'Subject';
      const lessonName = lesson ? lesson.name : '';
      
      let detail = lessonName;
      if (s.pastPaper) {
        detail = lessonName ? `${lessonName} (Past Paper)` : 'Past Paper Practice';
      } else if (!detail) {
        detail = 'Study & Revision';
      }

      const defaultPeriod = idx % 3 === 0 ? 'morning' : idx % 3 === 1 ? 'afternoon' : 'evening';
      const period = (s as any).period || defaultPeriod;
      const duration = (s as any).duration || (s.pastPaper ? '60 min' : '45 min');

      tasks.push({
        id: `s_${s.id}`,
        source: 'subject',
        originalId: s.id,
        title: `@${subjName}`,
        detail,
        duration,
        period,
        done: !!(s.studied || s.pastPaper),
      });
    });

    return tasks;
  }, [entry.hours, entry.subjects, subjects, lessons]);

  // Toggle task done state
  const handleToggleTask = (task: AgendaTask) => {
    if (task.source === 'hour') {
      const updatedHours = (entry.hours || []).map((h) =>
        h.id === task.originalId ? { ...h, done: !h.done } : h
      );
      persistEntry({ ...entry, hours: updatedHours });
    } else {
      const updatedSubjects = (entry.subjects || []).map((s) => {
        if (s.id === task.originalId) {
          const nextState = !(s.studied || s.pastPaper);
          return { ...s, studied: nextState, pastPaper: s.pastPaper && nextState };
        }
        return s;
      });
      persistEntry({ ...entry, subjects: updatedSubjects });
    }
  };

  // Delete task
  const handleDeleteTask = (task: AgendaTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.source === 'hour') {
      const updatedHours = (entry.hours || []).filter((h) => h.id !== task.originalId);
      persistEntry({ ...entry, hours: updatedHours });
    } else {
      const updatedSubjects = (entry.subjects || []).filter((s) => s.id !== task.originalId);
      persistEntry({ ...entry, subjects: updatedSubjects });
    }
  };

  // Header stats calculations
  const completedTasks = allTasks.filter((t) => t.done).length;
  const dailyTargetHours = 6;
  const doneHours = allTasks
    .filter((t) => t.done)
    .reduce((acc, t) => acc + parseDurationToHours(t.duration), 0);

  const formatHours = (num: number) => {
    const fixed = num.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  };

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allTasks;
    const q = searchQuery.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.detail && t.detail.toLowerCase().includes(q)) ||
        t.duration.toLowerCase().includes(q)
    );
  }, [allTasks, searchQuery]);

  const morningTasks = filteredTasks.filter((t) => t.period === 'morning');
  const afternoonTasks = filteredTasks.filter((t) => t.period === 'afternoon');
  const eveningTasks = filteredTasks.filter((t) => t.period === 'evening');

  // Week days calculation with offset
  const monday = useMemo(() => {
    const baseMonday = mondayOf(selectedDate);
    return addDays(baseMonday, weekOffset * 7);
  }, [selectedDate, weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [monday]);

  // Open add modal for specific period
  const openAddForPeriod = (period: 'morning' | 'afternoon' | 'evening') => {
    setTargetPeriod(period);
    setAddMode('task');
    setNewTaskTitle('');
    setNewTaskDetail('');
    setNewTaskDuration('50 min');
    setIsAddModalOpen(true);
  };

  // Add task submission
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'task') {
      if (!newTaskTitle.trim()) return;
      const fullTaskStr = newTaskDetail.trim()
        ? `${newTaskTitle.trim()}: ${newTaskDetail.trim()}`
        : newTaskTitle.trim();

      const newHour: HourBlock & { duration?: string; period?: string } = {
        id: uid(),
        time: targetPeriod === 'morning' ? '8:00 am' : targetPeriod === 'afternoon' ? '2:00 pm' : '7:00 pm',
        task: fullTaskStr,
        done: false,
        duration: newTaskDuration || '50 min',
        period: targetPeriod,
      };

      persistEntry({ ...entry, hours: [...(entry.hours || []), newHour] });
      setNewTaskTitle('');
      setNewTaskDetail('');
      setIsAddModalOpen(false);
    } else {
      if (!newSubjId) return;
      const newLog: DailySubjectLog & { duration?: string; period?: string } = {
        id: uid(),
        subjectId: newSubjId,
        lessonId: newLessonId,
        studied: newSubjStudied,
        pastPaper: newSubjPastPaper,
        confidence: newSubjConfidence,
        duration: newSubjPastPaper ? '60 min' : '45 min',
        period: targetPeriod,
      };

      persistEntry({ ...entry, subjects: [...(entry.subjects || []), newLog] });
      setNewSubjId('');
      setNewLessonId('');
      setIsAddModalOpen(false);
    }
  };

  // Month navigation
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

    const toDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return (
      <div className="grid grid-cols-7 gap-y-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[0.65rem] font-sans font-bold text-[var(--ink-soft)] uppercase pb-2">
            {d}
          </div>
        ))}
        {days.map((dayObj, i) => {
          const dateStr = toDateString(dayObj.date);
          const isDateToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayEntry = dailyEntries[dateStr];
          const hasActivity =
            dayEntry &&
            ((dayEntry.hours && dayEntry.hours.length > 0) ||
              (dayEntry.subjects && dayEntry.subjects.length > 0));

          return (
            <div
              key={i}
              onClick={() => {
                setSelectedDate(dateStr);
                setWeekOffset(0);
                setIsMonthModalOpen(false);
              }}
              className="flex flex-col items-center justify-start h-[40px] cursor-pointer"
            >
              <div
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all ${
                  !dayObj.isCurrentMonth ? 'opacity-30' : ''
                } ${
                  isSelected
                    ? 'bg-[#8B6F9E] text-white shadow-sm font-bold'
                    : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'
                } ${isDateToday && !isSelected ? 'ring-1 ring-[#8B6F9E] text-[#8B6F9E] font-bold' : ''}`}
              >
                <span className="font-sans text-[0.85rem]">{dayObj.date.getDate()}</span>
              </div>
              {hasActivity && <div className="w-1 h-1 rounded-full bg-[#8B6F9E] mt-0.5" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Render individual task row matching reference image card structure
  const renderTaskRow = (task: AgendaTask) => {
    return (
      <div
        key={task.id}
        onClick={() => handleToggleTask(task)}
        className="group bg-white/80 hover:bg-white border border-[var(--line)]/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer select-none"
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleTask(task);
          }}
          className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
            task.done
              ? 'bg-[#8B6F9E] border-[#8B6F9E] text-white'
              : 'border-[#cfc8b8] hover:border-[#8B6F9E] bg-white'
          }`}
        >
          {task.done && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Title + Detail */}
        <div className="flex-1 min-w-0 pr-1 leading-snug">
          <span
            className={`font-sans text-[0.92rem] text-[var(--ink)] transition-opacity ${
              task.done ? 'line-through opacity-45' : ''
            }`}
          >
            <strong className="font-bold text-[var(--ink)]">{task.title}</strong>
            {task.detail && (
              <span className="text-[var(--ink)] opacity-90 font-normal">
                {task.title.endsWith(':') ? ' ' : ': '}
                {task.detail}
              </span>
            )}
          </span>
        </div>

        {/* Duration badge + quick delete on hover */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="bg-[#efece4] text-[var(--ink-soft)] text-[0.72rem] font-sans font-semibold px-2.5 py-1 rounded-full border border-[var(--line)]/60 whitespace-nowrap">
            {task.duration}
          </div>
          <button
            type="button"
            onClick={(e) => handleDeleteTask(task, e)}
            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-soft)] hover:text-red-500 transition-opacity rounded"
            title="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  // Render section
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    tasks: AgendaTask[],
    period: 'morning' | 'afternoon' | 'evening'
  ) => {
    return (
      <div className="mb-4">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
            {icon}
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={() => openAddForPeriod(period)}
            className="text-[0.75rem] text-[#8B6F9E] hover:underline font-sans font-bold flex items-center gap-0.5 opacity-85 hover:opacity-100 cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} /> add
          </button>
        </div>

        {/* Task Cards */}
        {tasks.length === 0 ? (
          <div
            onClick={() => openAddForPeriod(period)}
            className="border border-dashed border-[var(--line)]/80 rounded-2xl p-3.5 text-center text-xs text-[var(--ink-soft)]/70 hover:text-[#8B6F9E] hover:border-[#8B6F9E]/50 cursor-pointer transition-colors"
          >
            No {title.toLowerCase()} tasks — tap + to add
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">{tasks.map(renderTaskRow)}</div>
        )}
      </div>
    );
  };

  const isToday = selectedDate === today;

  return (
    <div className="flex flex-col gap-4 pb-12 relative">
      {/* 1. Header row: Large title "Today" + badges + header icon actions */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div className="flex items-baseline gap-2">
          <h1 className="font-caveat text-4xl sm:text-5xl font-bold text-[#8B6F9E] tracking-tight leading-none m-0">
            {isToday ? 'Today' : 'Agenda'}
          </h1>
          {!isToday && (
            <span className="text-xs font-sans font-medium text-[var(--ink-soft)]">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Badges & Header action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Badge 1: checkmark circle + completed count */}
          <div className="bg-[#ECE6D8] border border-[var(--line)]/60 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 size={13} className="text-[#8B6F9E]" strokeWidth={2.5} />
            <span className="font-sans font-bold text-[0.75rem] text-[var(--ink)]">
              {completedTasks} done
            </span>
          </div>

          {/* Badge 2: clock icon + hours studied vs target (default 6 hrs) */}
          <div className="bg-[#ECE6D8] border border-[var(--line)]/60 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <Clock size={13} className="text-[var(--ink-soft)]" strokeWidth={2.5} />
            <span className="font-sans font-bold text-[0.75rem] text-[var(--ink)]">
              {formatHours(doneHours)} of {dailyTargetHours} hrs
            </span>
          </div>

          {/* Search toggle icon button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isSearchOpen ? 'bg-[#8B6F9E] text-white' : 'text-[var(--ink-soft)] hover:text-[#8B6F9E] hover:bg-[var(--accent-soft)]'
            }`}
            title="Search tasks"
          >
            <Search size={17} strokeWidth={2.2} />
          </button>

          {/* Notes / Teach-back modal icon button */}
          <button
            type="button"
            onClick={() => setIsNotesModalOpen(true)}
            className="p-1.5 text-[var(--ink-soft)] hover:text-[#8B6F9E] hover:bg-[var(--accent-soft)] rounded-full transition-colors cursor-pointer"
            title="Teach-back & Daily Notes"
          >
            <PenTool size={17} strokeWidth={2.2} />
          </button>

          {/* Month calendar jump icon button */}
          <button
            type="button"
            onClick={() => setIsMonthModalOpen(true)}
            className="p-1.5 text-[var(--ink-soft)] hover:text-[#8B6F9E] hover:bg-[var(--accent-soft)] rounded-full transition-colors cursor-pointer"
            title="Choose date"
          >
            <CalendarIcon size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. Week date strip (Mon - Sun) with week navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1 text-[var(--ink-soft)] hover:text-[#8B6F9E] rounded-full transition-colors flex-shrink-0"
          title="Previous week"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
          {weekDays.map((d) => {
            const isSelected = d === selectedDate;
            const dateObj = new Date(d);
            const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();

            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`flex-1 min-w-[42px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#8B6F9E] text-white shadow-sm'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5'
                }`}
              >
                <span
                  className={`text-[0.72rem] font-sans font-medium mb-0.5 ${
                    isSelected ? 'text-white' : 'text-[var(--ink-soft)]'
                  }`}
                >
                  {dayAbbr}
                </span>
                <span
                  className={`text-base font-sans font-bold leading-none ${
                    isSelected ? 'text-white font-extrabold' : 'text-[var(--ink)]'
                  }`}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-1 text-[var(--ink-soft)] hover:text-[#8B6F9E] rounded-full transition-colors flex-shrink-0"
          title="Next week"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Search Input Bar (smooth toggle) */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 bg-white/95 border border-[var(--line)] rounded-full px-3.5 py-1.5 shadow-sm mt-0.5 animate-in fade-in duration-150">
          <Search size={15} className="text-[var(--ink-soft)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search this day's tasks..."
            className="flex-1 bg-transparent border-none text-sm text-[var(--ink)] focus:outline-none placeholder-[var(--ink-soft)]"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 3. Time-of-day sections: Morning, Afternoon, Evening */}
      <div className="flex flex-col mt-1">
        {renderSection(
          'Morning',
          <Sun size={15} className="text-[#dfa145]" strokeWidth={2.3} />,
          morningTasks,
          'morning'
        )}
        {renderSection(
          'Afternoon',
          <CloudSun size={15} className="text-[#d27575]" strokeWidth={2.3} />,
          afternoonTasks,
          'afternoon'
        )}
        {renderSection(
          'Evening',
          <Moon size={15} className="text-[#8B6F9E]" strokeWidth={2.3} />,
          eveningTasks,
          'evening'
        )}
      </div>

      {/* Notes & Teach-back Modal */}
      {isNotesModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsNotesModalOpen(false)}
        >
          <div
            className="bg-[#fffdf7] rounded-3xl shadow-2xl border border-[var(--line)] w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-caveat text-2xl font-bold text-[#8B6F9E] m-0">Daily Reflections</h3>
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                  Teach-back summary
                </label>
                <textarea
                  className="w-full bg-white/70 border border-[var(--line)] focus:border-[#8B6F9E] transition-colors rounded-xl p-3 text-sm min-h-[90px] focus:outline-none"
                  value={entry.teachback || ''}
                  onChange={(e) => persistEntry({ ...entry, teachback: e.target.value })}
                  placeholder="Explain 3-4 concepts learned today from memory..."
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                  Notes / Fix tomorrow
                </label>
                <textarea
                  className="w-full bg-white/70 border border-[var(--line)] focus:border-[#8B6F9E] transition-colors rounded-xl p-3 text-sm min-h-[80px] focus:outline-none"
                  value={entry.notes || ''}
                  onChange={(e) => persistEntry({ ...entry, notes: e.target.value })}
                  placeholder="Any difficult topics, questions to ask, or priorities..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsNotesModalOpen(false)}
                  className="w-full py-2.5 bg-[#8B6F9E] text-white font-sans font-bold text-sm rounded-full shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-[#fffdf7] rounded-3xl shadow-2xl border border-[var(--line)] w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-caveat text-2xl font-bold text-[#8B6F9E] m-0">
                Add to {targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toggle Mode: Custom Task vs Subject Log */}
            <div className="flex bg-[var(--paper)] p-1 rounded-xl border border-[var(--line)] mb-4">
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
                  addMode === 'task'
                    ? 'bg-white shadow-sm text-[#8B6F9E]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setAddMode('task')}
              >
                Custom Task
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
                  addMode === 'subject'
                    ? 'bg-white shadow-sm text-[#8B6F9E]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setAddMode('subject')}
              >
                Subject Log
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {addMode === 'task' ? (
                <>
                  <div>
                    <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                      Label / Subject (Bold prefix)
                    </label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="@Chemistry or Focus Task"
                      className="w-full bg-white border border-[var(--line)] rounded-xl p-2.5 text-sm focus:border-[#8B6F9E] focus:outline-none"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                      Task Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newTaskDetail}
                      onChange={(e) => setNewTaskDetail(e.target.value)}
                      placeholder="e.g. solve 2022 past paper questions"
                      className="w-full bg-white border border-[var(--line)] rounded-xl p-2.5 text-sm focus:border-[#8B6F9E] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                        Time of Day
                      </label>
                      <select
                        value={targetPeriod}
                        onChange={(e) => setTargetPeriod(e.target.value as any)}
                        className="w-full bg-white border border-[var(--line)] rounded-xl p-2 text-sm focus:border-[#8B6F9E] focus:outline-none"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                        Duration
                      </label>
                      <select
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        className="w-full bg-white border border-[var(--line)] rounded-xl p-2 text-sm focus:border-[#8B6F9E] focus:outline-none"
                      >
                        <option value="25 min">25 min</option>
                        <option value="30 min">30 min</option>
                        <option value="45 min">45 min</option>
                        <option value="50 min">50 min</option>
                        <option value="60 min">60 min</option>
                        <option value="1 hr">1 hr</option>
                        <option value="1.5 hrs">1.5 hrs</option>
                        <option value="2 hrs">2 hrs</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      value={newSubjId}
                      onChange={(e) => {
                        setNewSubjId(e.target.value);
                        setNewLessonId('');
                      }}
                      className="w-full bg-white border border-[var(--line)] rounded-xl p-2 text-sm focus:border-[#8B6F9E] focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                      Lesson (Optional)
                    </label>
                    <select
                      value={newLessonId}
                      onChange={(e) => setNewLessonId(e.target.value)}
                      className="w-full bg-white border border-[var(--line)] rounded-xl p-2 text-sm focus:border-[#8B6F9E] focus:outline-none"
                    >
                      <option value="">-- Choose Lesson --</option>
                      {newSubjId &&
                        lessons
                          .filter((l) => l.subjectId === newSubjId)
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                        Time of Day
                      </label>
                      <select
                        value={targetPeriod}
                        onChange={(e) => setTargetPeriod(e.target.value as any)}
                        className="w-full bg-white border border-[var(--line)] rounded-xl p-2 text-sm focus:border-[#8B6F9E] focus:outline-none"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                        Confidence
                      </label>
                      <div className="flex gap-2 pt-1">
                        {(['L', 'M', 'H'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setNewSubjConfidence(lvl)}
                            className={`flex-1 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              newSubjConfidence === lvl
                                ? 'bg-[#8B6F9E] text-white border-[#8B6F9E]'
                                : 'bg-white text-[var(--ink-soft)] border-[var(--line)]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-sans font-medium text-[var(--ink)]">
                      <input
                        type="checkbox"
                        checked={newSubjStudied}
                        onChange={(e) => setNewSubjStudied(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--line)] text-[#8B6F9E]"
                      />
                      Studied
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-sans font-medium text-[var(--ink)]">
                      <input
                        type="checkbox"
                        checked={newSubjPastPaper}
                        onChange={(e) => setNewSubjPastPaper(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--line)] text-[#8B6F9E]"
                      />
                      Past Paper
                    </label>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#8B6F9E] text-white font-sans font-bold text-sm rounded-full shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                  Save to {targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Month Picker Modal */}
      {isMonthModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsMonthModalOpen(false)}
        >
          <div
            className="bg-[#fffdf7] rounded-3xl shadow-2xl border border-[var(--line)] w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 text-[var(--ink-soft)] hover:text-[#8B6F9E] hover:bg-[var(--accent-soft)] rounded-full transition-colors cursor-pointer"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="font-caveat text-2xl font-bold text-[#8B6F9E] m-0">
                {modalMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 text-[var(--ink-soft)] hover:text-[#8B6F9E] hover:bg-[var(--accent-soft)] rounded-full transition-colors cursor-pointer"
              >
                <ChevronRight size={22} strokeWidth={2.5} />
              </button>
            </div>
            {renderMonthGrid()}
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                className="text-xs font-sans font-bold text-[#8B6F9E] hover:underline cursor-pointer"
                onClick={() => {
                  setSelectedDate(today);
                  setWeekOffset(0);
                  setIsMonthModalOpen(false);
                }}
              >
                Jump to Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
