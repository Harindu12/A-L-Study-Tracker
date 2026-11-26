import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigation } from '../../navigation';
import { LessonCardItem } from './LessonCardItem';
import { calculateSubjectMetrics } from '../../utils/subjectMetrics';

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E5E5E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-lg font-extrabold text-[#111111] m-0">Add Lesson</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#525252] mb-1.5">
              Lesson Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF]"
              placeholder="e.g. Chemical Bonding"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F2F2EE] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer"
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

  const subjectLessons = lessons.filter((l) => l.subjectId === subject.id);
  const metrics = calculateSubjectMetrics(subject, lessons);
  const isAddModalOpen = activeOverlay === 'curriculum-add-lesson';

  const handleAddLesson = (name: string) => {
    addLesson({
      subjectId: subject.id,
      name: name.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-150">
      {/* Desktop Header Bar (Mobile uses App.tsx sticky bar with back arrow) */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-[#111111] hover:bg-[#EFEFEA] py-2 px-3 rounded-xl border border-[#E5E5E0] bg-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
            <span>Curriculum</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-sans text-2xl font-extrabold text-[#111111] tracking-tight truncate m-0">
              {subject.name}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openOverlay('curriculum-add-lesson')}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] text-xs font-sans font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Add Lesson</span>
        </button>
      </div>

      {/* Subject Progress Summary Card */}
      <div className="rounded-2xl border border-[#E5E5E0] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_1px_2px_rgba(17,17,17,0.03)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <span className="text-xs font-sans font-semibold text-[#787873] tabular-nums">
            {metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'} ·{' '}
            {metrics.totalPartsAdded} {metrics.totalPartsAdded === 1 ? 'part' : 'parts'}
          </span>
          <div className="text-xs sm:text-sm font-sans text-[#787873] tabular-nums">
            <strong className="font-bold text-[#111111]">
              {metrics.watchedPartsCount} / {metrics.totalPartsAdded}
            </strong>{' '}
            watched
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-[#EFEFEA] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-[#111111]"
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#EFEFEA] text-xs font-sans text-[#787873] tabular-nums">
          <span>
            {metrics.totalPartsAdded === 0
              ? 'No parts added yet across lessons'
              : `${metrics.partsRemaining} ${
                  metrics.partsRemaining === 1 ? 'part' : 'parts'
                } remaining`}
          </span>
          <span className="font-bold text-[#111111] whitespace-nowrap">
            {metrics.percentage}% complete
          </span>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex flex-col gap-3">
        {subjectLessons.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E5E0] bg-[#FFFFFF] text-center py-10 px-4">
            <p className="text-sm font-sans text-[#787873]">
              No lessons added yet. Tap <strong className="text-[#111111]">Add Lesson</strong> to
              create your first lesson.
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
