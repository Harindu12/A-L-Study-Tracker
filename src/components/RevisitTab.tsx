import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../utils';
import { StatTile } from './ui/StatTile';
import { Calendar, AlertCircle, Check } from 'lucide-react';
import { getSubjectColorById } from '../utils/colors';

export const RevisitTab = () => {
  const { revisits, subjects, lessons, updateRevisit } = useStore();

  const today = todayStr();

  const pendingRevisits = revisits
    .filter((r) => !r.done && lessons.some((l) => l.id === r.lessonId))
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedRevisits = revisits
    .filter((r) => r.done && lessons.some((l) => l.id === r.lessonId))
    .sort((a, b) => b.date.localeCompare(a.date));

  const dueToday = pendingRevisits.filter((r) => r.date === today);
  const overdue = pendingRevisits.filter((r) => r.date < today);

  const [activeView, setActiveView] = useState<'pending' | 'completed'>('pending');

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile icon={AlertCircle} value={overdue.length} label="Overdue" />
        <StatTile icon={Calendar} value={dueToday.length} label="Due today" />
      </div>

      {/* Main Hairline-Divided Reviews Container */}
      <section className="bg-[#FFFDF9] border border-[#E4E0D8] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(24,23,21,0.03)]">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#EFECE6] flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-sans text-sm sm:text-base font-bold text-[#181715] m-0">
            Topics to Review
          </h2>

          {/* Interactive Segmented Filter Control */}
          <div className="inline-flex bg-[#EDEAE2] p-1 rounded-xl border border-[#E4E0D8]">
            <button
              type="button"
              className={`min-h-[32px] py-1 px-3 rounded-lg font-sans font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                activeView === 'pending'
                  ? 'bg-[#FFFDF9] text-[#181715] shadow-[0_1px_2px_rgba(24,23,21,0.06)]'
                  : 'text-[#78716C] hover:text-[#181715]'
              }`}
              onClick={() => setActiveView('pending')}
            >
              Pending ({pendingRevisits.length})
            </button>
            <button
              type="button"
              className={`min-h-[32px] py-1 px-3 rounded-lg font-sans font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                activeView === 'completed'
                  ? 'bg-[#FFFDF9] text-[#181715] shadow-[0_1px_2px_rgba(24,23,21,0.06)]'
                  : 'text-[#78716C] hover:text-[#181715]'
              }`}
              onClick={() => setActiveView('completed')}
            >
              Completed ({completedRevisits.length})
            </button>
          </div>
        </div>

        {activeView === 'pending' ? (
          pendingRevisits.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs sm:text-sm font-sans text-[#78716C]">
              All caught up. No pending revisits due.
            </div>
          ) : (
            <div className="divide-y divide-[#EFECE6]">
              {pendingRevisits.map((r) => {
                const isOverdue = r.date < today;
                const isDateToday = r.date === today;
                const subject = subjects.find((s) => s.id === r.subjectId);
                const lesson = lessons.find((l) => l.id === r.lessonId);
                const accentColor = getSubjectColorById(r.subjectId, subjects);

                return (
                  <div
                    key={r.id}
                    className="px-4 sm:px-5 py-3.5 hover:bg-[#F9F7F2] transition-colors flex items-center gap-3"
                  >
                    {/* 44px touch target circular completion button */}
                    <button
                      type="button"
                      onClick={() => updateRevisit(r.id, { done: true })}
                      aria-label={`Mark ${lesson?.name || 'revisit'} complete`}
                      className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-[#EDEAE2] transition-colors cursor-pointer flex-shrink-0 group"
                    >
                      <span
                        className="w-5 h-5 rounded-full border-[1.75px] bg-[#FFFDF9] block transition-colors"
                        style={{ borderColor: `${accentColor}75` }}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-semibold text-sm text-[#181715] leading-snug break-words">
                        {lesson?.name || 'Lesson Revisit'}
                      </div>

                      {/* Unboxed Metadata Line (zero pill capsules) */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs font-sans text-[#78716C] tabular-nums">
                        <span
                          className="inline-flex items-center gap-1.5 font-semibold"
                          style={{ color: accentColor }}
                        >
                          <span
                            className="w-2 h-2 rounded-[3px] flex-shrink-0"
                            style={{ backgroundColor: accentColor }}
                            aria-hidden="true"
                          />
                          <span>{subject?.name || 'Subject'}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{r.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>{r.date}</span>
                        {isOverdue && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                              <AlertCircle size={12} />
                              <span>Overdue</span>
                            </span>
                          </>
                        )}
                        {isDateToday && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#181715] font-semibold">Due today</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : completedRevisits.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs sm:text-sm font-sans text-[#78716C]">
            No completed revisits yet.
          </div>
        ) : (
          <div className="divide-y divide-[#EFECE6]">
            {completedRevisits.map((r) => {
              const subject = subjects.find((s) => s.id === r.subjectId);
              const lesson = lessons.find((l) => l.id === r.lessonId);
              const accentColor = getSubjectColorById(r.subjectId, subjects);

              return (
                <div
                  key={r.id}
                  className="px-4 sm:px-5 py-3.5 bg-[#F9F7F2]/60 flex items-center gap-3 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <button
                    type="button"
                    onClick={() => updateRevisit(r.id, { done: false })}
                    aria-label={`Mark ${lesson?.name || 'revisit'} pending`}
                    className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-[#EDEAE2] transition-colors cursor-pointer flex-shrink-0"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#16A34A] border border-[#16A34A] text-[#FFFFFF] flex items-center justify-center">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-sm text-[#78716C] line-through leading-snug break-words">
                      {lesson?.name || 'Lesson Revisit'}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs font-sans text-[#78716C] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-[3px] flex-shrink-0 opacity-65"
                          style={{ backgroundColor: accentColor }}
                          aria-hidden="true"
                        />
                        <span>{subject?.name || 'Subject'}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{r.type}</span>
                      <span aria-hidden="true">·</span>
                      <span>{r.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
