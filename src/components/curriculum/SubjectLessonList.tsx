import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigation } from '../../navigation';
import { LessonCardItem } from './LessonCardItem';
import { calculateSubjectMetrics } from '../../utils/subjectMetrics';
import { getSubjectColorById } from '../../utils/colors';

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-lg font-extrabold text-[#181715] m-0">Add Lesson</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#57534E] mb-1.5">
              Lesson Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9]"
              placeholder="e.g. Chemical Bonding"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer"
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
  const { subjects, lessons, addLesson } = useStore();
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
  const accentColor = getSubjectColorById(subject.id, subjects);
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
            className="min-h-[38px] inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-[#181715] hover:bg-[#EDEAE2] py-2 px-3 rounded-xl border border-[#E4E0D8] bg-[#FFFDF9] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
            <span>Curriculum</span>
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3 h-3 rounded-[4px] flex-shrink-0"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <h1 className="font-sans text-2xl font-extrabold text-[#181715] tracking-tight truncate m-0">
              {subject.name}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openOverlay('curriculum-add-lesson')}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#181715] text-[#FFFDF9] hover:bg-[#2E2C28] text-xs font-sans font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Add Lesson</span>
        </button>
      </div>

      {/* Subject Progress Summary Card */}
      <div className="rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,23,21,0.03)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <span className="text-xs font-sans font-semibold text-[#78716C] tabular-nums">
            {metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'} ·{' '}
            {metrics.totalPartsAdded} {metrics.totalPartsAdded === 1 ? 'part' : 'parts'}
          </span>
          <div className="text-xs sm:text-sm font-sans text-[#78716C] tabular-nums">
            <strong className="font-bold text-[#181715]">
              {metrics.watchedPartsCount} / {metrics.totalPartsAdded}
            </strong>{' '}
            watched
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${metrics.percentage}%`, backgroundColor: accentColor }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#EFECE6] text-xs font-sans text-[#78716C] tabular-nums">
          <span>
            {metrics.totalPartsAdded === 0
              ? 'No parts added yet across lessons'
              : `${metrics.partsRemaining} ${
                  metrics.partsRemaining === 1 ? 'part' : 'parts'
                } remaining`}
          </span>
          <span className="font-bold text-[#181715] whitespace-nowrap">
            {metrics.percentage}% complete
          </span>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex flex-col gap-3">
        {subjectLessons.length === 0 ? (
          <div className="rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] text-center py-10 px-4">
            <p className="text-sm font-sans text-[#78716C]">
              No lessons added yet. Tap <strong className="text-[#181715]">Add Lesson</strong> to
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
