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
    const parts = lesson.parts || [];
    totalPartsAdded += parts.length;
    for (const part of parts) {
      if (part.watched) {
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
    const parts = lesson.parts || [];
    totalPartsAdded += parts.length;
    for (const p of parts) {
      if (p.watched) totalWatchedVideos++;
    }
  }

  const videosRemaining = Math.max(0, totalPartsAdded - totalWatchedVideos);

  return {
    totalWatchedVideos,
    totalPartsAdded,
    videosRemaining,
  };
}
