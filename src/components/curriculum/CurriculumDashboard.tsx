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
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  Clock, 
  Pencil, 
  Plus,
  ChevronRight,
  CheckCircle2,
  Video
} from 'lucide-react';

const SUBJECT_SWATCHES = [
  { bg: 'bg-[#7A5C94]/12', text: 'text-[#7A5C94]', border: 'border-[#7A5C94]/25' }, // plum
  { bg: 'bg-[#5B8266]/15', text: 'text-[#5B8266]', border: 'border-[#5B8266]/25' }, // sage
  { bg: 'bg-[#D97706]/15', text: 'text-[#B45309]', border: 'border-[#D97706]/25' }, // warm amber
  { bg: 'bg-[#4A7C8A]/15', text: 'text-[#366B79]', border: 'border-[#4A7C8A]/25' }, // slate teal
  { bg: 'bg-[#B25B6C]/15', text: 'text-[#9A4355]', border: 'border-[#B25B6C]/25' }, // dusty rose
  { bg: 'bg-[#8C7A58]/15', text: 'text-[#756240]', border: 'border-[#8C7A58]/25' }, // warm ochre
];

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

  const swatch = SUBJECT_SWATCHES[idx % SUBJECT_SWATCHES.length];

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
    // Cancel if finger moved more than 10px (user is scrolling)
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
    if (e.button !== 0) return; // left click only
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
      className="w-full bg-[#FFFDF9] hover:bg-[#FAF7F0] active:scale-[0.99] border border-[var(--line)] hover:border-[var(--accent)] rounded-2xl p-5 sm:p-6 paper-card shadow-[0_2px_8px_rgba(120,100,70,0.08)] hover:shadow-[0_6px_16px_rgba(120,100,70,0.12)] transition-all cursor-pointer group flex items-center gap-4 sm:gap-5 text-left select-none"
    >
      {/* Large colored icon block / solid-color swatch */}
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex-shrink-0 flex flex-col items-center justify-center ${swatch.bg} ${swatch.border} ${swatch.text} shadow-xs transition-transform group-hover:scale-[1.03]`}
      >
        <BookOpen size={24} strokeWidth={2.2} className="opacity-90 sm:w-7 sm:h-7" />
        <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider mt-1 opacity-90">
          {subj.name.trim().slice(0, 3)}
        </span>
      </div>

      {/* Card Content Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top Row: Subject Name + Circular Checkmark */}
        <div className="flex items-start justify-between gap-2">
          <div className="font-sans font-bold text-lg sm:text-xl text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
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
            <CheckCircle2
              size={22}
              className={isClean ? 'text-[#5B8266]' : 'text-[var(--ink-soft)]/25'}
              fill={isClean ? '#5B8266' : 'none'}
              color={isClean ? '#FFFDF9' : 'currentColor'}
            />
          </div>
        </div>

        {/* Metadata line */}
        <div className="text-xs sm:text-sm font-sans text-[var(--ink-soft)] font-medium mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {metrics.targetCount ? (
            <>
              <span>Target: <strong className="text-[var(--ink)] font-semibold">{metrics.targetCount}</strong></span>
              <span>·</span>
              <span>Total parts added: <strong className="text-[var(--ink)] font-semibold">{metrics.totalPartsAdded}</strong></span>
              <span>·</span>
              <span>{metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'}</span>
            </>
          ) : (
            <>
              <span>Total parts added: <strong className="text-[var(--ink)] font-semibold">{metrics.totalPartsAdded}</strong></span>
              <span>·</span>
              <span>{metrics.totalLessons} {metrics.totalLessons === 1 ? 'lesson' : 'lessons'}</span>
            </>
          )}
        </div>

        {/* Label + Progress Bar Row */}
        <div className="mt-3 sm:mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] sm:text-xs font-sans font-bold tracking-wider text-[var(--ink-soft)] uppercase">
              PROGRESS
            </span>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-sans font-semibold text-[var(--ink)]">
                {metrics.watchedPartsCount} / {metrics.progressDenominator}
              </span>
              <span className="text-xs font-sans text-[var(--ink-soft)] ml-1">
                ({metrics.percentage}%)
              </span>
            </div>
          </div>

          {/* Horizontal progress bar */}
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-[#EAE6DC] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.percentage >= 100 ? 'bg-[#5B8266]' : 'bg-[var(--accent)]'
              }`}
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

  // Top stats calculations (video parts based - unified live metrics)
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
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 relative">
      {/* Title */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-caveat text-4xl font-bold text-[var(--accent)] tracking-wide m-0">
          Curriculum
        </h1>
      </div>

      {/* Top Stat Tiles Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Video}
          value={`${overallMetrics.totalWatchedVideos} / ${overallMetrics.totalTargetVideos}`}
          label="Videos completed"
          sublabel={`${overallMetrics.totalPartsAdded} parts added so far`}
          iconColor="text-[var(--ok)]"
          bgColor="bg-[#FAF7F0]"
        />

        <StatTile
          icon={Layers}
          value={subjects.length}
          label="Subjects tracked"
          iconColor="text-[var(--accent)]"
          bgColor="bg-[#FAF7F0]"
        />

        <div 
          onClick={() => openOverlay('curriculum-exam-date')}
          className="bg-[#FAF7F0] border border-[var(--line)] rounded-2xl p-4 flex flex-col gap-2 flex-1 paper-card shadow-[0_2px_8px_rgba(120,100,70,0.08)] cursor-pointer hover:border-[var(--accent)] transition-all group"
        >
          <div className="flex justify-between items-center text-[var(--accent)]">
            <Calendar size={22} strokeWidth={2.5} />
            <Pencil size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--ink-soft)]" />
          </div>
          <div>
            {examDate ? (
              <div className="text-2xl font-bold font-sans text-[var(--ink)] leading-tight">
                {daysRemainingText}
              </div>
            ) : (
              <div className="text-sm font-bold font-sans text-[var(--accent)] underline leading-tight py-1">
                Set exam date
              </div>
            )}
            <div className="text-xs text-[var(--ink-soft)] font-sans font-medium">
              Days remaining
            </div>
          </div>
        </div>

        <StatTile
          icon={Clock}
          value={overallMetrics.videosRemaining}
          label="Videos remaining"
          iconColor="text-[#D97706]"
          bgColor="bg-[#FAF7F0]"
        />
      </div>

      {/* Subject Progress Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="section !mb-0">Progress</h2>
          <span className="text-xs font-sans text-[var(--ink-soft)]">
            Tap a card to view lessons
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="card !mb-0 paper-card empty-note text-center py-6">
            No subjects yet. Tap the <strong className="text-[var(--accent)]">+</strong> button below to start tracking your curriculum.
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5">
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
      <div className="card !mb-0 paper-card">
        <h2 className="section">Confidence breakdown</h2>
        {subjects.length === 0 ? (
          <div className="empty-note text-center py-4">No subjects added yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
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
                  className="p-3 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent)] hover:bg-[#FAF7F0] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="font-sans font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {subj.name}
                    </div>
                    <ChevronRight size={16} className="text-[var(--ink-soft)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {!hasCompleted ? (
                    <div className="text-xs font-sans text-[var(--ink-soft)] italic">
                      No lessons completed yet
                    </div>
                  ) : (
                    <div>
                      {/* Compact textual format */}
                      <div className="text-xs font-sans text-[var(--ink)] flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[var(--ink)]">{subj.name} —</span>
                        <span className="text-[#B45309] font-medium">{lowCount} Low</span>
                        <span className="text-[var(--ink-soft)]">·</span>
                        <span className="text-[#7A5C94] font-medium">{medCount} Medium</span>
                        <span className="text-[var(--ink-soft)]">·</span>
                        <span className="text-[#5B8266] font-medium">{highCount} High</span>
                      </div>

                      {/* Horizontal progress bar */}
                      {totalRated > 0 && (
                        <div className="w-full h-2 rounded-full bg-[var(--paper)] mt-2 overflow-hidden flex border border-[var(--line)]/50">
                          {lowCount > 0 && (
                            <div
                              style={{ width: `${(lowCount / totalRated) * 100}%` }}
                              className="bg-[#F59E0B] h-full"
                              title={`${lowCount} Low`}
                            />
                          )}
                          {medCount > 0 && (
                            <div
                              style={{ width: `${(medCount / totalRated) * 100}%` }}
                              className="bg-[#7A5C94] h-full"
                              title={`${medCount} Medium`}
                            />
                          )}
                          {highCount > 0 && (
                            <div
                              style={{ width: `${(highCount / totalRated) * 100}%` }}
                              className="bg-[#5B8266] h-full"
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

      {/* Floating Action Button (above the bottom navigation bar) */}
      <button
        type="button"
        onClick={() => openOverlay('curriculum-add-subject')}
        className="fixed bottom-24 z-40 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(122,92,148,0.35)] hover:bg-[#684c80] hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-[#FAF7F0] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/30 cursor-pointer"
        style={{ right: 'max(1.25rem, calc(50% - 204px))' }}
        aria-label="Add Subject"
        title="Add Subject"
      >
        <Plus size={28} strokeWidth={2.6} />
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
        currentPartsCount={
          editingSubject
            ? lessons
                .filter((l) => l.subjectId === editingSubject.id)
                .reduce((acc, l) => acc + (l.parts ? l.parts.length : 0), 0)
            : 0
        }
        lessonCount={
          editingSubject
            ? lessons.filter((l) => l.subjectId === editingSubject.id).length
            : 0
        }
        onSave={(id, updates) => {
          updateSubject(id, updates);
          closeOverlay();
        }}
      />

      <DeleteConfirmModal
        subject={deletingSubject}
        lessonCount={deletingSubject ? lessons.filter((l) => l.subjectId === deletingSubject.id).length : 0}
        isOpen={!!deletingSubject}
        onClose={closeOverlay}
        onConfirm={() => {
          if (deletingSubject) {
            deleteSubject(deletingSubject.id);
            closeOverlay();
          }
        }}
      />
    </div>
  );
};

