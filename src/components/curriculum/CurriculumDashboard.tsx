import React, { useState } from 'react';
import { Subject } from '../../types';
import { useStore } from '../../store';
import { CircularProgress } from '../ui/CircularProgress';
import { StatTile } from '../ui/StatTile';
import { ExamDateModal } from './ExamDateModal';
import { SubjectEditModal, DeleteConfirmModal } from './SubjectEditModal';
import { todayStr } from '../../utils';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  Clock, 
  Pencil, 
  Trash2, 
  Plus,
  ChevronRight
} from 'lucide-react';

interface CurriculumDashboardProps {
  onSelectSubject: (subjectId: string) => void;
}

export const CurriculumDashboard: React.FC<CurriculumDashboardProps> = ({ onSelectSubject }) => {
  const { 
    subjects, 
    lessons, 
    examDate, 
    setExamDate, 
    addSubject, 
    updateSubject, 
    deleteSubject 
  } = useStore();

  // New subject form state
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjTarget, setNewSubjTarget] = useState('');

  // Modals state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

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
          onClick={() => setIsExamModalOpen(true)}
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
            Tap a ring to view lessons
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="empty-note text-center py-6">
            No subjects yet. Add one below to start tracking your curriculum.
          </div>
        ) : (
          <div className="flex flex-wrap gap-5 sm:gap-6 justify-center sm:justify-start items-start py-2">
            {subjects.map((subj) => {
              const subjLessons = lessons.filter((l) => l.subjectId === subj.id);
              const doneCount = subjLessons.filter((l) => l.done).length;
              const hasTarget = !!subj.targetCount;
              const progressTarget = subj.targetCount || (subjLessons.length > 0 ? subjLessons.length : 1);
              const pct = Math.min(100, Math.round((doneCount / progressTarget) * 100));

              return (
                <div
                  key={subj.id}
                  className="w-[105px] flex flex-col items-center group cursor-pointer"
                  onClick={() => onSelectSubject(subj.id)}
                  title={`View ${subj.name} lessons`}
                >
                  <CircularProgress
                    progress={pct}
                    centerText={hasTarget ? `${pct}%` : `${doneCount}`}
                    label={subj.name}
                    subtitle={`${doneCount} / ${subj.targetCount || subjLessons.length}`}
                    onClick={() => onSelectSubject(subj.id)}
                    size={84}
                    strokeWidth={8}
                  />
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
                        onClick={() => setEditingSubject(subj)}
                        className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--accent)] rounded-lg hover:bg-black/5 transition-colors"
                        title="Edit subject"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setDeletingSubject(subj)}
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
        onClose={() => setIsExamModalOpen(false)}
        onSave={(date) => setExamDate(date)}
      />

      <SubjectEditModal
        subject={editingSubject}
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        onSave={(id, updates) => updateSubject(id, updates)}
      />

      <DeleteConfirmModal
        subject={deletingSubject}
        lessonCount={deletingSubject ? lessons.filter((l) => l.subjectId === deletingSubject.id).length : 0}
        isOpen={!!deletingSubject}
        onClose={() => setDeletingSubject(null)}
        onConfirm={() => {
          if (deletingSubject) {
            deleteSubject(deletingSubject.id);
          }
        }}
      />
    </div>
  );
};
