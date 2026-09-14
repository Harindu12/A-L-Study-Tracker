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
    .filter(r => !r.done && lessons.some(l => l.id === r.lessonId))
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedRevisits = revisits
    .filter(r => r.done && lessons.some(l => l.id === r.lessonId))
    .sort((a, b) => b.date.localeCompare(a.date));

  const dueToday = pendingRevisits.filter(r => r.date === today);
  const overdue = pendingRevisits.filter(r => r.date < today);

  const [activeView, setActiveView] = useState<'pending' | 'completed'>('pending');

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="pt-2 pb-1">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight m-0">
          Revisit List
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile 
          icon={AlertCircle} 
          value={overdue.length} 
          label="Overdue" 
        />
        <StatTile 
          icon={Calendar} 
          value={dueToday.length} 
          label="Due Today" 
        />
      </div>

      <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0">Topics to Review</h2>
          <div className="flex bg-[#F5F5F5] p-1 rounded-xl border border-[#EAEAEA]">
            <button 
              className={`py-1.5 px-3 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
                activeView === 'pending'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
              }`}
              onClick={() => setActiveView('pending')}
            >
              Pending ({pendingRevisits.length})
            </button>
            <button 
              className={`py-1.5 px-3 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
                activeView === 'completed'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
              }`}
              onClick={() => setActiveView('completed')}
            >
              Completed ({completedRevisits.length})
            </button>
          </div>
        </div>

        {activeView === 'pending' ? (
          <div>
            {pendingRevisits.length === 0 ? (
              <div className="text-center py-8 text-xs font-sans text-[#8A8A8A]">
                All caught up! No pending revisits due.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pendingRevisits.map(r => {
                  const isOverdue = r.date < today;
                  const isDateToday = r.date === today;
                  const subject = subjects.find(s => s.id === r.subjectId);
                  const lesson = lessons.find(l => l.id === r.lessonId);
                  const accentColor = getSubjectColorById(r.subjectId, subjects);

                  return (
                    <div 
                      key={r.id} 
                      className="border border-[#EBEBEB] hover:border-[#D4D4D4] rounded-2xl p-3.5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3 transition-all relative overflow-hidden"
                    >
                      {/* Left accent bar */}
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0 my-0.5"
                        style={{ backgroundColor: accentColor }}
                      />

                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => updateRevisit(r.id, { done: true })}
                        className="w-5 h-5 rounded-full border-[1.5px] border-[#D4D4D4] hover:border-[#1A1A1A] bg-white flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-sans font-bold text-sm text-[#1A1A1A] truncate">
                          {subject?.name} — {lesson?.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[0.72rem] text-[#8A8A8A] font-sans font-medium">
                            {r.date}
                          </span>
                          <span className="bg-[#F5F5F5] text-[#8A8A8A] border border-[#EAEAEA] font-sans font-semibold text-[0.7rem] px-2 py-0.5 rounded-full">
                            {r.type}
                          </span>
                          {isOverdue && (
                            <span className="text-[0.68rem] text-[#EF4444] font-sans font-bold uppercase tracking-wider">
                              Overdue
                            </span>
                          )}
                          {isDateToday && (
                            <span className="text-[0.68rem] text-[#1A1A1A] font-sans font-bold uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {completedRevisits.length === 0 ? (
              <div className="text-center py-8 text-xs font-sans text-[#8A8A8A]">
                No completed revisits yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {completedRevisits.map(r => {
                  const subject = subjects.find(s => s.id === r.subjectId);
                  const lesson = lessons.find(l => l.id === r.lessonId);
                  return (
                    <div 
                      key={r.id} 
                      className="border border-[#EBEBEB] rounded-2xl p-3.5 bg-[#FAFAFA] flex items-center gap-3 opacity-60"
                    >
                      <button
                        type="button"
                        onClick={() => updateRevisit(r.id, { done: false })}
                        className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#1A1A1A] text-white flex items-center justify-center cursor-pointer flex-shrink-0 shadow-2xs"
                      >
                        <Check size={11} strokeWidth={3} />
                      </button>

                      <div className="flex-1 min-w-0 line-through">
                        <div className="font-sans font-bold text-sm text-[#1A1A1A] truncate">
                          {subject?.name} — {lesson?.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[0.72rem] text-[#8A8A8A] font-sans">
                            {r.date}
                          </span>
                          <span className="bg-white text-[#8A8A8A] font-sans font-semibold text-[0.7rem] px-2 py-0.5 rounded-full border border-[#EAEAEA]">
                            {r.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
