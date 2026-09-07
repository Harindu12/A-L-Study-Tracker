import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf } from '../utils';
import { BarChart, BarChartData } from './ui/BarChart';
import { CircularProgress } from './ui/CircularProgress';

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

  const chartData: BarChartData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
    const rec = dailyEntries[d];
    return {
      label: String(i + 1),
      value: rec ? rec.subjects.filter(s => s.studied || s.pastPaper).length : 0
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="card !mb-0">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="w-[200px]">
            <label>Month</label>
            <input type="month" value={monthStr} onChange={e => setMonthStr(e.target.value)} />
          </div>
        </div>

        <h2 className="section">Overall progress</h2>
        {subjects.length === 0 ? (
          <div className="empty-note">No subjects added yet.</div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide">
            {subjects.map(subj => {
              const doneCount = totalDone[subj.id] || 0;
              const target = subj.targetCount || (lessons.filter(l => l.subjectId === subj.id).length || 1);
              const pct = Math.min(100, Math.round((doneCount / target) * 100));

              return (
                <div key={subj.id} className="min-w-[100px] flex-shrink-0">
                  <CircularProgress 
                    progress={pct} 
                    label={subj.name} 
                    subtitle={`${doneCount} / ${subj.targetCount || (lessons.filter(l => l.subjectId === subj.id).length || '-')}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card !mb-0 overflow-x-auto">
        <h2 className="section">Study Consistency</h2>
        <div className="min-w-[700px]">
          <BarChart data={chartData} />
        </div>
      </div>

      <div className="card !mb-0">
        <h2 className="section">Lessons completed this month</h2>
        {subjects.length === 0 ? (
          <div className="empty-note">No subjects added yet.</div>
        ) : (
          <div className="flex gap-4 flex-wrap text-[0.95rem]">
            {subjects.map(s => (
              <div key={s.id} className="bg-[var(--accent-soft)] px-3 py-2 rounded-xl border border-[var(--accent-line)]/30">
                <span className="font-sans font-medium text-[var(--ink-soft)]">{s.name}:</span>
                <span className="font-sans font-bold text-[var(--accent)] ml-2">{completedThisMonth[s.id] || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card !mb-0">
        <h2 className="section">Saturday test scores</h2>
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
      </div>

      <div className="card !mb-0 overflow-x-auto">
        <h2 className="section">Habit tracker</h2>
        <div className="overflow-x-auto pb-2">
          <table className="text-[0.75rem]">
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="text-center w-[28px]">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="whitespace-nowrap pr-2">Study</td>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
                  const rec = dailyEntries[d];
                  const on = rec && rec.subjects.some(s => s.studied);
                  return <td key={i}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
                })}
              </tr>
              <tr>
                <td className="whitespace-nowrap pr-2">Revisit</td>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
                  const on = getRevisitsDoneOnDate(d) > 0;
                  return <td key={i}><div className={`tracker-cell ${on ? 'on' : ''}`}></div></td>;
                })}
              </tr>
              <tr>
                <td className="whitespace-nowrap pr-2">Teach-back</td>
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
    </div>
  );
};
