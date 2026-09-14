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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 border border-[#EBEBEB] shadow-2xl bg-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-[#1A1A1A]" />
            <h3 className="font-sans text-xl font-extrabold text-[#1A1A1A] m-0">Add Lesson</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
              Lesson Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. Chemical Bonding"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F2F2F2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#1A1A1A] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
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

  // Centralized, live metrics calculated fresh on every render
  const metrics = calculateSubjectMetrics(subject, lessons);

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
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-sans font-bold text-[#1A1A1A] hover:bg-[#F2F2F2] py-2 px-3.5 rounded-xl transition-all bg-white border border-[#EBEBEB] shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Curriculum Dashboard</span>
          </button>
          
          {/* Total Parts Added Badge */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className="text-xs font-sans text-[#8A8A8A] bg-white px-3 py-1.5 rounded-xl border border-[#EBEBEB] shadow-2xs"
              title="Live count of parts across all lessons in this subject"
            >
              Total parts: <strong className="text-[#1A1A1A] font-bold">{metrics.totalPartsAdded}</strong>
            </span>
          </div>
        </div>

        <div className="px-1 mt-1">
          <div className="text-[0.68rem] uppercase tracking-wider font-sans font-bold text-[#8A8A8A]">
            Subject Drill-Down
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight mt-0.5">
            {subject.name}
          </h1>

          {/* Live parts completed summary */}
          <div className="text-xs sm:text-sm font-sans text-[#8A8A8A] mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[#1A1A1A]">
              {metrics.watchedPartsCount} / {metrics.totalPartsAdded} parts completed
            </span>
            <span className="text-[#8A8A8A]">
              ({metrics.percentage}%) · {metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
        </div>
      </div>

      {/* Top summary card: SUBJECT PROGRESS */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]">
            SUBJECT PROGRESS
          </span>
          <div className="text-xs sm:text-sm font-sans text-[#8A8A8A]">
            <span className="font-bold text-[#1A1A1A] text-sm sm:text-base">
              {metrics.watchedPartsCount} / {metrics.totalPartsAdded}
            </span>{' '}
            <span className="font-medium">parts completed</span>
          </div>
        </div>

        {/* Horizontal progress bar spanning the card */}
        <div className="w-full h-2.5 rounded-full bg-[#F0F0F0] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-[#1A1A1A]"
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>

        {/* Detail footer breakdown row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#F0F0F0] text-xs font-sans text-[#8A8A8A]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>
              {metrics.totalPartsAdded === 0
                ? 'No parts added yet across lessons'
                : `${metrics.partsRemaining} ${metrics.partsRemaining === 1 ? 'part' : 'parts'} remaining to watch`}
            </span>
          </div>
          <span className="font-bold text-[#1A1A1A] whitespace-nowrap">
            {metrics.percentage}% completed
          </span>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex flex-col gap-2.5">
        {subjectLessons.length === 0 ? (
          <div className="rounded-2xl border border-[#EBEBEB] bg-white text-center py-10 px-4">
            <p className="text-sm font-sans text-[#8A8A8A]">
              No lessons added yet. Tap the <strong className="text-[#1A1A1A]">+</strong> button below to add your first lesson.
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
