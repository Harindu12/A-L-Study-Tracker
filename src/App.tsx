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

  return (
    <div className="max-w-[1100px] mx-auto pt-16 pb-20 px-2">
      <header className="fixed top-0 left-0 right-0 h-14 bg-[var(--paper)] border-b-[1.5px] border-[var(--line)] flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-[1.5rem] m-0 leading-tight">A/L Study Tracker</h1>
          <p className="sub-title text-left mt-[-2px]">Your digital study notebook</p>
        </div>
        <PWAInstallButton />
      </header>

      <div className="mt-2">
        {renderTab()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--paper)] border-t-[1.5px] border-[var(--line)] flex justify-between items-center px-1 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        {navItems.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)]'
              }`}
            >
              <Icon size={22} className={isActive ? 'stroke-2' : 'stroke-[1.5]'} />
              <span className="font-patrick text-[0.75rem] leading-none">{tab.label}</span>
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
