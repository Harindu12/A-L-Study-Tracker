import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { todayStr, uid } from '../utils';
import { DailyEntry, HourBlock, DailySubjectLog } from '../types';

const INITIAL_HOURS = ['6-8', '8-10', '10-12', '12-1', '1-3', '3-5', '5-6', '6-8pm', '8-9', '9-10'];

const createBlankDaily = (date: string): DailyEntry => ({
  date,
  wakeTime: '',
  sleepTime: '',
  hours: INITIAL_HOURS.map(time => ({ id: uid(), time, task: '', done: false })),
  subjects: [],
  teachback: '',
  notes: ''
});

interface DailyTabProps {
  date: string;
  onDateChange: (d: string) => void;
}

export const DailyTab: React.FC<DailyTabProps> = ({ date, onDateChange }) => {
  const { dailyEntries, saveDailyEntry, subjects, lessons, revisits, updateRevisit } = useStore();
  const [entry, setEntry] = useState<DailyEntry>(createBlankDaily(date));
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setEntry(dailyEntries[date] || createBlankDaily(date));
  }, [date, dailyEntries]);

  const updateEntry = (updates: Partial<DailyEntry>) => {
    setEntry(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    saveDailyEntry(date, entry);
    setSaveMsg('Saved ✓');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addSubjectLog = () => {
    updateEntry({
      subjects: [
        ...entry.subjects,
        { id: uid(), subjectId: '', lessonId: '', studied: false, pastPaper: false, confidence: null }
      ]
    });
  };

  const updateSubjectLog = (id: string, updates: Partial<DailySubjectLog>) => {
    updateEntry({
      subjects: entry.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const dueRevisits = revisits.filter(r => r.date === date);

  return (
    <div className="flex flex-col gap-4">
      <div className="card !mb-0">
        <div className="flex flex-wrap gap-4 items-end mb-2">
          <div className="flex-1 min-w-[140px]">
            <label>Date</label>
            <input type="date" value={date} onChange={e => onDateChange(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label>Woke up</label>
            <input type="text" value={entry.wakeTime} onChange={e => updateEntry({ wakeTime: e.target.value })} placeholder="6:15 am" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label>Slept</label>
            <input type="text" value={entry.sleepTime} onChange={e => updateEntry({ sleepTime: e.target.value })} placeholder="11:20 pm" />
          </div>
          <div className="w-full mt-2">
            <button className="btn w-full" onClick={() => setEntry(dailyEntries[date] || createBlankDaily(date))}>Load date</button>
          </div>
        </div>
      </div>

      <div className="card !mb-0">
        <h2 className="section">Today's schedule</h2>
        <div className="grid grid-cols-[56px_1fr_28px] gap-x-3 gap-y-2 mb-4">
          {entry.hours.map(h => (
            <React.Fragment key={h.id}>
              <div className="font-sans font-medium text-[var(--ink-soft)] text-[0.8rem] text-right pt-2.5">{h.time}</div>
              <input 
                type="text" 
                value={h.task} 
                onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, task: e.target.value } : hx) })}
                className="!bg-transparent !border-0 !border-b-[1.5px] !border-[var(--line)] !rounded-none !px-1 focus:!border-[var(--accent)] focus:!box-shadow-none"
              />
              <div className="pt-2 flex justify-center">
                <input 
                  type="checkbox" 
                  checked={h.done} 
                  onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, done: e.target.checked } : hx) })}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
        <button className="text-[var(--accent)] text-sm font-sans font-medium underline" onClick={() => {
          updateEntry({ hours: [...entry.hours, { id: uid(), time: 'custom', task: '', done: false }] });
        }}>+ Add time block</button>
      </div>

      <div className="card !mb-0">
        <h2 className="section">Subject Logs</h2>
        {entry.subjects.length === 0 ? (
          <div className="empty-note mb-4">No subjects logged today.</div>
        ) : (
          entry.subjects.map((s, idx) => (
            <div key={s.id} className="border border-[var(--line)] rounded-[14px] p-4 mb-4 bg-[#fffdf7]">
              <div className="flex gap-4 flex-wrap mb-4">
                <div className="flex-1 min-w-[140px]">
                  <label>Subject</label>
                  <select value={s.subjectId} onChange={e => updateSubjectLog(s.id, { subjectId: e.target.value, lessonId: '' })}>
                    <option value="">-- choose subject --</option>
                    {subjects.map(subj => <option key={subj.id} value={subj.id}>{subj.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label>Lesson</label>
                  <select value={s.lessonId} onChange={e => updateSubjectLog(s.id, { lessonId: e.target.value })}>
                    <option value="">-- choose lesson --</option>
                    {s.subjectId && lessons.filter(l => l.subjectId === s.subjectId).map(l => (
                      <option key={l.id} value={l.id}>{l.name} {l.done ? '✓' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 items-center mt-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer mb-0">
                  <input type="checkbox" checked={s.studied} onChange={e => updateSubjectLog(s.id, { studied: e.target.checked })} />
                  <span className="mt-0.5">Watched / studied</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-0">
                  <input type="checkbox" checked={s.pastPaper} onChange={e => updateSubjectLog(s.id, { pastPaper: e.target.checked })} />
                  <span className="mt-0.5">Past paper done</span>
                </label>
              </div>

              <div className="mt-2 pt-4 border-t border-dashed border-[var(--line)]">
                <label>Confidence Rating</label>
                <div className="flex gap-2 mt-2">
                  {(['L', 'M', 'H'] as const).map(level => (
                    <button 
                      key={level}
                      type="button"
                      onClick={() => updateSubjectLog(s.id, { confidence: level })}
                      className={`font-sans font-bold text-sm w-[36px] h-[36px] rounded-full border-[1.5px] cursor-pointer transition-colors
                        ${s.confidence === level ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm' : 'bg-white border-[var(--ink-soft)] text-[var(--ink)]'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        <div>
          <button className="btn ghost w-full" onClick={addSubjectLog}>+ Add subject log</button>
        </div>
      </div>

      <div className="card !mb-0">
        <h2 className="section">Revisits due today</h2>
        <div>
          {dueRevisits.length === 0 ? (
            <div className="empty-note !p-4">Nothing due today.</div>
          ) : (
            dueRevisits.map(r => {
              const subject = subjects.find(s => s.id === r.subjectId);
              const lesson = lessons.find(l => l.id === r.lessonId);
              return (
                <label key={r.id} className="flex items-center gap-3 mb-3 cursor-pointer text-[0.95rem] p-2 hover:bg-[var(--paper)] rounded-lg transition-colors">
                  <input type="checkbox" checked={r.done} onChange={(e) => {
                    updateRevisit(r.id, { done: e.target.checked });
                  }} />
                  <span className="mt-0.5 flex-1">{subject?.name} — {lesson?.name}</span>
                  <span className="tag">{r.type}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="card !mb-0">
        <h2 className="section">Teach-back summary</h2>
        <textarea 
          className="mb-6"
          value={entry.teachback} 
          onChange={e => updateEntry({ teachback: e.target.value })} 
          placeholder="Write 3-4 lines from memory, no notes..."
        />

        <h2 className="section">Notes / fix tomorrow</h2>
        <textarea 
          value={entry.notes} 
          onChange={e => updateEntry({ notes: e.target.value })} 
          placeholder="Any areas of struggle?"
        />
      </div>
      
      <div className="sticky bottom-24 left-0 right-0 z-40 px-2 mt-4 pb-4">
        <button className="btn w-full shadow-lg h-[52px] text-lg rounded-xl flex items-center justify-center gap-2" onClick={handleSave}>
          Save Day {saveMsg && <span className="font-sans font-normal opacity-90">{saveMsg}</span>}
        </button>
      </div>
    </div>
  );
};
