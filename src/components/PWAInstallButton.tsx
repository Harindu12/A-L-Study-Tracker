import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';
import { useNavigation } from '../navigation';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { activeOverlay, openOverlay, closeOverlay } = useNavigation();
  const showIOSGuide = activeOverlay === 'pwa-ios-guide';

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] transition hover:opacity-90 shadow-sm"
      >
        <Download size={14} />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => openOverlay('pwa-ios-guide')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
        >
          <Download size={14} />
          Install
        </button>

        {showIOSGuide && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/60 backdrop-blur-xs p-4"
            onClick={closeOverlay}
          >
            <div 
              className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] border border-[#E0E0E0] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-sans font-bold text-[#111111] mb-2">Install on iPhone / iPad</h3>
              <p className="text-sm text-[#8A8A8A] font-sans leading-relaxed mb-4">
                1. Tap the <strong className="text-[#111111]">Share</strong> button in the Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-[#111111]">Add to Home Screen</strong>.
              </p>
              <button
                onClick={closeOverlay}
                className="w-full rounded-xl bg-[#111111] py-2.5 text-sm font-sans font-semibold text-[#FFFFFF] hover:bg-[#262626] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
