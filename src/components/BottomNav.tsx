import React from 'react';
import { CalendarDays, BarChart2, ListTodo, BookOpen, Plus } from 'lucide-react';
import { useNavigation, Tab } from '../navigation';

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'revisit', label: 'Revisit', icon: ListTodo },
  { id: 'lessons', label: 'Lessons', icon: BookOpen },
];

export const BottomNav: React.FC = () => {
  const { tab, setTab, activeSubjectId, openOverlay, activeOverlay } = useNavigation();

  // If a full-screen overlay or modal is active, do not render the floating bottom bar
  if (activeOverlay) {
    return null;
  }

  // Quick Action triggered by the floating accent circular button
  const handleQuickAction = () => {
    if (tab === 'calendar') {
      openOverlay('calendar-add-task');
    } else if (tab === 'lessons') {
      if (activeSubjectId) {
        openOverlay('curriculum-add-lesson');
      } else {
        openOverlay('curriculum-add-subject');
      }
    } else if (tab === 'revisit') {
      openOverlay('calendar-add-task');
    } else if (tab === 'stats') {
      openOverlay('calendar-add-task');
    }
  };

  const getQuickActionTitle = () => {
    if (tab === 'calendar') return 'Add task or study log';
    if (tab === 'lessons') return activeSubjectId ? 'Add lesson' : 'Add subject';
    if (tab === 'revisit') return 'Add revision task';
    return 'Quick add';
  };

  return (
    <div
      id="bottom-navigation-cluster"
      className="fixed bottom-5 sm:bottom-6 left-0 right-0 z-40 pointer-events-none flex justify-center px-3.5 sm:px-4"
    >
      <div className="w-full max-w-[420px] flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        {/* Main Dark Nav Pill */}
        <nav
          id="main-nav-pill"
          aria-label="Main Navigation"
          className="flex-1 bg-[#111111] border border-[#262626] rounded-full h-[78px] sm:h-[84px] p-2.5 sm:p-3 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-md"
        >
          {TABS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => setTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#262626] text-[#FFFFFF] rounded-full px-4 sm:px-5 h-full shadow-xs'
                    : 'flex-1 text-[#8A8A8A] hover:text-[#FFFFFF] h-full px-2.5 sm:px-3 rounded-full active:scale-95'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.5 : 2.1}
                    className={`transition-colors ${isActive ? 'text-[#FFFFFF]' : 'text-[#8A8A8A] group-hover:text-[#FFFFFF]'}`}
                  />
                  {isActive && (
                    <span className="font-bold text-sm sm:text-[15px] tracking-tight text-[#FFFFFF] whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Floating Accent Circular Button: aligned height, positioned outside/right of nav pill */}
        <button
          id="floating-quick-action-btn"
          type="button"
          onClick={handleQuickAction}
          title={getQuickActionTitle()}
          aria-label={getQuickActionTitle()}
          className="h-[78px] w-[78px] sm:h-[84px] sm:w-[84px] rounded-full aspect-square flex-shrink-0 flex items-center justify-center bg-[#111111] text-[#FFFFFF] border border-[#262626] shadow-[0_16px_40px_rgba(0,0,0,0.32)] hover:bg-[#262626] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#111111]/30"
        >
          <Plus size={32} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
};
