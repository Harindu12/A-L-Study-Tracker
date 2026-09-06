import React, { useState } from 'react';
import { useStore } from '../store';
import { mondayOf, addDays, todayStr } from '../utils';

export const WeeklyTab = () => {
  const { dailyEntries, subjects, weeklyTests, saveWeeklyTest, revisits } = useStore();
  const [anchorDate, setAnchorDate] = useState(todayStr());

  const monday = mondayOf(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  
  const getDaily = (d: string) => dailyEntries[d];
  
  const currentWeekTest = weeklyTests.find(t => t.weekStartDate === monday) || { subjectId: '', score: '' };
  const [testSubj, setTestSubj] = useState(currentWeekTest.subjectId);
  const [testScore, setTestScore] = useState(currentWeekTest.score);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveTest = () => {
    if (testSubj) {
      saveWeeklyTest({ weekStartDate: monday, subjectId: testSubj, score: testScore });
      setSaveMsg('Saved ✓');
      setTimeout(() => setSaveMsg(''), 1500);
    }
  };

  // Pre-calculate revisit completions per day to render in the table/habit tracker
  // Since revisits don't strictly link to the DailyEntry but are global, we check global revisits
  // that were due on that day AND are marked done. Alternatively, we can check DailyEntry if we tracked it there.
  // The provided HTML checked `rec.revisitDoneIds.length > 0`. Since our revisits are global:
  const getRevisitsDoneOnDate = (date: string) => {
    // For simplicity and based on how space-repetition works, if a revisit for `date` is `done`, it was done on `date`.
    return revisits.filter(r => r.date === date && r.done).length;
  };

  return (
    <div className="card overflow-x-auto">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex-1 min-w-[140px]">
          <label>Any date in the week</label>
          <input type="date" value={anchorDate} onChange={e => setAnchorDate(e.target.value)} />
        </div>
      </div>
      
      <h2 className="section">Week of {monday} → {days[6]}</h2>
      
      <div className="min-w-[600px]">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Subjects logged</th>
              <th>Revisits done</th>
              <th>Teach-back</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const rec = getDaily(d);
              const subjs = rec?.subjects || [];
              const revCount = getRevisitsDoneOnDate(d);
              
              return (
                <tr key={d}>
                  <td>{d}</td>
                  <td>
                    {subjs.length > 0 
                      ? subjs.map(s => subjects.find(sx => sx.id === s.subjectId)?.name || '?').join(', ')
                      : '—'}
                  </td>
                  <td>{revCount || '—'}</td>
                  <td>{rec?.teachback ? '✓' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="section mt-4">Habit tracker</h2>
      <div className="min-w-[600px]">
        <table>
          <thead>
            <tr>
              <th></th>
              {days.map(d => (
                <th key={d} className="text-center">{d.slice(8, 10)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Studied</td>
              {days.map(d => {
                const rec = getDaily(d);
                const on = rec && rec.subjects.some(s => s.studied);
                return <td key={d}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
            <tr>
              <td>Past papers</td>
              {days.map(d => {
                const rec = getDaily(d);
                const on = rec && rec.subjects.some(s => s.pastPaper);
                return <td key={d}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
            <tr>
              <td>Revisit done</td>
              {days.map(d => (
                <td key={d}><div className={`tracker-cell ${getRevisitsDoneOnDate(d) > 0 ? 'on' : ''}`}></div></td>
              ))}
            </tr>
            <tr>
              <td>Teach-back</td>
              {days.map(d => {
                const rec = getDaily(d);
                const on = !!rec?.teachback;
                return <td key={d}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="section mt-4">Saturday test</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label>Subject</label>
          <select value={testSubj} onChange={e => setTestSubj(e.target.value)}>
            <option value="">-- subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label>Score</label>
          <input type="text" value={testScore} onChange={e => setTestScore(e.target.value)} placeholder="e.g. 72%" />
        </div>
        <div>
          <button className="btn" onClick={handleSaveTest}>Save test result</button>
          {saveMsg && <span className="font-architects text-[var(--ok)] text-[0.85rem] ml-2.5">{saveMsg}</span>}
        </div>
      </div>
    </div>
  );
};
