import React from 'react';
import { Subject, Lesson, Revisit } from '../../types';
import { useStore } from '../../store';
import { StatTile } from '../ui/StatTile';
import { ExamDateModal } from './ExamDateModal';
import {
  AddSubjectModal,
  SubjectActionSheetModal,
  SubjectEditModal,
  DeleteConfirmModal,
} from './SubjectEditModal';
import { useNavigation } from '../../navigation';
import {
  calculateSubjectMetrics,
  calculateCurriculumMetrics,
  calculateDaysRemaining,
} from '../../utils/subjectMetrics';
import { getSubjectColorById } from '../../utils/colors';
import {
  BookOpen,
  Layers,
  Calendar,
  Clock,
  Pencil,
  Check,
  Video,
  MoreHorizontal,
} from 'lucide-react';

interface SubjectCardProps {
  subj: Subject;
  lessons: Lesson[];
  revisits: Revisit[];
  onSelectSubject: (subjectId: string) => void;
  onLongPressSubject: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subj,
  lessons,
  revisits,
  onSelectSubject,
  onLongPressSubject,
}) => {
  const subjLessons = lessons.filter((l) => l.subjectId === subj.id);
  const metrics = calculateSubjectMetrics(subj, lessons);

  const subjLessonIds = new Set(subjLessons.map((l) => l.id));
  const pendingRevisitsCount = revisits.filter(
    (r) => subjLessonIds.has(r.lessonId) && !r.done
  ).length;
  const isClean = subjLessons.length > 0 && pendingRevisitsCount === 0;

  const accentColor = getSubjectColorById(subj.id, [subj]);

  const timerRef = React.useRef<number | null>(null);
  const isLongPressTriggered = React.useRef(false);
  const touchStartPos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartPos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
      onLongPressSubject(subj);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (timerRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimer();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearTimer();
    if (isLongPressTriggered.current && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      onLongPressSubject(subj);
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (timerRef.current === null) return;
    const dx = e.clientX - mouseStartPos.current.x;
    const dy = e.clientY - mouseStartPos.current.y;
    if (Math.hypot(dx, dy) > 8) {
      clearTimer();
    }
  };

  const handleMouseUp = () => {
    clearTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressTriggered.current = false;
      return;
    }
    onSelectSubject(subj.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimer();
    onLongPressSubject(subj);
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearTimer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={clearTimer}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSubject(subj.id);
        }
      }}
      title={`Tap to view ${subj.name} lessons`}
      className="w-full bg-[#FFFDF9] hover:bg-[#FAF7F0] border border-[#E4E0D8] hover:border-[#CBC5B9] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,23,21,0.03)] transition-colors cursor-pointer group flex items-start gap-3.5 text-left select-none"
    >
      {/* Clean Subject Monogram Tile */}
      <div
        className="w-11 h-11 rounded-xl flex-shrink-0 flex flex-col items-center justify-center border"
        style={{
          backgroundColor: `${accentColor}1A`,
          borderColor: `${accentColor}38`,
          color: accentColor,
        }}
      >
        <BookOpen size={17} strokeWidth={2.1} />
        <span className="text-[9px] font-sans font-bold uppercase tracking-wider mt-0.5 leading-none">
          {subj.name.trim().slice(0, 3)}
        </span>
      </div>

      {/* Card Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-sans font-bold text-base text-[#181715] truncate m-0 leading-snug">
              {subj.name}
            </h3>
            <p className="text-xs font-sans text-[#78716C] font-medium mt-0.5 m-0 tabular-nums">
              {metrics.totalPartsAdded} {metrics.totalPartsAdded === 1 ? 'part' : 'parts'} ·{' '}
              {metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 -mr-1.5 -mt-1">
            {isClean && (
              <span
                title="All caught up"
                className="w-6 h-6 rounded-full bg-[#16A34A]/14 text-[#16A34A] flex items-center justify-center"
              >
                <Check size={13} strokeWidth={2.75} />
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLongPressSubject(subj);
              }}
              aria-label={`Options for ${subj.name}`}
              title="Edit or delete subject"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Subject-Colored Progress Bar & Tabular Ratio */}
        <div className="mt-3.5">
          <div className="flex justify-between items-baseline mb-1.5 text-xs font-sans tabular-nums">
            <span className="text-[#78716C] font-medium">
              {metrics.watchedPartsCount} / {metrics.totalPartsAdded} watched
            </span>
            <span className="font-bold text-[#181715]">{metrics.percentage}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics.percentage}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface CurriculumDashboardProps {
  onSelectSubject: (subjectId: string) => void;
}

