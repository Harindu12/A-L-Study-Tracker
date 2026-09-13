import React, { useState } from 'react';
import { Subject, Lesson } from '../../types';
import { useStore } from '../../store';
import { CircularProgress } from '../ui/CircularProgress';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { todayStr } from '../../utils';

interface SubjectLessonListProps {
  subject: Subject;
  onBack: () => void;
}

type FilterType = 'all' | 'pending' | 'done' | 'low';

export const SubjectLessonList: React.FC<SubjectLessonListProps> = ({ subject, onBack }) => {
  const { lessons, addLesson, updateLesson, deleteLesson, markLessonDone } = useStore();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [newLessonName, setNewLessonName] = useState('');
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});

  // Lessons strictly in the order they were added
  const subjectLessons = lessons.filter((l) => l.subjectId === subject.id);
  const doneCount = subjectLessons.filter((l) => l.done).length;
  const pendingCount = subjectLessons.length - doneCount;
  const lowConfidenceCount = subjectLessons.filter((l) => l.done && l.confidence === 'L').length;

  const targetCount = subject.targetCount;
  const progressTarget = targetCount || (subjectLessons.length > 0 ? subjectLessons.length : 1);
  const percentage = Math.min(100, Math.round((doneCount / progressTarget) * 100));

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
    }
  };

  const handleToggleDone = (lesson: Lesson) => {
    if (!lesson.done) {
      markLessonDone(lesson.id, lesson.confidence, todayStr());
    } else {
      updateLesson(lesson.id, { done: false, completedDate: null });
    }
  };

  const handleConfidenceChange = (lessonId: string, level: 'L' | 'M' | 'H') => {
    updateLesson(lessonId, { confidence: level });
  };

  const handleBlurName = (lessonId: string, originalName: string) => {
    const updated = editingNames[lessonId];
    if (updated !== undefined) {
      const trimmed = updated.trim();
      if (trimmed && trimmed !== originalName) {
        updateLesson(lessonId, { name: trimmed });
      } else {
        // revert to original
        setEditingNames((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top navigation row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans font-bold text-[var(--accent)] hover:opacity-80 py-1.5 px-3 rounded-xl transition-all bg-[#FAF7F0] border border-[var(--line)] shadow-[0_1px_3px_rgba(120,100,70,0.08)] paper-card"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Curriculum Dashboard</span>
        </button>
      </div>

      {/* Subject Summary Header Card */}
      <div className="card !mb-0 paper-card p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-[0.7rem] uppercase tracking-wider font-sans font-bold text-[var(--ink-soft)]">
            Subject Drill-Down
          </div>
          <h1 className="font-caveat text-3xl sm:text-4xl font-bold text-[var(--accent)] leading-tight mt-0.5">
            {subject.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-xs font-sans text-[var(--ink-soft)]">
            <span className="font-bold text-[var(--ink)]">
              {doneCount} / {targetCount || subjectLessons.length}
            </span>
            <span>lessons completed</span>
            {targetCount && (
              <span className="text-[0.7rem] bg-[var(--paper)] px-2 py-0.5 rounded-full border border-[var(--line)]">
                Target: {targetCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <CircularProgress
            progress={percentage}
            centerText={targetCount ? `${percentage}%` : `${doneCount}`}
            size={74}
            strokeWidth={7}
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
          filteredLessons.map((lesson) => {
            const currentName =
              editingNames[lesson.id] !== undefined
                ? editingNames[lesson.id]
                : lesson.name;

            return (
              <div
                key={lesson.id}
                className={`paper-card rounded-2xl p-3.5 border transition-all ${
                  lesson.done
                    ? 'border-[#D2DEC8] bg-[#F7F9F5] shadow-[0_1px_4px_rgba(91,130,102,0.06)]'
                    : 'border-[var(--line)] bg-[#FAF7F0] shadow-[0_2px_8px_rgba(120,100,70,0.06)] hover:bg-[#FFFDF9]'
                }`}
              >
                {/* Top Row: Checkbox + Editable Name + Delete */}
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={lesson.done}
                      onChange={() => handleToggleDone(lesson)}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) =>
                        setEditingNames((prev) => ({ ...prev, [lesson.id]: e.target.value }))
                      }
                      onBlur={() => handleBlurName(lesson.id, lesson.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className={`w-full bg-transparent border border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] focus:bg-white px-2 py-0.5 rounded-lg text-sm font-sans font-medium transition-colors ${
                        lesson.done
                          ? 'line-through text-[var(--ink-soft)]'
                          : 'text-[var(--ink)] font-semibold'
                      }`}
                    />

                    {/* Metadata: Completed Date */}
                    {lesson.done && lesson.completedDate && (
                      <div className="flex items-center gap-1.5 mt-1 ml-2">
                        <span className="text-[0.68rem] font-sans font-semibold text-[#4A6B53] bg-[#E4ECE0] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Done {lesson.completedDate}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteLesson(lesson.id)}
                    title="Delete lesson"
                    className="p-1 text-[var(--ink-soft)] hover:text-red-600 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Bottom Row: Confidence Picker (only visible/interactive once done) */}
                {lesson.done && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(91,130,102,0.2)] flex items-center justify-between">
                    <span className="text-[0.7rem] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)] ml-1">
                      Confidence Rating:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleConfidenceChange(lesson.id, 'L')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
                          lesson.confidence === 'L'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-xs'
                            : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                        }`}
                      >
                        Low
                      </button>
                      <button
                        onClick={() => handleConfidenceChange(lesson.id, 'M')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
                          lesson.confidence === 'M'
                            ? 'bg-[#EFE8F5] text-[#5C3D77] border border-[#7A5C94] shadow-xs'
                            : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                        }`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => handleConfidenceChange(lesson.id, 'H')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
                          lesson.confidence === 'H'
                            ? 'bg-[#E4ECE0] text-[#2F5238] border border-[#5B8266] shadow-xs'
                            : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                        }`}
                      >
                        High
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
