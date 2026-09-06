import React, { useState } from 'react';
import { useStore } from '../store';

export const LessonsTab = () => {
  const { subjects, addSubject, lessons, addLesson, updateLesson, markLessonDone } = useStore();
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjTarget, setNewSubjTarget] = useState('');
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [newLessonName, setNewLessonName] = useState('');

  const handleAddSubject = () => {
    if (newSubjName.trim()) {
      addSubject({
        name: newSubjName.trim(),
        targetCount: newSubjTarget ? parseInt(newSubjTarget, 10) : undefined
      });
      setNewSubjName('');
      setNewSubjTarget('');
    }
  };

  const handleAddLesson = () => {
    if (newLessonName.trim() && selectedSubjectId) {
      addLesson({
        subjectId: selectedSubjectId,
        name: newLessonName.trim()
      });
      setNewLessonName('');
    }
  };

  return (
    <div>
      <div className="card">
        <h2 className="section">Progress</h2>
        {subjects.length === 0 ? (
          <div className="empty-note">No subjects yet. Add one below to start tracking.</div>
        ) : (
          subjects.map(subj => {
            const subjLessons = lessons.filter(l => l.subjectId === subj.id);
            const doneCount = subjLessons.filter(l => l.done).length;
            const target = subj.targetCount || (subjLessons.length > 0 ? subjLessons.length : 1);
            const pct = Math.min(100, Math.round((doneCount / target) * 100));

            return (
              <div key={subj.id} className="flex items-center gap-2 mb-2.5">
                <span className="w-[110px] truncate" title={subj.name}>{subj.name}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="font-architects text-sm w-[70px] text-right">
                  {doneCount} / {subj.targetCount || (subjLessons.length > 0 ? subjLessons.length : '-')}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2 className="section">Manage Subjects</h2>
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[140px]">
            <label>Subject Name</label>
            <input type="text" value={newSubjName} onChange={e => setNewSubjName(e.target.value)} placeholder="e.g. Physics" />
          </div>
          <div className="w-[100px]">
            <label>Target Lessons</label>
            <input type="number" value={newSubjTarget} onChange={e => setNewSubjTarget(e.target.value)} placeholder="63" />
          </div>
          <div>
            <button className="btn" onClick={handleAddSubject} disabled={!newSubjName.trim()}>Add Subject</button>
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="card">
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="max-w-[200px] flex-1">
              <label>Select Subject</label>
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                <option value="">-- choose subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {selectedSubjectId && (
            <>
              <div className="flex flex-wrap gap-2 items-end mb-4">
                <div className="flex-1 min-w-[200px]">
                  <input type="text" value={newLessonName} onChange={e => setNewLessonName(e.target.value)} placeholder="Lesson Name" />
                </div>
                <button className="btn" onClick={handleAddLesson} disabled={!newLessonName.trim()}>Add Lesson</button>
              </div>

              <div className="max-h-[340px] overflow-y-auto border-[1.5px] border-[var(--line)] rounded-[5px] p-2 bg-[#fffdf7]">
                {lessons.filter(l => l.subjectId === selectedSubjectId).length === 0 ? (
                  <div className="empty-note text-center p-4">No lessons added for this subject yet.</div>
                ) : (
                  lessons.filter(l => l.subjectId === selectedSubjectId).map(lesson => (
                    <div key={lesson.id} className="flex items-center gap-2 py-1 border-b border-dotted border-[var(--line)] last:border-0">
                      <input 
                        type="checkbox" 
                        checked={lesson.done} 
                        onChange={(e) => {
                          if (e.target.checked && !lesson.done) {
                            markLessonDone(lesson.id, lesson.confidence, new Date().toISOString().slice(0, 10));
                          } else if (!e.target.checked) {
                            updateLesson(lesson.id, { done: false, completedDate: null });
                          }
                        }}
                      />
                      <input 
                        type="text" 
                        value={lesson.name} 
                        onChange={e => updateLesson(lesson.id, { name: e.target.value })}
                        className="flex-1 border-none bg-transparent text-[0.95rem] focus:bg-white focus:ring-1 focus:ring-[var(--accent-line)] p-1 rounded"
                      />
                      <select 
                        className="w-[60px] px-1 py-0.5 text-[0.8rem]" 
                        value={lesson.confidence || ''}
                        onChange={e => updateLesson(lesson.id, { confidence: (e.target.value as any) || null })}
                      >
                        <option value="">-</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="H">H</option>
                      </select>
                      <span className="text-[0.75rem] text-[var(--ink-soft)] w-[90px] inline-block text-right">
                        {lesson.completedDate || ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
