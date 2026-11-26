import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Search,
  PenTool,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  BookOpen,
  Sun,
  CloudSun,
  Moon,
  MoreHorizontal,
  ArrowRight,
  RotateCcw,
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
  subjectId?: string;
  lessonId?: string;
  partId?: string;
  pastPaperDone?: boolean;
}

const MONTH_ACCENT_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#EC4899',
  '#14B8A6',
  '#84CC16',
  '#64748B',
];

interface AgendaTaskRowProps {
  task: AgendaTask;
  onToggle: (task: AgendaTask) => void;
  onTogglePastPaper: (task: AgendaTask) => void;
  onLongPress: (task: AgendaTask) => void;
}

const AgendaTaskRow: React.FC<AgendaTaskRowProps> = ({
  task,
  onToggle,
  onTogglePastPaper,
  onLongPress,
}) => {
  const timerRef = React.useRef<number | null>(null);
  const isLongPressTriggered = React.useRef(false);
  const touchStartPos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartPos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }
      onLongPress(task);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (timerRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimer();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearTimer();
    if (isLongPressTriggered.current && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      onLongPress(task);
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (timerRef.current === null) return;
    const dx = e.clientX - mouseStartPos.current.x;
    const dy = e.clientY - mouseStartPos.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimer();
    }
  };

  const handleMouseUp = () => clearTimer();
  const handleMouseLeave = () => clearTimer();

  const handleClick = () => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    onToggle(task);
  };

  const isSubjectWithPart = task.source === 'subject' && !!task.partId;
  const isWatched = task.done;
  const isPastPaper = !!task.pastPaperDone;

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearTimer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        clearTimer();
        onLongPress(task);
      }}
      title="Tap to toggle · Hold or use menu to edit or delete"
      className={`group px-4 sm:px-5 py-3.5 transition-colors cursor-pointer flex items-start gap-3 select-none ${
        isWatched ? 'bg-[#FAFAF8]/65 hover:bg-[#FAFAF8]' : 'bg-[#FFFFFF] hover:bg-[#FAFAF8]'
      }`}
    >
      {/* 40px touch target around 20px circle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        className="w-10 h-10 -ml-2 -my-1 flex items-center justify-center rounded-xl hover:bg-[#F2F2EE] transition-colors cursor-pointer flex-shrink-0"
        aria-label={isWatched ? 'Mark incomplete' : 'Mark watched'}
        title={isWatched ? 'Done (click to unmark)' : 'Click to mark done'}
      >
        <span
          className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
            isWatched ? 'text-[#FFFFFF]' : 'border-[#C8C8C0] bg-[#FFFFFF]'
          }`}
          style={
            isWatched
              ? { backgroundColor: task.accentColor, borderColor: task.accentColor }
              : undefined
          }
        >
          {isWatched && <Check size={11} strokeWidth={3} className="text-[#FFFFFF]" />}
        </span>
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-sans font-semibold text-sm sm:text-[15px] leading-snug tracking-tight break-words m-0 ${
              isWatched ? 'line-through text-[#787873]' : 'text-[#111111]'
            }`}
          >
            {task.title}
          </h3>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLongPress(task);
            }}
            aria-label={`Task options for ${task.title}`}
            title="Edit or delete"
            className="w-8 h-8 -mr-1.5 -mt-1 rounded-lg flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer flex-shrink-0"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Unboxed Metadata + Interactive Step 2 Past Paper Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap mt-1.5">
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-sans text-[#787873] tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#525252]">
              <span
                className="w-2 h-2 rounded-[3px] flex-shrink-0"
                style={{ backgroundColor: task.accentColor }}
                aria-hidden="true"
              />
              <span>{task.subjectLabel}</span>
            </span>
            {task.duration && (
              <>
                <span aria-hidden="true">·</span>
                <span>{task.duration}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-[#525252] font-medium">
              <Clock size={11} className="text-[#787873]" />
              {task.timeDisplay}
            </span>
          </div>

          {isSubjectWithPart && (
            <button
              type="button"
              disabled={!isWatched}
              onClick={(e) => {
                e.stopPropagation();
                if (isWatched) {
                  onTogglePastPaper(task);
                }
              }}
              className={`min-h-[28px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold border transition-colors flex-shrink-0 ${
                !isWatched
                  ? 'bg-[#F7F7F5] text-[#A8A8A2] border-[#EFEFEA] cursor-not-allowed'
                  : isPastPaper
                  ? 'bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/30 hover:bg-[#16A34A]/15 cursor-pointer'
                  : 'bg-[#FFFFFF] text-[#525252] border-[#E5E5E0] hover:border-[#111111] hover:text-[#111111] cursor-pointer'
              }`}
              title={
                !isWatched
                  ? 'Mark "Watched" first to unlock Past Paper'
                  : isPastPaper
                  ? 'Past Paper done (click to toggle)'
                  : 'Mark Past Paper done'
              }
            >
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  !isWatched
                    ? 'border-[#D8D8D2] bg-[#FFFFFF]'
                    : isPastPaper
                    ? 'bg-[#16A34A] border-[#16A34A] text-[#FFFFFF]'
                    : 'border-[#C8C8C0] bg-[#FFFFFF]'
                }`}
              >
                {isWatched && isPastPaper && <Check size={9} strokeWidth={3.5} />}
              </span>
              <span>Past paper</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CalendarTab: React.FC<CalendarTabProps> = ({ onNavigateToRevisit }) => {
  const {
    dailyEntries,
    saveDailyEntry,
    updateDailyEntry,
    subjects,
    lessons,
    revisits,
    updateRevisit,
    updateLessonParts,
  } = useStore();

  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterMode, setFilterMode] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');

  // Mobile collapsible month grid
  const [isMonthGridExpanded, setIsMonthGridExpanded] = useState<boolean>(false);
  const [viewingYear, setViewingYear] = useState<number>(() => {
    const d = new Date(today.replace(/-/g, '/'));
    return !isNaN(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
  });
  const [viewingMonth, setViewingMonth] = useState<number>(() => {
    const d = new Date(today.replace(/-/g, '/'));
    return !isNaN(d.getMonth()) ? d.getMonth() : new Date().getMonth();
  });

  const { activeOverlay, openOverlay, closeOverlay, setTab, openSubject } = useNavigation();

  const isSearchOpen = activeOverlay === 'calendar-search';
  const [searchQuery, setSearchQuery] = useState('');
  const isNotesModalOpen = activeOverlay === 'calendar-notes';
  const isAddModalOpen = activeOverlay === 'calendar-add-task';
  const isMonthModalOpen = activeOverlay === 'calendar-month';
  const [modalYear, setModalYear] = useState<number>(() => new Date().getFullYear());

  useEffect(() => {
    if (isMonthModalOpen) {
      const d = new Date(selectedDate.replace(/-/g, '/'));
      if (!isNaN(d.getFullYear())) {
        setModalYear(d.getFullYear());
      }
    }
  }, [isMonthModalOpen, selectedDate]);

  useEffect(() => {
    if (!isMonthGridExpanded) {
      const d = new Date(selectedDate.replace(/-/g, '/'));
      if (!isNaN(d.getFullYear())) {
        setViewingYear(d.getFullYear());
        setViewingMonth(d.getMonth());
      }
    }
  }, [selectedDate, isMonthGridExpanded]);

  useEffect(() => {
    if (selectedDate === today) {
      setFilterMode('today');
    } else if (selectedDate === addDays(today, 1)) {
      setFilterMode('tomorrow');
    }
  }, [selectedDate, today]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const viewingMonthName = useMemo(
    () => new Date(viewingYear, viewingMonth, 1).toLocaleDateString('en-US', { month: 'long' }),
    [viewingYear, viewingMonth]
  );

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

  const hasTasksForDate = (dateStr: string): boolean => {
    const dayEntry = dailyEntries[dateStr];
    if (dayEntry) {
      if (dayEntry.hours && dayEntry.hours.length > 0) return true;
      if (dayEntry.subjects && dayEntry.subjects.length > 0) return true;
    }
    if (revisits && revisits.some((r) => r.date === dateStr)) return true;
    return false;
  };

  const calendarGridCells = useMemo(() => {
    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      hasTasks: boolean;
    }[] = [];

    const toDateKey = (year: number, monthIndex: number, day: number) =>
      `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const firstDayOfMonth = new Date(viewingYear, viewingMonth, 1);
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewingYear, viewingMonth, 0).getDate();

    const prevYear = viewingMonth === 0 ? viewingYear - 1 : viewingYear;
    const prevMonth = viewingMonth === 0 ? 11 : viewingMonth - 1;

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

  // Add modal state
  const [addMode, setAddMode] = useState<'task' | 'subject'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [newTaskPeriod, setNewTaskPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newTaskDuration, setNewTaskDuration] = useState('50 min');

  const [newSubjId, setNewSubjId] = useState('');
  const [newLessonId, setNewLessonId] = useState('');
  const [newPartId, setNewPartId] = useState('');
  const [newSubjPeriod, setNewSubjPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [newSubjStudied, setNewSubjStudied] = useState(true);
  const [newSubjPastPaper, setNewSubjPastPaper] = useState(false);
  const [newSubjConfidence, setNewSubjConfidence] = useState<'L' | 'M' | 'H'>('M');

  // Action Sheet & Edit/Delete Modals
  const [actionTask, setActionTask] = useState<AgendaTask | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDetail, setEditTaskDetail] = useState('');
  const [editTaskPeriod, setEditTaskPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [editTaskDuration, setEditTaskDuration] = useState('50 min');

  const [editSubjId, setEditSubjId] = useState('');
  const [editLessonId, setEditLessonId] = useState('');
  const [editPartId, setEditPartId] = useState('');
  const [editSubjPeriod, setEditSubjPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [editSubjStudied, setEditSubjStudied] = useState(false);
  const [editSubjPastPaper, setEditSubjPastPaper] = useState(false);
  const [editSubjConfidence, setEditSubjConfidence] = useState<'L' | 'M' | 'H'>('M');

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

  const handleTaskLongPress = (task: AgendaTask) => {
    setActionTask(task);
    setIsActionMenuOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!actionTask) return;
    setIsActionMenuOpen(false);

    if (actionTask.source === 'subject') {
      const entry = dailyEntries[actionTask.date];
      const log = (entry?.subjects || []).find((s) => s.id === actionTask.originalId);
      setEditSubjId(actionTask.subjectId || log?.subjectId || '');
      setEditLessonId(actionTask.lessonId || log?.lessonId || '');
      setEditPartId(actionTask.partId || log?.partId || '');
      setEditSubjPeriod((log as any)?.period || actionTask.period || 'afternoon');
      setEditSubjStudied(actionTask.done);
      setEditSubjPastPaper(actionTask.pastPaperDone || false);
      setEditSubjConfidence(log?.confidence || 'M');
    } else if (actionTask.source === 'hour') {
      const entry = dailyEntries[actionTask.date];
      const hourBlock = (entry?.hours || []).find((h) => h.id === actionTask.originalId);
      setEditTaskTitle(actionTask.title);
      setEditTaskDetail(actionTask.detail || '');
      setEditTaskPeriod((hourBlock as any)?.period || actionTask.period || 'morning');
      setEditTaskDuration(actionTask.duration || (hourBlock as any)?.duration || '50 min');
    }

    setIsEditModalOpen(true);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTask) return;
    const targetDate = actionTask.date;
    const baseEntry = dailyEntries[targetDate] || {
      date: targetDate,
      hours: [],
      subjects: [],
      teachback: '',
      notes: '',
      wakeTime: '',
      sleepTime: '',
    };

    if (actionTask.source === 'subject') {
      if (!editSubjId || !editLessonId) return;
      const updatedSubjects = (baseEntry.subjects || []).map((s) => {
        if (s.id === actionTask.originalId) {
          return {
            ...s,
            subjectId: editSubjId,
            lessonId: editLessonId,
            partId: editPartId || undefined,
            studied: editSubjStudied,
            pastPaper: editSubjPastPaper,
            confidence: editSubjConfidence,
            period: editSubjPeriod,
          };
        }
        return s;
      });
      updateEntryForDate(targetDate, { subjects: updatedSubjects });

      if (editLessonId && editPartId) {
        const lessonObj = lessons.find((l) => l.id === editLessonId);
        if (lessonObj && lessonObj.parts) {
          const updatedParts = lessonObj.parts.map((p) =>
            p.id === editPartId ? { ...p, watched: editSubjStudied, pastPaper: editSubjPastPaper } : p
          );
          updateLessonParts(editLessonId, updatedParts);
        }
      }
    } else if (actionTask.source === 'hour') {
      if (!editTaskTitle.trim()) return;
      const fullTaskStr = editTaskDetail.trim()
        ? `${editTaskTitle.trim()}: ${editTaskDetail.trim()}`
        : editTaskTitle.trim();
      const updatedHours = (baseEntry.hours || []).map((h) => {
        if (h.id === actionTask.originalId) {
          return {
            ...h,
            task: fullTaskStr,
            time: editTaskPeriod === 'morning' ? '8:00 AM' : editTaskPeriod === 'afternoon' ? '2:00 PM' : '7:00 PM',
            duration: editTaskDuration,
            period: editTaskPeriod,
          };
        }
        return h;
      });
      updateEntryForDate(targetDate, { hours: updatedHours });
    }

    setIsEditModalOpen(false);
    setActionTask(null);
  };

  const handleConfirmDelete = () => {
    if (!actionTask) return;
    const targetDate = actionTask.date;
    const baseEntry = dailyEntries[targetDate];
    if (!baseEntry) {
      setIsDeleteConfirmOpen(false);
      setActionTask(null);
      return;
    }

    if (actionTask.source === 'subject') {
      const updatedSubjects = (baseEntry.subjects || []).filter((s) => s.id !== actionTask.originalId);
      updateEntryForDate(targetDate, { subjects: updatedSubjects });
    } else if (actionTask.source === 'hour') {
      const updatedHours = (baseEntry.hours || []).filter((h) => h.id !== actionTask.originalId);
      updateEntryForDate(targetDate, { hours: updatedHours });
    } else if (actionTask.source === 'revisit') {
      if (typeof updateRevisit === 'function') {
        updateRevisit(actionTask.originalId, { done: false });
      }
    }

    setIsDeleteConfirmOpen(false);
    setActionTask(null);
  };

  const parseTimeToHour = (timeStr: string) => {
    const m = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (!m) return 9;
    let h = parseInt(m[1], 10);
    const pm = m[3] ? m[3].toLowerCase() === 'pm' : false;
    if (h === 12 && !pm) h = 0;
    if (h < 12 && pm) h += 12;
    return h;
  };

  const formatTime12h = (timeStr?: string, defaultHour = 9): string => {
    if (!timeStr || !timeStr.trim()) {
      const h12 = defaultHour % 12 === 0 ? 12 : defaultHour % 12;
      const ampm = defaultHour >= 12 ? 'PM' : 'AM';
      return `${h12}:00 ${ampm}`;
    }

    const trimmed = timeStr.trim();
    const m = trimmed.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
    if (!m) return trimmed;

    let h = parseInt(m[1], 10);
    const min = m[2] ? m[2] : '00';
    const ampmSpec = m[3] ? m[3].toUpperCase() : null;

    if (ampmSpec) {
      if (ampmSpec === 'PM' && h < 12) h += 12;
      if (ampmSpec === 'AM' && h === 12) h = 0;
    }

    const finalAmpm = h >= 12 ? 'PM' : 'AM';
    const finalH12 = h % 12 === 0 ? 12 : h % 12;
    return `${finalH12}:${min} ${finalAmpm}`;
  };

  const getTasksForDate = (dateStr: string): AgendaTask[] => {
    const dayEntry = dailyEntries[dateStr];
    const result: AgendaTask[] = [];

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

        const timeDisplay = formatTime12h(h.time, hour);
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

    if (dayEntry && dayEntry.subjects) {
      dayEntry.subjects.forEach((s, idx) => {
        const subj = subjects.find((sub) => sub.id === s.subjectId);
        const lesson = lessons.find((l) => l.id === s.lessonId);
        const subjName = subj ? subj.name : 'Subject';
        const lessonName = lesson ? lesson.name : 'Lesson';
        const part = lesson?.parts?.find((p) => p.id === s.partId);
        const partName = part ? part.name : '';

        const isWatched = part ? !!part.watched : !!s.studied;
        const isPastPaper = part ? !!part.pastPaper : !!s.pastPaper;

        const title = partName ? `${subjName} — ${lessonName}: ${partName}` : `${subjName} — ${lessonName}`;

        const defaultPeriod = idx % 3 === 0 ? 'morning' : idx % 3 === 1 ? 'afternoon' : 'evening';
        const period = (s as any).period || defaultPeriod;
        const defaultHour = period === 'morning' ? 8 : period === 'afternoon' ? 14 : 19;
        const timeDisplay = formatTime12h(undefined, defaultHour + (idx % 3));
        const accentColor = getSubjectColorById(s.subjectId, subjects);

        result.push({
          id: `s_${dateStr}_${s.id}`,
          source: 'subject',
          originalId: s.id,
          date: dateStr,
          title,
          timeDisplay,
          subjectLabel: partName
            ? `${subjName} · Part`
            : s.pastPaper
            ? `${subjName} · Past Paper`
            : `${subjName} · Lesson`,
          duration: (s as any).duration || (isPastPaper ? '60 min' : '45 min'),
          period,
          done: isWatched,
          accentColor,
          subjectId: s.subjectId,
          lessonId: s.lessonId,
          partId: s.partId,
          pastPaperDone: isPastPaper,
        });
      });
    }

    // Future scheduled revisits (or already completed revisits for this date); pending due/overdue
    // revisits on Today are shown in the unified "Due for Review" card without duplication.
    (revisits || [])
      .filter((r) => r.date === dateStr && (dateStr > today || r.done))
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
          title: `${subjName} — ${lessonName}`,
          timeDisplay: '9:00 AM',
          subjectLabel: `${subjName} · ${r.type}`,
          duration: '30 min',
          period: 'morning',
          done: !!r.done,
          accentColor,
        });
      });

    return result;
  };

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
      const nextDone = !task.done;

      if (task.lessonId && task.partId) {
        const lesson = lessons.find((l) => l.id === task.lessonId);
        if (lesson && lesson.parts) {
          const updatedParts = lesson.parts.map((p) =>
            p.id === task.partId ? { ...p, watched: nextDone } : p
          );
          updateLessonParts(task.lessonId, updatedParts);
        }
      }

      const updatedSubjects = (targetEntry.subjects || []).map((s) =>
        s.id === task.originalId ? { ...s, studied: nextDone } : s
      );
      saveFn(targetDate, { ...targetEntry, subjects: updatedSubjects });
    }
  };

  const handleToggleTaskPastPaper = (task: AgendaTask) => {
    const nextPP = !task.pastPaperDone;

    if (task.lessonId && task.partId) {
      const lesson = lessons.find((l) => l.id === task.lessonId);
      if (lesson && lesson.parts) {
        const updatedParts = lesson.parts.map((p) =>
          p.id === task.partId ? { ...p, pastPaper: nextPP } : p
        );
        updateLessonParts(task.lessonId, updatedParts);
      }
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
    if (typeof saveFn === 'function') {
      const updatedSubjects = (targetEntry.subjects || []).map((s) =>
        s.id === task.originalId ? { ...s, pastPaper: nextPP } : s
      );
      saveFn(targetDate, { ...targetEntry, subjects: updatedSubjects });
    }
  };

  // Due & overdue revisits for the unified Today view
  const dueRevisits = useMemo(() => {
    return (revisits || [])
      .filter((r) => !r.done && r.date <= today && lessons.some((l) => l.id === r.lessonId))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [revisits, today, lessons]);

  const showDueRevisitsStrip =
    (filterMode === 'today' || (filterMode === 'custom' && selectedDate === today)) &&
    dueRevisits.length > 0;

  const streak = useMemo(() => {
    let count = 0;
    let curr = today;
    const hasTodayActivity =
      !!dailyEntries[today] &&
      ((dailyEntries[today].hours || []).some((h) => h.done) ||
        (dailyEntries[today].subjects || []).some((s) => s.studied || s.pastPaper));
    if (hasTodayActivity) {
      count++;
      curr = addDays(today, -1);
    } else {
      curr = addDays(today, -1);
    }
    for (let i = 0; i < 90; i++) {
      const e = dailyEntries[curr];
      const had =
        !!e &&
        ((e.hours || []).some((h) => h.done) ||
          (e.subjects || []).some((s) => s.studied || s.pastPaper));
      if (had) {
        count++;
        curr = addDays(curr, -1);
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  }, [dailyEntries, today]);

  const displayedTasks = useMemo(() => {
    if (filterMode === 'today') return getTasksForDate(today);
    if (filterMode === 'tomorrow') return getTasksForDate(addDays(today, 1));
    if (filterMode === 'custom') return getTasksForDate(selectedDate);

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
        const dayLabel =
          d === today
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
  }, [filterMode, selectedDate, today, dailyEntries, subjects, lessons, revisits]);

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

  const getTimeOfDayPeriod = (timeStr?: string): 'morning' | 'afternoon' | 'evening' => {
    if (!timeStr) return 'morning';
    const hour = parseTimeToHour(timeStr);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const groupedSections = useMemo(() => {
    const morningTasks: AgendaTask[] = [];
    const afternoonTasks: AgendaTask[] = [];
    const eveningTasks: AgendaTask[] = [];

    tasksToRender.forEach((task) => {
      const period = getTimeOfDayPeriod(task.timeDisplay);
      if (period === 'morning') morningTasks.push(task);
      else if (period === 'afternoon') afternoonTasks.push(task);
      else eveningTasks.push(task);
    });

    const sections: Array<{
      key: 'morning' | 'afternoon' | 'evening';
      title: string;
      icon: typeof Sun;
      tasks: AgendaTask[];
    }> = [];

    if (morningTasks.length > 0) {
      sections.push({ key: 'morning', title: 'Morning', icon: Sun, tasks: morningTasks });
    }
    if (afternoonTasks.length > 0) {
      sections.push({ key: 'afternoon', title: 'Afternoon', icon: CloudSun, tasks: afternoonTasks });
    }
    if (eveningTasks.length > 0) {
      sections.push({ key: 'evening', title: 'Evening', icon: Moon, tasks: eveningTasks });
    }

    return sections;
  }, [tasksToRender]);

  const activeDisplayDate =
    filterMode === 'tomorrow' ? addDays(today, 1) : filterMode === 'all' ? today : selectedDate;

  const activeDateObj = new Date(activeDisplayDate.replace(/-/g, '/'));
  const formattedHeaderDate =
    filterMode === 'all'
      ? 'Next 7 days & upcoming'
      : activeDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

  // 7-day Monday-Sunday week strip centered around activeDisplayDate
  const weekStripDays = useMemo(() => {
    const base = new Date(activeDisplayDate.replace(/-/g, '/'));
    const mondayOffset = -((base.getDay() + 6) % 7);
    const mondayStr = addDays(activeDisplayDate, mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = addDays(mondayStr, i);
      const d = new Date(dateStr.replace(/-/g, '/'));
      return {
        dateStr,
        dayShort: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNumber: d.getDate(),
        isToday: dateStr === today,
        isSelected: filterMode !== 'all' && dateStr === activeDisplayDate,
        hasTasks: hasTasksForDate(dateStr),
      };
    });
  }, [activeDisplayDate, filterMode, today, dailyEntries, revisits]);

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
        time: newTaskPeriod === 'morning' ? '8:00 AM' : newTaskPeriod === 'afternoon' ? '2:00 PM' : '7:00 PM',
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
      if (!newSubjId || !newLessonId) return;
      const newLog: DailySubjectLog & { duration?: string; period?: string } = {
        id: uid(),
        subjectId: newSubjId,
        lessonId: newLessonId,
        partId: newPartId || undefined,
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

      if (newLessonId && newPartId) {
        const lessonObj = lessons.find((l) => l.id === newLessonId);
        if (lessonObj && lessonObj.parts) {
          const updatedParts = lessonObj.parts.map((p) =>
            p.id === newPartId ? { ...p, watched: newSubjStudied, pastPaper: newSubjPastPaper } : p
          );
          updateLessonParts(newLessonId, updatedParts);
        }
      }

      setNewSubjId('');
      setNewLessonId('');
      setNewPartId('');
      closeOverlay();
    }
  };

  const renderMultiMonthGrid = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const toDateString = (year: number, month: number, day: number) =>
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto max-h-[62dvh] p-0.5 scrollbar-hide">
        {months.map((monthIndex) => {
          const monthColor = MONTH_ACCENT_COLORS[monthIndex % MONTH_ACCENT_COLORS.length];
          const firstDayOfWeek = new Date(modalYear, monthIndex, 1).getDay();
          const daysInCurrentMonth = new Date(modalYear, monthIndex + 1, 0).getDate();
          const monthName = new Date(modalYear, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });

          const cells: (number | null)[] = [];
          for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
          for (let d = 1; d <= daysInCurrentMonth; d++) cells.push(d);

          return (
            <div
              key={monthIndex}
              className="rounded-2xl p-2.5 sm:p-3 border border-[#E5E5E0] bg-[#FAFAF8] flex flex-col"
            >
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="inline-flex items-center gap-1.5 font-sans font-bold text-xs sm:text-sm text-[#111111]">
                  <span
                    className="w-2 h-2 rounded-[3px] flex-shrink-0"
                    style={{ backgroundColor: monthColor }}
                    aria-hidden="true"
                  />
                  {monthName}
                </span>
                <span className="text-[10px] font-sans font-medium text-[#787873] tabular-nums">
                  {modalYear}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
                  <span key={i} className="text-[9px] font-sans font-semibold text-[#787873]">
                    {wd}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center tabular-nums">
                {cells.map((dayNum, i) => {
                  if (dayNum === null) {
                    return <div key={`empty-${i}`} className="h-6 w-6 mx-auto" />;
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
                        else setFilterMode('custom');
                        closeOverlay();
                      }}
                      className={`h-6 w-6 mx-auto rounded-full flex flex-col items-center justify-center text-[10px] sm:text-[11px] font-sans transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#111111] text-[#FFFFFF] font-bold'
                          : isTodayDate
                          ? 'ring-1 ring-[#111111] font-bold text-[#111111] hover:bg-[#EFEFEA]'
                          : 'text-[#111111] hover:bg-[#EFEFEA]'
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

  const monthCalendarCard = (
    <div className="bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl p-4 shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-sans font-bold text-sm text-[#111111]">{viewingMonthName}</span>
          <span className="font-sans font-semibold text-xs text-[#787873] tabular-nums">
            {viewingYear}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center pb-1.5 border-b border-[#EFEFEA]">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((wd) => (
          <span key={wd} className="text-[11px] font-sans font-semibold text-[#787873] py-0.5">
            {wd}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center pt-2 tabular-nums">
        {calendarGridCells.map((cell) => (
          <div key={cell.dateStr} className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleSelectCalendarDate(cell.dateStr)}
              className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-sans transition-colors cursor-pointer relative select-none ${
                cell.isSelected
                  ? 'bg-[#111111] text-[#FFFFFF] font-bold'
                  : cell.isToday
                  ? 'border border-[#111111] text-[#111111] font-bold hover:bg-[#F2F2EE]'
                  : !cell.isCurrentMonth
                  ? 'text-[#B8B8B2] hover:bg-[#F2F2EE] hover:text-[#525252]'
                  : 'text-[#111111] font-medium hover:bg-[#F2F2EE]'
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
        ))}
      </div>
    </div>
  );

  const dueRevisitsCard = showDueRevisitsStrip && (
    <section className="bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
      <div className="px-4 sm:px-5 py-3 border-b border-[#EFEFEA] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <RotateCcw size={15} className="text-[#111111] flex-shrink-0" />
          <h2 className="font-sans text-sm font-bold text-[#111111] m-0">
            Due for Review
          </h2>
          <span className="text-xs font-sans font-semibold text-[#787873] tabular-nums">
            ({dueRevisits.length})
          </span>
        </div>
        {onNavigateToRevisit && (
          <button
            type="button"
            onClick={onNavigateToRevisit}
            className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-[#525252] hover:text-[#111111] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="divide-y divide-[#EFEFEA]">
        {dueRevisits.slice(0, 4).map((r) => {
          const isOverdue = r.date < today;
          const subject = subjects.find((s) => s.id === r.subjectId);
          const lesson = lessons.find((l) => l.id === r.lessonId);
          const accentColor = getSubjectColorById(r.subjectId, subjects);

          return (
            <div
              key={r.id}
              className="px-4 sm:px-5 py-3 hover:bg-[#FAFAF8] transition-colors flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => updateRevisit(r.id, { done: true })}
                aria-label={`Complete review for ${lesson?.name || 'lesson'}`}
                className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-[#F2F2EE] transition-colors cursor-pointer flex-shrink-0 group"
              >
                <span className="w-5 h-5 rounded-full border-[1.5px] border-[#C8C8C0] group-hover:border-[#16A34A] bg-[#FFFFFF] block transition-colors" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-sm text-[#111111] leading-snug break-words">
                  {lesson?.name || 'Lesson Revisit'}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs font-sans text-[#787873] tabular-nums">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#525252]">
                    <span
                      className="w-2 h-2 rounded-[3px] flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                      aria-hidden="true"
                    />
                    <span>{subject?.name || 'Subject'}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{r.type}</span>
                  <span aria-hidden="true">·</span>
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                      <AlertCircle size={12} />
                      <span>Overdue</span>
                    </span>
                  ) : (
                    <span className="text-[#111111] font-semibold">Due today</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Top Workspace Strip: Date Summary, Mode Switcher, Utility Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-sans text-sm sm:text-base font-bold text-[#111111] leading-snug">
              {formattedHeaderDate}
            </div>
            <div className="text-xs font-sans text-[#787873] tabular-nums mt-0.5">
              {tasksCompletedCount}/{tasksToRender.length} tasks done · {streak}d streak
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Segmented View Filter */}
            <div className="inline-flex bg-[#EFEFEA] p-1 rounded-xl border border-[#E5E5E0]">
              {[
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'all', label: 'Upcoming' },
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
                    className={`min-h-[30px] px-2.5 sm:px-3 py-1 rounded-lg text-xs font-sans font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#FFFFFF] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]'
                        : 'text-[#787873] hover:text-[#111111]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Month Toggle + Toolbar Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMonthGrid}
                aria-expanded={isMonthGridExpanded}
                aria-label="Toggle month calendar"
                title="Toggle month calendar"
                className={`lg:hidden h-9 px-2.5 rounded-xl border text-xs font-sans font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  isMonthGridExpanded
                    ? 'bg-[#111111] text-[#FFFFFF] border-[#111111]'
                    : 'bg-[#FFFFFF] text-[#111111] border-[#E5E5E0] hover:bg-[#F2F2EE]'
                }`}
              >
                <span className="truncate max-w-[68px]">{viewingMonthName.slice(0, 3)}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isMonthGridExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => (isSearchOpen ? closeOverlay() : openOverlay('calendar-search'))}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  isSearchOpen
                    ? 'bg-[#111111] text-[#FFFFFF] border-[#111111]'
                    : 'bg-[#FFFFFF] text-[#525252] border-[#E5E5E0] hover:text-[#111111] hover:bg-[#F2F2EE]'
                }`}
                title="Search tasks"
                aria-label="Search tasks"
              >
                <Search size={16} />
              </button>

              <button
                type="button"
                onClick={() => openOverlay('calendar-notes')}
                className="w-9 h-9 rounded-xl border bg-[#FFFFFF] text-[#525252] border-[#E5E5E0] hover:text-[#111111] hover:bg-[#F2F2EE] flex items-center justify-center transition-colors cursor-pointer"
                title="Daily Reflections"
                aria-label="Daily Reflections"
              >
                <PenTool size={16} />
              </button>

              <button
                type="button"
                onClick={() => openOverlay('calendar-month')}
                className="w-9 h-9 rounded-xl border bg-[#FFFFFF] text-[#525252] border-[#E5E5E0] hover:text-[#111111] hover:bg-[#F2F2EE] flex items-center justify-center transition-colors cursor-pointer"
                title="Year at a glance"
                aria-label="Year at a glance"
              >
                <CalendarIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E5E0] focus-within:border-[#111111] rounded-xl px-3.5 py-2 transition-colors">
            <Search size={15} className="text-[#787873] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, lessons, or subjects..."
              className="flex-1 bg-transparent border-none text-sm text-[#111111] focus:outline-none placeholder:text-[#787873] p-0"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#787873] hover:text-[#111111] cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Horizontal 7-Day Week Strip */}
        <div className="grid grid-cols-7 gap-1 bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl p-1.5 shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
          {weekStripDays.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => handleSelectCalendarDate(day.dateStr)}
              className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer select-none ${
                day.isSelected
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : day.isToday
                  ? 'bg-[#F2F2EE] text-[#111111] ring-1 ring-[#111111]/25'
                  : 'text-[#525252] hover:bg-[#F7F7F5] hover:text-[#111111]'
              }`}
            >
              <span
                className={`text-[10px] font-sans font-semibold uppercase ${
                  day.isSelected ? 'text-[#FFFFFF]/75' : 'text-[#787873]'
                }`}
              >
                {day.dayShort}
              </span>
              <span className="text-sm font-sans font-bold tabular-nums leading-none">
                {day.dayNumber}
              </span>
              <span
                className={`w-1 h-1 rounded-full mt-0.5 ${
                  day.hasTasks
                    ? day.isSelected
                      ? 'bg-[#FFFFFF]'
                      : 'bg-[#111111]'
                    : 'bg-transparent'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Responsive 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Month Picker + Desktop Reflections Preview */}
        <div
          className={`${
            isMonthGridExpanded ? 'flex' : 'hidden lg:flex'
          } lg:col-span-5 xl:col-span-4 flex-col gap-4`}
        >
          {monthCalendarCard}

          {/* Desktop Reflections Card */}
          <div className="hidden lg:flex flex-col gap-3 bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl p-4 shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PenTool size={14} className="text-[#111111]" />
                <h3 className="font-sans text-sm font-bold text-[#111111] m-0">
                  Daily Reflections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openOverlay('calendar-notes')}
                className="text-xs font-sans font-semibold text-[#525252] hover:text-[#111111] cursor-pointer"
              >
                Edit
              </button>
            </div>

            {currentTargetEntry.teachback || currentTargetEntry.notes ? (
              <p className="text-xs font-sans text-[#525252] leading-relaxed line-clamp-3 m-0">
                {currentTargetEntry.teachback || currentTargetEntry.notes}
              </p>
            ) : (
              <p className="text-xs font-sans text-[#787873] leading-relaxed m-0">
                Summarize what you learned today or log mistakes to revisit.
              </p>
            )}

            {(currentTargetEntry.wakeTime || currentTargetEntry.sleepTime) && (
              <div className="pt-2 border-t border-[#EFEFEA] flex items-center gap-3 text-[11px] font-sans text-[#787873] tabular-nums">
                {currentTargetEntry.wakeTime && <span>Wake {currentTargetEntry.wakeTime}</span>}
                {currentTargetEntry.sleepTime && <span>Sleep {currentTargetEntry.sleepTime}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right / Main Column: Unified Due for Review + Timeline */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5 min-w-0">
          {dueRevisitsCard}

          {tasksToRender.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D4D4CE] p-8 sm:p-10 text-center bg-[#FFFFFF] flex flex-col items-center justify-center">
              <div className="w-11 h-11 mb-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] flex items-center justify-center text-[#787873]">
                <CalendarIcon size={20} />
              </div>
              <h3 className="font-sans text-sm font-bold text-[#111111] m-0">
                {searchQuery.trim()
                  ? 'No matching tasks'
                  : filterMode === 'tomorrow'
                  ? 'Nothing planned for tomorrow'
                  : filterMode === 'all'
                  ? 'No upcoming tasks'
                  : filterMode === 'custom' && selectedDate !== today
                  ? `Nothing planned for ${activeDateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}`
                  : 'Nothing planned for today'}
              </h3>
              <p className="font-sans text-xs text-[#787873] mt-1 mb-4 max-w-[260px]">
                {searchQuery.trim()
                  ? 'Try a different search keyword or clear the filter.'
                  : 'Schedule a lesson part or study block to build your day.'}
              </p>
              {!searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => openOverlay('calendar-add-task')}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#FFFFFF] text-xs font-sans font-bold hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          ) : (
            groupedSections.map((sec) => {
              const IconComp = sec.icon;
              return (
                <section key={sec.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 select-none">
                    <div className="flex items-center gap-2 text-[#525252]">
                      <IconComp size={14} strokeWidth={2.2} className="text-[#787873]" />
                      <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-[#787873] m-0">
                        {sec.title}
                      </h2>
                    </div>
                    <span className="text-xs font-sans font-semibold text-[#787873] tabular-nums">
                      {sec.tasks.length}
                    </span>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl overflow-hidden divide-y divide-[#EFEFEA] shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
                    {sec.tasks.map((task) => (
                      <AgendaTaskRow
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        onTogglePastPaper={handleToggleTaskPastPaper}
                        onLongPress={handleTaskLongPress}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* Daily Reflections Modal */}
      {isNotesModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-[#111111]/45 backdrop-blur-xs z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={closeOverlay}
          >
            <div
              className="bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E5E0] w-full sm:max-w-md p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#111111]" />
                  <h3 className="font-sans text-lg font-extrabold text-[#111111] m-0">
                    Daily Reflections
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1.5">
                    Teach-back Summary
                  </label>
                  <textarea
                    value={currentTargetEntry.teachback || ''}
                    onChange={(e) => updateEntryForDate(activeTargetDate, { teachback: e.target.value })}
                    placeholder="Explain today's core concept in your own words (Feynman technique)..."
                    rows={4}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl p-3 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none resize-none text-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1.5">
                    Personal Notes / Mistake Log
                  </label>
                  <textarea
                    value={currentTargetEntry.notes || ''}
                    onChange={(e) => updateEntryForDate(activeTargetDate, { notes: e.target.value })}
                    placeholder="What went well? What needs more attention tomorrow?"
                    rows={3}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl p-3 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none resize-none text-[#111111]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                      Wake Time
                    </label>
                    <input
                      type="time"
                      value={currentTargetEntry.wakeTime || ''}
                      onChange={(e) => updateEntryForDate(activeTargetDate, { wakeTime: e.target.value })}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                      Sleep Time
                    </label>
                    <input
                      type="time"
                      value={currentTargetEntry.sleepTime || ''}
                      onChange={(e) => updateEntryForDate(activeTargetDate, { sleepTime: e.target.value })}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeOverlay}
                className="mt-6 w-full min-h-[44px] py-2.5 bg-[#111111] text-[#FFFFFF] font-sans font-bold text-sm rounded-xl hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Add Task / Subject Log Modal */}
      {isAddModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-[#111111]/45 backdrop-blur-xs z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={closeOverlay}
          >
            <div
              className="bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E5E0] w-full sm:max-w-md p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-sans text-lg font-extrabold text-[#111111] m-0">
                  Add to Agenda
                </h3>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex bg-[#F2F2EE] p-1 rounded-xl border border-[#E5E5E0] mb-4">
                <button
                  type="button"
                  onClick={() => setAddMode('task')}
                  className={`flex-1 min-h-[34px] py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    addMode === 'task'
                      ? 'bg-[#FFFFFF] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]'
                      : 'text-[#787873] hover:text-[#111111]'
                  }`}
                >
                  General Task
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('subject')}
                  className={`flex-1 min-h-[34px] py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    addMode === 'subject'
                      ? 'bg-[#FFFFFF] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]'
                      : 'text-[#787873] hover:text-[#111111]'
                  }`}
                >
                  Subject Log
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                {addMode === 'task' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Task Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="e.g. Physics Past Paper 2021"
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Details / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={newTaskDetail}
                        onChange={(e) => setNewTaskDetail(e.target.value)}
                        placeholder="e.g. Structured Essay questions 1 to 4"
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Time of Day
                        </label>
                        <select
                          value={newTaskPeriod}
                          onChange={(e) => setNewTaskPeriod(e.target.value as any)}
                          className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                        >
                          <option value="morning">Morning (8 AM)</option>
                          <option value="afternoon">Afternoon (2 PM)</option>
                          <option value="evening">Evening (7 PM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Duration
                        </label>
                        <select
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(e.target.value)}
                          className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
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
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Subject
                      </label>
                      <select
                        required
                        value={newSubjId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setNewSubjId(sId);
                          setNewLessonId('');
                          setNewPartId('');
                        }}
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                      >
                        <option value="">-- Choose Subject --</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {newSubjId &&
                      (() => {
                        const subjLessons = lessons.filter((l) => l.subjectId === newSubjId);
                        if (subjLessons.length === 0) {
                          return (
                            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                <AlertCircle size={15} className="text-[#D97706] flex-shrink-0" />
                                <span>No lessons in this subject yet</span>
                              </div>
                              <p className="text-[11px] leading-relaxed m-0 text-[#B45309]">
                                Please add lessons and parts in the Curriculum tab first before scheduling tasks.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  closeOverlay();
                                  openSubject(newSubjId);
                                  setTab('lessons');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#92400E] underline hover:text-[#78350F] cursor-pointer pt-0.5"
                              >
                                <span>Open Curriculum tab to add lessons →</span>
                              </button>
                            </div>
                          );
                        }

                        const selectedLessonObj = lessons.find((l) => l.id === newLessonId);
                        const lessonParts = selectedLessonObj?.parts || [];

                        return (
                          <>
                            <div>
                              <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                                Lesson
                              </label>
                              <select
                                required
                                value={newLessonId}
                                onChange={(e) => {
                                  const lId = e.target.value;
                                  setNewLessonId(lId);
                                  const chosen = lessons.find((l) => l.id === lId);
                                  const parts = chosen?.parts || [];
                                  const firstUnwatched = parts.find((p) => !p.watched);
                                  const initialPartId = firstUnwatched ? firstUnwatched.id : parts[0]?.id || '';
                                  setNewPartId(initialPartId);
                                  if (initialPartId) {
                                    const pObj = parts.find((p) => p.id === initialPartId);
                                    setNewSubjStudied(pObj ? !!pObj.watched : false);
                                    setNewSubjPastPaper(pObj ? !!pObj.pastPaper : false);
                                  }
                                }}
                                className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                              >
                                <option value="">-- Choose Lesson --</option>
                                {subjLessons.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name} {l.done ? '✓ (Completed)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {newLessonId &&
                              (() => {
                                if (lessonParts.length === 0) {
                                  return (
                                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-2">
                                      <div className="flex items-center gap-1.5 font-bold">
                                        <AlertCircle size={15} className="text-[#D97706] flex-shrink-0" />
                                        <span>No parts in this lesson yet</span>
                                      </div>
                                      <p className="text-[11px] leading-relaxed m-0 text-[#B45309]">
                                        Please add parts (e.g. Day 01, Day 02) to this lesson in the Curriculum tab first.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          closeOverlay();
                                          openSubject(newSubjId);
                                          setTab('lessons');
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#92400E] underline hover:text-[#78350F] cursor-pointer pt-0.5"
                                      >
                                        <span>Open Curriculum tab to add parts →</span>
                                      </button>
                                    </div>
                                  );
                                }

                                const unwatchedCount = lessonParts.filter((p) => !p.watched).length;

                                return (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider">
                                        Specific Part
                                      </label>
                                      <span className="text-[11px] font-sans font-medium text-[#787873] tabular-nums">
                                        {unwatchedCount} unwatched
                                      </span>
                                    </div>
                                    <select
                                      required
                                      value={newPartId}
                                      onChange={(e) => {
                                        const pId = e.target.value;
                                        setNewPartId(pId);
                                        const pObj = lessonParts.find((p) => p.id === pId);
                                        if (pObj) {
                                          setNewSubjStudied(pObj.watched);
                                          setNewSubjPastPaper(pObj.pastPaper);
                                        }
                                      }}
                                      className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                                    >
                                      <option value="">-- Choose Part --</option>
                                      {lessonParts.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} {p.watched ? '✓ (Watched)' : '(Unwatched)'}{' '}
                                          {p.pastPaper ? '· PP Done' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                          </>
                        );
                      })()}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Time of Day
                        </label>
                        <select
                          value={newSubjPeriod}
                          onChange={(e) => setNewSubjPeriod(e.target.value as any)}
                          className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                        >
                          <option value="morning">Morning (8 AM)</option>
                          <option value="afternoon">Afternoon (2 PM)</option>
                          <option value="evening">Evening (7 PM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Confidence
                        </label>
                        <div className="flex gap-1.5 pt-0.5">
                          {(['L', 'M', 'H'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setNewSubjConfidence(lvl)}
                              className={`flex-1 min-h-[38px] rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                                newSubjConfidence === lvl
                                  ? 'bg-[#111111] text-[#FFFFFF] border-[#111111]'
                                  : 'bg-[#F7F7F5] text-[#787873] border-[#E5E5E0] hover:text-[#111111]'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pt-2 border-t border-[#EFEFEA]">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-medium text-[#111111]">
                        <input
                          type="checkbox"
                          checked={newSubjStudied}
                          onChange={(e) => setNewSubjStudied(e.target.checked)}
                          className="rounded accent-black"
                        />
                        Watched / Done
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-medium text-[#111111]">
                        <input
                          type="checkbox"
                          checked={newSubjPastPaper}
                          onChange={(e) => setNewSubjPastPaper(e.target.checked)}
                          className="rounded accent-black"
                        />
                        Past Paper Done
                      </label>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      addMode === 'subject' &&
                      (!newSubjId ||
                        !newLessonId ||
                        !newPartId ||
                        lessons.filter((l) => l.subjectId === newSubjId).length === 0 ||
                        (lessons.find((l) => l.id === newLessonId)?.parts || []).length === 0)
                    }
                    className="w-full min-h-[44px] py-2.5 font-sans font-bold text-sm rounded-xl transition-colors cursor-pointer bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] disabled:bg-[#E5E5E0] disabled:text-[#9A9A94] disabled:cursor-not-allowed"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Year at a Glance Modal */}
      {isMonthModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-[#111111]/45 backdrop-blur-xs z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={closeOverlay}
          >
            <div
              className="bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E5E0] w-full sm:max-w-2xl p-5 sm:p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#EFEFEA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] flex items-center justify-center flex-shrink-0">
                    <CalendarIcon size={16} className="text-[#111111]" />
                  </div>
                  <div>
                    <h2 className="font-sans text-base sm:text-lg font-extrabold text-[#111111] m-0 leading-tight">
                      Year at a Glance
                    </h2>
                    <p className="text-xs font-sans text-[#787873] m-0">
                      Tap any date to view agenda
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#F2F2EE] rounded-xl p-1 border border-[#E5E5E0]">
                    <button
                      type="button"
                      onClick={() => setModalYear((y) => y - 1)}
                      className="p-1.5 text-[#787873] hover:text-[#111111] hover:bg-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                      title="Previous year"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="font-sans font-bold text-xs sm:text-sm px-2 text-[#111111] tabular-nums">
                      {modalYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalYear((y) => y + 1)}
                      className="p-1.5 text-[#787873] hover:text-[#111111] hover:bg-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                      title="Next year"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {renderMultiMonthGrid()}

              <div className="mt-3 pt-3 border-t border-[#EFEFEA] flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-sans font-bold text-[#111111] bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E0] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDate(today);
                    setFilterMode('today');
                    closeOverlay();
                  }}
                >
                  Jump to Today
                </button>
                <span className="text-xs font-sans text-[#787873] tabular-nums">
                  Selected: <strong className="text-[#111111]">{selectedDate}</strong>
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Task Action Sheet Modal */}
      {isActionMenuOpen &&
        actionTask &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#111111]/45 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => {
              setIsActionMenuOpen(false);
              setActionTask(null);
            }}
          >
            <div
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E5E5E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#EFEFEA]">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{
                      backgroundColor: `${actionTask.accentColor}15`,
                      borderColor: `${actionTask.accentColor}35`,
                      color: actionTask.accentColor,
                    }}
                  >
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans text-sm sm:text-base font-bold text-[#111111] truncate m-0">
                      {actionTask.title}
                    </h3>
                    <p className="text-xs font-sans text-[#787873] m-0 truncate tabular-nums">
                      {actionTask.subjectLabel} · {actionTask.timeDisplay}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    setActionTask(null);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {actionTask.source !== 'revisit' && (
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E5E5E0] bg-[#FFFFFF] hover:bg-[#F7F7F5] hover:border-[#111111] text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] text-[#111111] flex items-center justify-center flex-shrink-0 group-hover:bg-[#111111] group-hover:text-[#FFFFFF] transition-colors">
                      <Pencil size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-bold text-sm text-[#111111]">Edit</div>
                      <div className="text-xs font-sans text-[#787873]">
                        Modify subject, lesson, part, or time block
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#DC2626]/25 bg-[#FFFFFF] hover:bg-[#DC2626]/5 hover:border-[#DC2626]/50 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DC2626] group-hover:text-[#FFFFFF] transition-colors">
                    <Trash2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-bold text-sm text-[#DC2626]">Delete</div>
                    <div className="text-xs font-sans text-[#DC2626]/80">
                      Remove from agenda
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 pt-2 border-t border-[#EFEFEA]">
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    setActionTask(null);
                  }}
                  className="w-full min-h-[40px] py-2 text-center text-xs font-sans font-semibold text-[#787873] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Task Modal */}
      {isEditModalOpen &&
        actionTask &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#111111]/45 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => {
              setIsEditModalOpen(false);
              setActionTask(null);
            }}
          >
            <div
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-[#E5E5E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Pencil size={18} className="text-[#111111]" />
                  <h3 className="font-sans text-lg font-extrabold text-[#111111] m-0">Edit Task</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setActionTask(null);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditTask} className="space-y-3.5">
                {actionTask.source === 'subject' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Subject
                      </label>
                      <select
                        required
                        value={editSubjId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setEditSubjId(sId);
                          const subjLessons = lessons.filter((l) => l.subjectId === sId);
                          const firstL = subjLessons[0];
                          setEditLessonId(firstL ? firstL.id : '');
                          const parts = firstL?.parts || [];
                          const firstP = parts.find((p) => !p.watched) || parts[0];
                          setEditPartId(firstP ? firstP.id : '');
                        }}
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                      >
                        <option value="">-- Choose Subject --</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editSubjId &&
                      (() => {
                        const subjLessons = lessons.filter((l) => l.subjectId === editSubjId);
                        if (subjLessons.length === 0) {
                          return (
                            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                              No lessons found for this subject.
                            </div>
                          );
                        }

                        const selectedLessonObj = lessons.find((l) => l.id === editLessonId);
                        const lessonParts = selectedLessonObj?.parts || [];

                        return (
                          <>
                            <div>
                              <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                                Lesson
                              </label>
                              <select
                                required
                                value={editLessonId}
                                onChange={(e) => {
                                  const lId = e.target.value;
                                  setEditLessonId(lId);
                                  const chosen = lessons.find((l) => l.id === lId);
                                  const parts = chosen?.parts || [];
                                  const firstP = parts.find((p) => !p.watched) || parts[0];
                                  setEditPartId(firstP ? firstP.id : '');
                                }}
                                className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                              >
                                <option value="">-- Choose Lesson --</option>
                                {subjLessons.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name} {l.done ? '✓ (Completed)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {editLessonId &&
                              (() => {
                                if (lessonParts.length === 0) {
                                  return (
                                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                                      No parts found in this lesson.
                                    </div>
                                  );
                                }
                                return (
                                  <div>
                                    <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                                      Specific Part
                                    </label>
                                    <select
                                      required
                                      value={editPartId}
                                      onChange={(e) => {
                                        const pId = e.target.value;
                                        setEditPartId(pId);
                                        const pObj = lessonParts.find((p) => p.id === pId);
                                        if (pObj) {
                                          setEditSubjStudied(pObj.watched);
                                          setEditSubjPastPaper(pObj.pastPaper);
                                        }
                                      }}
                                      className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                                    >
                                      <option value="">-- Choose Part --</option>
                                      {lessonParts.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} {p.watched ? '✓ (Watched)' : '(Unwatched)'}{' '}
                                          {p.pastPaper ? '· PP Done' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                          </>
                        );
                      })()}

                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Time Block
                      </label>
                      <select
                        value={editSubjPeriod}
                        onChange={(e) => setEditSubjPeriod(e.target.value as any)}
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                      >
                        <option value="morning">Morning (8 AM)</option>
                        <option value="afternoon">Afternoon (2 PM)</option>
                        <option value="evening">Evening (7 PM)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-5 pt-2 border-t border-[#EFEFEA]">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-medium text-[#111111]">
                        <input
                          type="checkbox"
                          checked={editSubjStudied}
                          onChange={(e) => setEditSubjStudied(e.target.checked)}
                          className="rounded accent-black"
                        />
                        Watched / Done
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-medium text-[#111111]">
                        <input
                          type="checkbox"
                          checked={editSubjPastPaper}
                          onChange={(e) => setEditSubjPastPaper(e.target.checked)}
                          className="rounded accent-black"
                        />
                        Past Paper Done
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Task Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        placeholder="e.g. Physics Revision"
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                        Details / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={editTaskDetail}
                        onChange={(e) => setEditTaskDetail(e.target.value)}
                        placeholder="e.g. Questions 1 to 5"
                        className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Time Block
                        </label>
                        <select
                          value={editTaskPeriod}
                          onChange={(e) => setEditTaskPeriod(e.target.value as any)}
                          className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
                        >
                          <option value="morning">Morning (8 AM)</option>
                          <option value="afternoon">Afternoon (2 PM)</option>
                          <option value="evening">Evening (7 PM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-bold text-[#787873] uppercase tracking-wider mb-1">
                          Duration
                        </label>
                        <select
                          value={editTaskDuration}
                          onChange={(e) => setEditTaskDuration(e.target.value)}
                          className="w-full bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-sm focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none text-[#111111]"
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
                )}

                <div className="flex gap-2 justify-end pt-3 border-t border-[#EFEFEA]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setActionTask(null);
                    }}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F2F2EE] rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#111111] text-[#FFFFFF] rounded-xl hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteConfirmOpen &&
        actionTask &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#111111]/45 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setActionTask(null);
            }}
          >
            <div
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E5E5E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-[#111111] m-0">
                    Delete Task?
                  </h3>
                  <p className="text-xs font-sans text-[#787873] mt-1.5 leading-relaxed">
                    Remove <strong className="text-[#111111] font-semibold">{actionTask.title}</strong> from this day&apos;s agenda?
                  </p>
                  <p className="text-[11px] font-sans text-[#787873] mt-1 leading-relaxed">
                    Completed study progress in your Curriculum will remain intact.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setActionTask(null);
                  }}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F2F2EE] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="min-h-[40px] bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-sans font-bold text-xs py-2 px-5 rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CalendarTab;
