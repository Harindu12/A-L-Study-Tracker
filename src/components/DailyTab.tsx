import { DailyEntry, DailySubjectLog } from "../types";
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { todayStr, uid } from '../utils';
import { DateChipStrip } from './ui/DateChipStrip';
import { Sun, CloudSun, Moon, BookOpen, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface DailyTabProps {
  date: string;
  onDateChange: (d: string) => void;
}

const createBlankDaily = (d: string): DailyEntry => ({
  date: d,
  wakeTime: '',
  sleepTime: '',
  hours: [
    { id: uid(), time: '09:00', task: '', done: false },
    { id: uid(), time: '11:00', task: '', done: false },
    { id: uid(), time: '14:00', task: '', done: false },
  ],
  subjects: [],
  teachback: '',
  notes: ''
});

// Helper to determine time section
const getTimeSection = (timeStr: string) => {
  const t = timeStr.trim().toLowerCase();
  let hour = 12; // default to afternoon if can't parse
  const match = t.match(/(\d+)/);
  if (match) {
    hour = parseInt(match[1], 10);
    if (t.includes('pm') && hour < 12) hour += 12;
    if (t.includes('am') && hour === 12) hour = 0;
  }
  
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

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

  const getSubjectColor = (subjectId: string, textSearch: string = '') => {
    // Generate a simple deterministic color class based on subject id or string match
    const colors = ['bg-[#8B6F9E]', 'bg-[#d27575]', 'bg-[#639c89]', 'bg-[#dfa145]', 'bg-[#6a87b8]', 'bg-[#b67a9f]'];
    if (subjectId) {
      const idx = subjects.findIndex(s => s.id === subjectId);
      return colors[Math.max(0, idx % colors.length)];
    }
    if (textSearch) {
      const subjMatch = subjects.findIndex(s => textSearch.toLowerCase().includes(s.name.toLowerCase()));
      if (subjMatch !== -1) return colors[subjMatch % colors.length];
    }
    return 'bg-[var(--ink-soft)]';
  };

  // Group hour blocks
  const morningBlocks = entry.hours.filter(h => getTimeSection(h.time) === 'Morning');
  const afternoonBlocks = entry.hours.filter(h => getTimeSection(h.time) === 'Afternoon');
  const eveningBlocks = entry.hours.filter(h => getTimeSection(h.time) === 'Evening');

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Date Header & Badges */}
      <div className="card !mb-0 !pt-2">
        <DateChipStrip currentDate={date} onDateSelect={onDateChange} />
        
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
          <div className="flex items-center gap-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-full px-3 py-1.5 flex-shrink-0">
            <CheckCircle2 size={14} className="text-[var(--ink-soft)]" />
            <span className="text-[0.75rem] font-sans font-bold text-[var(--ink)]">{entry.hours.filter(h => h.done).length} completed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-full px-3 py-1.5 flex-shrink-0">
            <Clock size={14} className="text-[var(--ink-soft)]" />
            <span className="text-[0.75rem] font-sans font-bold text-[var(--ink)]">{entry.hours.length} tasks</span>
          </div>
          {dueRevisits.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#fffdf7] border border-[var(--accent-line)]/50 rounded-full px-3 py-1.5 flex-shrink-0">
              <AlertCircle size={14} className="text-[var(--warn)]" />
              <span className="text-[0.75rem] font-sans font-bold text-[var(--warn)]">{dueRevisits.length} revisits due</span>
            </div>
          )}
        </div>
      </div>

      {/* Render Time Sections */}
      {[
        { title: 'Morning', icon: Sun, blocks: morningBlocks, color: 'text-[#d27575]' },
        { title: 'Afternoon', icon: CloudSun, blocks: afternoonBlocks, color: 'text-[#dfa145]' },
        { title: 'Evening', icon: Moon, blocks: eveningBlocks, color: 'text-[#6a87b8]' }
      ].map(section => (
        <div key={section.title} className="mb-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <section.icon size={16} className={`${section.color} opacity-80`} strokeWidth={2.5} />
            <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">{section.title}</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {section.blocks.length === 0 ? (
              <div className="text-[0.75rem] text-[var(--ink-soft)] italic px-2">No tasks</div>
            ) : (
              section.blocks.map(h => (
                <div key={h.id} className="flex items-stretch gap-3">
                  {/* Left Timeline */}
                  <div className="w-[45px] flex-shrink-0 flex flex-col items-end pt-1.5 relative">
                    <span className="font-sans text-[0.75rem] font-bold text-[var(--ink-soft)] tracking-tight">{h.time}</span>
                  </div>
                  
                  {/* Right Card */}
                  <div className={`flex-1 bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 flex items-start gap-3 shadow-sm transition-all hover:shadow-md ${h.done ? 'opacity-60' : ''}`}>
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        checked={h.done} 
                        onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, done: e.target.checked } : hx) })}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-h-[28px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getSubjectColor('', h.task)}`}></div>
                        <input 
                          type="text" 
                          value={h.task} 
                          placeholder="Task name..."
                          onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, task: e.target.value } : hx) })}
                          className={`!bg-transparent !border-0 !p-0 font-sans font-bold text-[0.9rem] text-[var(--ink)] focus:!ring-0 placeholder-[var(--ink-soft)] w-full ${h.done ? 'line-through' : ''}`}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <input 
                          type="text" 
                          value={h.time} 
                          onChange={e => updateEntry({ hours: entry.hours.map(hx => hx.id === h.id ? { ...hx, time: e.target.value } : hx) })}
                          className="!bg-[var(--paper)] !border !border-[var(--line)] !rounded-lg !text-[0.65rem] !font-sans !font-bold !text-[var(--ink-soft)] !px-1.5 !py-0.5 !w-[60px] !h-auto focus:!border-[var(--accent)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      <button className="text-[var(--accent)] text-sm font-sans font-bold px-2 flex items-center gap-1" onClick={() => {
        updateEntry({ hours: [...entry.hours, { id: uid(), time: 'custom', task: '', done: false }] });
      }}>+ Add task block</button>

      {/* Subject Logs */}
      <div className="mt-4 mb-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <BookOpen size={16} className="text-[var(--accent)] opacity-80" strokeWidth={2.5} />
          <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">Subject Logs</h3>
        </div>
        
        {entry.subjects.length === 0 ? (
          <div className="text-[0.75rem] text-[var(--ink-soft)] italic px-2">No subjects logged today.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {entry.subjects.map((s, idx) => (
              <div key={s.id} className="bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-4 shadow-sm relative">
                <div className="absolute top-4 right-4">
                   <div className={`w-3 h-3 rounded-full ${getSubjectColor(s.subjectId)} shadow-sm`}></div>
                </div>
                <div className="flex gap-4 flex-wrap mb-4 pr-6">
                  <div className="flex-1 min-w-[140px]">
                    <label className="!text-[0.7rem] !mb-1">Subject</label>
                    <select value={s.subjectId} onChange={e => updateSubjectLog(s.id, { subjectId: e.target.value, lessonId: '' })} className="!text-sm !py-1.5">
                      <option value="">-- subject --</option>
                      {subjects.map(subj => <option key={subj.id} value={subj.id}>{subj.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="!text-[0.7rem] !mb-1">Lesson</label>
                    <select value={s.lessonId} onChange={e => updateSubjectLog(s.id, { lessonId: e.target.value })} className="!text-sm !py-1.5">
                      <option value="">-- lesson --</option>
                      {s.subjectId && lessons.filter(l => l.subjectId === s.subjectId).map(l => (
                        <option key={l.id} value={l.id}>{l.name} {l.done ? '✓' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center mt-2 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-0">
                    <input type="checkbox" checked={s.studied} onChange={e => updateSubjectLog(s.id, { studied: e.target.checked })} className="w-4 h-4" />
                    <span className="mt-0.5 text-sm font-sans font-medium text-[var(--ink)]">Studied</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mb-0">
                    <input type="checkbox" checked={s.pastPaper} onChange={e => updateSubjectLog(s.id, { pastPaper: e.target.checked })} className="w-4 h-4" />
                    <span className="mt-0.5 text-sm font-sans font-medium text-[var(--ink)]">Past paper</span>
                  </label>
                </div>
                <div className="mt-2 pt-3 border-t border-dashed border-[var(--line)]">
                  <label className="!text-[0.7rem] !mb-2">Confidence Rating</label>
                  <div className="flex gap-2">
                    {(['L', 'M', 'H'] as const).map(level => (
                      <button 
                        key={level}
                        type="button"
                        onClick={() => updateSubjectLog(s.id, { confidence: level })}
                        className={`font-sans font-bold text-[0.8rem] w-[32px] h-[32px] rounded-full border cursor-pointer transition-colors
                          ${s.confidence === level ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm' : 'bg-[var(--paper)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)]'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="text-[var(--accent)] text-sm font-sans font-bold px-2 mt-3 flex items-center gap-1" onClick={addSubjectLog}>+ Add subject log</button>
      </div>

      {/* Revisits */}
      <div className="mt-4 mb-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <AlertCircle size={16} className="text-[var(--warn)] opacity-80" strokeWidth={2.5} />
          <h3 className="font-sans font-bold text-[0.8rem] text-[var(--ink-soft)] uppercase tracking-wider">Revisits due today</h3>
        </div>
        
        {dueRevisits.length === 0 ? (
          <div className="text-[0.75rem] text-[var(--ink-soft)] italic px-2">Nothing due today.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {dueRevisits.map(r => {
              const subject = subjects.find(s => s.id === r.subjectId);
              const lesson = lessons.find(l => l.id === r.lessonId);
              return (
                <div key={r.id} className={`bg-[#fffdf7] border border-[var(--line)] rounded-[16px] p-3 flex items-start gap-3 shadow-sm transition-all hover:shadow-md ${r.done ? 'opacity-60' : ''}`}>
                  <div className="pt-0.5">
                    <input type="checkbox" checked={r.done} onChange={(e) => updateRevisit(r.id, { done: e.target.checked })} className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getSubjectColor(r.subjectId)}`}></div>
                      <div className={`font-sans font-bold text-[0.9rem] text-[var(--ink)] leading-tight ${r.done ? 'line-through' : ''}`}>
                        {subject?.name} — {lesson?.name}
                      </div>
                    </div>
                    <div className="mt-1.5 flex">
                      <span className="tag bg-[#fef2f2] text-[#d27575] border-[#fecaca] px-2 py-0.5 rounded-md">{r.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes & Summaries */}
      <div className="mt-4 card !mb-0 shadow-sm border border-[var(--line)]">
        <h2 className="section !text-sm">Teach-back summary</h2>
        <textarea 
          className="mb-4 !bg-transparent border border-[var(--line)] focus:border-[var(--accent)] transition-colors rounded-xl min-h-[80px]"
          value={entry.teachback} 
          onChange={e => updateEntry({ teachback: e.target.value })} 
          placeholder="Write 3-4 lines from memory..."
        />
        <h2 className="section !text-sm mt-2">Notes / fix tomorrow</h2>
        <textarea 
          className="!bg-transparent border border-[var(--line)] focus:border-[var(--accent)] transition-colors rounded-xl min-h-[80px]"
          value={entry.notes} 
          onChange={e => updateEntry({ notes: e.target.value })} 
          placeholder="Any areas of struggle?"
        />
      </div>
      
      {/* Floating Save Button */}
      <div className="fixed bottom-[84px] left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-end">
          <button className="btn shadow-lg px-6 py-3 text-[0.9rem] rounded-full flex items-center justify-center gap-2 pointer-events-auto" onClick={handleSave}>
            Save Changes {saveMsg && <span className="font-sans font-normal opacity-90">{saveMsg}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
