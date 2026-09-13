import { Subject, Lesson } from '../types';

export interface SubjectProgressMetrics {
  subjectId: string;
  totalLessons: number;
  totalPartsAdded: number;       // Live count of all parts currently existing across all lessons in this subject
  watchedPartsCount: number;     // Live sum of parts with watched === true across all lessons in this subject
  targetCount?: number;          // User-defined goal number (if any)
  progressDenominator: number;   // targetCount if set and > 0, otherwise totalPartsAdded
  percentage: number;            // Math.min(100, Math.round((watchedPartsCount / progressDenominator) * 100)) or 0
  exceedsTarget: boolean;        // true if totalPartsAdded > targetCount
  partsOverTarget: number;       // Math.max(0, totalPartsAdded - targetCount)
  partsUnderTarget: number;      // Math.max(0, targetCount - totalPartsAdded)
  videosRemaining: number;       // Math.max(0, progressDenominator - watchedPartsCount)
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
    const parts = lesson.parts || [];
    totalPartsAdded += parts.length;
    for (const part of parts) {
      if (part.watched) {
        watchedPartsCount++;
      }
    }
  }

  const targetCount =
    typeof subject.targetCount === 'number' && subject.targetCount > 0
      ? subject.targetCount
      : undefined;

  const progressDenominator = targetCount ?? totalPartsAdded;
  const percentage = progressDenominator > 0
    ? Math.min(100, Math.round((watchedPartsCount / progressDenominator) * 100))
    : 0;

  const exceedsTarget = !!(targetCount && totalPartsAdded > targetCount);
  const partsOverTarget = targetCount && totalPartsAdded > targetCount ? totalPartsAdded - targetCount : 0;
  const partsUnderTarget = targetCount && totalPartsAdded < targetCount ? targetCount - totalPartsAdded : 0;
  const videosRemaining = Math.max(0, progressDenominator - watchedPartsCount);

  return {
    subjectId: subject.id,
    totalLessons,
    totalPartsAdded,
    watchedPartsCount,
    targetCount,
    progressDenominator,
    percentage,
    exceedsTarget,
    partsOverTarget,
    partsUnderTarget,
    videosRemaining,
  };
}

export interface CurriculumOverallMetrics {
  totalWatchedVideos: number;
  totalPartsAdded: number;
  totalTargetVideos: number;
  videosRemaining: number;
}

/**
 * Calculates overall curriculum-wide metrics across all subjects and lessons.
 */
export function calculateCurriculumMetrics(subjects: Subject[], lessons: Lesson[]): CurriculumOverallMetrics {
  let totalWatchedVideos = 0;
  let totalPartsAdded = 0;
  let totalTargetVideos = 0;
  let videosRemaining = 0;

  for (const subject of subjects) {
    const m = calculateSubjectMetrics(subject, lessons);
    totalWatchedVideos += m.watchedPartsCount;
    totalPartsAdded += m.totalPartsAdded;
    totalTargetVideos += m.progressDenominator;
    videosRemaining += m.videosRemaining;
  }

  // Also include any lessons not belonging to an active subject
  const knownSubjectIds = new Set(subjects.map((s) => s.id));
  const orphanedLessons = lessons.filter((l) => !knownSubjectIds.has(l.subjectId));
  for (const lesson of orphanedLessons) {
    const parts = lesson.parts || [];
    totalPartsAdded += parts.length;
    for (const p of parts) {
      if (p.watched) totalWatchedVideos++;
    }
    totalTargetVideos += parts.length;
  }

  return {
    totalWatchedVideos,
    totalPartsAdded,
    totalTargetVideos,
    videosRemaining,
  };
}
