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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] relative font-sans antialiased">
      <div className="max-w-md mx-auto min-h-screen relative bg-[#FAFAFA] border-x border-[#EAEAEA] flex flex-col">
        {/* Header - only for stats and revisit; Calendar and Lessons render their own headers */}
        {tab !== 'calendar' && tab !== 'lessons' && (
          <header className="pt-8 pb-3 px-6 relative z-10">
            <div className="flex justify-between items-center">
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight m-0">
                {tab === 'stats' && 'Analytics'}
                {tab === 'revisit' && 'Spaced Repetition'}
              </h1>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto px-4 pb-32 relative z-10 scrollbar-hide ${tab === 'calendar' || tab === 'lessons' ? 'pt-5' : ''}`}>
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
