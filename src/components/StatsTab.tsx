import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf, addDays } from '../utils';
import { getSubjectColorById } from '../utils/colors';
import { Atom, FlaskConical, Calculator, BookOpen, Check, Pencil, RotateCcw, X, Flame } from 'lucide-react';

const CUSTOM_TARGETS_KEY = 'study_tracker_custom_weekly_targets';

interface SubjectPaceData {
  id: string;
  name: string;
  accentColor: string;
  actualProgress: number;
  weeklyTarget: number;
  isOverridden: boolean;
  isOnTrack: boolean;
  expectedPace: number;
  totalRemainingParts: number;
}

export const StatsTab: React.FC = () => {
  const { subjects, lessons, dailyEntries, examDate, updateSubject } = useStore();

  // Custom targets map (subjectId -> overridden number)
  const [customTargets, setCustomTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TARGETS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Target editing modal/popover state
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; currentTarget: number; autoTarget: number } | null>(null);
  const [targetInputValue, setTargetInputValue] = useState<string>('');

  // Persist custom targets to localStorage
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
  const currentWeekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  // Days elapsed in current Mon–Sun week (Monday = 1, Sunday = 7)
  const daysElapsedThisWeek = useMemo(() => {
    const idx = currentWeekDays.indexOf(today);
    return idx >= 0 ? idx + 1 : 1;
  }, [currentWeekDays, today]);

  // Weeks remaining until exam date
  const weeksRemaining = useMemo(() => {
    if (!examDate) return 10; // Sensible default if not set
    const todayMs = new Date(today + 'T00:00:00').getTime();
    const examMs = new Date(examDate + 'T00:00:00').getTime();
    const diffDays = Math.ceil((examMs - todayMs) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  }, [examDate, today]);

  // Default standard 3 subjects if user hasn't added any yet
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

  // SECTION 1: Calculate per-subject pace cards
  const subjectPaces = useMemo<SubjectPaceData[]>(() => {
    return displaySubjects.map((subj) => {
      const accentColor = getSubjectColorById(subj.id, subjects);

      // 1. Total parts remaining for this subject
      const subjLessons = lessons.filter((l) => l.subjectId === subj.id);
      let remainingParts = 0;

      subjLessons.forEach((l) => {
        if (l.parts && l.parts.length > 0) {
          remainingParts += l.parts.filter((p) => !p.watched).length;
        } else if (!l.done) {
          remainingParts += 1;
        }
      });

      // 2. Auto-suggested weekly target: (remaining parts) ÷ (weeks remaining), rounded
      const autoTarget = Math.max(1, Math.round(remainingParts / weeksRemaining));

      // Check if user has manually overridden target
      const isOverridden = customTargets[subj.id] !== undefined || (typeof subj.targetCount === 'number' && subj.targetCount > 0);
      const weeklyTarget = isOverridden
        ? (customTargets[subj.id] !== undefined ? customTargets[subj.id] : (subj.targetCount || autoTarget))
        : autoTarget;

      // 3. This week's actual progress: count of parts marked "Watched" for this subject within Mon–Sun week
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

      // 4. On-track / behind indicator:
      // Compare actual progress so far this week against expected pace: target × (days elapsed ÷ 7)
      const expectedPace = weeklyTarget * (daysElapsedThisWeek / 7);
      const isOnTrack = actualProgress >= expectedPace;

      return {
        id: subj.id,
        name: subj.name,
        accentColor,
        actualProgress,
        weeklyTarget,
        isOverridden,
        isOnTrack,
        expectedPace,
        totalRemainingParts: remainingParts,
      };
    });
  }, [displaySubjects, subjects, lessons, weeksRemaining, customTargets, currentWeekDays, dailyEntries, daysElapsedThisWeek]);

  // SECTION 2: Weekly consistency
  // Total parts completed across all subjects this week
  const weeklyTotalWatched = useMemo(() => {
    return subjectPaces.reduce((sum, sp) => sum + sp.actualProgress, 0);
  }, [subjectPaces]);

  // Helper to determine if at least one part was marked "Watched" on a given day
  const hasWatchedOnDate = (dateStr: string): boolean => {
    const entry = dailyEntries[dateStr];
    if (entry && Array.isArray(entry.subjects)) {
      return entry.subjects.some((s) => s.studied);
    }
    return false;
  };

  // Current streak: consecutive days (including today, up to now) with >= 1 part marked "Watched"
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
      // If user hasn't logged today yet, count streak up to yesterday so active streak doesn't vanish
      checkDate = addDays(checkDate, -1);
      while (hasWatchedOnDate(checkDate)) {
        streakCount++;
        checkDate = addDays(checkDate, -1);
      }
    }

    return streakCount;
  }, [dailyEntries, today]);

  // Weekly 7-day dot grid data (Mon–Sun)
  const weekDotGrid = useMemo(() => {
    // Days Mon - Sun with initials M, T, W, T, F, S, S
    const dayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return currentWeekDays.map((dateStr, idx) => {
      const entry = dailyEntries[dateStr];
      let watchedCount = 0;
      if (entry && Array.isArray(entry.subjects)) {
        watchedCount = entry.subjects.filter((s) => s.studied).length;
      }

      return {
        date: dateStr,
        initial: dayInitials[idx],
        fullName: fullDayNames[idx],
        isCompleted: watchedCount > 0,
        isToday: dateStr === today,
        count: watchedCount,
      };
    });
  }, [currentWeekDays, dailyEntries, today]);

  // Helper icon for subject
  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chem')) {
      return <FlaskConical size={16} strokeWidth={2.4} />;
    }
    if (lower.includes('phys')) {
      return <Atom size={16} strokeWidth={2.4} />;
    }
    if (lower.includes('math') || lower.includes('comb')) {
      return <Calculator size={16} strokeWidth={2.4} />;
    }
    return <BookOpen size={16} strokeWidth={2.4} />;
  };

  // Open modal to override weekly target
  const handleOpenEditTarget = (sp: SubjectPaceData) => {
    // Calculate raw auto target for reference
    const autoTarget = Math.max(1, Math.round(sp.totalRemainingParts / weeksRemaining));
    setEditingSubject({
      id: sp.id,
      name: sp.name,
      currentTarget: sp.weeklyTarget,
      autoTarget,
    });
    setTargetInputValue(String(sp.weeklyTarget));
  };

  // Save manual override
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

  // Reset override back to auto-suggested
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
    <div className="flex flex-col gap-6 pb-28 pt-1">
      {/* SECTION 1 — Per-subject pace cards (Reference: Image 3's "My Habits" grid cards) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-sans text-xs font-bold text-[#8A8A8A] uppercase tracking-wider m-0">
            Weekly Pace
          </h2>
          <span className="text-[11px] font-sans font-medium text-[#8A8A8A]">
            Mon – Sun
          </span>
        </div>

        {/* 2-column grid wrapping */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {subjectPaces.map((sp) => (
            <div
              key={sp.id}
              className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-2xl p-4 sm:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#CCCCCC] transition-all flex flex-col justify-between min-h-[148px]"
            >
              {/* Top row: Subject Icon/Badge in top-left + On-track/behind indicator in corner */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${sp.accentColor}18`,
                    color: sp.accentColor,
                  }}
                  title={sp.name}
                >
                  {getSubjectIcon(sp.name)}
                </div>

                {/* On-track / behind indicator: factual comparison only */}
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-sans font-bold flex-shrink-0"
                  style={{
                    backgroundColor: sp.isOnTrack ? '#ECFDF5' : '#FFFBEB',
                    borderColor: sp.isOnTrack ? '#A7F3D0' : '#FDE68A',
                    color: sp.isOnTrack ? '#059669' : '#D97706',
                  }}
                  title={
                    sp.isOnTrack
                      ? `On track (done ${sp.actualProgress} ≥ expected ${sp.expectedPace.toFixed(1)})`
                      : `Behind pace (done ${sp.actualProgress} < expected ${sp.expectedPace.toFixed(1)})`
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sp.isOnTrack ? '#10B981' : '#F59E0B' }}
                  />
                  <span>{sp.isOnTrack ? 'On track' : 'Behind'}</span>
                </div>
              </div>

              {/* Middle row: Subject name */}
              <div className="mt-3">
                <h3 className="font-sans font-bold text-xs sm:text-[13px] text-[#737373] uppercase tracking-wider truncate m-0">
                  {sp.name}
                </h3>

                {/* Large focal number: "X / target" (matching Image 3 streak-number treatment) */}
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-sans text-3xl sm:text-4xl font-black text-[#111111] tracking-tight leading-none">
                    {sp.actualProgress}
                  </span>
                  <span className="font-sans text-lg sm:text-xl font-bold text-[#8A8A8A] leading-none">
                    / {sp.weeklyTarget}
                  </span>
                </div>
              </div>

              {/* Bottom row: User-editable target control */}
              <div className="mt-3 pt-2.5 border-t border-[#F2F2F2] flex items-center justify-between text-[11px] font-sans">
                <button
                  type="button"
                  onClick={() => handleOpenEditTarget(sp)}
                  className="inline-flex items-center gap-1 text-[#8A8A8A] hover:text-[#111111] transition-colors cursor-pointer select-none group"
                  title="Tap to override weekly target"
                >
                  <span>
                    Target: <strong className="text-[#111111]">{sp.weeklyTarget}/wk</strong>
                  </span>
                  {sp.isOverridden ? (
                    <span className="text-[9px] bg-[#F0F0F0] text-[#555555] px-1 py-0.2 rounded font-semibold ml-0.5">
                      Custom
                    </span>
                  ) : (
                    <Pencil size={10} className="text-[#8A8A8A] opacity-60 group-hover:opacity-100" />
                  )}
                </button>

                {sp.isOverridden && (
                  <button
                    type="button"
                    onClick={() => handleResetTarget(sp.id)}
                    className="text-[10px] text-[#8A8A8A] hover:text-[#111111] underline cursor-pointer select-none"
                    title="Reset to auto-calculated target"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 — Weekly consistency (Reference: Image 3 "Today's Focus" + Image 2 dot-grid pattern) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-sans text-xs font-bold text-[#8A8A8A] uppercase tracking-wider m-0">
            Weekly Consistency
          </h2>
          <span className="text-[11px] font-sans font-medium text-[#8A8A8A]">
            Current week
          </span>
        </div>

        {/* Consistency Card */}
        <div className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          {/* Top section: Current Streak + This week's total */}
          <div className="flex items-center justify-between gap-4">
            {/* Current Streak (styled like Image 3 "47 days" streak treatment) */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                <Flame size={13} className="text-[#111111]" />
                <span>Current Streak</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-4xl sm:text-5xl font-black text-[#111111] tracking-tight leading-none">
                  {currentStreak}
                </span>
                <span className="font-sans text-base sm:text-lg font-bold text-[#8A8A8A] leading-none">
                  {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            {/* Subtle vertical separator */}
            <div className="w-[1px] h-12 bg-[#EAEAEA] flex-shrink-0" />

            {/* This week's total (sum of all three subjects' actual progress from Section 1) */}
            <div className="text-right">
              <div className="text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                This Week's Total
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-sans text-3xl sm:text-4xl font-black text-[#111111] tracking-tight leading-none">
                  {weeklyTotalWatched}
                </span>
                <span className="font-sans text-sm sm:text-base font-bold text-[#8A8A8A] leading-none">
                  {weeklyTotalWatched === 1 ? 'part' : 'parts'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom section: Weekly dot-grid (styled like Image 2 filled-vs-hollow circle pattern) */}
          <div className="pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-[11px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider">
                Daily Activity
              </span>
              <span className="text-[10px] font-sans text-[#8A8A8A]">
                Ring = Today
              </span>
            </div>

            {/* 7 dots/circles row (Mon – Sun) with initials beneath */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {weekDotGrid.map((day) => {
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2 select-none">
                    {/* Circle dot: filled if >= 1 part completed, hollow if 0; today gets highlight ring */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                        day.isCompleted
                          ? 'bg-[#111111] text-[#FFFFFF] shadow-2xs'
                          : 'bg-[#FFFFFF] border-2 border-[#D4D4D4] text-[#A3A3A3]'
                      } ${
                        day.isToday
                          ? 'ring-2 ring-[#111111] ring-offset-2'
                          : ''
                      }`}
                      title={`${day.fullName} (${day.date}): ${day.count} parts watched`}
                    >
                      {day.isCompleted ? (
                        <Check size={14} strokeWidth={3} className="text-[#FFFFFF]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4D4D4]" />
                      )}
                    </div>

                    {/* Day initial beneath dot */}
                    <span
                      className={`text-xs font-sans font-bold leading-none ${
                        day.isToday ? 'text-[#111111] font-black' : 'text-[#8A8A8A]'
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
      </section>

      {/* Target Override Modal / Popover */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-2xl w-full max-w-xs p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-[#111111] m-0">
                Override Weekly Target
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="text-[#8A8A8A] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-sans text-[#737373]">
                Subject: <strong className="text-[#111111]">{editingSubject.name}</strong>
              </div>
              <div className="text-[11px] font-sans text-[#8A8A8A]">
                Auto-calculated suggestion: <strong>{editingSubject.autoTarget} parts/week</strong> based on remaining parts until exam.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                Target parts per week
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetInputValue}
                onChange={(e) => setTargetInputValue(e.target.value)}
                autoFocus
                className="w-full font-sans text-base font-bold p-2.5 rounded-xl border border-[#E0E0E0] bg-[#F9F9F9] text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              {customTargets[editingSubject.id] !== undefined && (
                <button
                  type="button"
                  onClick={() => handleResetTarget(editingSubject.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#E0E0E0] text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Auto</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#111111] text-[#FFFFFF] font-sans font-bold text-xs hover:bg-[#262626] transition-colors cursor-pointer shadow-xs"
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
