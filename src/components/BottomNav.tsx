import React from 'react';
import { CalendarDays, BarChart2, RotateCcw, BookOpen, Plus } from 'lucide-react';
import { useNavigation, Tab } from '../navigation';
import { useStore } from '../store';
import { todayStr } from '../utils';
import { PWAInstallButton } from './PWAInstallButton';

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'calendar', label: 'Today', icon: CalendarDays },
  { id: 'lessons', label: 'Curriculum', icon: BookOpen },
  { id: 'revisit', label: 'Revisit', icon: RotateCcw },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
];

export function useDueRevisitsCount(): number {
  const { revisits, lessons } = useStore();
  const today = todayStr();
  return revisits.filter(
    (r) => !r.done && r.date <= today && lessons.some((l) => l.id === r.lessonId)
  ).length;
}

export function useQuickAddAction() {
  const { tab, activeSubjectId, openOverlay, openTabOverlay } = useNavigation();

  const label =
    tab === 'lessons' ? (activeSubjectId ? 'Add Lesson' : 'Add Subject') : 'Add Task';

  const trigger = () => {
    if (tab === 'calendar') {
      openOverlay('calendar-add-task');
    } else if (tab === 'lessons') {
      openOverlay(activeSubjectId ? 'curriculum-add-lesson' : 'curriculum-add-subject');
    } else {
      openTabOverlay('calendar', 'calendar-add-task');
    }
  };

  return { label, trigger };
}

export const DesktopNavRail: React.FC = () => {
  const { tab, setTab } = useNavigation();
  const dueCount = useDueRevisitsCount();
  const quickAdd = useQuickAddAction();

  return (
    <aside
      aria-label="Primary Sidebar Navigation"
      className="hidden md:flex flex-col justify-between w-[228px] lg:w-[248px] flex-shrink-0 bg-[#FFFDF9] border-r border-[#E4E0D8] px-4 py-6 select-none"
    >
      <div className="flex flex-col gap-6">
        {/* Clean Brand Wordmark (single text element) */}
        <div className="px-2">
          <span className="font-sans text-lg font-extrabold tracking-tight text-[#181715] whitespace-nowrap">
            A/L Tracker
          </span>
        </div>

        {/* Contextual Primary CTA */}
        <button
          type="button"
          onClick={quickAdd.trigger}
          className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-[#181715] text-[#FFFDF9] hover:bg-[#2E2C28] active:scale-[0.98] transition-all text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_1px_2px_rgba(24,23,21,0.08)]"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>{quickAdd.label}</span>
        </button>

        {/* Primary Destinations */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          {TABS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            const showCount = item.id === 'revisit' && dueCount > 0;

            return (
              <button
                key={item.id}
                id={`rail-tab-${item.id}`}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-sm font-sans transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#EDEAE2] text-[#181715] font-bold'
                    : 'text-[#57534E] font-medium hover:bg-[#F6F4EF] hover:text-[#181715]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 2}
                    className={isActive ? 'text-[#181715]' : 'text-[#78716C]'}
                  />
                  <span>{item.label}</span>
                </span>

                {showCount && (
                  <span className="text-xs font-sans font-bold text-[#DC2626] tabular-nums">
                    {dueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#EFECE6] px-1">
        <PWAInstallButton />
      </div>
    </aside>
  );
};

export const BottomNav: React.FC = () => {
  const { tab, setTab, activeOverlay } = useNavigation();
  const dueCount = useDueRevisitsCount();

  // If an overlay sheet/modal is active, hide the docked bottom bar
  if (activeOverlay) {
    return null;
  }

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/94 backdrop-blur-md border-t border-[#E4E0D8] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 h-[60px] px-2">
        {TABS.map((item) => {
          const isActive = tab === item.id;
          const Icon = item.icon;
          const showCount = item.id === 'revisit' && dueCount > 0;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => setTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] cursor-pointer select-none focus:outline-none active:scale-95 transition-transform"
            >
              {/* Subtle top active hairline */}
              <span
                aria-hidden="true"
                className={`absolute top-0 w-7 h-[2px] rounded-full transition-opacity ${
                  isActive ? 'bg-[#181715] opacity-100' : 'opacity-0'
                }`}
              />

              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={isActive ? 'text-[#181715]' : 'text-[#78716C]'}
                />
                {showCount && (
                  <span className="absolute -top-1.5 -right-3 text-[10px] font-sans font-extrabold text-[#DC2626] tabular-nums leading-none">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-sans tracking-tight leading-none whitespace-nowrap ${
                  isActive ? 'text-[#181715] font-bold' : 'text-[#78716C] font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