export const CurriculumDashboard: React.FC<CurriculumDashboardProps> = ({
  onSelectSubject,
}) => {
  const {
    subjects,
    lessons,
    revisits,
    examDate,
    setExamDate,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useStore();

  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useNavigation();

  const isAddModalOpen = activeOverlay === 'curriculum-add-subject';
  const isExamModalOpen = activeOverlay === 'curriculum-exam-date';
  const actionSheetSubject =
    activeOverlay === 'curriculum-subject-menu' ? (overlayData as Subject) : null;
  const editingSubject =
    activeOverlay === 'curriculum-edit-subject' ? (overlayData as Subject) : null;
  const deletingSubject =
    activeOverlay === 'curriculum-delete-subject' ? (overlayData as Subject) : null;

  const overallMetrics = calculateCurriculumMetrics(subjects, lessons);

  let daysRemainingText = 'Set exam date';
  if (examDate) {
    const diffDays = calculateDaysRemaining(examDate);
    if (diffDays > 1) daysRemainingText = `${diffDays} days`;
    else if (diffDays === 1) daysRemainingText = '1 day';
    else if (diffDays === 0) daysRemainingText = 'Today';
    else daysRemainingText = 'Passed';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={Video}
          value={`${overallMetrics.totalWatchedVideos} / ${overallMetrics.totalPartsAdded}`}
          label="Videos completed"
        />

        <StatTile
          icon={Layers}
          value={subjects.length}
          label="Subjects tracked"
        />

        <div
          onClick={() => openOverlay('curriculum-exam-date')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openOverlay('curriculum-exam-date');
            }
          }}
          className="bg-[#FFFDF9] border border-[#E4E0D8] hover:border-[#CBC5B9] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_1px_2px_rgba(24,23,21,0.03)] cursor-pointer transition-colors group"
        >
          <div className="flex justify-between items-center text-[#78716C] mb-2.5">
            <Calendar size={17} strokeWidth={2} />
            <Pencil
              size={13}
              className="opacity-60 group-hover:opacity-100 transition-opacity text-[#78716C]"
            />
          </div>
          <div>
            {examDate ? (
              <div className="text-2xl sm:text-[1.65rem] font-extrabold font-sans text-[#181715] tracking-tight leading-none tabular-nums">
                {daysRemainingText}
              </div>
            ) : (
              <div className="text-sm font-bold font-sans text-[#181715] underline underline-offset-2 leading-tight py-1">
                Set exam date
              </div>
            )}
            <div className="text-xs text-[#78716C] font-sans font-medium mt-1.5 leading-snug">
              Days remaining
            </div>
          </div>
        </div>

        <StatTile
          icon={Clock}
          value={overallMetrics.videosRemaining}
          label="Videos remaining"
        />
      </div>

      {/* Subjects Progress Grid */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="font-sans text-sm sm:text-base font-bold text-[#181715] m-0">
            Subjects
          </h2>
          <span className="text-xs font-sans text-[#78716C]">Tap a subject to view lessons</span>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl p-8 text-center text-sm font-sans text-[#78716C]">
            No subjects yet. Tap <strong className="text-[#181715]">Add Subject</strong> to start
            tracking your curriculum.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subjects.map((subj) => (
              <SubjectCard
                key={subj.id}
                subj={subj}
                lessons={lessons}
                revisits={revisits}
                onSelectSubject={onSelectSubject}
                onLongPressSubject={(s) => openOverlay('curriculum-subject-menu', s)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals & Action Sheets */}
      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={closeOverlay}
        onAdd={(data) => {
          addSubject(data);
          closeOverlay();
        }}
      />

      <SubjectActionSheetModal
        subject={actionSheetSubject}
        isOpen={!!actionSheetSubject}
        onClose={closeOverlay}
        onEdit={(subj) => openOverlay('curriculum-edit-subject', subj)}
        onDelete={(subj) => openOverlay('curriculum-delete-subject', subj)}
      />

      <ExamDateModal
        currentDate={examDate}
        isOpen={isExamModalOpen}
        onClose={closeOverlay}
        onSave={(date) => {
          setExamDate(date);
          closeOverlay();
        }}
      />

      <SubjectEditModal
        subject={editingSubject}
        isOpen={!!editingSubject}
        onClose={closeOverlay}
        onSave={(subjId, newName) => {
          updateSubject(subjId, { name: newName });
          closeOverlay();
        }}
      />

      <DeleteConfirmModal
        subject={deletingSubject}
        isOpen={!!deletingSubject}
        onClose={closeOverlay}
        onConfirm={(subjId) => {
          deleteSubject(subjId);
          closeOverlay();
        }}
      />
    </div>
  );
};
