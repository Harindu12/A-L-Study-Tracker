import React, { useState } from 'react';
import { StoreProvider } from './store';
import { MonthlyTab } from './components/MonthlyTab';
import { WeeklyTab } from './components/WeeklyTab';
import { DailyTab } from './components/DailyTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';
import { PWAInstallButton } from './components/PWAInstallButton';
import { CalendarDays, Calendar, Sun, ListTodo, BookOpen } from 'lucide-react';

type Tab = 'monthly' | 'weekly' | 'daily' | 'revisit' | 'lessons';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  const renderTab = () => {
    switch (activeTab) {
      case 'monthly': return <MonthlyTab />;
      case 'weekly': return <WeeklyTab />;
      case 'daily': return <DailyTab />;
      case 'revisit': return <RevisitTab />;
      case 'lessons': return <LessonsTab />;
      default: return null;
    }
  };

  const navItems = [
    { id: 'monthly', label: 'Monthly', icon: CalendarDays },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'daily', label: 'Daily', icon: Sun },
    { id: 'revisit', label: 'Revisits', icon: ListTodo },
    { id: 'lessons', label: 'Lessons', icon: BookOpen }
  ];

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-[1100px] mx-auto pt-6 pb-32 px-4">
      <header className="flex items-center justify-between px-2 mb-6">
        <div>
          <p className="text-[var(--ink-soft)] text-sm font-sans font-medium mb-1">{getGreeting()}!</p>
          <h1 className="text-[2rem] font-caveat text-[var(--ink)] m-0 leading-none">{dateStr}</h1>
        </div>
        <PWAInstallButton />
      </header>

      <div className="mt-4">
        {renderTab()}
      </div>

      <nav className="fixed bottom-6 left-6 right-6 h-[72px] bg-white rounded-full flex justify-around items-center px-2 z-50 shadow-[0_16px_40px_rgba(139,111,158,0.15)] border border-[var(--accent-line)]/20 pb-0">
        {navItems.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-out ${
                isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)] scale-105' : 'bg-transparent text-[var(--ink-soft)] hover:bg-[#fffdf7]'
              }`}
            >
              <Icon size={isActive ? 24 : 22} className={isActive ? 'stroke-2' : 'stroke-[1.5]'} />
              {!isActive && <span className="font-sans text-[10px] font-medium leading-none mt-1">{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
