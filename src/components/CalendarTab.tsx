import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { useNavigation } from '../navigation';
import { DailyEntry, DailySubjectLog, HourBlock } from '../types';
import { todayStr, uid, addDays } from '../utils';
import { SUBJECT_ACCENT_COLORS, getSubjectColorById } from '../utils/colors';
import { 
  Plus, 
  Check, 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  MapPin,
  Search,
  PenTool,
  Clock
} from 'lucide-react';

interface CalendarTabProps {
  onNavigateToRevisit?: () => void;
}

interface AgendaTask {
  id: string;
  source: 'hour' | 'subject' | 'revisit';
  originalId: string;
  date: string;
  title: string;
  detail?: string;
  timeDisplay: string;
  subjectLabel: string;
  duration?: string;
  period?: 'morning' | 'afternoon' | 'evening';
  done: boolean;
  accentColor: string;
}

const MONTH_ACCENT_COLORS = [
  '#EF4444', // Jan - Red / Rose
  '#3B82F6', // Feb - Blue
  '#10B981', // Mar - Emerald
  '#F59E0B', // Apr - Amber
  '#8B5CF6', // May - Purple
  '#06B6D4', // Jun - Cyan
  '#F97316', // Jul - Orange
  '#6366F1', // Aug - Indigo
  '#EC4899', // Sep - Pink
  '#14B8A6', // Oct - Teal
  '#84CC16', // Nov - Lime
  '#64748B', // Dec - Slate
];

