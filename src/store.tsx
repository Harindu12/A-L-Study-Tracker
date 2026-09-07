import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subject, Lesson, Revisit, DailyEntry, WeeklyTest } from './types';
import { addDays, todayStr } from './utils';

interface AppState {
  subjects: Subject[];
  lessons: Lesson[];
  revisits: Revisit[];
  dailyEntries: Record<string, DailyEntry>;
  weeklyTests: WeeklyTest[];
}

interface AppContextType extends AppState {
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  addLesson: (lesson: Omit<Lesson, 'id' | 'done' | 'confidence' | 'completedDate'>) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  markLessonDone: (id: string, confidence: 'L' | 'M' | 'H' | null, date: string) => void;
  updateRevisit: (id: string, updates: Partial<Revisit>) => void;
  saveDailyEntry: (date: string, entry: DailyEntry) => void;
  saveWeeklyTest: (test: Omit<WeeklyTest, 'id'>) => void;
}

const STORAGE_KEY = 'al_study_tracker_data';

const defaultState: AppState = {
  subjects: [],
  lessons: [],
  revisits: [],
  dailyEntries: {},
  weeklyTests: [],
};

const cleanState = (raw: any): AppState => {
  if (!raw || typeof raw !== 'object') return defaultState;

  const subjects: Subject[] = Array.isArray(raw.subjects) ? raw.subjects : [];
  let lessons: Lesson[] = Array.isArray(raw.lessons) ? [...raw.lessons] : [];
  let revisits: Revisit[] = Array.isArray(raw.revisits) ? [...raw.revisits] : [];

  // Detect and fix corrupted/duplicate lessons (e.g. "uYBonds" alongside "Bonds")
  const idRemap = new Map<string, string>(); // corruptedId -> canonicalId

  lessons.forEach((lesson) => {
    const rawName = (lesson.name || '').trim();
    // Look for another lesson in the same subject whose name is a pure suffix of this lesson
    const match = lessons.find((other) => {
      if (other.id === lesson.id || other.subjectId !== lesson.subjectId) return false;
      const otherName = (other.name || '').trim();
      return (
        otherName.length > 0 &&
        rawName.endsWith(otherName) &&
        rawName.length > otherName.length &&
        rawName.length <= otherName.length + 5
      );
    });

    if (match) {
      idRemap.set(lesson.id, match.id);
    }
  });

  // Remove exact duplicates and remapped corrupted lessons
  const seenLessonKeys = new Set<string>();
  const filteredLessons: Lesson[] = [];

  lessons.forEach((lesson) => {
    if (idRemap.has(lesson.id)) return;
    const cleanName = (lesson.name || '').trim();
    const key = `${lesson.subjectId}::${cleanName.toLowerCase()}`;
    if (!seenLessonKeys.has(key)) {
      seenLessonKeys.add(key);
      filteredLessons.push({ ...lesson, name: cleanName });
    } else {
      const canonical = filteredLessons.find(
        (l) => l.subjectId === lesson.subjectId && l.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (canonical) {
        idRemap.set(lesson.id, canonical.id);
      }
    }
  });
  lessons = filteredLessons;

  // Remap revisits referencing remapped lessons
  revisits = revisits.map((r) => ({
    ...r,
    lessonId: idRemap.get(r.lessonId) || r.lessonId,
  }));

  // Filter out revisits for lessons that don't exist or aren't done
  const validCompletedLessonIds = new Set(lessons.filter((l) => l.done).map((l) => l.id));
  revisits = revisits.filter((r) => validCompletedLessonIds.has(r.lessonId));

  // Exactly one set of revisit reminders (Day 3, Day 7, Day 30) per completed lesson
  const seenRevisits = new Set<string>();
  const dedupedRevisits: Revisit[] = [];

  revisits.forEach((r) => {
    const key = `${r.lessonId}::${r.type}`;
    if (!seenRevisits.has(key)) {
      seenRevisits.add(key);
      dedupedRevisits.push(r);
    }
  });

  return {
    subjects,
    lessons,
    revisits: dedupedRevisits,
    dailyEntries: raw.dailyEntries && typeof raw.dailyEntries === 'object' ? raw.dailyEntries : {},
    weeklyTests: Array.isArray(raw.weeklyTests) ? raw.weeklyTests : [],
  };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(cleanState(parsed));
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addSubject = (subject: Omit<Subject, 'id'>) => {
    setState((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...subject, name: subject.name.trim(), id: Math.random().toString(36).slice(2, 10) }],
    }));
  };

  const addLesson = (lesson: Omit<Lesson, 'id' | 'done' | 'confidence' | 'completedDate'>) => {
    setState((prev) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          ...lesson,
          name: lesson.name.trim(),
          id: Math.random().toString(36).slice(2, 10),
          done: false,
          confidence: null,
          completedDate: null,
        },
      ],
    }));
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    setState((prev) => {
      const cleanUpdates = { ...updates };
      if (typeof cleanUpdates.name === 'string') {
        cleanUpdates.name = cleanUpdates.name.trim();
      }
      let revisits = prev.revisits;
      if (cleanUpdates.done === false) {
        // Remove revisits when lesson is unmarked
        revisits = prev.revisits.filter((r) => r.lessonId !== id);
      }
      return {
        ...prev,
        lessons: prev.lessons.map((l) => (l.id === id ? { ...l, ...cleanUpdates } : l)),
        revisits,
      };
    });
  };

  const markLessonDone = (id: string, confidence: 'L' | 'M' | 'H' | null, date: string) => {
    setState((prev) => {
      const lesson = prev.lessons.find((l) => l.id === id);
      if (!lesson) return prev;

      // Remove any existing revisits for this lesson to ensure strictly one set
      const cleanRevisits = prev.revisits.filter((r) => r.lessonId !== id);

      const newRevisits: Revisit[] = [
        {
          id: Math.random().toString(36).slice(2, 10),
          lessonId: lesson.id,
          subjectId: lesson.subjectId,
          date: addDays(date, 3),
          type: 'Day 3',
          done: false,
        },
        {
          id: Math.random().toString(36).slice(2, 10),
          lessonId: lesson.id,
          subjectId: lesson.subjectId,
          date: addDays(date, 7),
          type: 'Day 7',
          done: false,
        },
        {
          id: Math.random().toString(36).slice(2, 10),
          lessonId: lesson.id,
          subjectId: lesson.subjectId,
          date: addDays(date, 30),
          type: 'Day 30',
          done: false,
        },
      ];

      return {
        ...prev,
        lessons: prev.lessons.map((l) =>
          l.id === id ? { ...l, done: true, confidence, completedDate: date } : l
        ),
        revisits: [...cleanRevisits, ...newRevisits],
      };
    });
  };

  const updateRevisit = (id: string, updates: Partial<Revisit>) => {
    setState((prev) => ({
      ...prev,
      revisits: prev.revisits.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const saveDailyEntry = (date: string, entry: DailyEntry) => {
    setState((prev) => {
      // Also mark any revisits done globally if they are newly checked today
      // Actually, we'll handle revisit syncing within the daily tab component itself
      return {
        ...prev,
        dailyEntries: {
          ...prev.dailyEntries,
          [date]: entry,
        },
      };
    });
  };

  const saveWeeklyTest = (test: Omit<WeeklyTest, 'id'>) => {
    setState((prev) => {
      const existingIdx = prev.weeklyTests.findIndex(
        (t) => t.weekStartDate === test.weekStartDate && t.subjectId === test.subjectId
      );
      if (existingIdx >= 0) {
        const newTests = [...prev.weeklyTests];
        newTests[existingIdx] = { ...newTests[existingIdx], score: test.score };
        return { ...prev, weeklyTests: newTests };
      }
      return {
        ...prev,
        weeklyTests: [...prev.weeklyTests, { ...test, id: Math.random().toString(36).slice(2, 10) }],
      };
    });
  };

  if (!isLoaded) return null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        addSubject,
        addLesson,
        updateLesson,
        markLessonDone,
        updateRevisit,
        saveDailyEntry,
        saveWeeklyTest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
