import React from 'react';
import { BookOpen, ListTodo, CalendarDays, BarChart2 } from 'lucide-react';
import { CalendarTab } from './components/CalendarTab';
import { StatsTab } from './components/StatsTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';
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

        {/* Bottom Navigation: Clean Black & White */}
        <nav className="fixed bottom-4 left-4 right-4 max-w-[416px] mx-auto bg-white/95 backdrop-blur-md border border-[#EAEAEA] rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] z-50 py-1.5 px-3">
          <div className="flex justify-between items-center">
            <button 
              className={`nav-btn ${tab === 'calendar' ? 'active !text-[#1A1A1A]' : '!text-[#8A8A8A]'}`}
              onClick={() => setTab('calendar')}
            >
              <CalendarDays size={22} strokeWidth={tab === 'calendar' ? 2.5 : 2} />
              <span className={tab === 'calendar' ? 'font-bold text-[#1A1A1A]' : 'font-medium'}>Calendar</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'stats' ? 'active !text-[#1A1A1A]' : '!text-[#8A8A8A]'}`}
              onClick={() => setTab('stats')}
            >
              <BarChart2 size={22} strokeWidth={tab === 'stats' ? 2.5 : 2} />
              <span className={tab === 'stats' ? 'font-bold text-[#1A1A1A]' : 'font-medium'}>Stats</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'revisit' ? 'active !text-[#1A1A1A]' : '!text-[#8A8A8A]'}`}
              onClick={() => setTab('revisit')}
            >
              <ListTodo size={22} strokeWidth={tab === 'revisit' ? 2.5 : 2} />
              <span className={tab === 'revisit' ? 'font-bold text-[#1A1A1A]' : 'font-medium'}>Revisit</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'lessons' ? 'active !text-[#1A1A1A]' : '!text-[#8A8A8A]'}`}
              onClick={() => setTab('lessons')}
            >
              <BookOpen size={22} strokeWidth={tab === 'lessons' ? 2.5 : 2} />
              <span className={tab === 'lessons' ? 'font-bold text-[#1A1A1A]' : 'font-medium'}>Lessons</span>
            </button>
          </div>
        </nav>
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
