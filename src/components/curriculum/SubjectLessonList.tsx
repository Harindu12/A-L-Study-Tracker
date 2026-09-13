import React, { useState } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigation } from '../../navigation';
import { LessonCardItem } from './LessonCardItem';

interface SubjectLessonListProps {
  subject: Subject;
  onBack: () => void;
}

type FilterType = 'all' | 'pending' | 'done' | 'low';

export const SubjectLessonList: React.FC<SubjectLessonListProps> = ({ subject, onBack }) => {
  const { lessons, addLesson } = useStore();
  const { activeOverlay, openOverlay, closeOverlay, isPopping } = useNavigation();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [newLessonName, setNewLessonName] = useState('');
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>({});

  // Reset newLessonName if add-lesson overlay was dismissed via system back
  React.useEffect(() => {
    if (activeOverlay !== 'add-lesson' && isPopping) {
      setNewLessonName('');
    }
  }, [activeOverlay, isPopping]);

  const toggleExpandLesson = (lessonId: string) => {
    setExpandedLessonIds((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Lessons strictly in the order they were added
  const subjectLessons = lessons.filter((l) => l.subjectId === subject.id);
  const doneCount = subjectLessons.filter((l) => l.done).length;
  const pendingCount = subjectLessons.length - doneCount;
  const lowConfidenceCount = subjectLessons.filter((l) => l.done && l.confidence === 'L').length;

  const targetCount = subject.targetCount;
  const watchedVideosCount = subjectLessons.reduce(
    (acc, l) => acc + (l.parts ? l.parts.filter((p) => p.watched).length : 0),
    0
  );
  const totalVideosInSubject = subjectLessons.reduce(
    (acc, l) => acc + (l.parts ? l.parts.length : 0),
    0
  );
  const progressTarget = targetCount || totalVideosInSubject;
  const percentage = progressTarget > 0 ? Math.min(100, Math.round((watchedVideosCount / progressTarget) * 100)) : 0;

  const filteredLessons = subjectLessons.filter((lesson) => {
    if (filter === 'pending') return !lesson.done;
    if (filter === 'done') return lesson.done;
    if (filter === 'low') return lesson.done && lesson.confidence === 'L';
    return true; // 'all'
  });

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLessonName.trim()) {
      addLesson({
        subjectId: subject.id,
        name: newLessonName.trim(),
      });
      setNewLessonName('');
      if (activeOverlay === 'add-lesson') {
        closeOverlay();
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top navigation row & Subject Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-sans font-bold text-[var(--accent)] hover:opacity-80 py-1.5 px-3 rounded-xl transition-all bg-[#FAF7F0] border border-[var(--line)] shadow-[0_1px_3px_rgba(120,100,70,0.08)] paper-card cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Curriculum Dashboard</span>
          </button>
          {targetCount && (
            <span className="text-xs font-sans text-[var(--ink-soft)] bg-[#FAF7F0] px-2.5 py-1 rounded-xl border border-[var(--line)]">
              Target: <strong className="text-[var(--ink)]">{targetCount}</strong> videos
            </span>
          )}
        </div>

        <div className="px-1 mt-1">
          <div className="text-[0.7rem] uppercase tracking-wider font-sans font-bold text-[var(--ink-soft)]">
            Subject Drill-Down
          </div>
          <h1 className="font-caveat text-3xl sm:text-4xl font-bold text-[var(--accent)] leading-tight mt-0.5">
            {subject.name}
          </h1>
        </div>
      </div>

      {/* Top summary card: SUBJECT PROGRESS (Matches Reference) */}
      <div className="paper-card rounded-2xl sm:rounded-3xl border border-[var(--line)] bg-[#FAF7F0] p-4 sm:p-5 shadow-[0_2px_8px_rgba(120,100,70,0.06)]">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)]">
            SUBJECT PROGRESS
          </span>
          <div className="text-xs sm:text-sm font-sans text-[var(--ink-soft)]">
            <span className="font-bold text-[var(--ink)] text-sm sm:text-base">
              {watchedVideosCount}/{progressTarget}
            </span>{' '}
            <span className="font-medium">videos</span>
          </div>
        </div>

        {/* Horizontal progress bar spanning the card */}
        <div className="w-full h-2.5 sm:h-3 rounded-full bg-[#EAE6DC] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-[#5B8266]' : 'bg-[var(--accent)]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'all'
              ? 'bg-[#7A5C94] text-white shadow-sm'
              : 'bg-[#FAF7F0] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          <span>All</span>
          <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-white/20' : 'bg-black/5'}`}>
            {subjectLessons.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'pending'
              ? 'bg-[#7A5C94] text-white shadow-sm'
              : 'bg-[#FAF7F0] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          <span>Pending</span>
          <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${filter === 'pending' ? 'bg-white/20' : 'bg-black/5'}`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('done')}
          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'done'
              ? 'bg-[#5B8266] text-white shadow-sm'
              : 'bg-[#FAF7F0] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          <span>Done</span>
          <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${filter === 'done' ? 'bg-white/20' : 'bg-black/5'}`}>
            {doneCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'low'
              ? 'bg-[#B45309] text-white shadow-sm'
              : 'bg-[#FAF7F0] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          <span>Low confidence</span>
          <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${filter === 'low' ? 'bg-white/20' : 'bg-black/5'}`}>
            {lowConfidenceCount}
          </span>
        </button>
      </div>

      {/* Add Lesson Input */}
      <form onSubmit={handleAddLesson} className="card !mb-0 p-3 sm:p-4 paper-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={newLessonName}
            onChange={(e) => setNewLessonName(e.target.value)}
            onFocus={() => {
              if (activeOverlay !== 'add-lesson') {
                openOverlay('add-lesson');
              }
            }}
            onBlur={() => {
              if (activeOverlay === 'add-lesson' && !newLessonName.trim() && !isPopping) {
                closeOverlay();
              }
            }}
            placeholder="Lesson name (e.g. Chemical Bonding)..."
            className="flex-1 font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
          />
          <button
            type="submit"
            disabled={!newLessonName.trim()}
            className="btn !py-2 !px-4 !text-xs whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
          >
            <Plus size={16} />
            <span>Add Lesson</span>
          </button>
        </div>
      </form>

      {/* Lesson List */}
      <div className="flex flex-col gap-2.5">
        {filteredLessons.length === 0 ? (
          <div className="card paper-card text-center py-8">
            <p className="text-sm font-sans text-[var(--ink-soft)]">
              {subjectLessons.length === 0
                ? 'No lessons added yet. Type a lesson name above to get started.'
                : filter === 'pending'
                ? 'Great job! No pending lessons in this subject.'
                : filter === 'done'
                ? 'No completed lessons yet. Mark one as done above!'
                : 'No low confidence lessons found.'}
            </p>
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCardItem
              key={lesson.id}
              lesson={lesson}
              isExpanded={!!expandedLessonIds[lesson.id]}
              onToggleExpand={() => toggleExpandLesson(lesson.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

