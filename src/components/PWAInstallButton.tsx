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
        type="button"
        onClick={install}
        className="w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] hover:bg-[#EDEAE2] px-3 py-1.5 text-xs font-sans font-semibold text-[#181715] transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download size={14} />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => openOverlay('pwa-ios-guide')}
          className="w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] hover:bg-[#EDEAE2] px-3 py-1.5 text-xs font-sans font-semibold text-[#181715] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download size={14} />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181715]/45 backdrop-blur-xs p-0 sm:p-4"
            onClick={closeOverlay}
          >
            <div
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] border border-[#E4E0D8] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-sans font-extrabold text-[#181715] mb-2">
                Install on iPhone / iPad
              </h3>
              <p className="text-sm text-[#57534E] font-sans leading-relaxed mb-5">
                1. Tap the <strong className="text-[#181715]">Share</strong> button in the Safari toolbar.
                <br />
                2. Scroll down and tap <strong className="text-[#181715]">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={closeOverlay}
                className="w-full min-h-[42px] rounded-xl bg-[#181715] py-2.5 text-sm font-sans font-semibold text-[#FFFDF9] hover:bg-[#2E2C28] transition-colors cursor-pointer"
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
