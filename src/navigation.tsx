import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type Tab = 'calendar' | 'stats' | 'revisit' | 'lessons';

export interface HistoryNavState {
  appletNavId: string;
  tab: Tab;
  subjectId: string | null;
  overlay: string | null;
  overlayData?: any;
  depth: number;
}

interface NavigationContextType {
  tab: Tab;
  setTab: (tab: Tab) => void;
  activeSubjectId: string | null;
  openSubject: (subjectId: string) => void;
  closeSubject: () => void;
  activeOverlay: string | null;
  overlayData: any;
  openOverlay: (overlay: string, data?: any) => void;
  closeOverlay: () => void;
  goBack: () => void;
  isPopping: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

const APPLET_NAV_ID = 'study-app-nav';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navState, setNavState] = useState<HistoryNavState>(() => {
    const raw = window.history.state as HistoryNavState | null;
    if (raw && raw.appletNavId === APPLET_NAV_ID) {
      return raw;
    }
    return {
      appletNavId: APPLET_NAV_ID,
      tab: 'calendar',
      subjectId: null,
      overlay: null,
      overlayData: null,
      depth: 0,
    };
  });

  const [isPopping, setIsPopping] = useState(false);

  const navStateRef = useRef<HistoryNavState>(navState);
  navStateRef.current = navState;

  const isPoppingRef = useRef(false);

  useEffect(() => {
    // Replace initial state if not tagged with our ID
    const raw = window.history.state as HistoryNavState | null;
    if (!raw || raw.appletNavId !== APPLET_NAV_ID) {
      const initial: HistoryNavState = {
        appletNavId: APPLET_NAV_ID,
        tab: 'calendar',
        subjectId: null,
        overlay: null,
        overlayData: null,
        depth: 0,
      };
      window.history.replaceState(initial, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      isPoppingRef.current = true;
      setIsPopping(true);
      const state = event.state as HistoryNavState | null;

      if (state && state.appletNavId === APPLET_NAV_ID) {
        navStateRef.current = state;
        setNavState(state);
      } else {
        const rootState: HistoryNavState = {
          appletNavId: APPLET_NAV_ID,
          tab: 'calendar',
          subjectId: null,
          overlay: null,
          overlayData: null,
          depth: 0,
        };
        navStateRef.current = rootState;
        setNavState(rootState);
      }

      // If any input or form element is focused, blur it so virtual keyboard and inline cursor dismiss
      if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
        (document.activeElement as HTMLElement).blur();
      }

      // Reset popping flag after current event loop settles
      setTimeout(() => {
        isPoppingRef.current = false;
        setIsPopping(false);
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setTab = useCallback((newTab: Tab) => {
    const current = navStateRef.current;
    if (current.tab === newTab && current.subjectId === null && current.overlay === null) {
      return;
    }

    const next: HistoryNavState = {
      appletNavId: APPLET_NAV_ID,
      tab: newTab,
      subjectId: null,
      overlay: null,
      overlayData: null,
      depth: current.depth + 1,
    };

    window.history.pushState(next, '');
    navStateRef.current = next;
    setNavState(next);
  }, []);

  const openSubject = useCallback((subjectId: string) => {
    const current = navStateRef.current;
    if (current.tab === 'lessons' && current.subjectId === subjectId && current.overlay === null) {
      return;
    }

    const next: HistoryNavState = {
      appletNavId: APPLET_NAV_ID,
      tab: 'lessons',
      subjectId,
      overlay: null,
      overlayData: null,
      depth: current.depth + 1,
    };

    window.history.pushState(next, '');
    navStateRef.current = next;
    setNavState(next);
  }, []);

  const closeSubject = useCallback(() => {
    const current = navStateRef.current;
    if (current.subjectId === null) return;

    if (!isPoppingRef.current && current.depth > 0) {
      const steps = current.overlay ? 2 : 1;
      const next: HistoryNavState = {
        ...current,
        subjectId: null,
        overlay: null,
        overlayData: null,
        depth: Math.max(0, current.depth - steps),
      };
      navStateRef.current = next;
      setNavState(next);
      if (steps === 2 && current.depth >= 2) {
        window.history.go(-2);
      } else {
        window.history.back();
      }
    } else {
      const next: HistoryNavState = {
        ...current,
        subjectId: null,
        overlay: null,
        overlayData: null,
      };
      navStateRef.current = next;
      setNavState(next);
      window.history.replaceState(next, '');
    }
  }, []);

  const openOverlay = useCallback((overlay: string, data?: any) => {
    const current = navStateRef.current;
    if (current.overlay === overlay) return;

    const next: HistoryNavState = {
      ...current,
      overlay,
      overlayData: data !== undefined ? data : null,
      depth: current.overlay ? current.depth : current.depth + 1,
    };

    // If an overlay was already open, replace current entry; otherwise push a new one
    if (current.overlay) {
      window.history.replaceState(next, '');
    } else {
      window.history.pushState(next, '');
    }
    navStateRef.current = next;
    setNavState(next);
  }, []);

  const closeOverlay = useCallback(() => {
    const current = navStateRef.current;
    if (current.overlay === null) return;

    if (!isPoppingRef.current && current.depth > 0) {
      const next: HistoryNavState = {
        ...current,
        overlay: null,
        overlayData: null,
        depth: Math.max(0, current.depth - 1),
      };
      navStateRef.current = next;
      setNavState(next);
      window.history.back();
    } else {
      const next: HistoryNavState = {
        ...current,
        overlay: null,
        overlayData: null,
      };
      navStateRef.current = next;
      setNavState(next);
      window.history.replaceState(next, '');
    }
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        tab: navState.tab,
        setTab,
        activeSubjectId: navState.subjectId,
        openSubject,
        closeSubject,
        activeOverlay: navState.overlay,
        overlayData: navState.overlayData,
        openOverlay,
        closeOverlay,
        goBack,
        isPopping,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
