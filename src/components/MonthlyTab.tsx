import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf } from '../utils';

export const MonthlyTab = () => {
  const { subjects, lessons, dailyEntries, weeklyTests, revisits } = useStore();
  const [monthStr, setMonthStr] = useState(todayStr().slice(0, 7)); // YYYY-MM

  const year = parseInt(monthStr.slice(0, 4), 10);
  const month = parseInt(monthStr.slice(5, 7), 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const totalDone: Record<string, number> = {};
  const completedThisMonth: Record<string, number> = {};
  
  subjects.forEach(s => {
    totalDone[s.id] = 0;
    completedThisMonth[s.id] = 0;
  });

  lessons.forEach(l => {
    if (l.done) {
      if (totalDone[l.subjectId] !== undefined) totalDone[l.subjectId]++;
      if (l.completedDate && l.completedDate.startsWith(monthStr)) {
        if (completedThisMonth[l.subjectId] !== undefined) completedThisMonth[l.subjectId]++;
      }
    }
  });

  const mondays = new Set<string>();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = `${monthStr}-${String(i).padStart(2, '0')}`;
    mondays.add(mondayOf(d));
  }
  
  const testResults = Array.from(mondays).map(m => {
    return weeklyTests.find(t => t.weekStartDate === m);
  }).filter(Boolean);

  const getRevisitsDoneOnDate = (date: string) => {
    return revisits.filter(r => r.date === date && r.done).length;
  };

  return (
    <div className="card overflow-x-auto">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="w-[200px]">
          <label>Month</label>
          <input type="month" value={monthStr} onChange={e => setMonthStr(e.target.value)} />
        </div>
      </div>

      <h2 className="section">Overall lesson progress</h2>
      {subjects.length === 0 ? (
        <div className="empty-note">No subjects added yet.</div>
      ) : (
        subjects.map(subj => {
          const doneCount = totalDone[subj.id] || 0;
          const target = subj.targetCount || (lessons.filter(l => l.subjectId === subj.id).length || 1);
          const pct = Math.min(100, Math.round((doneCount / target) * 100));

          return (
            <div key={subj.id} className="flex items-center gap-2.5 mb-2.5">
              <span className="w-[110px] truncate" title={subj.name}>{subj.name}</span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="font-architects text-[0.8rem] w-[70px] text-right">
                {doneCount} / {subj.targetCount || (lessons.filter(l => l.subjectId === subj.id).length || '-')}
              </span>
            </div>
          );
        })
      )}

      <h2 className="section mt-4">Lessons completed this month</h2>
      {subjects.length === 0 ? (
        <div className="empty-note">No subjects added yet.</div>
      ) : (
        <div className="flex gap-4 flex-wrap text-[0.95rem]">
          {subjects.map(s => (
            <span key={s.id}>{s.name}: <strong>{completedThisMonth[s.id] || 0}</strong></span>
          ))}
        </div>
      )}

      <h2 className="section mt-4">Saturday test scores</h2>
      {testResults.length === 0 ? (
        <div className="empty-note">No test scores logged for weeks in this month.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Week of</th>
              <th>Subject</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {testResults.map(t => (
              <tr key={t!.id}>
                <td>{t!.weekStartDate}</td>
                <td>{subjects.find(s => s.id === t!.subjectId)?.name || 'Unknown'}</td>
                <td>{t!.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="section mt-4">Habit tracker</h2>
      <div className="overflow-x-auto">
        <table className="text-[0.75rem]">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i + 1} className="text-center">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Study</td>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
                const rec = dailyEntries[d];
                const on = rec && rec.subjects.some(s => s.studied);
                return <td key={i}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
            <tr>
              <td>Revisit</td>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
                const on = getRevisitsDoneOnDate(d) > 0;
                return <td key={i}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
            <tr>
              <td>Teach-back</td>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
                const rec = dailyEntries[d];
                const on = !!rec?.teachback;
                return <td key={i}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
