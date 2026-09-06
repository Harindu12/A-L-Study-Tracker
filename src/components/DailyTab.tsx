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

export const DailyTab = () => {
  const { dailyEntries, saveDailyEntry, subjects, lessons, revisits, updateRevisit } = useStore();
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [entry, setEntry] = useState<DailyEntry>(createBlankDaily(currentDate));
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setEntry(dailyEntries[currentDate] || createBlankDaily(currentDate));
  }, [currentDate, dailyEntries]);

  const updateEntry = (updates: Partial<DailyEntry>) => {
    setEntry(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    saveDailyEntry(currentDate, entry);
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

  const dueRevisits = revisits.filter(r => r.date === currentDate);

  return (
    <div className="card">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex-1 min-w-[140px]">
          <label>Date</label>
          <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label>Woke up</label>
          <input type="text" value={entry.wakeTime} onChange={e => updateEntry({ wakeTime: e.target.value })} placeholder="6:15am" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label>Slept</label>
          <input type="text" value={entry.sleepTime} onChange={e => updateEntry({ sleepTime: e.target.value })} placeholder="11:20pm" />
        </div>
        <div>
          <button className="btn" onClick={() => setEntry(dailyEntries[currentDate] || createBlankDaily(currentDate))}>Load day</button>
        </div>
      </div>

      <h2 className="section">Today's hours</h2>
      <div className="grid grid-cols-[48px_1fr_24px] gap-x-2 gap-y-1.5 mb-4">
        {entry.hours.map(h => (
          <React.Fragment key={h.id}>
            <div className="font-architects text-[var(--ink-soft)] text-[0.78rem] text-right pt-1.5">{h.time}</div>
            <input 
              type="text" 
              value={h.task} 
              onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, task: e.target.value } : hx) })}
              className="border-b-[1.3px] border-[var(--line)] bg-transparent px-0.5 py-1 focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="pt-1.5">
              <input 
                type="checkbox" 
                checked={h.done} 
                onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, done: e.target.checked } : hx) })}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
      <button className="text-[var(--accent)] text-sm mb-6 font-architects underline" onClick={() => {
        updateEntry({ hours: [...entry.hours, { id: uid(), time: 'custom', task: '', done: false }] });
      }}>+ Add hour block</button>

      <h2 className="section">Subject Logs</h2>
      {entry.subjects.length === 0 ? (
        <div className="empty-note mb-4">No subjects logged today.</div>
      ) : (
        entry.subjects.map((s, idx) => (
          <div key={s.id} className="border-[1.5px] border-[var(--line)] rounded-[5px] p-3.5 mb-3 bg-[#fffdf7]">
            <div className="flex gap-4 flex-wrap mb-2">
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
            
            <div className="flex flex-wrap gap-4 items-center mt-2 mb-2">
              <label className="flex items-center gap-2 cursor-pointer mb-0">
                <input type="checkbox" checked={s.studied} onChange={e => updateSubjectLog(s.id, { studied: e.target.checked })} />
                Watched / studied
              </label>
              <label className="flex items-center gap-2 cursor-pointer mb-0">
                <input type="checkbox" checked={s.pastPaper} onChange={e => updateSubjectLog(s.id, { pastPaper: e.target.checked })} />
                Past paper done
              </label>
            </div>

            <div className="mt-2">
              <label>Confidence</label>
              <div className="flex gap-1.5 mt-1">
                {(['L', 'M', 'H'] as const).map(level => (
                  <button 
                    key={level}
                    type="button"
                    onClick={() => updateSubjectLog(s.id, { confidence: level })}
                    className={`font-architects text-[0.75rem] w-[26px] h-[26px] rounded-full border-[1.5px] cursor-pointer
                      ${s.confidence === level ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-white border-[var(--ink-soft)] text-[var(--ink)]'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
      <div className="mb-6">
        <button className="btn ghost" onClick={addSubjectLog}>+ Add subject log</button>
      </div>

      <h2 className="section">Revisit due today</h2>
      <div className="mb-6">
        {dueRevisits.length === 0 ? (
          <div className="empty-note">Nothing due today.</div>
        ) : (
          dueRevisits.map(r => {
            const subject = subjects.find(s => s.id === r.subjectId);
            const lesson = lessons.find(l => l.id === r.lessonId);
            return (
              <label key={r.id} className="flex items-center gap-2 mb-1.5 cursor-pointer text-base">
                <input type="checkbox" checked={r.done} onChange={(e) => {
                  updateRevisit(r.id, { done: e.target.checked });
                }} />
                <span>{subject?.name} — {lesson?.name} <span className="tag ml-1">{r.type}</span></span>
              </label>
            );
          })
        )}
      </div>

      <h2 className="section">Teach-back summary</h2>
      <textarea 
        className="mb-4"
        value={entry.teachback} 
        onChange={e => updateEntry({ teachback: e.target.value })} 
        placeholder="Write 3-4 lines from memory, no notes..."
      />

      <h2 className="section">Notes / fix tomorrow</h2>
      <textarea 
        value={entry.notes} 
        onChange={e => updateEntry({ notes: e.target.value })} 
      />

      <div className="mt-4 flex items-center">
        <button className="btn" onClick={handleSave}>Save day</button>
        {saveMsg && <span className="font-architects text-[var(--ok)] text-[0.85rem] ml-2.5">{saveMsg}</span>}
      </div>
    </div>
  );
};
