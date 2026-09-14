import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { todayStr, mondayOf, addDays } from '../utils';
import { CircularProgress } from './ui/CircularProgress';
import { BarChart, BarChartData } from './ui/BarChart';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateChipStrip } from './ui/DateChipStrip';
import { useNavigation } from '../navigation';

interface SaturdayTestSectionProps {
  monday: string;
}

const SaturdayTestSection: React.FC<SaturdayTestSectionProps> = ({ monday }) => {
  const { weeklyTests, saveWeeklyTest, subjects } = useStore();
  const { activeOverlay, openOverlay, closeOverlay, isPopping } = useNavigation();

  const currentWeekTest = weeklyTests.find(t => t.weekStartDate === monday) || { subjectId: '', score: '' };
  const [testSubj, setTestSubj] = useState(currentWeekTest.subjectId);
  const [testScore, setTestScore] = useState(currentWeekTest.score);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setTestSubj(currentWeekTest.subjectId);
    setTestScore(currentWeekTest.score);
  }, [currentWeekTest.subjectId, currentWeekTest.score, monday]);

  const handleSaveTest = () => {
    if (testSubj) {
      saveWeeklyTest({ weekStartDate: monday, subjectId: testSubj, score: testScore });
      setSaveMsg('Saved ✓');
      if (activeOverlay === 'stats-saturday-test') {
        closeOverlay();
      }
      setTimeout(() => setSaveMsg(''), 1500);
    }
  };

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0 mb-4">Saturday Test</h2>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <select 
            value={testSubj} 
            onChange={e => setTestSubj(e.target.value)}
            onFocus={() => {
              if (activeOverlay !== 'stats-saturday-test') {
                openOverlay('stats-saturday-test');
              }
            }}
            onBlur={() => {
              if (activeOverlay === 'stats-saturday-test' && !isPopping) {
                closeOverlay();
              }
            }}
            className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
          >
            <option value="">-- select subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
            Score
          </label>
          <input 
            type="text" 
            value={testScore} 
            onChange={e => setTestScore(e.target.value)} 
            onFocus={() => {
              if (activeOverlay !== 'stats-saturday-test') {
                openOverlay('stats-saturday-test');
              }
            }}
            onBlur={() => {
              if (activeOverlay === 'stats-saturday-test' && !isPopping) {
                closeOverlay();
              }
            }}
            placeholder="e.g. 72%" 
            className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
          />
        </div>
        <div className="mt-2 flex items-center">
          <button 
            type="button"
            className="w-full py-2.5 px-4 bg-[#1A1A1A] text-white font-sans font-bold text-xs rounded-xl hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2" 
            onClick={handleSaveTest}
          >
            <span>Save Test Result</span>
            {saveMsg && <span className="font-normal opacity-80">{saveMsg}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export const StatsTab = () => {
  const { dailyEntries, subjects, lessons, weeklyTests, revisits } = useStore();
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
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <DateChipStrip currentDate={anchorDate} onDateSelect={setAnchorDate} />
          <div className="mt-4 text-center">
             <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0">Week of {monday}</h2>
          </div>
          <div className="mt-5">
            <h3 className="font-sans font-bold text-[#8A8A8A] text-xs uppercase tracking-wider mb-2">Subjects Studied</h3>
            <BarChart data={chartData} />
          </div>
        </div>
        
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0 mb-3">Activity Log</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0] text-[#8A8A8A]">
                  <th className="w-16 py-2 px-1 text-left font-semibold">Day</th>
                  <th className="py-2 px-2 text-left font-semibold">Subjects logged</th>
                  <th className="w-14 py-2 px-1 text-center whitespace-nowrap font-semibold">Revisit</th>
                  <th className="w-14 py-2 px-1 text-center whitespace-nowrap font-semibold">Teach</th>
                </tr>
              </thead>
              <tbody>
                {days.map(d => {
                  const rec = getDaily(d);
                  const subjs = rec?.subjects || [];
                  const revCount = getRevisitsDoneOnDate(d);
                  
                  return (
                    <tr key={d} className="border-b border-[#F7F7F7] last:border-b-0">
                      <td className="py-2.5 px-1 font-medium text-[#1A1A1A] whitespace-nowrap">
                        {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-2 text-[#1A1A1A]">
                        {subjs.length > 0 
                          ? subjs.map(s => subjects.find(sx => sx.id === s.subjectId)?.name || '?').join(', ')
                          : '—'}
                      </td>
                      <td className="py-2.5 px-1 text-center font-semibold">
                        {revCount > 0 ? (
                          <span className="text-[#1A1A1A]">{revCount}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-1 text-center font-semibold">
                        {rec?.teachback ? <span className="text-[#1A1A1A]">✓</span> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
          <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0 mb-3">Habit Tracker</h2>
          <div className="min-w-[460px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] text-[#8A8A8A]">
                  <th className="text-left py-2"></th>
                  {days.map(d => (
                    <th key={d} className="text-center py-2 font-semibold">{d.slice(8, 10)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F7F7F7]">
                  <td className="py-2 font-medium text-[#1A1A1A]">Studied</td>
                  {days.map(d => {
                    const rec = getDaily(d);
                    const on = rec && rec.subjects.some(s => s.studied);
                    return (
                      <td key={d} className="text-center py-2">
                        <div className={`w-3.5 h-3.5 rounded-sm mx-auto transition-colors ${on ? 'bg-[#1A1A1A]' : 'bg-[#F0F0F0]'}`} />
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-[#F7F7F7]">
                  <td className="py-2 font-medium text-[#1A1A1A]">Past papers</td>
                  {days.map(d => {
                    const rec = getDaily(d);
                    const on = rec && rec.subjects.some(s => s.pastPaper);
                    return (
                      <td key={d} className="text-center py-2">
                        <div className={`w-3.5 h-3.5 rounded-sm mx-auto transition-colors ${on ? 'bg-[#1A1A1A]' : 'bg-[#F0F0F0]'}`} />
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-[#F7F7F7]">
                  <td className="py-2 font-medium text-[#1A1A1A]">Revisit done</td>
                  {days.map(d => (
                    <td key={d} className="text-center py-2">
                      <div className={`w-3.5 h-3.5 rounded-sm mx-auto transition-colors ${getRevisitsDoneOnDate(d) > 0 ? 'bg-[#1A1A1A]' : 'bg-[#F0F0F0]'}`} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 font-medium text-[#1A1A1A]">Teach-back</td>
                  {days.map(d => {
                    const rec = getDaily(d);
                    const on = !!rec?.teachback;
                    return (
                      <td key={d} className="text-center py-2">
                        <div className={`w-3.5 h-3.5 rounded-sm mx-auto transition-colors ${on ? 'bg-[#1A1A1A]' : 'bg-[#F0F0F0]'}`} />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <SaturdayTestSection monday={monday} />
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
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <button 
              type="button"
              onClick={prevMonth} 
              className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="font-sans text-xl font-extrabold text-[#1A1A1A] m-0">{monthLabel}</h2>
            <button 
              type="button"
              onClick={nextMonth} 
              className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
          
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-[#8A8A8A] mb-3">Overall progress</h2>
          <div className="flex overflow-x-auto gap-4 pb-2">
            {subjects.map(s => {
              const subjLessons = lessons.filter(l => l.subjectId === s.id);
              const total = subjLessons.length;
              const done = totalDone[s.id] || 0;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 min-w-[76px]">
                  <CircularProgress percentage={percent} size={60} strokeWidth={5} />
                  <span className="text-[0.72rem] font-sans font-bold text-[#1A1A1A] text-center line-clamp-1">{s.name}</span>
                </div>
              );
            })}
          </div>

          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-[#8A8A8A] mt-5 mb-2">Study consistency</h2>
          <BarChart data={chartData} />
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="font-sans text-2xl font-extrabold text-[#1A1A1A]">
                {Object.values(completedThisMonth).reduce((a, b) => a + b, 0)}
              </span>
              <span className="text-[0.68rem] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                Lessons completed
              </span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="font-sans text-2xl font-extrabold text-[#1A1A1A]">
                {testResults.length}
              </span>
              <span className="text-[0.68rem] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                Tests taken
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
          <h2 className="font-sans text-base font-bold text-[#1A1A1A] m-0 mb-3">Saturday Test Scores</h2>
          <div className="min-w-[360px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] text-[#8A8A8A]">
                  <th className="text-left py-2 font-semibold">Week of</th>
                  <th className="text-left py-2 font-semibold">Subject</th>
                  <th className="text-right py-2 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {testResults.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-[#8A8A8A]">No tests logged this month</td>
                  </tr>
                ) : (
                  testResults.map((t, i) => {
                    const subj = subjects.find(s => s.id === t.subjectId);
                    return (
                      <tr key={i} className="border-b border-[#F7F7F7] last:border-b-0">
                        <td className="py-2.5 text-[#8A8A8A]">{t.weekStartDate}</td>
                        <td className="py-2.5 font-medium text-[#1A1A1A]">{subj?.name || 'Unknown'}</td>
                        <td className="py-2.5 text-right font-bold text-[#1A1A1A]">{t.score}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-6 h-full">
      <div className="pt-2 pb-1 flex items-center justify-between">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight m-0">
          Analytics & Progress
        </h1>
        <div className="flex bg-[#F5F5F5] p-1 rounded-xl border border-[#EAEAEA]">
          <button 
            type="button"
            className={`py-1.5 px-3 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
              mode === 'weekly' 
                ? 'bg-[#1A1A1A] text-white shadow-2xs' 
                : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
            }`}
            onClick={() => setMode('weekly')}
          >
            Weekly
          </button>
          <button 
            type="button"
            className={`py-1.5 px-3 rounded-lg font-sans font-bold text-xs transition-all cursor-pointer ${
              mode === 'monthly' 
                ? 'bg-[#1A1A1A] text-white shadow-2xs' 
                : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
            }`}
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
