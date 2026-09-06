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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
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
      subjects: [...prev.subjects, { ...subject, id: Math.random().toString(36).slice(2, 10) }],
    }));
  };

  const addLesson = (lesson: Omit<Lesson, 'id' | 'done' | 'confidence' | 'completedDate'>) => {
    setState((prev) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          ...lesson,
          id: Math.random().toString(36).slice(2, 10),
          done: false,
          confidence: null,
          completedDate: null,
        },
      ],
    }));
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    setState((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const markLessonDone = (id: string, confidence: 'L' | 'M' | 'H' | null, date: string) => {
    setState((prev) => {
      const lesson = prev.lessons.find((l) => l.id === id);
      if (!lesson || lesson.done) return prev;

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
        revisits: [...prev.revisits, ...newRevisits],
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
