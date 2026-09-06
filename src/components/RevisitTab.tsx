import React from 'react';
import { useStore } from '../store';
import { todayStr } from '../utils';

export const RevisitTab = () => {
  const { revisits, subjects, lessons, updateRevisit } = useStore();
  
  const today = todayStr();
  
  const pendingRevisits = revisits
    .filter(r => !r.done)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="card overflow-x-auto">
      <h2 className="section">All pending revisits</h2>
      {pendingRevisits.length === 0 ? (
        <div className="empty-note">
          No pending revisits yet — mark lessons complete in the Lessons tab or Daily view to generate them.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Subject</th>
              <th>Lesson</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendingRevisits.map(r => {
              const overdue = r.date < today;
              const subject = subjects.find(s => s.id === r.subjectId);
              const lesson = lessons.find(l => l.id === r.lessonId);
              
              return (
                <tr key={r.id}>
                  <td>
                    {r.date} {overdue && <span className="tag overdue ml-2">overdue</span>}
                  </td>
                  <td>{subject?.name || 'Unknown Subject'}</td>
                  <td>{lesson?.name || 'Unknown Lesson'}</td>
                  <td>{r.type}</td>
                  <td>
                    <button className="btn ghost" onClick={() => updateRevisit(r.id, { done: true })}>
                      Mark done
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