export const CalendarTab: React.FC<CalendarTabProps> = () => {
  const { dailyEntries, saveDailyEntry, updateDailyEntry, subjects, lessons, revisits, updateRevisit } = useStore();
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterMode, setFilterMode] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');

  // Expandable month calendar grid state
  const [isMonthGridExpanded, setIsMonthGridExpanded] = useState<boolean>(false);
  const [viewingYear, setViewingYear] = useState<number>(() => {
    const d = new Date(today.replace(/-/g, '/'));
    return !isNaN(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
  });
  const [viewingMonth, setViewingMonth] = useState<number>(() => {
    const d = new Date(today.replace(/-/g, '/'));
    return !isNaN(d.getMonth()) ? d.getMonth() : new Date().getMonth();
  });

  const { activeOverlay, openOverlay, closeOverlay } = useNavigation();

  // Floating toolbar & overlay states
  const isSearchOpen = activeOverlay === 'calendar-search';
  const [searchQuery, setSearchQuery] = useState('');
  const isNotesModalOpen = activeOverlay === 'calendar-notes';
  const isAddModalOpen = activeOverlay === 'calendar-add-task';
  const isMonthModalOpen = activeOverlay === 'calendar-month';
  const [modalYear, setModalYear] = useState<number>(() => {
    const d = new Date();
    return d.getFullYear();
  });

  // Keep modalYear synced when overlay opens or selectedDate changes
  useEffect(() => {
    if (isMonthModalOpen) {
      const d = new Date(selectedDate.replace(/-/g, '/'));
      if (!isNaN(d.getFullYear())) {
        setModalYear(d.getFullYear());
      }
    }
  }, [isMonthModalOpen, selectedDate]);

  // Keep viewingYear & viewingMonth in sync when selectedDate changes and grid is closed
  useEffect(() => {
    if (!isMonthGridExpanded) {
      const d = new Date(selectedDate.replace(/-/g, '/'));
      if (!isNaN(d.getFullYear())) {
        setViewingYear(d.getFullYear());
        setViewingMonth(d.getMonth());
      }
    }
  }, [selectedDate, isMonthGridExpanded]);

  // Keep filterMode in sync when selectedDate changes outside of chips
  useEffect(() => {
    if (selectedDate === today) {
      setFilterMode('today');
    } else if (selectedDate === addDays(today, 1)) {
      setFilterMode('tomorrow');
    }
  }, [selectedDate, today]);

  // Helpers for expandable month calendar
  const viewingMonthName = useMemo(() => {
    return new Date(viewingYear, viewingMonth, 1).toLocaleDateString('en-US', { month: 'long' });
  }, [viewingYear, viewingMonth]);

  const handlePrevMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear((prev) => prev - 1);
    } else {
      setViewingMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear((prev) => prev + 1);
    } else {
      setViewingMonth((prev) => prev + 1);
    }
  };

  const handleToggleMonthGrid = () => {
    if (!isMonthGridExpanded) {
      const d = new Date(selectedDate.replace(/-/g, '/'));
      if (!isNaN(d.getFullYear())) {
        setViewingYear(d.getFullYear());
        setViewingMonth(d.getMonth());
      }
    }
    setIsMonthGridExpanded((prev) => !prev);
  };

  // Check if a date has any tasks or lessons logged
  const hasTasksForDate = (dateStr: string): boolean => {
    const dayEntry = dailyEntries[dateStr];
    if (dayEntry) {
      if (dayEntry.hours && dayEntry.hours.length > 0) return true;
      if (dayEntry.subjects && dayEntry.subjects.length > 0) return true;
    }
    if (revisits && revisits.some((r) => r.date === dateStr)) return true;
    return false;
  };

  // Generate calendar grid cells (Monday-first: Mo-Su) with adjacent month overflow days
  const calendarGridCells = useMemo(() => {
    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      hasTasks: boolean;
    }[] = [];

    const toDateKey = (year: number, monthIndex: number, day: number) => {
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const firstDayOfMonth = new Date(viewingYear, viewingMonth, 1);
    // Monday-based day of week: Monday is 0, Sunday is 6
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewingYear, viewingMonth, 0).getDate();

    const prevYear = viewingMonth === 0 ? viewingYear - 1 : viewingYear;
    const prevMonth = viewingMonth === 0 ? 11 : viewingMonth - 1;

    // Previous month overflow days
    for (let i = 0; i < firstDayIndex; i++) {
      const dayNum = daysInPrevMonth - firstDayIndex + 1 + i;
      const dateStr = toDateKey(prevYear, prevMonth, dayNum);
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === today,
        hasTasks: hasTasksForDate(dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = toDateKey(viewingYear, viewingMonth, d);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === today,
        hasTasks: hasTasksForDate(dateStr),
      });
    }

    // Next month overflow days (fill out remaining slots in the last week, minimum 35 cells)
    const nextYear = viewingMonth === 11 ? viewingYear + 1 : viewingYear;
    const nextMonth = viewingMonth === 11 ? 0 : viewingMonth + 1;
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const remainingSlots = totalSlots - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const dateStr = toDateKey(nextYear, nextMonth, d);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === today,
        hasTasks: hasTasksForDate(dateStr),
      });
    }

    return cells;
  }, [viewingYear, viewingMonth, selectedDate, today, dailyEntries, revisits]);

  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const d = new Date(dateStr.replace(/-/g, '/'));
    if (!isNaN(d.getFullYear())) {
      setViewingYear(d.getFullYear());
      setViewingMonth(d.getMonth());
    }
    if (dateStr === today) {
      setFilterMode('today');
    } else if (dateStr === addDays(today, 1)) {
      setFilterMode('tomorrow');
    } else {
      setFilterMode('custom');
    }
    setIsMonthGridExpanded(false);
  };

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Add modal form state
  const [addMode, setAddMode] = useState<'task' | 'subject'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [newTaskPeriod, setNewTaskPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newTaskDuration, setNewTaskDuration] = useState('50 min');

  // Subject log form state
  const [newSubjId, setNewSubjId] = useState('');
  const [newLessonId, setNewLessonId] = useState('');
  const [newSubjPeriod, setNewSubjPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [newSubjStudied, setNewSubjStudied] = useState(true);
  const [newSubjPastPaper, setNewSubjPastPaper] = useState(false);
  const [newSubjConfidence, setNewSubjConfidence] = useState<'L' | 'M' | 'H'>('M');

  const activeTargetDate = filterMode === 'tomorrow' ? addDays(today, 1) : selectedDate;
  const currentTargetEntry: DailyEntry = dailyEntries[activeTargetDate] || {
    date: activeTargetDate,
    hours: [],
    subjects: [],
    teachback: '',
    notes: '',
    wakeTime: '',
    sleepTime: '',
  };

  const updateEntryForDate = (targetDate: string, updates: Partial<DailyEntry>) => {
    const baseEntry = dailyEntries[targetDate] || {
      date: targetDate,
      hours: [],
      subjects: [],
      teachback: '',
      notes: '',
      wakeTime: '',
      sleepTime: '',
    };
    const saveFn = saveDailyEntry || updateDailyEntry;
    if (typeof saveFn === 'function') {
      saveFn(targetDate, { ...baseEntry, ...updates });
    }
  };

  // Helper to parse time string to 24-hr hour
  const parseTimeToHour = (timeStr: string) => {
    const m = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (!m) return 9;
    let h = parseInt(m[1], 10);
    const pm = m[3] ? m[3].toLowerCase() === 'pm' : false;
    if (h === 12 && !pm) h = 0;
    if (h < 12 && pm) h += 12;
    return h;
  };

  // Format time matching reference's "10.45", "12.10", "19.45" exact style
  const formatTimeDot = (timeStr?: string, defaultHour = 9): string => {
    if (!timeStr) return `${String(defaultHour).padStart(2, '0')}.00`;
    const m = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (!m) return timeStr;
    let h = parseInt(m[1], 10);
    const min = m[2] ? m[2].padStart(2, '0') : '00';
    const ampm = m[3] ? m[3].toLowerCase() : '';
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}.${min}`;
  };

  // Extract agenda tasks for any specific date using real app data
  const getTasksForDate = (dateStr: string): AgendaTask[] => {
    const dayEntry = dailyEntries[dateStr];
    const result: AgendaTask[] = [];

    // 1. Hourly schedule blocks from dailyEntries
    if (dayEntry && dayEntry.hours) {
      dayEntry.hours.forEach((h, hIdx) => {
        let period: 'morning' | 'afternoon' | 'evening' = 'morning';
        const hour = parseTimeToHour(h.time || '');
        if (hour >= 5 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 17) period = 'afternoon';
        else period = 'evening';

        let title = h.task;
        let detail: string | undefined = undefined;
        const colonIdx = h.task.indexOf(':');
        if (colonIdx > -1) {
          title = h.task.slice(0, colonIdx).trim();
          detail = h.task.slice(colonIdx + 1).trim();
        }

        const matchingSubj = subjects.find(
          (s) =>
            title.toLowerCase().includes(s.name.toLowerCase()) ||
            (detail && detail.toLowerCase().includes(s.name.toLowerCase()))
        );

        const accentColor = matchingSubj
          ? getSubjectColorById(matchingSubj.id, subjects)
          : SUBJECT_ACCENT_COLORS[hIdx % SUBJECT_ACCENT_COLORS.length];

        const timeDisplay = h.time && h.time.trim() ? h.time.trim() : formatTimeDot(h.time, hour);
        const subjectLabel = matchingSubj ? matchingSubj.name : 'Study Block';

        result.push({
          id: `h_${dateStr}_${h.id}`,
          source: 'hour',
          originalId: h.id,
          date: dateStr,
          title,
          detail,
          timeDisplay,
          subjectLabel,
          duration: (h as any).duration || '50 min',
          period: (h as any).period || period,
          done: !!h.done,
          accentColor,
        });
      });
    }

    // 2. Subject study logs from dailyEntries
    if (dayEntry && dayEntry.subjects) {
      dayEntry.subjects.forEach((s, idx) => {
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
        const defaultHour = period === 'morning' ? 9 : period === 'afternoon' ? 14 : 19;
        const timeDisplay = formatTimeDot(undefined, defaultHour + (idx % 3));
        const accentColor = getSubjectColorById(s.subjectId, subjects);

        result.push({
          id: `s_${dateStr}_${s.id}`,
          source: 'subject',
          originalId: s.id,
          date: dateStr,
          title: lessonName || subjName,
          detail: s.pastPaper ? `${subjName} · Past Paper` : (lessonName ? subjName : 'Study & Revision'),
          timeDisplay,
          subjectLabel: s.pastPaper ? `${subjName} · Past Paper` : `${subjName} · Lesson`,
          duration: (s as any).duration || (s.pastPaper ? '60 min' : '45 min'),
          period,
          done: !!(s.studied || s.pastPaper),
          accentColor,
        });
      });
    }

    // 3. Spaced repetition revisits scheduled for this date
    (revisits || [])
      .filter((r) => r.date === dateStr)
      .forEach((r) => {
        const subj = subjects.find((sub) => sub.id === r.subjectId);
        const lesson = lessons.find((l) => l.id === r.lessonId);
        const subjName = subj ? subj.name : 'Subject';
        const lessonName = lesson ? lesson.name : 'Lesson Revisit';
        const accentColor = getSubjectColorById(r.subjectId, subjects);

        result.push({
          id: `r_${dateStr}_${r.id}`,
          source: 'revisit',
          originalId: r.id,
          date: dateStr,
          title: lessonName,
          detail: `${subjName} · Spaced Repetition (${r.type})`,
          timeDisplay: '09.00',
          subjectLabel: `${subjName} · ${r.type}`,
          duration: '30 min',
          period: 'morning',
          done: !!r.done,
          accentColor,
        });
      });

    return result;
  };

  // Toggle task done state
  const handleToggleTask = (task: AgendaTask) => {
    if (task.source === 'revisit') {
      if (typeof updateRevisit === 'function') {
        updateRevisit(task.originalId, { done: !task.done });
      }
      return;
    }

    const targetDate = task.date || selectedDate;
    const targetEntry = dailyEntries[targetDate] || {
      date: targetDate,
      hours: [],
      subjects: [],
      teachback: '',
      notes: '',
      wakeTime: '',
      sleepTime: '',
    };

    const saveFn = saveDailyEntry || updateDailyEntry;
    if (typeof saveFn !== 'function') return;

    if (task.source === 'hour') {
      const updatedHours = (targetEntry.hours || []).map((h) =>
        h.id === task.originalId ? { ...h, done: !h.done } : h
      );
      saveFn(targetDate, { ...targetEntry, hours: updatedHours });
    } else {
      const updatedSubjects = (targetEntry.subjects || []).map((s) => {
        if (s.id === task.originalId) {
          const nextState = !(s.studied || s.pastPaper);
          return { ...s, studied: nextState, pastPaper: s.pastPaper && nextState };
        }
        return s;
      });
      saveFn(targetDate, { ...targetEntry, subjects: updatedSubjects });
    }
  };

  // Compute daily streak for the secondary info block
  const streak = useMemo(() => {
    let count = 0;
    let curr = today;
    const hasTodayActivity = !!dailyEntries[today] && (
      (dailyEntries[today].hours || []).some(h => h.done) || 
      (dailyEntries[today].subjects || []).some(s => s.studied || s.pastPaper)
    );
    if (hasTodayActivity) {
      count++;
      curr = addDays(today, -1);
    } else {
      curr = addDays(today, -1);
    }
    for (let i = 0; i < 90; i++) {
      const e = dailyEntries[curr];
      const had = !!e && (
        (e.hours || []).some(h => h.done) || 
        (e.subjects || []).some(s => s.studied || s.pastPaper)
      );
      if (had) {
        count++;
        curr = addDays(curr, -1);
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  }, [dailyEntries, today]);

  // Tasks to display based on filterMode ('today' | 'tomorrow' | 'all' | 'custom')
  const displayedTasks = useMemo(() => {
    if (filterMode === 'today') {
      return getTasksForDate(today);
    }
    if (filterMode === 'tomorrow') {
      return getTasksForDate(addDays(today, 1));
    }
    if (filterMode === 'custom') {
      return getTasksForDate(selectedDate);
    }
    // 'all': collect tasks starting from today onwards
    const upcomingTasks: AgendaTask[] = [];
    const dateKeys = Array.from(
      new Set([
        today,
        addDays(today, 1),
        addDays(today, 2),
        addDays(today, 3),
        addDays(today, 4),
        addDays(today, 5),
        addDays(today, 6),
        ...Object.keys(dailyEntries).filter((d) => d >= today),
      ])
    ).sort();

    dateKeys.forEach((d) => {
      const dTasks = getTasksForDate(d);
      dTasks.forEach((t) => {
        const dateObj = new Date(d.replace(/-/g, '/'));
        const dayLabel = d === today 
          ? 'Today' 
          : d === addDays(today, 1) 
          ? 'Tomorrow' 
          : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        upcomingTasks.push({
          ...t,
          subjectLabel: `${t.subjectLabel} · ${dayLabel}`,
        });
      });
    });

    return upcomingTasks;
  }, [filterMode, today, dailyEntries, subjects, lessons]);

  // Filter tasks by search query if active
  const tasksToRender = useMemo(() => {
    if (!searchQuery.trim()) return displayedTasks;
    const q = searchQuery.toLowerCase();
    return displayedTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.detail && t.detail.toLowerCase().includes(q)) ||
        t.subjectLabel.toLowerCase().includes(q) ||
        t.timeDisplay.includes(q)
    );
  }, [displayedTasks, searchQuery]);

  const tasksCompletedCount = tasksToRender.filter((t) => t.done).length;

  // Greeting helper matching reference "Good Morning"
  const getGreetingText = () => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 12) return 'Good Morning';
    if (hr >= 12 && hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 17) return '☀️';
    return '🌙';
  };

  // Date values for oversized date display
  const activeDisplayDate = filterMode === 'tomorrow' 
    ? addDays(today, 1) 
    : filterMode === 'all' 
    ? today 
    : selectedDate;

  const activeDateObj = new Date(activeDisplayDate.replace(/-/g, '/'));
  const displayDayName = filterMode === 'all' 
    ? 'All Tasks' 
    : activeDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const displayDayNum = activeDateObj.getDate();
  const displayMonthName = activeDateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

  // Add task handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDate = filterMode === 'tomorrow' ? addDays(today, 1) : selectedDate;

    if (addMode === 'task') {
      if (!newTaskTitle.trim()) return;
      const fullTaskStr = newTaskDetail.trim() 
        ? `${newTaskTitle.trim()}: ${newTaskDetail.trim()}` 
        : newTaskTitle.trim();
      
      const newHour: HourBlock & { duration?: string; period?: string } = {
        id: uid(),
        time: newTaskPeriod === 'morning' ? '8:00 am' : newTaskPeriod === 'afternoon' ? '2:00 pm' : '7:00 pm',
        task: fullTaskStr,
        done: false,
        duration: newTaskDuration,
        period: newTaskPeriod,
      };

      const baseEntry = dailyEntries[targetDate] || {
        date: targetDate,
        hours: [],
        subjects: [],
        teachback: '',
        notes: '',
        wakeTime: '',
        sleepTime: '',
      };

      updateEntryForDate(targetDate, { hours: [...(baseEntry.hours || []), newHour] });
      setNewTaskTitle('');
      setNewTaskDetail('');
      closeOverlay();
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
        period: newSubjPeriod,
      };

      const baseEntry = dailyEntries[targetDate] || {
        date: targetDate,
        hours: [],
        subjects: [],
        teachback: '',
        notes: '',
        wakeTime: '',
        sleepTime: '',
      };

      updateEntryForDate(targetDate, { subjects: [...(baseEntry.subjects || []), newLog] });
      setNewSubjId('');
      setNewLessonId('');
      closeOverlay();
    }
  };

  // Year-at-a-glance multi-month grid renderer matching reference image
  const renderMultiMonthGrid = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const toDateString = (year: number, month: number, day: number) =>
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto max-h-[64vh] p-1 scrollbar-hide">
        {months.map((monthIndex) => {
          const monthColor = MONTH_ACCENT_COLORS[monthIndex % MONTH_ACCENT_COLORS.length];
          const firstDayOfWeek = new Date(modalYear, monthIndex, 1).getDay();
          const daysInCurrentMonth = new Date(modalYear, monthIndex + 1, 0).getDate();
          const monthName = new Date(modalYear, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });

          const cells: (number | null)[] = [];
          for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(null);
          }
          for (let d = 1; d <= daysInCurrentMonth; d++) {
            cells.push(d);
          }

          return (
            <div
              key={monthIndex}
              className="rounded-2xl p-2.5 sm:p-3 border flex flex-col shadow-2xs transition-all"
              style={{
                backgroundColor: `${monthColor}14`,
                borderColor: `${monthColor}35`,
              }}
            >
              {/* Month Header */}
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="font-sans font-bold text-xs sm:text-sm text-[#111111]">
                  {monthName}
                </span>
                <span className="text-[10px] font-sans font-medium text-[#8A8A8A]">
                  {modalYear}
                </span>
              </div>

              {/* Day of week initials */}
              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
                  <span key={i} className="text-[8px] sm:text-[9px] font-sans font-semibold text-[#8A8A8A]">
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {cells.map((dayNum, i) => {
                  if (dayNum === null) {
                    return <div key={`empty-${i}`} className="h-5 w-5 mx-auto" />;
                  }

                  const dateStr = toDateString(modalYear, monthIndex, dayNum);
                  const isSelected = dateStr === selectedDate;
                  const isTodayDate = dateStr === today;
                  const dayEntry = dailyEntries[dateStr];
                  const hasActivity =
                    dayEntry &&
                    ((dayEntry.hours && dayEntry.hours.length > 0) ||
                      (dayEntry.subjects && dayEntry.subjects.length > 0));

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        if (dateStr === today) setFilterMode('today');
                        else if (dateStr === addDays(today, 1)) setFilterMode('tomorrow');
                        else setFilterMode('all');
                        closeOverlay();
                      }}
                      className={`h-5.5 w-5.5 mx-auto rounded-full flex flex-col items-center justify-center text-[10px] sm:text-[11px] font-sans transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#111111] text-[#FFFFFF] font-bold shadow-xs'
                          : isTodayDate
                          ? 'ring-1 ring-[#111111] font-bold text-[#111111] hover:bg-[#111111]/10'
                          : 'text-[#111111] hover:bg-[#111111]/10'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasActivity && !isSelected && (
                        <span className="w-0.5 h-0.5 rounded-full bg-[#111111] -mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render individual task card matching the app's established black-and-white-with-accent theme:
  // White/light-neutral card background, subject-accent-colored left edge or tag, bold title, gray subtitle/detail, time badge
  const renderTaskCard = (task: AgendaTask) => {
    return (
      <div
        key={task.id}
        onClick={() => handleToggleTask(task)}
        className="group relative bg-[#FFFFFF] border border-[#E0E0E0] hover:border-[#CCCCCC] rounded-2xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all cursor-pointer flex items-center gap-3 select-none"
      >
        {/* Subject-accent-colored left edge indicator */}
        <div
          className="w-1.5 self-stretch rounded-full flex-shrink-0 my-0.5 transition-transform group-hover:scale-y-105"
          style={{ backgroundColor: task.accentColor }}
        />

        {/* Circular Checkbox button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleTask(task);
          }}
          className={`w-5.5 h-5.5 rounded-full border-[1.5px] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
            task.done
              ? 'bg-[#111111] border-[#111111] text-[#FFFFFF]'
              : 'border-[#D4D4D4] hover:border-[#111111] bg-[#FFFFFF]'
          }`}
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.done && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Content area: Title, Subtitle, Tags */}
        <div className="flex-1 min-w-0 pr-1">
          <h3
            className={`font-sans font-bold text-sm sm:text-[15px] text-[#111111] leading-snug tracking-tight truncate ${
              task.done ? 'line-through text-[#8A8A8A]' : ''
            }`}
          >
            {task.title}
          </h3>

          {task.detail && (
            <p className="font-sans text-xs text-[#8A8A8A] mt-0.5 leading-normal truncate">
              {task.detail}
            </p>
          )}

          {/* Subject tag & duration line */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[10px] sm:text-[11px] font-sans font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5"
              style={{
                backgroundColor: `${task.accentColor}14`,
                color: task.accentColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.accentColor }}
              />
              {task.subjectLabel}
            </span>

            {task.duration && (
              <span className="text-[10px] sm:text-[11px] font-sans text-[#8A8A8A]">
                {task.duration}
              </span>
            )}
          </div>
        </div>

        {/* Right side: Time shown as a small badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="inline-flex items-center gap-1 bg-[#F5F5F5] border border-[#E0E0E0] text-[#111111] text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full shadow-2xs">
            <Clock size={11} className="text-[#8A8A8A]" />
            {task.timeDisplay}
          </span>
          {task.period && (
            <span className="text-[10px] font-sans text-[#8A8A8A] capitalize">
              {task.period}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative">
      {/* Pinned / Fixed Header Section (greeting, filter chips + quick-add, large bold date display) */}
      <div className="flex-shrink-0 space-y-2 pb-2 bg-[#FAFAFA] z-20">
        {/* Top Control Bar: Month Selector Pill Button (left) + Utility Icons (right) */}
        <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
          {/* Collapsed state month button matching reference image */}
          <button
            type="button"
            onClick={handleToggleMonthGrid}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E0E0E0] hover:border-[#111111] text-[#111111] shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
            aria-expanded={isMonthGridExpanded}
            aria-label="Toggle month calendar grid"
          >
            <CalendarIcon size={14} className="text-[#111111] group-hover:scale-105 transition-transform" />
            <span className="text-xs font-sans font-bold capitalize">
              {viewingMonthName}
            </span>
            <ChevronDown
              size={14}
              className={`text-[#8A8A8A] transition-transform duration-300 ease-in-out ${
                isMonthGridExpanded ? 'rotate-180 text-[#111111]' : ''
              }`}
            />
          </button>

          {/* Utility icons on the top-right replacing the avatar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => (isSearchOpen ? closeOverlay() : openOverlay('calendar-search'))}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isSearchOpen ? 'text-[#111111] bg-[#F0F0F0]' : 'text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F0F0F0]'
              }`}
              title="Search tasks"
              aria-label="Search tasks"
            >
              <Search size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => openOverlay('calendar-notes')}
              className="p-1.5 text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F0F0F0] rounded-full transition-colors cursor-pointer"
              title="Teach-back & Daily Reflections"
              aria-label="Daily Reflections"
            >
              <PenTool size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => openOverlay('calendar-month')}
              className="p-1.5 text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F0F0F0] rounded-full transition-colors cursor-pointer"
              title="Year at a glance"
              aria-label="Year at a glance"
            >
              <CalendarIcon size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Smooth Expandable Month Calendar Grid */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isMonthGridExpanded
              ? 'max-h-[380px] opacity-100 scale-y-100 my-1'
              : 'max-h-0 opacity-0 scale-y-95 pointer-events-none my-0'
          } origin-top`}
        >
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-3 sm:p-4 shadow-xs mx-0.5">
            {/* Month & Year header with prev/next arrows */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-sans font-bold text-sm sm:text-base text-[#111111]">
                {viewingMonthName} <span className="text-[#8A8A8A] font-semibold text-xs ml-1">{viewingYear}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day of week labels (Mo–Su) at top matching reference */}
            <div className="grid grid-cols-7 text-center mb-1 border-b border-[#F0F0F0] pb-1">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((wd) => (
                <span key={wd} className="text-[10px] sm:text-[11px] font-sans font-semibold text-[#8A8A8A] py-0.5">
                  {wd}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center pt-1">
              {calendarGridCells.map((cell) => {
                return (
                  <div key={cell.dateStr} className="flex flex-col items-center justify-center p-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectCalendarDate(cell.dateStr)}
                      className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full flex flex-col items-center justify-center text-[11px] sm:text-xs font-sans transition-all cursor-pointer relative select-none ${
                        cell.isSelected
                          ? 'bg-[#111111] text-[#FFFFFF] font-bold shadow-xs'
                          : cell.isToday
                          ? 'border border-[#111111] text-[#111111] font-bold hover:bg-[#F5F5F5]'
                          : !cell.isCurrentMonth
                          ? 'text-[#C4C4C4] hover:bg-[#F5F5F5] hover:text-[#8A8A8A]'
                          : 'text-[#111111] font-medium hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <span className={cell.hasTasks ? '-mt-0.5' : ''}>{cell.dayNumber}</span>
                      {cell.hasTasks && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${
                            cell.isSelected ? 'bg-[#FFFFFF]' : 'bg-[#111111]'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1. Greeting Header Row (Screen 1 in Reference) */}
        <div className="px-1 pt-0.5 pb-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight leading-tight m-0 flex items-center gap-1.5">
            {getGreetingText()}{' '}
            <span className="text-base select-none">
              {getGreetingIcon()}
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-[#8A8A8A] mt-0.5 m-0 font-normal">
            Have a great day!
          </p>
        </div>

        {/* Optional Search bar */}
        {isSearchOpen && (
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E0E0E0] rounded-full px-3.5 py-1.5 shadow-xs mt-1 mb-1 animate-in fade-in duration-150">
            <Search size={16} className="text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or subjects..."
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#111111] focus:outline-none placeholder-[#8A8A8A]"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#8A8A8A] hover:text-[#111111] cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* 2. Filter Chip Row: "Today", "Tomorrow", "All" + circular "+" button */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'all', label: 'All' },
            ].map((chip) => {
              const isSelected = filterMode === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    if (chip.id === 'today') {
                      setSelectedDate(today);
                      setFilterMode('today');
                    } else if (chip.id === 'tomorrow') {
                      setSelectedDate(addDays(today, 1));
                      setFilterMode('tomorrow');
                    } else {
                      setFilterMode('all');
                    }
                  }}
                  className={`px-5 py-1.5 rounded-full text-xs font-sans font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#111111] text-[#FFFFFF] border border-[#111111] shadow-xs'
                      : 'bg-[#FFFFFF] text-[#111111] border border-[#D4D4D4] hover:border-[#111111]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Small circular "+" button at the end of the row */}
          <button
            type="button"
            onClick={() => openOverlay('calendar-add-task')}
            className="w-8.5 h-8.5 rounded-full border border-[#D4D4D4] hover:border-[#111111] bg-[#FFFFFF] text-[#111111] flex items-center justify-center transition-all hover:bg-[#F5F5F5] cursor-pointer shadow-2xs flex-shrink-0"
            title="Add task or lesson"
            aria-label="Add task"
          >
            <Plus size={17} strokeWidth={2.4} />
          </button>
        </div>

        {/* 3. Date Display Block (Oversized date treatment + secondary info line on the right) */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div
            onClick={() => openOverlay('calendar-month')}
            className="cursor-pointer select-none group"
            title="Tap to view Year at a Glance"
          >
            <div className="text-xs sm:text-sm font-sans font-medium text-[#8A8A8A]">
              {displayDayName}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-sans text-4xl sm:text-5xl font-black text-[#111111] tracking-tight leading-none">
                {displayDayNum}
              </span>
              <span className="font-sans text-lg sm:text-xl font-black text-[#111111] tracking-wider uppercase">
                {displayMonthName}
              </span>
            </div>
          </div>

          {/* Right side secondary info line matching reference Screen 1 */}
          <div className="flex items-center gap-3 pl-3">
            <div className="w-[1px] h-10 bg-[#E0E0E0]" />
            <div className="text-left">
              <div className="font-sans text-base sm:text-lg font-black text-[#111111] leading-tight">
                {tasksToRender.length} {tasksToRender.length === 1 ? 'task' : 'tasks'}
              </div>
              <div className="text-[11px] sm:text-xs font-sans text-[#8A8A8A] font-medium leading-tight mt-0.5">
                {tasksCompletedCount} completed · {streak}d streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Independently scrollable task card list container below the fixed header */}
      <div
        id="calendar-tasks-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-1 pb-32 space-y-2.5 pr-0.5"
      >
        {tasksToRender.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D4D4D4] p-8 text-center bg-[#FFFFFF] shadow-2xs my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] flex items-center justify-center text-[#8A8A8A]">
              <CalendarIcon size={20} />
            </div>
            <h3 className="font-sans text-sm font-bold text-[#111111] m-0">
              {filterMode === 'tomorrow'
                ? 'Nothing planned for tomorrow'
                : filterMode === 'all'
                ? 'No upcoming tasks'
                : filterMode === 'custom' && selectedDate !== today
                ? `Nothing planned for ${activeDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'Nothing planned for today'}
            </h3>
            <p className="font-sans text-xs text-[#8A8A8A] mt-1 mb-4 max-w-[230px]">
              Tap the <strong className="text-[#111111]">+</strong> button to schedule a lesson or study block.
            </p>
            <button
              type="button"
              onClick={() => openOverlay('calendar-add-task')}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-[#111111] text-[#FFFFFF] text-xs font-bold hover:bg-[#262626] transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} strokeWidth={2.4} /> Add Task
            </button>
          </div>
        ) : (
          tasksToRender.map((task) => renderTaskCard(task))
        )}
      </div>

      {/* Notes & Teach-back Modal */}
      {isNotesModalOpen && (
        <div
          className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={closeOverlay}
        >
          <div
            className="bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#E0E0E0] w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#111111]" />
                <h3 className="font-sans text-xl font-extrabold text-[#111111] m-0">Daily Reflections</h3>
              </div>
              <button
                onClick={closeOverlay}
                className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  Teach-back Summary
                </label>
                <textarea
                  value={currentTargetEntry.teachback || ''}
                  onChange={(e) => updateEntryForDate(activeTargetDate, { teachback: e.target.value })}
                  placeholder="Explain today's core concept in your own words (Feynman technique)..."
                  rows={4}
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-3 text-sm focus:border-[#111111] focus:outline-none resize-none text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  Personal Notes / Mistake Log
                </label>
                <textarea
                  value={currentTargetEntry.notes || ''}
                  onChange={(e) => updateEntryForDate(activeTargetDate, { notes: e.target.value })}
                  placeholder="What went well? What needs more attention tomorrow?"
                  rows={3}
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-3 text-sm focus:border-[#111111] focus:outline-none resize-none text-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[0.7rem] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                    Wake Time
                  </label>
                  <input
                    type="time"
                    value={currentTargetEntry.wakeTime || ''}
                    onChange={(e) => updateEntryForDate(activeTargetDate, { wakeTime: e.target.value })}
                    className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                    Sleep Time
                  </label>
                  <input
                    type="time"
                    value={currentTargetEntry.sleepTime || ''}
                    onChange={(e) => updateEntryForDate(activeTargetDate, { sleepTime: e.target.value })}
                    className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={closeOverlay}
              className="mt-6 w-full py-3 bg-[#111111] text-[#FFFFFF] font-sans font-bold text-sm rounded-xl hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add Task / Study Session Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={closeOverlay}
        >
          <div
            className="bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#E0E0E0] w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans text-xl font-extrabold text-[#111111] m-0">Add to Agenda</h3>
              <button
                onClick={closeOverlay}
                className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-[#F5F5F5] p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setAddMode('task')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  addMode === 'task' ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs' : 'text-[#8A8A8A]'
                }`}
              >
                General Task
              </button>
              <button
                type="button"
                onClick={() => setAddMode('subject')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  addMode === 'subject' ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs' : 'text-[#8A8A8A]'
                }`}
              >
                Subject Log
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              {addMode === 'task' ? (
                <>
                  <div>
                    <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Physics Past Paper 2021"
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2.5 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Details / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newTaskDetail}
                      onChange={(e) => setNewTaskDetail(e.target.value)}
                      placeholder="e.g. Structured Essay questions 1 to 4"
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2.5 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        Time of Day
                      </label>
                      <select
                        value={newTaskPeriod}
                        onChange={(e) => setNewTaskPeriod(e.target.value as any)}
                        className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                      >
                        <option value="morning">Morning (8 AM)</option>
                        <option value="afternoon">Afternoon (2 PM)</option>
                        <option value="evening">Evening (7 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        Duration
                      </label>
                      <select
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                      >
                        <option value="30 min">30 min</option>
                        <option value="45 min">45 min</option>
                        <option value="50 min">50 min</option>
                        <option value="1 hr">1 hr</option>
                        <option value="1.5 hr">1.5 hr</option>
                        <option value="2 hr">2 hr</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      required
                      value={newSubjId}
                      onChange={(e) => {
                        setNewSubjId(e.target.value);
                        setNewLessonId('');
                      }}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
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
                    <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Lesson / Topic (Optional)
                    </label>
                    <select
                      value={newLessonId}
                      onChange={(e) => setNewLessonId(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
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
                      <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        Time of Day
                      </label>
                      <select
                        value={newSubjPeriod}
                        onChange={(e) => setNewSubjPeriod(e.target.value as any)}
                        className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-2 text-sm focus:border-[#111111] focus:outline-none text-[#111111]"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
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
                                ? 'bg-[#111111] text-[#FFFFFF] border-[#111111]'
                                : 'bg-[#F5F5F5] text-[#8A8A8A] border-[#E0E0E0]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-sans font-medium text-[#111111]">
                      <input
                        type="checkbox"
                        checked={newSubjStudied}
                        onChange={(e) => setNewSubjStudied(e.target.checked)}
                      />
                      Studied
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-sans font-medium text-[#111111]">
                      <input
                        type="checkbox"
                        checked={newSubjPastPaper}
                        onChange={(e) => setNewSubjPastPaper(e.target.checked)}
                      />
                      Past Paper
                    </label>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] text-[#FFFFFF] font-sans font-bold text-sm rounded-xl hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Month Picker Modal - Year-at-a-glance multi-month grid */}
      {isMonthModalOpen && (
        <div
          className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4"
          onClick={closeOverlay}
        >
          <div
            className="bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#E0E0E0] w-full max-w-2xl p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] flex items-center justify-center flex-shrink-0">
                  <CalendarIcon size={16} className="text-[#111111]" />
                </div>
                <div>
                  <h2 className="font-sans text-base sm:text-lg font-extrabold text-[#111111] m-0 leading-tight">
                    Year at a Glance
                  </h2>
                  <p className="text-[11px] font-sans text-[#8A8A8A] m-0">
                    Tap any date to view agenda
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Year Switcher */}
                <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-full p-1 border border-[#E0E0E0]">
                  <button
                    type="button"
                    onClick={() => setModalYear((y) => y - 1)}
                    className="p-1 text-[#8A8A8A] hover:text-[#111111] hover:bg-[#FFFFFF] rounded-full transition-colors cursor-pointer"
                    title="Previous year"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>
                  <span className="font-sans font-bold text-xs sm:text-sm px-2 text-[#111111]">
                    {modalYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalYear((y) => y + 1)}
                    className="p-1 text-[#8A8A8A] hover:text-[#111111] hover:bg-[#FFFFFF] rounded-full transition-colors cursor-pointer"
                    title="Next year"
                  >
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeOverlay}
                  className="p-1.5 text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F0F0F0] rounded-full transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Multi-Month Grid */}
            {renderMultiMonthGrid()}

            {/* Modal Footer */}
            <div className="mt-3 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-sans font-bold text-[#111111] bg-[#F5F5F5] hover:bg-[#EAEAEA] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedDate(today);
                  setFilterMode('today');
                  closeOverlay();
                }}
              >
                Jump to Today
              </button>
              <span className="text-[11px] font-sans text-[#8A8A8A]">
                Selected: <strong className="text-[#111111]">{selectedDate}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;
