import React from 'react';
import { CalendarDays, BarChart2, RotateCcw, BookOpen, Plus } from 'lucide-react';
import { useNavigation, Tab } from '../navigation';

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'revisit', label: 'Revisit', icon: RotateCcw },
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
      className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 pointer-events-none flex justify-center px-3.5 sm:px-4"
    >
      <div className="w-full max-w-[420px] flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        {/* Main Nav Bar containing 4 items (Matching squircle shape of highlight) */}
        <nav
          id="main-nav-pill"
          aria-label="Main Navigation"
          className="flex-1 bg-[#111111] border border-[#262626] rounded-[26px] h-[70px] sm:h-[74px] px-2 py-1.5 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl"
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
                className="flex-1 flex items-center justify-center h-full transition-all duration-150 cursor-pointer select-none group focus:outline-none active:scale-95 px-0.5"
              >
                {/* Active Highlight Container: Highlights BOTH the icon and the text */}
                <div
                  className={`w-full max-w-[74px] sm:max-w-[78px] h-[56px] sm:h-[60px] rounded-[20px] flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2A2A2A] text-[#FFFFFF] shadow-2xs'
                      : 'text-[#8A8A8A] group-hover:bg-[#1A1A1A] group-hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-colors"
                  />
                  <span
                    className={`text-[11px] font-sans tracking-tight text-center leading-none transition-colors ${
                      isActive
                        ? 'text-[#FFFFFF] font-bold'
                        : 'text-[#8A8A8A] font-medium group-hover:text-[#FFFFFF]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Floating Quick Action Button: Matching squircle shape of the bar and highlight */}
        <button
          id="floating-quick-action-btn"
          type="button"
          onClick={handleQuickAction}
          title={getQuickActionTitle()}
          aria-label={getQuickActionTitle()}
          className="h-[70px] w-[70px] sm:h-[74px] sm:w-[74px] rounded-[26px] aspect-square flex-shrink-0 flex items-center justify-center bg-[#111111] text-[#FFFFFF] border border-[#262626] shadow-[0_16px_40px_rgba(0,0,0,0.38)] hover:bg-[#1F1F1F] hover:scale-[1.03] active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#111111]/30"
        >
          <Plus size={28} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};
