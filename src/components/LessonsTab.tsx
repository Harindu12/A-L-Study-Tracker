import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { CurriculumDashboard } from './curriculum/CurriculumDashboard';
import { SubjectLessonList } from './curriculum/SubjectLessonList';

export const LessonsTab: React.FC = () => {
  const { subjects } = useStore();
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // If active subject was deleted, return to dashboard
  useEffect(() => {
    if (activeSubjectId && !subjects.some((s) => s.id === activeSubjectId)) {
      setActiveSubjectId(null);
    }
  }, [activeSubjectId, subjects]);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  const handleSelectSubject = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveSubjectId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-6">
      {activeSubject ? (
        <SubjectLessonList
          subject={activeSubject}
          onBack={handleBackToDashboard}
        />
      ) : (
        <CurriculumDashboard onSelectSubject={handleSelectSubject} />
      )}
    </div>
  );
};

