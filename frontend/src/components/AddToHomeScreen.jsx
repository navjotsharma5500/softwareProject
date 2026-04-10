/**
 * @file AddToHomeScreen.jsx
 * @description Progressive Web App "Add to Home Screen" install prompt banner.
 *
 * Detects platform (iOS Safari / Android Chrome) and renders step-by-step
 * install instructions. The banner is suppressed when already running in
 * standalone mode and will not reappear for 2 weeks after being dismissed.
 *
 * @component
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusSquare, ChevronDown } from 'lucide-react';

/** localStorage key used to track dismissal timestamp. */
const STORAGE_KEY = 'tiet_a2hs_dismissed';
/** Minimum milliseconds before the banner reappears after dismissal (2 weeks). */
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000 * 2; // 2 weeks

/**
 * Detects the user's platform and browser from the User-Agent string.
 *
 * @returns {{ isIOS: boolean, isAndroid: boolean, isSafari: boolean,
 *   isChrome: boolean, isStandalone: boolean }}
 */
function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  // Safari: has "Safari" but NOT "Chrome" or "CriOS" (Chrome on iOS)
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  // Chrome: desktop Chrome or Android Chrome or CriOS (Chrome on iOS)
  const isChrome = /chrome|crios/i.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  return { isIOS, isAndroid, isSafari, isChrome, isStandalone };
}

const steps = {
  ios: [
    <>Tap the <strong>Share</strong> button at the bottom of Safari</>,
    <>Scroll down and tap <strong>"Add to Home Screen"</strong></>,
    <>Tap <strong>"Add"</strong> to confirm</>,
  ],
  android: [
    <>Tap the <strong>three-dot menu (⋮)</strong> at the top right of Chrome</>,
    <>Tap <strong>"Add to Home screen"</strong></>,
    <>Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm</>,
  ],
};

/**
 * "Add to Home Screen" install prompt banner.
 *
 * Shown only when:
 *  - Running in a browser (not in standalone mode already).
 *  - Platform is iOS Safari or Android Chrome.
 *  - The banner has not been dismissed within the last 2 weeks.
 *
 * Dismissal stores a timestamp in `localStorage` under `STORAGE_KEY`.
 * The collapsible step list is toggled via `expanded` state.
 *
 * @component
 * @returns {JSX.Element|null} The banner, or `null` when conditions are not met.
 */
export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    const lastDismissed = localStorage.getItem(STORAGE_KEY);
    if (lastDismissed && Date.now() - Number(lastDismissed) < RESHOW_AFTER_MS) return;

    const { isIOS, isAndroid, isSafari, isChrome, isStandalone } = detectPlatform();
    if (isStandalone) return;

    // iOS steps: only Safari on iPhone/iPad supports the native share → Add to Home Screen flow
    // Android steps: Chrome on Android supports Add to Home screen
    if (isIOS && isSafari) {
      setPlatform('ios');
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } else if (isAndroid && isChrome) {
      setPlatform('android');
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = (e) => {
    e.stopPropagation();
    setShow(false);
    setExpanded(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!platform) return null;

  const currentSteps = steps[platform];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
          style={{ x: '-50%' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* ── Compact bar (always visible) ── */}
            <div className="flex items-center justify-between px-4 py-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(v => !v)}
                onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
              >
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <PlusSquare size={15} className="text-white" />
                </span>
                <span className="text-sm font-semibold text-gray-800">Add to Home Screen</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.22 }}
                  className="text-gray-400 pointer-events-none"
                >
                  <ChevronDown size={16} />
                </motion.span>
                <button
                  onClick={dismiss}
                  className="ml-1 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Expanded steps ── */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="steps"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="h-px bg-gray-100 mx-4" />

                  <ul className="px-4 pt-3 pb-2 space-y-3">
                    {currentSteps.map((step, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-700 leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mx-4 mb-4 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-[11px] text-red-700 text-center font-medium">
                      TIET Lost &amp; Found will appear on your home screen for quick access
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
