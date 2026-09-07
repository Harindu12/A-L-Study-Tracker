import React, { useState } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf, addDays } from '../utils';
import { CircularProgress } from './ui/CircularProgress';
import { BarChart, BarChartData } from './ui/BarChart';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateChipStrip } from './ui/DateChipStrip';

export const StatsTab = () => {
  const { dailyEntries, subjects, lessons, weeklyTests, saveWeeklyTest, revisits } = useStore();
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  
  // Weekly State
  const [anchorDate, setAnchorDate] = useState(todayStr());
  
  // Monthly State
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const getDaily = (d: string) => dailyEntries[d];
  const getRevisitsDoneOnDate = (date: string) => revisits.filter(r => r.date === date && r.done).length;

  const renderWeekly = () => {
    const monday = mondayOf(anchorDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    
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

    const chartData: BarChartData[] = days.map(d => {
      const rec = getDaily(d);
      const dayLabel = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
      return {
        label: dayLabel,
        value: rec ? rec.subjects.filter(s => s.studied || s.pastPaper).length : 0
      };
    });

    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-200">
        <div className="card !mb-0 !pt-2 border border-[var(--line)] shadow-sm">
          <DateChipStrip currentDate={anchorDate} onDateSelect={setAnchorDate} />
          <div className="mt-4 text-center">
             <h2 className="font-caveat text-xl text-[var(--ink)]">Week of {monday}</h2>
          </div>
          <div className="mt-6">
            <h3 className="font-sans font-bold text-[var(--ink)] text-sm mb-2">Subjects Studied</h3>
            <BarChart data={chartData} />
          </div>
        </div>
        
        <div className="card !mb-0 overflow-x-auto border border-[var(--line)] shadow-sm">
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

        <div className="card !mb-0 overflow-x-auto border border-[var(--line)] shadow-sm">
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

        <div className="card !mb-0 border border-[var(--line)] shadow-sm">
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

  const renderMonthly = () => {
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const prevMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
    const nextMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));

    const totalDone: Record<string, number> = {};
    const completedThisMonth: Record<string, number> = {};

    lessons.forEach(l => {
      if (l.done) {
        totalDone[l.subjectId] = (totalDone[l.subjectId] || 0) + 1;
        if (l.completedDate && l.completedDate.startsWith(monthStr)) {
          completedThisMonth[l.subjectId] = (completedThisMonth[l.subjectId] || 0) + 1;
        }
      }
    });

    const testResults = weeklyTests.filter(t => t.weekStartDate.startsWith(monthStr));

    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => `${monthStr}-${String(i + 1).padStart(2, '0')}`);

    const chartData: BarChartData[] = [];
    const weeksCount = Math.ceil(daysInMonth / 7);
    for (let i = 0; i < weeksCount; i++) {
      let count = 0;
      for (let j = 0; j < 7; j++) {
        const dayIdx = i * 7 + j;
        if (dayIdx < days.length) {
          const rec = getDaily(days[dayIdx]);
          if (rec && rec.subjects.some(s => s.studied || s.pastPaper)) {
            count++;
          }
        }
      }
      chartData.push({ label: `W${i+1}`, value: count });
    }

    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-200">
        <div className="card !mb-0 border border-[var(--line)] shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2 pt-2">
            <button onClick={prevMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="font-caveat text-3xl font-bold text-[var(--accent)] m-0">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-full transition-colors">
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
          
          <h2 className="section">Overall progress</h2>
          <div className="flex overflow-x-auto gap-4 pb-4">
            {subjects.map(s => {
              const subjLessons = lessons.filter(l => l.subjectId === s.id);
              const total = subjLessons.length;
              const done = totalDone[s.id] || 0;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <CircularProgress percentage={percent} size={64} strokeWidth={6} />
                  <span className="text-[0.7rem] font-sans font-bold text-[var(--ink)] text-center line-clamp-1">{s.name}</span>
                </div>
              );
            })}
          </div>

          <h2 className="section mt-4">Study consistency</h2>
          <BarChart data={chartData} />
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-[#fffdf7] border border-[var(--line)] rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="font-caveat text-3xl font-bold text-[var(--accent)]">{Object.values(completedThisMonth).reduce((a, b) => a + b, 0)}</span>
              <span className="text-[0.7rem] font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider">Lessons completed</span>
            </div>
            <div className="bg-[#fffdf7] border border-[var(--line)] rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="font-caveat text-3xl font-bold text-[var(--accent)]">{testResults.length}</span>
              <span className="text-[0.7rem] font-sans font-bold text-[var(--ink-soft)] uppercase tracking-wider">Tests taken</span>
            </div>
          </div>
        </div>

        <div className="card !mb-0 overflow-x-auto border border-[var(--line)] shadow-sm">
          <h2 className="section">Saturday test scores</h2>
          <div className="min-w-[400px]">
            <table>
              <thead>
                <tr>
                  <th>Week of</th>
                  <th>Subject</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {testResults.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center italic opacity-60">No tests logged this month</td>
                  </tr>
                ) : (
                  testResults.map((t, i) => {
                    const subj = subjects.find(s => s.id === t.subjectId);
                    return (
                      <tr key={i}>
                        <td>{t.weekStartDate}</td>
                        <td>{subj?.name || 'Unknown'}</td>
                        <td className="font-bold text-[var(--accent)]">{t.score}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card !mb-0 overflow-x-auto border border-[var(--line)] shadow-sm">
          <h2 className="section">Monthly habit tracker</h2>
          <div className="min-w-[800px]">
            <table>
              <thead>
                <tr>
                  <th></th>
                  {days.map(d => (
                    <th key={d} className="text-center px-1">{d.slice(8, 10)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Studied</td>
                  {days.map(d => {
                    const rec = getDaily(d);
                    const on = rec && rec.subjects.some(s => s.studied);
                    return <td key={d} className="px-1"><div className={`tracker-cell ${on ? 'on' : ''} mx-auto`}></div></td>;
                  })}
                </tr>
                <tr>
                  <td>Past papers</td>
                  {days.map(d => {
                    const rec = getDaily(d);
                    const on = rec && rec.subjects.some(s => s.pastPaper);
                    return <td key={d} className="px-1"><div className={`tracker-cell ${on ? 'on' : ''} mx-auto`}></div></td>;
                  })}
                </tr>
                <tr>
                  <td>Revisit done</td>
                  {days.map(d => (
                    <td key={d} className="px-1"><div className={`tracker-cell ${getRevisitsDoneOnDate(d) > 0 ? 'on' : ''} mx-auto`}></div></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-24 h-full">
      <div className="sticky top-0 z-30 pt-3 pb-2 bg-white/95 backdrop-blur-md">
        <div className="flex bg-[var(--paper)] p-1 rounded-xl border border-[var(--line)] shadow-sm max-w-sm mx-auto">
          <button 
            className={`flex-1 py-2 rounded-lg font-sans font-bold text-sm transition-all ${mode === 'weekly' ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--line)]' : 'text-[var(--ink-soft)] hover:bg-black/5 border border-transparent'}`}
            onClick={() => setMode('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg font-sans font-bold text-sm transition-all ${mode === 'monthly' ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--line)]' : 'text-[var(--ink-soft)] hover:bg-black/5 border border-transparent'}`}
            onClick={() => setMode('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {mode === 'weekly' ? renderWeekly() : renderMonthly()}
    </div>
  );
};
