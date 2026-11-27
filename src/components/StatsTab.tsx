import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf, addDays } from '../utils';
import { getSubjectColorById } from '../utils/colors';
import {
  calculateDaysRemaining,
  calculateWeeksRemaining,
  calculateWeeklyTarget,
  calculateSubjectMetrics,
} from '../utils/subjectMetrics';
import {
  Atom,
  FlaskConical,
  Calculator,
  BookOpen,
  Check,
  Pencil,
  RotateCcw,
  X,
  Flame,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  formatStudiedTime,
  formatBarStudyTime,
  calculateWeeklyStudiedMinutes,
  calculateDailyStudiedMinutes,
} from '../utils/duration';

const CUSTOM_TARGETS_KEY = 'study_tracker_custom_weekly_targets';

interface SubjectPaceData {
  id: string;
  name: string;
  accentColor: string;
  actualProgress: number;
  weeklyTarget: number;
  autoTarget: number;
  isOverridden: boolean;
  isOnTrack: boolean;
  expectedPace: number;
  totalRemainingParts: number;
  totalParts: number;
}

export const StatsTab: React.FC = () => {
  const { subjects, lessons, dailyEntries, revisits, examDate, updateSubject } = useStore();

  const [customTargets, setCustomTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TARGETS_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const cleaned: Record<string, number> = {};
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'number' && val > 0 && val !== 1 && val !== 50) {
            cleaned[key] = val;
          }
        }
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });

  const [editingSubject, setEditingSubject] = useState<{
    id: string;
    name: string;
    currentTarget: number;
    autoTarget: number;
  } | null>(null);
  const [targetInputValue, setTargetInputValue] = useState<string>('');

  const saveCustomTargets = (newTargets: Record<string, number>) => {
    setCustomTargets(newTargets);
    try {
      localStorage.setItem(CUSTOM_TARGETS_KEY, JSON.stringify(newTargets));
    } catch (e) {
      console.error('Failed to save custom targets', e);
    }
  };

  const today = todayStr();
  const monday = mondayOf(today);
  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  );

  const daysElapsedThisWeek = useMemo(() => {
    const idx = currentWeekDays.indexOf(today);
    return idx >= 0 ? idx + 1 : 1;
  }, [currentWeekDays, today]);

  const daysRemaining = useMemo(() => calculateDaysRemaining(examDate), [examDate]);
  const weeksRemaining = useMemo(() => calculateWeeksRemaining(examDate), [examDate]);

  const displaySubjects = useMemo(() => {
    if (subjects && subjects.length > 0) {
      return subjects;
    }
    return [
      { id: 'physics_default', name: 'Physics' },
      { id: 'chemistry_default', name: 'Chemistry' },
      { id: 'maths_default', name: 'Combined Maths' },
    ];
  }, [subjects]);

  const subjectPaces = useMemo<SubjectPaceData[]>(() => {
    return displaySubjects.map((subj) => {
      const accentColor = getSubjectColorById(subj.id, subjects);
      const metrics = calculateSubjectMetrics(subj, lessons);
      const totalParts = metrics.totalPartsAdded;
      const watchedParts = metrics.watchedPartsCount;
      const remainingParts = metrics.partsRemaining;

      const autoTarget = calculateWeeklyTarget(totalParts, watchedParts, weeksRemaining);
      const isOverridden =
        typeof customTargets[subj.id] === 'number' && customTargets[subj.id] > 0;
      const weeklyTarget = isOverridden ? customTargets[subj.id] : autoTarget;

      const watchedThisWeek = new Set<string>();
      currentWeekDays.forEach((d) => {
        const entry = dailyEntries[d];
        if (entry && Array.isArray(entry.subjects)) {
          entry.subjects.forEach((s) => {
            if (s.subjectId === subj.id && s.studied) {
              watchedThisWeek.add(`${d}_${s.partId || s.id || s.lessonId}`);
            }
          });
        }
      });
      const actualProgress = watchedThisWeek.size;

      const expectedPace = weeklyTarget * (daysElapsedThisWeek / 7);
      const isOnTrack = actualProgress >= expectedPace;

      return {
        id: subj.id,
        name: subj.name,
        accentColor,
        actualProgress,
        weeklyTarget,
        autoTarget,
        isOverridden,
        isOnTrack,
        expectedPace,
        totalRemainingParts: remainingParts,
        totalParts,
      };
    });
  }, [
    displaySubjects,
    subjects,
    lessons,
    weeksRemaining,
    customTargets,
    currentWeekDays,
    dailyEntries,
    daysElapsedThisWeek,
  ]);

  const weeklyTotalWatched = useMemo(
    () => subjectPaces.reduce((sum, sp) => sum + sp.actualProgress, 0),
    [subjectPaces]
  );

  const totalWeeklyTarget = useMemo(
    () => subjectPaces.reduce((sum, sp) => sum + sp.weeklyTarget, 0),
    [subjectPaces]
  );

  const dailyTargetShare = useMemo(
    () => (totalWeeklyTarget > 0 ? totalWeeklyTarget / 7 : 1),
    [totalWeeklyTarget]
  );

  const timeStudied = useMemo(() => {
    const totalMinutes = calculateWeeklyStudiedMinutes(
      currentWeekDays,
      dailyEntries,
      lessons,
      revisits || []
    );
    return formatStudiedTime(totalMinutes);
  }, [currentWeekDays, dailyEntries, lessons, revisits]);

  const hasWatchedOnDate = (dateStr: string): boolean => {
    const entry = dailyEntries[dateStr];
    if (entry && Array.isArray(entry.subjects)) {
      return entry.subjects.some((s) => s.studied);
    }
    return false;
  };

  const currentStreak = useMemo(() => {
    let streakCount = 0;
    let checkDate = today;

    if (hasWatchedOnDate(checkDate)) {
      streakCount = 1;
      checkDate = addDays(checkDate, -1);
      while (hasWatchedOnDate(checkDate)) {
        streakCount++;
        checkDate = addDays(checkDate, -1);
      }
    } else {
      checkDate = addDays(checkDate, -1);
      while (hasWatchedOnDate(checkDate)) {
        streakCount++;
        checkDate = addDays(checkDate, -1);
      }
    }

    return streakCount;
  }, [dailyEntries, today]);

  const weekRingsData = useMemo(() => {
    const dayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fullDayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    return currentWeekDays.map((dateStr, idx) => {
      const entry = dailyEntries[dateStr];
      let watchedCount = 0;
      if (entry && Array.isArray(entry.subjects)) {
        watchedCount = entry.subjects.filter((s) => s.studied).length;
      }

      const ratio = dailyTargetShare > 0 ? watchedCount / dailyTargetShare : 0;
      const percentage = Math.min(100, Math.round(ratio * 100));
      const isTargetMet = watchedCount > 0 && ratio >= 1.0;

      return {
        date: dateStr,
        initial: dayInitials[idx],
        fullName: fullDayNames[idx],
        watchedCount,
        percentage,
        isTargetMet,
        isToday: dateStr === today,
      };
    });
  }, [currentWeekDays, dailyEntries, today, dailyTargetShare]);

  const daysOnTarget = useMemo(
    () => weekRingsData.filter((d) => d.isTargetMet).length,
    [weekRingsData]
  );

  const weekBarData = useMemo(() => {
    const dayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fullDayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    const minutesList = currentWeekDays.map((dateStr) =>
      calculateDailyStudiedMinutes(dateStr, dailyEntries, lessons, revisits || [])
    );

    const maxMinutes = Math.max(...minutesList, 60);

    return currentWeekDays.map((dateStr, idx) => {
      const minutes = minutesList[idx];
      const heightPercent =
        minutes > 0 ? Math.max(16, Math.min(100, Math.round((minutes / maxMinutes) * 100))) : 0;

      return {
        date: dateStr,
        initial: dayInitials[idx],
        fullName: fullDayNames[idx],
        minutes,
        label: formatBarStudyTime(minutes),
        heightPercent,
        isToday: dateStr === today,
      };
    });
  }, [currentWeekDays, dailyEntries, lessons, revisits, today]);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chem')) return <FlaskConical size={16} strokeWidth={2.2} />;
    if (lower.includes('phys')) return <Atom size={16} strokeWidth={2.2} />;
    if (lower.includes('math') || lower.includes('comb')) {
      return <Calculator size={16} strokeWidth={2.2} />;
    }
    return <BookOpen size={16} strokeWidth={2.2} />;
  };

  const handleOpenEditTarget = (sp: SubjectPaceData) => {
    setEditingSubject({
      id: sp.id,
      name: sp.name,
      currentTarget: sp.weeklyTarget,
      autoTarget: sp.autoTarget,
    });
    setTargetInputValue(String(sp.weeklyTarget));
  };

  const handleSaveTarget = () => {
    if (!editingSubject) return;
    const parsed = parseInt(targetInputValue.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      const updated = { ...customTargets, [editingSubject.id]: parsed };
      saveCustomTargets(updated);
      if (typeof updateSubject === 'function' && subjects.some((s) => s.id === editingSubject.id)) {
        updateSubject(editingSubject.id, { targetCount: parsed });
      }
    }
    setEditingSubject(null);
  };

  const handleResetTarget = (subjId: string) => {
    const updated = { ...customTargets };
    delete updated[subjId];
    saveCustomTargets(updated);
    if (typeof updateSubject === 'function' && subjects.some((s) => s.id === subjId)) {
      updateSubject(subjId, { targetCount: undefined });
    }
    if (editingSubject && editingSubject.id === subjId) {
      setEditingSubject(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* SECTION 1 — Per-subject pace cards */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-bold text-[#181715] m-0">
              Weekly Pace
            </h2>
            <p className="text-xs font-sans text-[#78716C] mt-0.5 flex items-center gap-1.5 m-0 tabular-nums">
              <Calendar size={12} className="text-[#78716C]" />
              <span>
                {examDate
                  ? `${weeksRemaining} ${weeksRemaining === 1 ? 'week' : 'weeks'} to exam · ${daysRemaining}d left`
                  : `${weeksRemaining} weeks baseline`}
              </span>
            </p>
          </div>
          <span className="text-xs font-sans font-medium text-[#78716C]">Mon – Sun</span>
        </div>

        {/* Mobile & Tablet (< 1024px): Unified Hairline-Divided Sheet (eliminates 2+1 orphan card gap) */}
        <div className="lg:hidden bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl overflow-hidden divide-y divide-[#EFECE6] shadow-[0_1px_2px_rgba(24,23,21,0.03)]">
          {subjectPaces.map((sp) => {
            const pacePct = Math.min(
              100,
              Math.round((sp.actualProgress / Math.max(1, sp.weeklyTarget)) * 100)
            );
            return (
              <div key={sp.id} className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-2.5">
                {/* Row Top: Icon + Subject & Status on left, Tabular Ratio on right */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{
                        backgroundColor: `${sp.accentColor}16`,
                        borderColor: `${sp.accentColor}30`,
                        color: sp.accentColor,
                      }}
                      title={sp.name}
                    >
                      {getSubjectIcon(sp.name)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-sans font-bold text-sm text-[#181715] truncate m-0 leading-snug">
                        {sp.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold mt-0.5 ${
                          sp.isOnTrack ? 'text-[#16A34A]' : 'text-[#D97706]'
                        }`}
                        title={
                          sp.isOnTrack
                            ? `On track (done ${sp.actualProgress} >= expected ${sp.expectedPace.toFixed(1)})`
                            : `Behind pace (done ${sp.actualProgress} < expected ${sp.expectedPace.toFixed(1)})`
                        }
                      >
                        {sp.isOnTrack ? <Check size={11} strokeWidth={2.75} /> : <Clock size={11} />}
                        <span>{sp.isOnTrack ? 'On track' : 'Behind'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 flex-shrink-0 tabular-nums">
                    <span className="font-sans text-2xl font-extrabold text-[#181715] tracking-tight leading-none">
                      {sp.actualProgress}
                    </span>
                    <span className="font-sans text-sm font-bold text-[#78716C] leading-none">
                      / {sp.weeklyTarget}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pacePct}%`,
                      backgroundColor: sp.accentColor,
                    }}
                  />
                </div>

                {/* Row Footer: Target Edit & Reset / Remaining */}
                <div className="flex items-center justify-between gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTarget(sp)}
                    className="min-h-[36px] -my-1.5 inline-flex items-center gap-1.5 text-[#78716C] hover:text-[#181715] transition-colors cursor-pointer select-none group"
                    title={`Tap to override weekly target (${sp.totalRemainingParts} parts left ÷ ${weeksRemaining}w)`}
                  >
                    <span className="tabular-nums">
                      Target <strong className="text-[#181715]">{sp.weeklyTarget}/wk</strong>
                      {sp.isOverridden && <span className="text-[#78716C] font-normal"> · Custom</span>}
                    </span>
                    {!sp.isOverridden && (
                      <Pencil size={11} className="text-[#78716C] opacity-60 group-hover:opacity-100" />
                    )}
                  </button>

                  {sp.isOverridden ? (
                    <button
                      type="button"
                      onClick={() => handleResetTarget(sp.id)}
                      className="min-h-[36px] px-2 -mr-2 -my-1.5 text-[11px] text-[#78716C] hover:text-[#181715] underline underline-offset-2 cursor-pointer select-none"
                      title={`Reset to auto-calculated pace (${sp.autoTarget}/wk)`}
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#78716C] tabular-nums">
                      {sp.totalRemainingParts} left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop (>= 1024px): Equal-Width Side-by-Side Cards */}
        <div
          className={`hidden lg:grid gap-3.5 ${
            subjectPaces.length === 1
              ? 'lg:grid-cols-1'
              : subjectPaces.length === 2
              ? 'lg:grid-cols-2'
              : 'lg:grid-cols-3'
          }`}
        >
          {subjectPaces.map((sp) => {
            const pacePct = Math.min(
              100,
              Math.round((sp.actualProgress / Math.max(1, sp.weeklyTarget)) * 100)
            );
            return (
              <div
                key={sp.id}
                className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-4 shadow-[0_1px_2px_rgba(24,23,21,0.03)] hover:border-[#CBC5B9] transition-colors flex flex-col justify-between min-h-[164px]"
              >
                {/* Top row: Subject icon + Unboxed Pace Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{
                      backgroundColor: `${sp.accentColor}16`,
                      borderColor: `${sp.accentColor}30`,
                      color: sp.accentColor,
                    }}
                    title={sp.name}
                  >
                    {getSubjectIcon(sp.name)}
                  </div>

                  {/* Unboxed status label with explicit icon */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold flex-shrink-0 ${
                      sp.isOnTrack ? 'text-[#16A34A]' : 'text-[#D97706]'
                    }`}
                    title={
                      sp.isOnTrack
                        ? `On track (done ${sp.actualProgress} >= expected ${sp.expectedPace.toFixed(1)})`
                        : `Behind pace (done ${sp.actualProgress} < expected ${sp.expectedPace.toFixed(1)})`
                    }
                  >
                    {sp.isOnTrack ? <Check size={12} strokeWidth={2.75} /> : <Clock size={12} />}
                    <span>{sp.isOnTrack ? 'On track' : 'Behind'}</span>
                  </span>
                </div>

                {/* Middle: Subject Name + Focal Tabular Metric + Color Track */}
                <div className="mt-3">
                  <h3 className="font-sans font-semibold text-xs text-[#57534E] truncate m-0">
                    {sp.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1 tabular-nums">
                    <span className="font-sans text-3xl sm:text-[2.1rem] font-extrabold text-[#181715] tracking-tight leading-none">
                      {sp.actualProgress}
                    </span>
                    <span className="font-sans text-base sm:text-lg font-bold text-[#78716C] leading-none">
                      / {sp.weeklyTarget}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pacePct}%`,
                        backgroundColor: sp.accentColor,
                      }}
                    />
                  </div>
                </div>

                {/* Footer: Editable Target */}
                <div className="mt-3 pt-2.5 border-t border-[#EFECE6] flex items-center justify-between gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTarget(sp)}
                    className="inline-flex items-center gap-1.5 text-[#78716C] hover:text-[#181715] transition-colors cursor-pointer select-none group min-h-[28px]"
                    title={`Tap to override weekly target (${sp.totalRemainingParts} parts left ÷ ${weeksRemaining}w)`}
                  >
                    <span className="tabular-nums">
                      Target <strong className="text-[#181715]">{sp.weeklyTarget}/wk</strong>
                      {sp.isOverridden && <span className="text-[#78716C] font-normal"> · Custom</span>}
                    </span>
                    {!sp.isOverridden && (
                      <Pencil size={11} className="text-[#78716C] opacity-60 group-hover:opacity-100" />
                    )}
                  </button>

                  {sp.isOverridden && (
                    <button
                      type="button"
                      onClick={() => handleResetTarget(sp.id)}
                      className="text-[11px] text-[#78716C] hover:text-[#181715] underline underline-offset-2 cursor-pointer select-none min-h-[28px]"
                      title={`Reset to auto-calculated pace (${sp.autoTarget}/wk)`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2 — Weekly consistency & Time Studied */}
      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="font-sans text-sm sm:text-base font-bold text-[#181715] m-0">
            Weekly Consistency
          </h2>
          <span className="text-xs font-sans font-medium text-[#78716C]">Current week</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card 1: Streak and Weekly Total */}
          <div className="md:col-span-2 bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,23,21,0.03)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#78716C] mb-1.5">
                  <Flame size={14} className="text-[#D97706]" />
                  <span>Current streak</span>
                </div>
                <div className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#181715] tracking-tight leading-none">
                    {currentStreak}
                  </span>
                  <span className="font-sans text-sm sm:text-base font-semibold text-[#78716C] leading-none">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              <div className="w-[1px] h-11 bg-[#EFECE6] flex-shrink-0" />

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-sans font-semibold text-[#78716C] mb-1.5">
                  <BookOpen size={14} className="text-[#181715]" />
                  <span>Watched this week</span>
                </div>
                <div className="flex items-baseline justify-end gap-1.5 tabular-nums">
                  <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#181715] tracking-tight leading-none">
                    {weeklyTotalWatched}
                  </span>
                  <span className="font-sans text-sm sm:text-base font-semibold text-[#78716C] leading-none">
                    {weeklyTotalWatched === 1 ? 'part' : 'parts'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Daily Activity Rings */}
          <div className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,23,21,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-sans font-semibold text-[#78716C]">Daily activity</span>
              <span className="text-[11px] font-sans text-[#78716C]">Bold = Today</span>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex-shrink-0 min-w-[74px]">
                <div className="font-sans text-3xl sm:text-4xl font-extrabold text-[#181715] tracking-tight leading-none tabular-nums">
                  {daysOnTarget}/7
                </div>
                <div className="text-xs font-sans font-medium text-[#78716C] mt-1.5 leading-tight">
                  Days on target
                </div>
              </div>

              <div className="flex-1 max-w-[250px] grid grid-cols-7 gap-1 sm:gap-1.5 text-center items-center">
                {weekRingsData.map((day) => {
                  const size = 26;
                  const strokeWidth = 2.6;
                  const center = size / 2;
                  const radius = 9.8;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (day.percentage / 100) * circumference;

                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1.5 select-none">
                      <div
                        className="w-8 h-8 flex items-center justify-center"
                        title={`${day.fullName}: ${day.watchedCount} / ${
                          typeof dailyTargetShare === 'number'
                            ? dailyTargetShare.toFixed(1)
                            : dailyTargetShare
                        } parts (${day.percentage}%)${day.isToday ? ' · Today' : ''}`}
                      >
                        {day.isTargetMet ? (
                          <div className="w-[24px] h-[24px] rounded-full bg-[#16A34A] flex items-center justify-center">
                            <Check size={13} strokeWidth={3} className="text-[#FFFFFF]" />
                          </div>
                        ) : (
                          <div className="relative w-[24px] h-[24px] flex items-center justify-center">
                            <svg
                              width={size}
                              height={size}
                              viewBox={`0 0 ${size} ${size}`}
                              className="w-full h-full -rotate-90"
                            >
                              <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="#EFECE6"
                                strokeWidth={strokeWidth}
                              />
                              {day.percentage > 0 && (
                                <circle
                                  cx={center}
                                  cy={center}
                                  r={radius}
                                  fill="none"
                                  stroke="#181715"
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                />
                              )}
                            </svg>
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-xs font-sans leading-none ${
                          day.isToday ? 'font-bold text-[#181715]' : 'font-normal text-[#78716C]'
                        }`}
                      >
                        {day.initial}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Time Studied Bar Chart */}
          <div className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,23,21,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-sans font-semibold text-[#78716C]">Time studied</span>
              <span className="text-[11px] font-sans text-[#78716C]">Mon – Sun</span>
            </div>

            <div className="flex items-end justify-between gap-3 sm:gap-4 pt-3.5">
              <div className="flex-shrink-0 min-w-[74px] pb-1">
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#181715] tracking-tight leading-none">
                    {timeStudied.value}
                  </span>
                  <span className="font-sans text-sm sm:text-base font-semibold text-[#78716C] leading-none">
                    {timeStudied.unit}
                  </span>
                </div>
                <div className="text-xs font-sans font-medium text-[#78716C] mt-1.5 leading-tight">
                  This week
                </div>
              </div>

              <div className="flex-1 max-w-[250px] grid grid-cols-7 gap-1 sm:gap-1.5 text-center items-end">
                {weekBarData.map((day) => (
                  <div key={day.date} className="flex flex-col items-center select-none">
                    <div className="h-11 w-full flex items-end justify-center pb-1">
                      {day.minutes > 0 ? (
                        <div
                          style={{ height: `${day.heightPercent}%` }}
                          className={`relative w-2.5 sm:w-3 rounded-full transition-all duration-300 ${
                            day.isToday ? 'bg-[#181715]' : 'bg-[#57534E]'
                          }`}
                          title={`${day.fullName}: ${day.minutes} min studied${day.isToday ? ' · Today' : ''}`}
                        >
                          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-sans font-medium text-[#78716C] leading-none whitespace-nowrap pointer-events-none tabular-nums">
                            {day.label}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="relative w-2.5 sm:w-3 h-[3px] rounded-full bg-[#D6D1C7]"
                          title={`${day.fullName}: 0 min studied${day.isToday ? ' · Today' : ''}`}
                        >
                          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-sans font-medium text-[#78716C] leading-none whitespace-nowrap pointer-events-none tabular-nums">
                            {day.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-xs font-sans leading-none ${
                        day.isToday ? 'font-bold text-[#181715]' : 'font-normal text-[#78716C]'
                      }`}
                    >
                      {day.initial}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Override Modal */}
      {editingSubject && (
        <div
          className="fixed inset-0 z-50 bg-[#181715]/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setEditingSubject(null)}
        >
          <div
            className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xs p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-base text-[#181715] m-0">
                Override Weekly Target
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-sans text-[#57534E]">
                Subject: <strong className="text-[#181715]">{editingSubject.name}</strong>
              </div>
              <div className="text-xs font-sans text-[#78716C] leading-relaxed tabular-nums">
                Auto-calculated suggestion: <strong>{editingSubject.autoTarget} parts/week</strong>{' '}
                based on remaining parts ({weeksRemaining}w to exam).
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-[#57534E] mb-1.5">
                Target parts per week
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetInputValue}
                onChange={(e) => setTargetInputValue(e.target.value)}
                autoFocus
                className="w-full font-sans text-base font-bold px-3.5 py-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9] tabular-nums"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              {customTargets[editingSubject.id] !== undefined && (
                <button
                  type="button"
                  onClick={() => handleResetTarget(editingSubject.id)}
                  className="flex-1 min-h-[40px] py-2 px-3 rounded-xl border border-[#E4E0D8] text-[#57534E] hover:text-[#181715] hover:bg-[#F6F4EF] font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Auto</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#181715] text-[#FFFDF9] font-sans font-bold text-xs hover:bg-[#2E2C28] transition-colors cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
