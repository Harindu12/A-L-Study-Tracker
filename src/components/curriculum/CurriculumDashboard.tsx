import React, { useState } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { StatTile } from '../ui/StatTile';
import { ExamDateModal } from './ExamDateModal';
import { SubjectEditModal, DeleteConfirmModal } from './SubjectEditModal';
import { todayStr } from '../../utils';
import { useNavigation } from '../../navigation';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  Clock, 
  Pencil, 
  Trash2, 
  Plus,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

const SUBJECT_SWATCHES = [
  { bg: 'bg-[#7A5C94]/12', text: 'text-[#7A5C94]', border: 'border-[#7A5C94]/25' }, // plum
  { bg: 'bg-[#5B8266]/15', text: 'text-[#5B8266]', border: 'border-[#5B8266]/25' }, // sage
  { bg: 'bg-[#D97706]/15', text: 'text-[#B45309]', border: 'border-[#D97706]/25' }, // warm amber
  { bg: 'bg-[#4A7C8A]/15', text: 'text-[#366B79]', border: 'border-[#4A7C8A]/25' }, // slate teal
  { bg: 'bg-[#B25B6C]/15', text: 'text-[#9A4355]', border: 'border-[#B25B6C]/25' }, // dusty rose
  { bg: 'bg-[#8C7A58]/15', text: 'text-[#756240]', border: 'border-[#8C7A58]/25' }, // warm ochre
];

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

  // New subject form state
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjTarget, setNewSubjTarget] = useState('');

  const { activeOverlay, overlayData, openOverlay, closeOverlay, isPopping } = useNavigation();

  // Reset new subject inputs if user presses system back to dismiss add-subject form
  React.useEffect(() => {
    if (activeOverlay !== 'add-subject' && isPopping) {
      setNewSubjName('');
      setNewSubjTarget('');
    }
  }, [activeOverlay, isPopping]);

  // Modals state derived from navigation overlay
  const isExamModalOpen = activeOverlay === 'curriculum-exam-date';
  const editingSubject = activeOverlay === 'curriculum-edit-subject' ? (overlayData as Subject) : null;
  const deletingSubject = activeOverlay === 'curriculum-delete-subject' ? (overlayData as Subject) : null;

  // Top stats calculations
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => l.done).length;
  const lessonsRemaining = totalLessons - completedLessons;

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

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjName.trim()) {
      addSubject({
        name: newSubjName.trim(),
        targetCount: newSubjTarget ? parseInt(newSubjTarget, 10) : undefined,
      });
      setNewSubjName('');
      setNewSubjTarget('');
      if (activeOverlay === 'add-subject') {
        closeOverlay();
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Title */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-caveat text-4xl font-bold text-[var(--accent)] tracking-wide m-0">
          Curriculum
        </h1>
      </div>

      {/* Top Stat Tiles Row (wrap to new row on narrow screens) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={BookOpen}
          value={`${completedLessons} / ${totalLessons}`}
          label="Lessons completed"
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
          value={lessonsRemaining}
          label="Lessons remaining"
          iconColor="text-[#D97706]"
          bgColor="bg-[#FAF7F0]"
        />
      </div>

      {/* Subject Progress Section */}
      <div className="card !mb-0 paper-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section !mb-0">Progress</h2>
          <span className="text-xs font-sans text-[var(--ink-soft)]">
            Tap a card to view lessons
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="empty-note text-center py-6">
            No subjects yet. Add one below to start tracking your curriculum.
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-1">
            {subjects.map((subj, idx) => {
              const subjLessons = lessons.filter((l) => l.subjectId === subj.id);
              const doneCount = subjLessons.filter((l) => l.done).length;
              const progressTarget = subj.targetCount || subjLessons.length;
              const pct = progressTarget > 0 ? Math.min(100, Math.round((doneCount / progressTarget) * 100)) : 0;
              const displayTarget = progressTarget > 0 ? progressTarget : 0;

              // Checkmark indicator: clean if has lessons and 0 pending revisits and 0 low confidence
              const subjLessonIds = new Set(subjLessons.map((l) => l.id));
              const pendingRevisitsCount = revisits.filter((r) => subjLessonIds.has(r.lessonId) && !r.completed).length;
              const lowConfCount = subjLessons.filter((l) => l.done && l.confidence === 'L').length;
              const isClean = subjLessons.length > 0 && pendingRevisitsCount === 0 && lowConfCount === 0;

              const swatch = SUBJECT_SWATCHES[idx % SUBJECT_SWATCHES.length];

              return (
                <div
                  key={subj.id}
                  onClick={() => onSelectSubject(subj.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSubject(subj.id);
                    }
                  }}
                  title={`View ${subj.name} lessons`}
                  className="w-full bg-[#FFFDF9] hover:bg-[#FAF7F0] border border-[var(--line)] hover:border-[var(--accent)] rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_8px_rgba(120,100,70,0.06)] hover:shadow-[0_4px_12px_rgba(120,100,70,0.1)] transition-all cursor-pointer group flex items-center gap-3.5 sm:gap-4 text-left"
                >
                  {/* Small colored icon block / solid-color swatch */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border flex-shrink-0 flex flex-col items-center justify-center ${swatch.bg} ${swatch.border} ${swatch.text} shadow-xs transition-transform group-hover:scale-[1.03]`}
                  >
                    <BookOpen size={20} strokeWidth={2.2} className="opacity-85" />
                    <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider mt-0.5 opacity-90">
                      {subj.name.trim().slice(0, 3)}
                    </span>
                  </div>

                  {/* Card Content Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top Row: Subject Name + Circular Checkmark */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-sans font-bold text-base sm:text-lg text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
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
                          size={19}
                          className={isClean ? 'text-[#5B8266]' : 'text-[var(--ink-soft)]/25'}
                          fill={isClean ? '#5B8266' : 'none'}
                          color={isClean ? '#FFFDF9' : 'currentColor'}
                        />
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="text-xs font-sans text-[var(--ink-soft)] font-medium mt-0.5 truncate">
                      {subj.targetCount
                        ? `Target: ${subj.targetCount} · ${subjLessons.length} ${subjLessons.length === 1 ? 'lesson' : 'lessons'}`
                        : `${subjLessons.length} ${subjLessons.length === 1 ? 'lesson' : 'lessons'}`}
                    </div>

                    {/* Label + Progress Bar Row */}
                    <div className="mt-2 sm:mt-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-wider text-[var(--ink-soft)] uppercase">
                          PROGRESS
                        </span>
                        <span className="text-xs sm:text-sm font-sans font-semibold text-[var(--ink)]">
                          {doneCount} / {displayTarget} ({pct}%)
                        </span>
                      </div>

                      {/* Horizontal progress bar */}
                      <div className="w-full h-2 rounded-full bg-[#EAE6DC] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 100 ? 'bg-[#5B8266]' : 'bg-[var(--accent)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                      {/* Compact textual format required: "Chemistry — 6 Low · 12 Medium · 10 High" */}
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

      {/* Manage Subjects Section: Add a Subject + Existing Subjects List */}
      <div className="card !mb-0 paper-card">
        <h2 className="section">Add a subject</h2>
        <form onSubmit={handleAddSubject} className="flex flex-col gap-3 mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                onFocus={() => {
                  if (activeOverlay !== 'add-subject') {
                    openOverlay('add-subject');
                  }
                }}
                onBlur={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && form.contains(e.relatedTarget as Node)) {
                    return;
                  }
                  if (activeOverlay === 'add-subject' && !newSubjName.trim() && !isPopping) {
                    closeOverlay();
                  }
                }}
                placeholder="e.g. Chemistry"
                className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              />
            </div>
            <div className="w-[120px]">
              <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
                Target Lessons <span className="text-[var(--ink-soft)] font-normal">(opt)</span>
              </label>
              <input
                type="number"
                value={newSubjTarget}
                onChange={(e) => setNewSubjTarget(e.target.value)}
                onFocus={() => {
                  if (activeOverlay !== 'add-subject') {
                    openOverlay('add-subject');
                  }
                }}
                onBlur={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && form.contains(e.relatedTarget as Node)) {
                    return;
                  }
                  if (activeOverlay === 'add-subject' && !newSubjName.trim() && !isPopping) {
                    closeOverlay();
                  }
                }}
                placeholder="e.g. 50"
                min="1"
                className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!newSubjName.trim()}
            className="btn w-full !py-2 flex justify-center items-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={16} />
            <span>Add Subject</span>
          </button>
        </form>

        {/* Existing Subjects List with Edit and Delete */}
        {subjects.length > 0 && (
          <div className="pt-4 border-t border-[var(--line)]">
            <h3 className="font-sans text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2.5">
              Configured Subjects ({subjects.length})
            </h3>
            <div className="flex flex-col gap-2">
              {subjects.map((subj) => {
                const subjLessonsCount = lessons.filter((l) => l.subjectId === subj.id).length;

                return (
                  <div
                    key={subj.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[#FAF7F0] hover:bg-[#FFFDF9] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-sans font-bold text-sm text-[var(--ink)] truncate">
                        {subj.name}
                      </div>
                      <div className="text-[0.7rem] font-sans text-[var(--ink-soft)]">
                        {subj.targetCount ? `Target: ${subj.targetCount} lessons` : 'No target count'} · {subjLessonsCount} lessons added
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openOverlay('curriculum-edit-subject', subj)}
                        className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--accent)] rounded-lg hover:bg-black/5 transition-colors"
                        title="Edit subject"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => openOverlay('curriculum-delete-subject', subj)}
                        className="p-1.5 text-[var(--ink-soft)] hover:text-red-600 rounded-lg hover:bg-black/5 transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
