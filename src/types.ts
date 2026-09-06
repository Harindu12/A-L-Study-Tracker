export interface Subject {
  id: string;
  name: string;
  targetCount?: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  name: string;
  done: boolean;
  confidence: 'L' | 'M' | 'H' | null;
  completedDate: string | null;
}

export interface Revisit {
  id: string;
  lessonId: string;
  subjectId: string;
  date: string;
  type: string;
  done: boolean;
}

export interface HourBlock {
  id: string;
  time: string;
  task: string;
  done: boolean;
}

export interface DailySubjectLog {
  id: string;
  subjectId: string;
  lessonId: string;
  studied: boolean;
  pastPaper: boolean;
  confidence: 'L' | 'M' | 'H' | null;
}

export interface DailyEntry {
  date: string;
  wakeTime: string;
  sleepTime: string;
  hours: HourBlock[];
  subjects: DailySubjectLog[];
  teachback: string;
  notes: string;
}

export interface WeeklyTest {
  id: string;
  weekStartDate: string;
  subjectId: string;
  score: string;
}
