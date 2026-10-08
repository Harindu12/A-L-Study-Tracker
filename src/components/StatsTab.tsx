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
import { Atom, FlaskConical, Calculator, BookOpen, Check, Pencil, RotateCcw, X, Flame, Calendar, Clock, TrendingUp } from 'lucide-react';
import { formatStudiedTime, calculateWeeklyStudiedMinutes } from '../utils/duration';

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

  // Custom targets map (subjectId -> overridden number).
  // Defaults to empty so every subject displays its live auto-calculated target.
  const [customTargets, setCustomTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TARGETS_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        // Clean out any stale '1' or '50' overrides from the legacy schema bug
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

  // Exact days remaining pulled from the single source of truth (examDate in store)
  const daysRemaining = useMemo(() => {
    return calculateDaysRemaining(examDate);
  }, [examDate]);

  // Whole weeks remaining until the saved exam date: (days remaining ÷ 7), rounded up, minimum 1
  const weeksRemaining = useMemo(() => {
    return calculateWeeksRemaining(examDate);
  }, [examDate]);

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
  // Formula: (that subject's total parts − parts already watched) ÷ weeks remaining, rounded up to a whole number
  const subjectPaces = useMemo<SubjectPaceData[]>(() => {
    return displaySubjects.map((subj) => {
      const accentColor = getSubjectColorById(subj.id, subjects);

      // 1. Live parts calculation from actual lesson parts
      const metrics = calculateSubjectMetrics(subj, lessons);
      const totalParts = metrics.totalPartsAdded;
      const watchedParts = metrics.watchedPartsCount;
      const remainingParts = metrics.partsRemaining; // totalParts - watchedParts

      // 2. Auto-suggested weekly target: (remaining parts) ÷ (weeks remaining), rounded up to a whole number
      const autoTarget = calculateWeeklyTarget(totalParts, watchedParts, weeksRemaining);

      // Check if user has an explicit manual override in customTargets.
      // Do NOT treat legacy subj.targetCount as an override — autoTarget displays by default.
      const isOverridden = typeof customTargets[subj.id] === 'number' && customTargets[subj.id] > 0;
      const weeklyTarget = isOverridden ? customTargets[subj.id] : autoTarget;

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
        autoTarget,
        isOverridden,
        isOnTrack,
        expectedPace,
        totalRemainingParts: remainingParts,
        totalParts,
      };
    });
  }, [displaySubjects, subjects, lessons, weeksRemaining, customTargets, currentWeekDays, dailyEntries, daysElapsedThisWeek]);

  // SECTION 2: Weekly consistency
  // Total parts completed across all subjects this week
  const weeklyTotalWatched = useMemo(() => {
    return subjectPaces.reduce((sum, sp) => sum + sp.actualProgress, 0);
  }, [subjectPaces]);

  // Time studied this week: Sum the duration of every task in Calendar/Agenda marked as completed
  // ("Watched" checked) within current Mon–Sun week across all subjects.
  const timeStudied = useMemo(() => {
    const totalMinutes = calculateWeeklyStudiedMinutes(
      currentWeekDays,
      dailyEntries,
      lessons,
      revisits || []
    );
    return formatStudiedTime(totalMinutes);
  }, [currentWeekDays, dailyEntries, lessons, revisits]);

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

  // Weekly trend line data: one point per day (Mon–Sun), plotting count of parts completed that day
  const weeklyTrendData = useMemo(() => {
    const counts = weekDotGrid.map((d) => d.count);
    const maxCount = Math.max(...counts, 0);

    // SVG coordinate space: 280 x 48
    // Y: 8 (peak) to 40 (baseline 0 parts)
    const baselineY = 40;
    const topY = 8;
    const heightRange = baselineY - topY; // 32

    // 7 day points aligned with the 7 columns (each column width is 280 / 7 = 40, center is (i + 0.5) * 40)
    const dayPoints = weekDotGrid.map((day, idx) => {
      const x = (idx + 0.5) * (280 / 7);
      const y = maxCount > 0 ? baselineY - (day.count / maxCount) * heightRange : baselineY;
      return { x, y, day };
    });

    // Spline points with virtual edges at x=0 and x=280 to span full card width seamlessly
    const splinePoints = [
      { x: 0, y: dayPoints[0].y },
      ...dayPoints.map((p) => ({ x: p.x, y: p.y })),
      { x: 280, y: dayPoints[dayPoints.length - 1].y },
    ];

    let linePath = '';
    let areaPath = '';

    if (maxCount === 0) {
      // Flat line at zero across the entire week
      linePath = `M 0 ${baselineY} L 280 ${baselineY}`;
      areaPath = `M 0 ${baselineY} L 280 ${baselineY} L 280 ${baselineY} L 0 ${baselineY} Z`;
    } else {
      // Catmull-Rom spline converted to smooth cubic Bezier
      linePath = `M ${splinePoints[0].x.toFixed(1)} ${splinePoints[0].y.toFixed(1)}`;
      for (let i = 0; i < splinePoints.length - 1; i++) {
        const p0 = i > 0 ? splinePoints[i - 1] : splinePoints[i];
        const p1 = splinePoints[i];
        const p2 = splinePoints[i + 1];
        const p3 = i < splinePoints.length - 2 ? splinePoints[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;

        // Clamp control points between topY and baselineY so curves do not dip below 0
        cp1y = Math.max(topY, Math.min(baselineY, cp1y));
        cp2y = Math.max(topY, Math.min(baselineY, cp2y));

        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }

      areaPath = `${linePath} L 280 ${baselineY} L 0 ${baselineY} Z`;
    }

    return {
      counts,
      maxCount,
      dayPoints,
      linePath,
      areaPath,
      baselineY,
    };
  }, [weekDotGrid]);

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
    setEditingSubject({
      id: sp.id,
      name: sp.name,
      currentTarget: sp.weeklyTarget,
      autoTarget: sp.autoTarget,
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
          <div>
            <h2 className="font-sans text-xs font-bold text-[#8A8A8A] uppercase tracking-wider m-0">
              Weekly Pace
            </h2>
            <div className="text-[11px] font-sans font-medium text-[#737373] mt-0.5 flex items-center gap-1.5">
              <Calendar size={11} className="text-[#8A8A8A]" />
              <span>
                {examDate
                  ? `${weeksRemaining} ${weeksRemaining === 1 ? 'week' : 'weeks'} to exam (${daysRemaining}d)`
                  : `${weeksRemaining} weeks baseline`}
              </span>
            </div>
          </div>
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

              {/* Bottom row: User-editable target control & weekly progress mini-bar */}
              <div className="mt-3 pt-2.5 border-t border-[#F2F2F2] flex flex-col gap-1.5 text-[11px] font-sans">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTarget(sp)}
                    className="inline-flex items-center gap-1 text-[#8A8A8A] hover:text-[#111111] transition-colors cursor-pointer select-none group"
                    title={`Tap to override weekly target (${sp.totalRemainingParts} parts left ÷ ${weeksRemaining}w)`}
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
                      title={`Reset to auto-calculated pace (${sp.autoTarget}/wk)`}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Weekly progress mini-bar */}
                {(() => {
                  const weekElapsedPct = Math.min(100, Math.max(0, (daysElapsedThisWeek / 7) * 100));
                  const targetProgressPct = sp.weeklyTarget > 0 ? Math.min(100, (sp.actualProgress / sp.weeklyTarget) * 100) : 0;

                  return (
                    <div
                      className="relative w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-visible mt-0.5"
                      title={`This week: ${sp.actualProgress}/${sp.weeklyTarget} parts (${Math.round(targetProgressPct)}%) • Week elapsed: ${daysElapsedThisWeek}/7 days (${Math.round(weekElapsedPct)}%)`}
                    >
                      {/* A lighter-shaded marker or fill showing how far into the week we are */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#D4D4D4] rounded-full"
                        style={{ width: `${weekElapsedPct}%` }}
                      />

                      {/* A solid colored fill (using that subject's accent color) showing actual progress toward this week's target */}
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300"
                        style={{
                          width: `${targetProgressPct}%`,
                          backgroundColor: sp.accentColor,
                        }}
                      />

                      {/* Week-progress marker tick */}
                      <div
                        className="absolute -top-[2px] -bottom-[2px] w-[2px] bg-[#525252] rounded-full z-10 -ml-[1px]"
                        style={{ left: `${weekElapsedPct}%` }}
                      />
                    </div>
                  );
                })()}
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
          {/* Top section: Current Streak, This Week's Total, and Time Studied This Week */}
          <div className="space-y-4">
            {/* Top row: Current Streak + This week's total */}
            <div className="flex items-center justify-between gap-4">
              {/* Current Streak (styled like Image 3 "47 days" streak treatment) */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                  <Flame size={13} className="text-[#111111]" />
                  <span>Current Streak</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-3xl sm:text-4xl font-black text-[#111111] tracking-tight leading-none">
                    {currentStreak}
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-[#8A8A8A] leading-none">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* Subtle vertical separator */}
              <div className="w-[1px] h-11 bg-[#EAEAEA] flex-shrink-0" />

              {/* This week's total (sum of all three subjects' actual progress from Section 1) */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                  <BookOpen size={13} className="text-[#111111]" />
                  <span>This Week's Total</span>
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

            {/* Bottom row: Time studied this week */}
            <div className="pt-3.5 border-t border-[#F0F0F0] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                  <Clock size={13} className="text-[#111111]" />
                  <span>Time Studied This Week</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-3xl sm:text-4xl font-black text-[#111111] tracking-tight leading-none">
                    {timeStudied.value}
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-[#8A8A8A] leading-none">
                    {timeStudied.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle section: Weekly trend line sparkline */}
          <div className="pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider">
                <TrendingUp size={13} className="text-[#111111]" />
                <span>Weekly Trend</span>
              </div>
              <span className="text-[10px] font-sans text-[#8A8A8A]">
                {weeklyTrendData.maxCount > 0
                  ? `Peak: ${weeklyTrendData.maxCount} ${weeklyTrendData.maxCount === 1 ? 'part' : 'parts'}/day`
                  : '0 parts'}
              </span>
            </div>

            {/* Sparkline chart */}
            <div className="relative w-full h-12 select-none">
              <svg
                viewBox="0 0 280 48"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="weeklyTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111111" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#111111" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Faint baseline guide at y=40 */}
                <line
                  x1="0"
                  y1={weeklyTrendData.baselineY}
                  x2="280"
                  y2={weeklyTrendData.baselineY}
                  stroke="#EFEFEF"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Area fill beneath curve */}
                {weeklyTrendData.maxCount > 0 && (
                  <path
                    d={weeklyTrendData.areaPath}
                    fill="url(#weeklyTrendGradient)"
                  />
                )}

                {/* Smooth curve / flat line */}
                <path
                  d={weeklyTrendData.linePath}
                  fill="none"
                  stroke={weeklyTrendData.maxCount > 0 ? '#111111' : '#A3A3A3'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Day points overlay along the curve */}
              {weeklyTrendData.dayPoints.map(({ y, day }, idx) => {
                const xPct = ((idx + 0.5) / 7) * 100;
                const yPct = (y / 48) * 100;

                if (day.count > 0) {
                  return (
                    <div
                      key={day.date}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      title={`${day.fullName}: ${day.count} ${day.count === 1 ? 'part' : 'parts'} watched`}
                    >
                      <div
                        className={`rounded-full bg-[#111111] border-2 border-[#FFFFFF] shadow-2xs ${
                          day.isToday ? 'w-2.5 h-2.5 ring-1.5 ring-[#111111]' : 'w-2 h-2'
                        }`}
                      />
                    </div>
                  );
                }

                if (day.isToday) {
                  return (
                    <div
                      key={day.date}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{
                        left: `${xPct}%`,
                        top: `${(weeklyTrendData.baselineY / 48) * 100}%`,
                      }}
                      title={`${day.fullName} (Today): 0 parts watched`}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#FFFFFF] border-1.5 border-[#111111]" />
                    </div>
                  );
                }

                return null;
              })}
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
                Auto-calculated suggestion: <strong>{editingSubject.autoTarget} parts/week</strong> based on remaining parts until exam ({weeksRemaining}w).
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

