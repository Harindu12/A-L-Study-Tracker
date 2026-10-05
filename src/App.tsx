import React from 'react';
import { CalendarTab } from './components/CalendarTab';
import { StatsTab } from './components/StatsTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';
import { BottomNav } from './components/BottomNav';
import { NavigationProvider, useNavigation } from './navigation';

function AppContent() {
  const { tab, setTab } = useNavigation();

  return (
    <div className="h-[100dvh] min-h-screen bg-[#FAFAFA] text-[#111111] relative font-sans antialiased overflow-hidden flex flex-col">
      <div className="max-w-md mx-auto w-full h-full relative bg-[#FAFAFA] border-x border-[#E0E0E0] flex flex-col overflow-hidden">
        {/* Header - only for stats and revisit; Calendar and Lessons render their own headers */}
        {tab !== 'calendar' && tab !== 'lessons' && (
          <header className="pt-8 pb-3 px-6 relative z-10 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight m-0">
                {tab === 'stats' && 'Analytics'}
                {tab === 'revisit' && 'Spaced Repetition'}
              </h1>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 min-h-0 relative z-10 flex flex-col ${
            tab === 'calendar'
              ? 'overflow-hidden px-4 pt-5'
              : 'overflow-y-auto px-4 pb-44 scrollbar-hide' + (tab === 'lessons' ? ' pt-5' : '')
          }`}
        >
          {tab === 'calendar' && <CalendarTab onNavigateToRevisit={() => setTab('revisit')} />}
          {tab === 'stats' && <StatsTab />}
          {tab === 'revisit' && <RevisitTab />}
          {tab === 'lessons' && <LessonsTab />}
        </main>

        {/* Floating Bottom Navigation Cluster */}
        <BottomNav />
      </div>
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
