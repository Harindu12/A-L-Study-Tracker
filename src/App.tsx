import React, { useState, useEffect } from 'react';
import { BookOpen, ListTodo, CalendarDays, BarChart2 } from 'lucide-react';
import { CalendarTab } from './components/CalendarTab';
import { StatsTab } from './components/StatsTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';
import { useStore } from './store';

type Tab = 'calendar' | 'stats' | 'revisit' | 'lessons';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');

  return (
    <div className="min-h-screen bg-[var(--paper)] bg-[radial-gradient(var(--dot)_1.5px,transparent_1.5px)] [background-size:24px_24px] relative">
      <div className="max-w-md mx-auto min-h-screen relative shadow-[0_12px_40px_rgba(120,100,70,0.14)] bg-[var(--paper)] border-x border-[var(--line)]/40 overflow-hidden flex flex-col">
        {/* Header - only for other tabs; CalendarTab renders the reference header */}
        {activeTab !== 'calendar' && (
          <header className="pt-10 pb-4 px-6 relative z-10">
            <div className="flex justify-center items-center">
              <h1 className="font-caveat text-4xl font-bold text-[var(--accent)] tracking-wide">
                {activeTab === 'stats' && 'Analytics'}
                {activeTab === 'revisit' && 'Spaced Repetition'}
                {activeTab === 'lessons' && 'Curriculum'}
              </h1>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto px-4 pb-32 relative z-10 scrollbar-hide ${activeTab === 'calendar' ? 'pt-6' : ''}`}>
          {activeTab === 'calendar' && <CalendarTab onNavigateToRevisit={() => setActiveTab('revisit')} />}
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'revisit' && <RevisitTab />}
          {activeTab === 'lessons' && <LessonsTab />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 max-w-[416px] mx-auto bg-[#FAF7F0]/95 backdrop-blur-md border border-[var(--line)] rounded-[24px] shadow-[0_8px_25px_rgba(120,100,70,0.12)] z-50 p-1.5">
          <div className="flex justify-between items-center px-2">
            <button 
              className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <CalendarDays size={24} strokeWidth={2.5} />
              <span>Calendar</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart2 size={24} strokeWidth={2.5} />
              <span>Stats</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'revisit' ? 'active' : ''}`}
              onClick={() => setActiveTab('revisit')}
            >
              <ListTodo size={24} strokeWidth={2.5} />
              <span>Revisit</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
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

export default App;
