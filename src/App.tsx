import React from 'react';
import { CalendarTab } from './components/CalendarTab';
import { StatsTab } from './components/StatsTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';
import { BottomNav, DesktopNavRail, useQuickAddAction } from './components/BottomNav';
import { NavigationProvider, useNavigation } from './navigation';
import { useStore } from './store';
import { ArrowLeft, Plus } from 'lucide-react';

function AppContent() {
  const { tab, setTab, activeSubjectId, closeSubject } = useNavigation();
  const { subjects } = useStore();
  const quickAdd = useQuickAddAction();

  const activeSubject =
    tab === 'lessons' && activeSubjectId
      ? subjects.find((s) => s.id === activeSubjectId)
      : undefined;

  const getHeaderTitle = () => {
    if (tab === 'calendar') return 'Today';
    if (tab === 'lessons') return activeSubject ? activeSubject.name : 'Curriculum';
    if (tab === 'revisit') return 'Spaced Repetition';
    return 'Stats';
  };

  return (
    <div className="h-[100dvh] min-h-screen bg-[#F7F7F5] text-[#111111] relative font-sans antialiased overflow-hidden flex flex-col md:flex-row">
      {/* Persistent Desktop / Tablet Left Navigation Rail */}
      <DesktopNavRail />

      {/* Main Responsive Viewport */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#F7F7F5]">
        {/* Mobile Sticky Compact Header (56px) */}
        <header className="md:hidden sticky top-0 z-30 h-14 px-4 bg-[#F7F7F5]/94 backdrop-blur-md border-b border-[#EFEFEA] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeSubject && (
              <button
                type="button"
                onClick={closeSubject}
                aria-label="Back to Curriculum"
                className="w-9 h-9 -ml-1.5 rounded-xl flex items-center justify-center text-[#111111] hover:bg-[#EFEFEA] transition-colors cursor-pointer flex-shrink-0"
              >
                <ArrowLeft size={18} strokeWidth={2.3} />
              </button>
            )}
            <h1 className="font-sans text-lg font-extrabold text-[#111111] tracking-tight truncate m-0">
              {getHeaderTitle()}
            </h1>
          </div>

          <button
            type="button"
            onClick={quickAdd.trigger}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] active:scale-[0.97] transition-all text-xs font-sans font-bold inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{quickAdd.label}</span>
          </button>
        </header>

        {/* Scrollable Content Region */}
        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="max-w-5xl lg:max-w-6xl mx-auto w-full px-4 md:px-7 lg:px-8 pt-4 md:pt-7 pb-24 md:pb-10 flex flex-col">
            {/* Desktop Clean Top Bar (for non-subject views; SubjectLessonList renders its own back header on desktop) */}
            {!(tab === 'lessons' && activeSubject) && (
              <div className="hidden md:flex items-center justify-between gap-4 mb-6">
                <h1 className="font-sans text-2xl lg:text-[1.85rem] font-extrabold text-[#111111] tracking-tight m-0">
                  {getHeaderTitle()}
                </h1>
                <button
                  type="button"
                  onClick={quickAdd.trigger}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] active:scale-[0.98] transition-all text-xs font-sans font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.4} />
                  <span>{quickAdd.label}</span>
                </button>
              </div>
            )}

            {tab === 'calendar' && <CalendarTab onNavigateToRevisit={() => setTab('revisit')} />}
            {tab === 'stats' && <StatsTab />}
            {tab === 'revisit' && <RevisitTab />}
            {tab === 'lessons' && <LessonsTab />}
          </div>
        </main>
      </div>

      {/* Sleek Mobile Docked Bottom Tab Bar */}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
