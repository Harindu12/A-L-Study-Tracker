export interface Subject {
  id: string;
  name: string;
  targetCount?: number;
}

export interface LessonPart {
  id: string;
  name: string;
  title?: string;
  videoLink?: string;
  watched: boolean;
  pastPaper: boolean;
}

export interface Lesson {
  id: string;
  subjectId: string;
  name: string;
  done: boolean;
  confidence?: 'L' | 'M' | 'H' | null;
  completedDate: string | null;
  parts?: LessonPart[];
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
  time?: string;
  startTime?: string;
  duration?: string;
  task: string;
  done: boolean;
}

export interface DailySubjectLog {
  id: string;
  subjectId: string;
  lessonId: string;
  partId?: string;
  studied: boolean;
  pastPaper: boolean;
  confidence?: 'L' | 'M' | 'H' | null;
  startTime?: string;
  duration?: string;
}

export interface DailyEntry {
  date: string;
  wakeTime?: string;
  sleepTime?: string;
  hours: HourBlock[];
  subjects: DailySubjectLog[];
  teachback: string;
  notes: string;
}
