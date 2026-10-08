import { Subject, Lesson } from '../types';

export interface SubjectProgressMetrics {
  subjectId: string;
  totalLessons: number;
  totalPartsAdded: number;       // Live count of all parts currently existing across all lessons in this subject
  watchedPartsCount: number;     // Live sum of parts with watched === true across all lessons in this subject
  percentage: number;            // Math.min(100, Math.round((watchedPartsCount / totalPartsAdded) * 100)) or 0
  partsRemaining: number;        // Math.max(0, totalPartsAdded - watchedPartsCount)
}

/**
 * Calculates live subject metrics from current lessons state.
 * Never caches; always returns fresh calculations based on current lesson parts.
 */
export function calculateSubjectMetrics(subject: Subject, lessons: Lesson[]): SubjectProgressMetrics {
  const subjectLessons = lessons.filter((l) => l.subjectId === subject.id);
  const totalLessons = subjectLessons.length;
  
  let watchedPartsCount = 0;
  let totalPartsAdded = 0;

  for (const lesson of subjectLessons) {
    if (lesson.parts && lesson.parts.length > 0) {
      totalPartsAdded += lesson.parts.length;
      for (const part of lesson.parts) {
        if (part.watched) {
          watchedPartsCount++;
        }
      }
    } else {
      totalPartsAdded += 1;
      if (lesson.done) {
        watchedPartsCount++;
      }
    }
  }

  const percentage = totalPartsAdded > 0
    ? Math.min(100, Math.round((watchedPartsCount / totalPartsAdded) * 100))
    : 0;

  const partsRemaining = Math.max(0, totalPartsAdded - watchedPartsCount);

  return {
    subjectId: subject.id,
    totalLessons,
    totalPartsAdded,
    watchedPartsCount,
    percentage,
    partsRemaining,
  };
}

export interface CurriculumOverallMetrics {
  totalWatchedVideos: number;
  totalPartsAdded: number;
  videosRemaining: number;
}

/**
 * Calculates overall curriculum-wide metrics across all subjects and lessons purely from actual parts.
 */
export function calculateCurriculumMetrics(subjects: Subject[], lessons: Lesson[]): CurriculumOverallMetrics {
  let totalWatchedVideos = 0;
  let totalPartsAdded = 0;

  for (const subject of subjects) {
    const m = calculateSubjectMetrics(subject, lessons);
    totalWatchedVideos += m.watchedPartsCount;
    totalPartsAdded += m.totalPartsAdded;
  }

  // Also include any lessons not belonging to an active subject
  const knownSubjectIds = new Set(subjects.map((s) => s.id));
  const orphanedLessons = lessons.filter((l) => !knownSubjectIds.has(l.subjectId));
  for (const lesson of orphanedLessons) {
    if (lesson.parts && lesson.parts.length > 0) {
      totalPartsAdded += lesson.parts.length;
      for (const p of lesson.parts) {
        if (p.watched) totalWatchedVideos++;
      }
    } else {
      totalPartsAdded += 1;
      if (lesson.done) totalWatchedVideos++;
    }
  }

  const videosRemaining = Math.max(0, totalPartsAdded - totalWatchedVideos);

  return {
    totalWatchedVideos,
    totalPartsAdded,
    videosRemaining,
  };
}

/**
 * Calculates days remaining until the saved exam date.
 * Uses local calendar date boundaries to avoid UTC/timezone offsets.
 */
export function calculateDaysRemaining(examDate?: string): number {
  if (!examDate) return 0;
  const cleanDateStr = examDate.split('T')[0];
  const parts = cleanDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [examYear, examMonth, examDay] = parts;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const examMidnight = new Date(examYear, examMonth - 1, examDay).getTime();

  const diffMs = examMidnight - todayMidnight;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates whole weeks remaining until the saved exam date.
 * Formula: (days remaining ÷ 7), rounded up, with a minimum of 1.
 */
export function calculateWeeksRemaining(examDate?: string): number {
  if (!examDate) return 10; // Sensible baseline when exam date has not been set yet
  const daysRemaining = calculateDaysRemaining(examDate);
  if (daysRemaining <= 0) return 1; // Minimum 1 to avoid divide-by-zero if exam is less than a week away or today
  return Math.max(1, Math.ceil(daysRemaining / 7));
}

/**
 * Calculates a subject's weekly target.
 * Formula: (that subject's total parts − parts already watched) ÷ weeks remaining, rounded up to a whole number.
 */
export function calculateWeeklyTarget(totalParts: number, watchedParts: number, weeksRemaining: number): number {
  const partsRemaining = Math.max(0, totalParts - watchedParts);
  const weeks = Math.max(1, weeksRemaining);
  if (partsRemaining === 0) return 0;
  return Math.max(1, Math.ceil(partsRemaining / weeks));
}
