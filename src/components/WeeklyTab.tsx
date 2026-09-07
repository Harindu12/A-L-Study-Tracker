import React, { useState } from 'react';
import { useStore } from '../store';
import { mondayOf, addDays, todayStr } from '../utils';
import { BarChart, BarChartData } from './ui/BarChart';

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

  const getRevisitsDoneOnDate = (date: string) => {
    return revisits.filter(r => r.date === date && r.done).length;
  };

  const chartData: BarChartData[] = days.map(d => {
    const rec = getDaily(d);
    const dayLabel = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
    return {
      label: dayLabel,
      value: rec ? rec.subjects.filter(s => s.studied || s.pastPaper).length : 0
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="card !mb-0">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[140px]">
            <label>Any date in the week</label>
            <input type="date" value={anchorDate} onChange={e => setAnchorDate(e.target.value)} />
          </div>
        </div>
        
        <h2 className="section">Week of {monday} → {days[6]}</h2>
        
        <div className="mt-6">
          <h3 className="font-sans font-bold text-[var(--ink)] text-sm mb-2">Subjects Studied</h3>
          <BarChart data={chartData} />
        </div>
      </div>
      
      <div className="card !mb-0 overflow-x-auto">
        <h2 className="section">Activity Log</h2>
        <div className="min-w-[500px]">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Subjects logged</th>
                <th>Revisits</th>
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
                    <td>{new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</td>
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
      </div>

      <div className="card !mb-0 overflow-x-auto">
        <h2 className="section">Habit tracker</h2>
        <div className="min-w-[500px]">
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
      </div>

      <div className="card !mb-0">
        <h2 className="section">Saturday test</h2>
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label>Subject</label>
            <select value={testSubj} onChange={e => setTestSubj(e.target.value)}>
              <option value="">-- subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Score</label>
            <input type="text" value={testScore} onChange={e => setTestScore(e.target.value)} placeholder="e.g. 72%" />
          </div>
          <div className="mt-2 flex items-center">
            <button className="btn w-full flex justify-center gap-2" onClick={handleSaveTest}>
              Save test result
              {saveMsg && <span className="font-sans font-normal opacity-90 ml-2">{saveMsg}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
