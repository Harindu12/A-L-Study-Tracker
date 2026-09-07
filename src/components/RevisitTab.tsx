import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../utils';
import { StatTile } from './ui/StatTile';
import { Calendar, AlertCircle } from 'lucide-react';

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
      <div className="flex gap-4 mb-2">
        <StatTile 
          icon={AlertCircle} 
          value={overdue.length} 
          label="Overdue" 
          iconColor="text-[var(--warn)]"
          bgColor="bg-[#fffdf7]"
        />
        <StatTile 
          icon={Calendar} 
          value={dueToday.length} 
          label="Due Today" 
          iconColor="text-[var(--accent)]" 
        />
      </div>

      <div className="card !mb-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section !mb-0">Revisit List</h2>
          <div className="flex gap-2">
            <button 
              className={`btn ${activeView !== 'pending' ? 'ghost' : ''} !py-1.5 !px-3 !text-xs`}
              onClick={() => setActiveView('pending')}
            >
              Pending
            </button>
            <button 
              className={`btn ${activeView !== 'completed' ? 'ghost' : ''} !py-1.5 !px-3 !text-xs`}
              onClick={() => setActiveView('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {activeView === 'pending' ? (
          <div>
            {pendingRevisits.length === 0 ? (
              <div className="empty-note">No pending revisits!</div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingRevisits.map(r => {
                  const isOverdue = r.date < today;
                  const isToday = r.date === today;
                  const subject = subjects.find(s => s.id === r.subjectId);
                  const lesson = lessons.find(l => l.id === r.lessonId);

                  return (
                    <div key={r.id} className="border border-[var(--line)] rounded-xl p-3 bg-[#fffdf7] flex items-start gap-3 transition-colors hover:bg-[var(--paper)]">
                      <div className="pt-1">
                        <input type="checkbox" checked={r.done} onChange={(e) => {
                          updateRevisit(r.id, { done: e.target.checked });
                        }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-sans font-bold text-[var(--ink)] leading-tight mb-1">
                          {subject?.name} — {lesson?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.75rem] text-[var(--ink-soft)] font-sans">{r.date}</span>
                          <span className={`tag ${isOverdue ? 'overdue' : ''}`}>{r.type}</span>
                          {isOverdue && <span className="text-[0.7rem] text-[var(--warn)] font-sans font-bold uppercase tracking-wider ml-1">Overdue</span>}
                          {isToday && <span className="text-[0.7rem] text-[var(--accent)] font-sans font-bold uppercase tracking-wider ml-1">Today</span>}
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
              <div className="empty-note">No completed revisits yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedRevisits.map(r => {
                  const subject = subjects.find(s => s.id === r.subjectId);
                  const lesson = lessons.find(l => l.id === r.lessonId);
                  return (
                    <div key={r.id} className="border border-[var(--line)] rounded-xl p-3 bg-[#fffdf7] flex items-start gap-3 opacity-70">
                      <div className="pt-1">
                        <input type="checkbox" checked={r.done} onChange={(e) => {
                          updateRevisit(r.id, { done: e.target.checked });
                        }} />
                      </div>
                      <div className="flex-1 line-through">
                        <div className="font-sans font-bold text-[var(--ink)] leading-tight mb-1">
                          {subject?.name} — {lesson?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.75rem] text-[var(--ink-soft)] font-sans">{r.date}</span>
                          <span className="tag">{r.type}</span>
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
