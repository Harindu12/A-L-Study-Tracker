import React, { useEffect } from 'react';
import { useStore } from '../store';
import { CurriculumDashboard } from './curriculum/CurriculumDashboard';
import { SubjectLessonList } from './curriculum/SubjectLessonList';
import { useNavigation } from '../navigation';

export const LessonsTab: React.FC = () => {
  const { subjects } = useStore();
  const { activeSubjectId, openSubject, closeSubject } = useNavigation();

  // If active subject was deleted, return to dashboard
  useEffect(() => {
    if (activeSubjectId && !subjects.some((s) => s.id === activeSubjectId)) {
      closeSubject();
    }
  }, [activeSubjectId, subjects, closeSubject]);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  const handleSelectSubject = (subjectId: string) => {
    openSubject(subjectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    closeSubject();
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

