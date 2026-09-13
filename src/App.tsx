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
    <div className="min-h-screen bg-[var(--paper)] bg-[radial-gradient(var(--dot)_1.5px,transparent_1.5px)] [background-size:24px_24px] relative">
      <div className="max-w-md mx-auto min-h-screen relative shadow-[0_12px_40px_rgba(120,100,70,0.14)] bg-[var(--paper)] border-x border-[var(--line)]/40 overflow-hidden flex flex-col">
        {/* Header - only for stats and revisit; Calendar and Lessons render their own headers */}
        {tab !== 'calendar' && tab !== 'lessons' && (
          <header className="pt-10 pb-4 px-6 relative z-10">
            <div className="flex justify-center items-center">
              <h1 className="font-caveat text-4xl font-bold text-[var(--accent)] tracking-wide">
                {tab === 'stats' && 'Analytics'}
                {tab === 'revisit' && 'Spaced Repetition'}
              </h1>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto px-4 pb-32 relative z-10 scrollbar-hide ${tab === 'calendar' || tab === 'lessons' ? 'pt-6' : ''}`}>
          {tab === 'calendar' && <CalendarTab onNavigateToRevisit={() => setTab('revisit')} />}
          {tab === 'stats' && <StatsTab />}
          {tab === 'revisit' && <RevisitTab />}
          {tab === 'lessons' && <LessonsTab />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 max-w-[416px] mx-auto bg-[#FAF7F0]/95 backdrop-blur-md border border-[var(--line)] rounded-[24px] shadow-[0_8px_25px_rgba(120,100,70,0.12)] z-50 p-1.5">
          <div className="flex justify-between items-center px-2">
            <button 
              className={`nav-btn ${tab === 'calendar' ? 'active' : ''}`}
              onClick={() => setTab('calendar')}
            >
              <CalendarDays size={24} strokeWidth={2.5} />
              <span>Calendar</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'stats' ? 'active' : ''}`}
              onClick={() => setTab('stats')}
            >
              <BarChart2 size={24} strokeWidth={2.5} />
              <span>Stats</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'revisit' ? 'active' : ''}`}
              onClick={() => setTab('revisit')}
            >
              <ListTodo size={24} strokeWidth={2.5} />
              <span>Revisit</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'lessons' ? 'active' : ''}`}
              onClick={() => setTab('lessons')}
            >
              <BookOpen size={24} strokeWidth={2.5} />
              <span>Lessons</span>
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
