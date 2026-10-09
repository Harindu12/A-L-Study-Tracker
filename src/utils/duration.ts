import { DailyEntry, Lesson, Revisit } from '../types';

/**
 * Parses duration strings like '45 min', '50 mins', '1 hr', '1.5 hr', '2 hrs', '60 min'
 * into total minutes.
 */
export function parseDurationToMinutes(duration?: string | number): number {
  if (typeof duration === 'number') {
    return isNaN(duration) ? 0 : duration;
  }
  if (!duration || typeof duration !== 'string') {
    return 0;
  }
  const str = duration.trim().toLowerCase();
  if (!str) return 0;

  let totalMinutes = 0;
  let matched = false;

  // Match hours, e.g. "1.5 hr", "2 hrs", "1 hour", "1.5h"
  const hrMatch = str.match(/([\d.]+)\s*(?:hr|hour|h\b)/i);
  if (hrMatch) {
    const hours = parseFloat(hrMatch[1]);
    if (!isNaN(hours)) {
      totalMinutes += hours * 60;
      matched = true;
    }
  }

  // Match minutes, e.g. "45 min", "45 mins", "30 m", "30 minutes"
  const minMatch = str.match(/([\d.]+)\s*(?:min|minute|m\b)/i);
  if (minMatch) {
    const mins = parseFloat(minMatch[1]);
    if (!isNaN(mins)) {
      totalMinutes += mins;
      matched = true;
    }
  }

  // Fallback: If no unit matched, check if it's a bare number e.g. "45"
  if (!matched) {
    const bareNum = parseFloat(str);
    if (!isNaN(bareNum)) {
      totalMinutes = bareNum;
    }
  }

  return totalMinutes;
}

/**
 * Formats minutes studied into a bold number + unit pair.
 * Under 60 min -> minutes (e.g. "45" "min", "0" "min").
 * 60 min or above -> hours (e.g. "3.5" "hrs", "1" "hr", "2" "hrs").
 */
export function formatStudiedTime(totalMinutes: number): { value: string; unit: string } {
  if (totalMinutes < 60) {
    return {
      value: String(Math.round(totalMinutes)),
      unit: 'min',
    };
  }

  const hours = totalMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  const value = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  const unit = rounded === 1 ? 'hr' : 'hrs';

  return { value, unit };
}

/**
 * Formats daily study minutes for the bar chart label:
 * - Under 60 min: "Xm" (e.g. "45m")
 * - 60 min or more: "Xh Ym" (e.g. "1h 10m"), or "Xh" if zero leftover minutes (e.g. "2h")
 * - Zero minutes: "0m"
 */
export function formatBarStudyTime(minutes: number): string {
  const rounded = Math.round(minutes || 0);
  if (rounded <= 0) return '0m';
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const remainingMins = rounded % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Calculates total minutes studied within a list of dates (current Mon–Sun week)
 * by summing duration of every task in Calendar/Agenda marked as completed ("Watched" checked).
 */
export function calculateWeeklyStudiedMinutes(
  weekDays: string[],
  dailyEntries: Record<string, DailyEntry>,
  lessons: Lesson[],
  revisits: Revisit[] = []
): number {
  let totalMinutes = 0;

  for (const dateStr of weekDays) {
    const dayEntry = dailyEntries[dateStr];

    // 1. Hourly schedule blocks from dailyEntries
    if (dayEntry && Array.isArray(dayEntry.hours)) {
      for (const h of dayEntry.hours) {
        if (h.done) {
          const durationStr = (h as any).duration || '50 min';
          totalMinutes += parseDurationToMinutes(durationStr);
        }
      }
    }

    // 2. Subject study logs from dailyEntries
    if (dayEntry && Array.isArray(dayEntry.subjects)) {
      for (const s of dayEntry.subjects) {
        const lesson = lessons.find((l) => l.id === s.lessonId);
        const part = lesson?.parts?.find((p) => p.id === s.partId);

        // Two-way sync: part in Curriculum is the source of truth for watched and pastPaper
        const isWatched = part ? !!part.watched : !!s.studied;
        if (isWatched) {
          const isPastPaper = part ? !!part.pastPaper : !!s.pastPaper;
          const durationStr = (s as any).duration || (isPastPaper ? '60 min' : '45 min');
          totalMinutes += parseDurationToMinutes(durationStr);
        }
      }
    }

    // 3. Spaced repetition revisits scheduled for this date
    if (Array.isArray(revisits)) {
      for (const r of revisits) {
        if (r.date === dateStr && r.done) {
          const durationStr = (r as any).duration || '30 min';
          totalMinutes += parseDurationToMinutes(durationStr);
        }
      }
    }
  }

  return totalMinutes;
}

/**
 * Calculates total minutes studied on a specific single date
 * by summing duration of every task in Calendar/Agenda marked as completed ("Watched" checked).
 */
export function calculateDailyStudiedMinutes(
  dateStr: string,
  dailyEntries: Record<string, DailyEntry>,
  lessons: Lesson[],
  revisits: Revisit[] = []
): number {
  return calculateWeeklyStudiedMinutes([dateStr], dailyEntries, lessons, revisits);
}
