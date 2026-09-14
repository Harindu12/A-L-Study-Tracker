import React from 'react';
import { Subject, Lesson, Revisit } from '../../types';
import { useStore } from '../../store';
import { StatTile } from '../ui/StatTile';
import { ExamDateModal } from './ExamDateModal';
import { 
  AddSubjectModal, 
  SubjectActionSheetModal, 
  SubjectEditModal, 
  DeleteConfirmModal 
} from './SubjectEditModal';
import { todayStr } from '../../utils';
import { useNavigation } from '../../navigation';
import { calculateSubjectMetrics, calculateCurriculumMetrics } from '../../utils/subjectMetrics';
import { getSubjectAccentColor } from '../../utils/colors';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  Clock, 
  Pencil, 
  Plus, 
  ChevronRight, 
  Check, 
  Video 
} from 'lucide-react';

interface SubjectCardProps {
  subj: Subject;
  idx: number;
  lessons: Lesson[];
  revisits: Revisit[];
  onSelectSubject: (subjectId: string) => void;
  onLongPressSubject: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subj,
  idx,
  lessons,
  revisits,
  onSelectSubject,
  onLongPressSubject,
}) => {
  const subjLessons = lessons.filter((l) => l.subjectId === subj.id);
  const metrics = calculateSubjectMetrics(subj, lessons);

  // Checkmark indicator: clean if has lessons and 0 pending revisits and 0 low confidence
  const subjLessonIds = new Set(subjLessons.map((l) => l.id));
  const pendingRevisitsCount = revisits.filter((r) => subjLessonIds.has(r.lessonId) && !r.completed).length;
  const lowConfCount = subjLessons.filter((l) => l.done && l.confidence === 'L').length;
  const isClean = subjLessons.length > 0 && pendingRevisitsCount === 0 && lowConfCount === 0;

  const accentColor = getSubjectAccentColor(idx);

  // Long-press handling (500ms standard hold threshold)
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
    if (isLongPressTriggered.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
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
      title={`Tap to view ${subj.name} lessons · Press & hold to edit or delete`}
      className="w-full bg-white hover:bg-[#FAFAFA] border border-[#EBEBEB] hover:border-[#D4D4D4] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer group flex items-center gap-3.5 sm:gap-4 text-left select-none relative overflow-hidden"
    >
      {/* Left-edge functional accent bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0 my-0.5"
        style={{ backgroundColor: accentColor }}
      />

      {/* Clean minimal icon/category block */}
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex flex-col items-center justify-center border transition-transform group-hover:scale-105"
        style={{
          backgroundColor: `${accentColor}10`,
          borderColor: `${accentColor}25`,
          color: accentColor,
        }}
      >
        <BookOpen size={20} strokeWidth={2.2} />
        <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider mt-0.5">
          {subj.name.trim().slice(0, 3)}
        </span>
      </div>

      {/* Card Content Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top Row: Subject Name + Circular Checkmark */}
        <div className="flex items-start justify-between gap-2">
          <div className="font-sans font-bold text-base sm:text-lg text-[#1A1A1A] truncate">
            {subj.name}
          </div>

          <div
            className="flex-shrink-0 mt-0.5"
            title={
              isClean
                ? 'All caught up: no pending revisits or low-confidence lessons'
                : pendingRevisitsCount > 0
                ? `${pendingRevisitsCount} revisit(s) pending`
                : 'Pending reviews'
            }
          >
            {/* Completed items: solid black fill with white checkmark */}
            {isClean ? (
              <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-2xs">
                <Check size={12} strokeWidth={3} />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-[#D4D4D4]" />
            )}
          </div>
        </div>

        {/* Metadata line */}
        <div className="text-xs font-sans text-[#8A8A8A] font-medium mt-0.5 flex flex-wrap items-center gap-x-2">
          <span>{metrics.totalPartsAdded} {metrics.totalPartsAdded === 1 ? 'part' : 'parts'}</span>
          <span>·</span>
          <span>{metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'}</span>
        </div>

        {/* Label + Progress Bar Row */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-sans font-bold tracking-wider text-[#8A8A8A] uppercase">
              PROGRESS
            </span>
            <div className="text-right">
              <span className="text-xs font-sans font-semibold text-[#1A1A1A]">
                {metrics.watchedPartsCount} / {metrics.totalPartsAdded} parts completed
              </span>
              <span className="text-xs font-sans text-[#8A8A8A] ml-1">
                ({metrics.percentage}%)
              </span>
            </div>
          </div>

          {/* Horizontal progress bar */}
          <div className="w-full h-2 rounded-full bg-[#F0F0F0] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#1A1A1A]"
              style={{ width: `${metrics.percentage}%` }}
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

export const CurriculumDashboard: React.FC<CurriculumDashboardProps> = ({ onSelectSubject }) => {
  const { 
    subjects, 
    lessons, 
    revisits,
    examDate, 
    setExamDate, 
    addSubject, 
    updateSubject, 
    deleteSubject 
  } = useStore();

  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useNavigation();

  // Modals state derived from navigation overlay
  const isAddModalOpen = activeOverlay === 'curriculum-add-subject';
  const isExamModalOpen = activeOverlay === 'curriculum-exam-date';
  const actionSheetSubject = activeOverlay === 'curriculum-subject-menu' ? (overlayData as Subject) : null;
  const editingSubject = activeOverlay === 'curriculum-edit-subject' ? (overlayData as Subject) : null;
  const deletingSubject = activeOverlay === 'curriculum-delete-subject' ? (overlayData as Subject) : null;

  // Top stats calculations
  const overallMetrics = calculateCurriculumMetrics(subjects, lessons);

  // Days remaining calculation
  let daysRemainingText: string | React.ReactNode = 'Set exam date';
  if (examDate) {
    const today = new Date(todayStr() + 'T00:00:00').getTime();
    const exam = new Date(examDate + 'T00:00:00').getTime();
    const diffDays = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      daysRemainingText = `${diffDays} days`;
    } else if (diffDays === 1) {
      daysRemainingText = '1 day';
    } else if (diffDays === 0) {
      daysRemainingText = 'Today!';
    } else {
      daysRemainingText = 'Passed';
    }
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Title */}
      <div className="text-left pt-2 pb-1">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight m-0">
          Curriculum
        </h1>
      </div>

      {/* Top Stat Tiles Row matching image 1's tile style */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          className="bg-white border border-[#EBEBEB] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between flex-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#D4D4D4] transition-all group"
        >
          <div className="flex justify-between items-center text-[#1A1A1A] mb-2">
            <Calendar size={18} strokeWidth={2.2} />
            <Pencil size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8A8A8A]" />
          </div>
          <div>
            {examDate ? (
              <div className="text-2xl sm:text-[1.65rem] font-extrabold font-sans text-[#1A1A1A] tracking-tight leading-tight">
                {daysRemainingText}
              </div>
            ) : (
              <div className="text-sm font-bold font-sans text-[#1A1A1A] underline leading-tight py-1">
                Set exam date
              </div>
            )}
            <div className="text-xs text-[#8A8A8A] font-sans font-medium mt-1 leading-snug">
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

      {/* Subject Progress Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="section !mb-0 text-base sm:text-lg font-bold text-[#1A1A1A]">Progress</h2>
          <span className="text-xs font-sans text-[#8A8A8A]">
            Tap a card to view lessons
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 text-center text-sm text-[#8A8A8A]">
            No subjects yet. Tap the <strong className="text-[#1A1A1A]">+</strong> button below to start tracking your curriculum.
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {subjects.map((subj, idx) => (
              <SubjectCard
                key={subj.id}
                subj={subj}
                idx={idx}
                lessons={lessons}
                revisits={revisits}
                onSelectSubject={onSelectSubject}
                onLongPressSubject={(s) => openOverlay('curriculum-subject-menu', s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confidence Overview Section */}
      <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <h2 className="section text-base font-bold text-[#1A1A1A] mb-3">Confidence breakdown</h2>
        {subjects.length === 0 ? (
          <div className="text-xs text-[#8A8A8A] text-center py-4">No subjects added yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {subjects.map((subj) => {
              const subjDone = lessons.filter((l) => l.subjectId === subj.id && l.done);
              const lowCount = subjDone.filter((l) => l.confidence === 'L').length;
              const medCount = subjDone.filter((l) => l.confidence === 'M').length;
              const highCount = subjDone.filter((l) => l.confidence === 'H').length;
              const hasCompleted = subjDone.length > 0;
              const totalRated = lowCount + medCount + highCount;

              return (
                <div
                  key={subj.id}
                  onClick={() => onSelectSubject(subj.id)}
                  className="p-3 rounded-xl border border-[#EBEBEB] bg-white hover:border-[#D4D4D4] hover:bg-[#FAFAFA] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="font-sans font-bold text-sm text-[#1A1A1A] group-hover:text-black transition-colors">
                      {subj.name}
                    </div>
                    <ChevronRight size={16} className="text-[#8A8A8A] group-hover:text-[#1A1A1A] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {!hasCompleted ? (
                    <div className="text-xs font-sans text-[#8A8A8A] italic">
                      No lessons completed yet
                    </div>
                  ) : (
                    <div>
                      {/* Compact textual format */}
                      <div className="text-xs font-sans text-[#1A1A1A] flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#1A1A1A]">{subj.name} —</span>
                        <span className="text-[#EF4444] font-medium">{lowCount} Low</span>
                        <span className="text-[#8A8A8A]">·</span>
                        <span className="text-[#8B5CF6] font-medium">{medCount} Medium</span>
                        <span className="text-[#8A8A8A]">·</span>
                        <span className="text-[#10B981] font-medium">{highCount} High</span>
                      </div>

                      {/* Horizontal progress bar */}
                      {totalRated > 0 && (
                        <div className="w-full h-2 rounded-full bg-[#F0F0F0] mt-2 overflow-hidden flex">
                          {lowCount > 0 && (
                            <div
                              style={{ width: `${(lowCount / totalRated) * 100}%` }}
                              className="bg-[#EF4444] h-full"
                              title={`${lowCount} Low`}
                            />
                          )}
                          {medCount > 0 && (
                            <div
                              style={{ width: `${(medCount / totalRated) * 100}%` }}
                              className="bg-[#8B5CF6] h-full"
                              title={`${medCount} Medium`}
                            />
                          )}
                          {highCount > 0 && (
                            <div
                              style={{ width: `${(highCount / totalRated) * 100}%` }}
                              className="bg-[#10B981] h-full"
                              title={`${highCount} High`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => openOverlay('curriculum-add-subject')}
        className="fixed bottom-24 z-40 w-14 h-14 rounded-full bg-[#1A1A1A] text-white shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white focus:outline-none focus:ring-4 focus:ring-black/20 cursor-pointer"
        style={{ right: 'max(1.25rem, calc(50% - 204px))' }}
        aria-label="Add Subject"
        title="Add Subject"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

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
        onEdit={(subj) => {
          openOverlay('curriculum-edit-subject', subj);
        }}
        onDelete={(subj) => {
          openOverlay('curriculum-delete-subject', subj);
        }}
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
