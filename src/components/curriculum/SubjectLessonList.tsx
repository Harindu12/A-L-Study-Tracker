import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigation } from '../../navigation';
import { LessonCardItem } from './LessonCardItem';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 border border-[var(--line)] shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-[var(--accent)]" />
            <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">Add Lesson</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
              Lesson Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)] text-[var(--ink)]"
              placeholder="e.g. Chemical Bonding"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn ghost !py-2 !px-3 !text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn !py-2 !px-4 !text-xs disabled:opacity-50 cursor-pointer"
            >
              Add Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SubjectLessonListProps {
  subject: Subject;
  onBack: () => void;
}

export const SubjectLessonList: React.FC<SubjectLessonListProps> = ({ subject, onBack }) => {
  const { lessons, addLesson } = useStore();
  const { activeOverlay, openOverlay, closeOverlay } = useNavigation();
  
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>({});

  const toggleExpandLesson = (lessonId: string) => {
    setExpandedLessonIds((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Lessons strictly in the order they were added
  const subjectLessons = lessons.filter((l) => l.subjectId === subject.id);

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

  const isAddModalOpen = activeOverlay === 'curriculum-add-lesson';

  const handleAddLesson = (name: string) => {
    addLesson({
      subjectId: subject.id,
      name: name.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-20">
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

      {/* Lesson List */}
      <div className="flex flex-col gap-2.5">
        {subjectLessons.length === 0 ? (
          <div className="card paper-card text-center py-10 px-4">
            <p className="text-sm font-sans text-[var(--ink-soft)]">
              No lessons added yet. Tap the <strong className="text-[var(--accent)]">+</strong> button below to add your first lesson.
            </p>
          </div>
        ) : (
          subjectLessons.map((lesson) => (
            <LessonCardItem
              key={lesson.id}
              lesson={lesson}
              isExpanded={!!expandedLessonIds[lesson.id]}
              onToggleExpand={() => toggleExpandLesson(lesson.id)}
            />
          ))
        )}
      </div>

      {/* Floating Action Button (above the bottom navigation bar) */}
      <button
        type="button"
        onClick={() => openOverlay('curriculum-add-lesson')}
        className="fixed bottom-24 z-40 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(122,92,148,0.35)] hover:bg-[#684c80] hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-[#FAF7F0] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/30 cursor-pointer"
        style={{ right: 'max(1.25rem, calc(50% - 204px))' }}
        aria-label="Add Lesson"
        title="Add Lesson"
      >
        <Plus size={28} strokeWidth={2.6} />
      </button>

      {/* Add Lesson Modal */}
      <AddLessonModal
        isOpen={isAddModalOpen}
        onClose={closeOverlay}
        onAdd={(name) => {
          handleAddLesson(name);
          closeOverlay();
        }}
      />
    </div>
  );
};

