import React, { useState } from 'react';
import { StoreProvider } from './store';
import { MonthlyTab } from './components/MonthlyTab';
import { WeeklyTab } from './components/WeeklyTab';
import { DailyTab } from './components/DailyTab';
import { RevisitTab } from './components/RevisitTab';
import { LessonsTab } from './components/LessonsTab';

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

  return (
    <div className="max-w-[1100px] mx-auto">
      <h1>A/L Study Tracker</h1>
      <p className="sub-title">Your complete digital study notebook</p>

      <div className="flex justify-center gap-2 mb-5 flex-wrap">
        {[
          { id: 'monthly', label: 'Monthly' },
          { id: 'weekly', label: 'Weekly' },
          { id: 'daily', label: 'Daily' },
          { id: 'revisit', label: 'Revisit List' },
          { id: 'lessons', label: 'Lessons' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`font-patrick text-[1rem] py-2 px-4 rounded-[6px] border-[2px] border-[#cfc4a6] bg-[var(--paper)] cursor-pointer transition-colors ${
              activeTab === tab.id ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'hover:bg-[#ebe5d6]'
            }`}
            onClick={() => setActiveTab(tab.id as Tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {renderTab()}
      </div>
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
