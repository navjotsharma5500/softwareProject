/**
 * @file InstallApp.jsx
 * @description Dedicated PWA installation guide page with interactive phone mockups.
 * Shows step-by-step "Add to Home Screen" instructions for iOS Safari and Android Chrome.
 * The user can switch between platforms and step through the guide using the phone mockup.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, MoreVertical, PlusSquare, Home,
  ChevronLeft, ChevronRight, Smartphone, CheckCircle2,
} from 'lucide-react';

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  return { isIOS };
}

// ── Step metadata ──────────────────────────────────────────────────────────────
const STEPS = {
  ios: [
    {
      icon: <Share2 className="text-blue-600" size={28} />,
      title: 'Tap the Share button',
      description: 'Find the Share button (□↑) in the Safari toolbar at the bottom of your screen.',
      hint: 'It looks like a box with an arrow pointing upward',
    },
    {
      icon: <PlusSquare className="text-blue-600" size={28} />,
      title: 'Add to Home Screen',
      description: 'Scroll down in the share sheet and tap "Add to Home Screen".',
      hint: 'You may need to scroll the icons row to find it',
    },
    {
      icon: <CheckCircle2 className="text-green-600" size={28} />,
      title: 'Confirm — tap Add',
      description: 'Tap "Add" in the top-right of the dialog. The app icon will appear on your Home Screen.',
      hint: 'You can rename the shortcut before adding',
    },
  ],
  android: [
    {
      icon: <MoreVertical className="text-gray-600" size={28} />,
      title: 'Open the Chrome menu',
      description: 'Tap the three-dot menu (⋮) at the top-right corner of Chrome.',
      hint: 'Make sure you are using Google Chrome browser',
    },
    {
      icon: <PlusSquare className="text-blue-600" size={28} />,
      title: 'Add to Home screen',
      description: 'Tap "Add to Home screen" from the dropdown menu.',
      hint: 'Newer Chrome versions may show "Install app" instead',
    },
    {
      icon: <CheckCircle2 className="text-green-600" size={28} />,
      title: 'Tap Add or Install',
      description: 'Confirm by tapping "Add" or "Install" in the dialog that appears.',
      hint: 'The app will appear in your app drawer and home screen',
    },
  ],
};

// ── iOS screen simulation ──────────────────────────────────────────────────────
function IOSScreen({ step }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.2 }}
        className="h-full flex flex-col bg-gray-100"
      >
        {/* Safari address bar */}
        <div className="bg-gray-200 px-2 py-1.5 flex items-center gap-1.5">
          <div className="flex-1 bg-white rounded-lg px-2 py-1 text-[9px] text-gray-500 truncate border border-gray-300">
            tiet-lnf.vercel.app
          </div>
          <motion.div
            animate={step === 0 ? { scale: [1, 1.25, 1], opacity: [1, 0.55, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.3 }}
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${
              step === 0 ? 'bg-blue-500 shadow-md shadow-blue-300' : 'bg-blue-400'
            }`}
          >
            <Share2 size={11} className="text-white" />
          </motion.div>
        </div>

        {/* Fake page body */}
        <div className="flex-1 bg-white p-2 overflow-hidden relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-red-600 flex-shrink-0" />
              <div className="h-2 bg-gray-800 rounded w-2/3" />
            </div>
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            <div className="h-10 bg-red-50 rounded mt-2 border border-red-100" />
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>

          {/* Share sheet (step 1) */}
          {step === 1 && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200"
            >
              <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto mt-1.5 mb-2" />
              <div className="px-2 pb-1 flex gap-2 overflow-x-hidden">
                {['📋', '🔖', '📤', 'ℹ️'].map((em, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">{em}</div>
                    <span className="text-[5px] text-gray-500">Share</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mx-1">
                <div className="py-1 px-2 text-[8px] text-blue-500 border-b border-gray-100">Copy Link</div>
                <div className="py-1 px-2 text-[8px] text-blue-500 border-b border-gray-100">Find on Page</div>
                <motion.div
                  animate={{ backgroundColor: ['#ffffff', '#fef9c3', '#ffffff'] }}
                  transition={{ repeat: Infinity, duration: 1.3 }}
                  className="py-1.5 px-2 flex items-center gap-1.5 rounded-b-xl"
                >
                  <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                    <PlusSquare size={10} className="text-gray-700" />
                  </div>
                  <span className="text-[8px] font-semibold text-blue-600">Add to Home Screen</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Confirmation dialog (step 2) */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-[88%] overflow-hidden"
              >
                <div className="px-3 py-2 text-center">
                  <p className="text-[8px] font-semibold text-gray-900">Add to Home Screen</p>
                  <div className="flex items-center gap-2 mt-2 p-1.5 border border-gray-200 rounded-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Home size={11} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-gray-900">TIET L&F</p>
                      <p className="text-[6px] text-gray-500">tiet-lnf.vercel.app</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-gray-200">
                  <div className="flex-1 py-1.5 text-[8px] text-blue-500 text-center border-r border-gray-200">Cancel</div>
                  <motion.div
                    animate={{ color: ['#2563eb', '#1e40af', '#2563eb'] }}
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="flex-1 py-1.5 text-[8px] font-bold text-blue-600 text-center"
                  >
                    Add
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Safari bottom toolbar */}
        <div className="bg-gray-200 border-t border-gray-300 px-4 py-1.5 flex justify-around items-center">
          {['←', '→', '↑', '□', '≡'].map((btn, i) => (
            <span key={i} className="text-blue-500 text-[11px]">{btn}</span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Android screen simulation ──────────────────────────────────────────────────
function AndroidScreen({ step }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.2 }}
        className="h-full flex flex-col bg-white"
      >
        {/* Chrome address bar */}
        <div className="bg-white px-2 py-1.5 flex items-center gap-1.5 border-b border-gray-200 shadow-sm">
          <div className="flex-1 bg-gray-100 rounded-full px-2 py-1 text-[9px] text-gray-500 truncate">
            🔒lostnfound.thapar.edu
          </div>
          <motion.div
            animate={step === 0 ? { scale: [1, 1.25, 1], opacity: [1, 0.55, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.3 }}
            className={`p-1 rounded transition-all ${step === 0 ? 'bg-yellow-100 shadow shadow-yellow-300' : ''}`}
          >
            <MoreVertical size={13} className="text-gray-700" />
          </motion.div>
        </div>

        {/* Fake page body */}
        <div className="flex-1 bg-white p-2 overflow-hidden relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-red-600 flex-shrink-0" />
              <div className="h-2 bg-gray-800 rounded w-2/3" />
            </div>
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            <div className="h-10 bg-red-50 rounded mt-2 border border-red-100" />
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>

          {/* Chrome dropdown (step 1) */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="absolute top-0 right-0 bg-white rounded-lg shadow-2xl w-32 border border-gray-200 overflow-hidden z-10"
            >
              {['New Tab', 'Bookmarks', 'History', 'Downloads'].map((m) => (
                <div key={m} className="px-2 py-1 text-[7px] text-gray-700 border-b border-gray-100">{m}</div>
              ))}
              <motion.div
                animate={{ backgroundColor: ['#ffffff', '#fef9c3', '#ffffff'] }}
                transition={{ repeat: Infinity, duration: 1.3 }}
                className="px-2 py-1.5 flex items-center gap-1.5"
              >
                <Home size={8} className="text-gray-700 flex-shrink-0" />
                <span className="text-[7px] font-semibold text-gray-900">Add to Home screen</span>
              </motion.div>
              <div className="px-2 py-1 text-[7px] text-gray-700">Settings</div>
            </motion.div>
          )}

          {/* Install dialog (step 2) */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-end justify-center bg-black/30 pb-4"
            >
              <motion.div
                initial={{ y: 30, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="bg-white rounded-2xl shadow-xl w-[92%] overflow-hidden"
              >
                <div className="px-3 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-900">Add to Home screen</p>
                    <p className="text-[7px] text-gray-500">TIET Lost &amp; Found</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-3 pb-3">
                  <div className="px-3 py-1 text-[8px] text-gray-600 rounded">Cancel</div>
                  <motion.div
                    animate={{ backgroundColor: ['#2563eb', '#1d4ed8', '#2563eb'] }}
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="px-3 py-1 text-[8px] font-bold text-white bg-blue-600 rounded"
                  >
                    Add
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Android nav bar */}
        <div className="bg-white border-t border-gray-200 px-6 py-1.5 flex justify-around items-center">
          <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />
          <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
          <div
            className="w-3 h-3 border-l-2 border-b-2 border-gray-400"
            style={{ transform: 'rotate(45deg) translateY(-2px)' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── iPhone frame ───────────────────────────────────────────────────────────────
function IPhoneFrame({ children }) {
  return (
    <div className="relative mx-auto" style={{ width: 210, height: 420 }}>
      {/* Body */}
      <div className="absolute inset-0 rounded-[2.6rem] shadow-2xl" style={{ background: '#1a1a1a', border: '5px solid #2d2d2d' }}>
        {/* Left: mute toggle */}
        <div className="absolute rounded-l-sm" style={{ left: -7, top: 72, width: 5, height: 28, background: '#444' }} />
        {/* Left: volume up */}
        <div className="absolute rounded-l-sm" style={{ left: -7, top: 112, width: 5, height: 26, background: '#444' }} />
        {/* Left: volume down */}
        <div className="absolute rounded-l-sm" style={{ left: -7, top: 146, width: 5, height: 26, background: '#444' }} />
        {/* Right: power/lock */}
        <div className="absolute rounded-r-sm" style={{ right: -7, top: 104, width: 5, height: 52, background: '#444' }} />
      </div>
      {/* Screen */}
      <div className="absolute inset-[6px] bg-white rounded-[2.1rem] overflow-hidden flex flex-col">
        {/* Status bar + Dynamic Island */}
        <div className="relative bg-white flex items-center justify-between px-4 pt-1.5 pb-0.5 flex-shrink-0">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[72px] h-[18px] bg-black rounded-b-[14px]" />
          <span className="text-[8px] font-semibold text-gray-900">9:41</span>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-2 border border-gray-800 rounded-sm relative">
              <div className="absolute inset-[1.5px] bg-gray-800 rounded-[1px]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// ── Android frame ──────────────────────────────────────────────────────────────
function AndroidFrame({ children }) {
  return (
    <div className="relative mx-auto" style={{ width: 210, height: 420 }}>
      {/* Body */}
      <div className="absolute inset-0 rounded-[1.9rem] shadow-2xl" style={{ background: '#1a1a1a', border: '5px solid #2d2d2d' }}>
        {/* Right: power */}
        <div className="absolute rounded-r-sm" style={{ right: -7, top: 96, width: 5, height: 46, background: '#444' }} />
        {/* Left: volume up */}
        <div className="absolute rounded-l-sm" style={{ left: -7, top: 80, width: 5, height: 26, background: '#444' }} />
        {/* Left: volume down */}
        <div className="absolute rounded-l-sm" style={{ left: -7, top: 114, width: 5, height: 40, background: '#444' }} />
      </div>
      {/* Screen */}
      <div className="absolute inset-[6px] bg-white rounded-[1.4rem] overflow-hidden flex flex-col">
        {/* Status bar + pill camera */}
        <div className="relative bg-white flex items-center justify-between px-3 py-1 flex-shrink-0">
          <span className="text-[7px] font-semibold text-gray-900">9:41</span>
          {/* Pill-shaped punch-hole camera */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 w-[42px] h-[11px] bg-black rounded-full" />
          <span className="text-[7px] text-gray-600">●●●</span>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InstallApp() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState('android');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const { isIOS } = detectPlatform();
    if (isIOS) setPlatform('ios');
  }, []);

  const steps = STEPS[platform];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const switchPlatform = (p) => {
    setPlatform(p);
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight text-gray-900">Install the App</h1>
          <p className="text-xs text-gray-500 truncate">Add TIET L&F to your home screen</p>
        </div>
        <Smartphone size={22} className="text-gray-400 flex-shrink-0" />
      </div>

      {/* ── Platform tabs ── */}
      <div className="px-4 mb-8 max-w-3xl mx-auto">
        <div className="flex bg-gray-200 rounded-xl p-1 gap-1">
          {['android', 'ios'].map((p) => (
            <button
              key={p}
              onClick={() => switchPlatform(p)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                platform === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'ios' ? '🍎  iOS Safari' : '🤖  Android Chrome'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-4 max-w-3xl mx-auto flex flex-col lg:flex-row lg:items-start gap-10">

        {/* Phone mockup */}
        <div className="flex-shrink-0 flex justify-center">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={platform}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.22 }}
              >
                {platform === 'ios'
                  ? <IPhoneFrame><IOSScreen step={step} /></IPhoneFrame>
                  : <AndroidFrame><AndroidScreen step={step} /></AndroidFrame>
                }
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* Steps panel */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Active step card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${platform}-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-red-200 flex-shrink-0">
                  {step + 1}
                </span>
                <div className="p-2 bg-gray-100 rounded-xl">
                  {steps[step].icon}
                </div>
              </div>
              <h2 className="text-lg font-bold mb-1 text-gray-900">{steps[step].title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{steps[step].description}</p>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
                <span className="text-xs text-gray-500 leading-relaxed">{steps[step].hint}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* All steps list */}
          <div className="space-y-2">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${
                  i === step
                    ? 'bg-red-50 border-red-200'
                    : i < step
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span className={`text-sm font-medium transition-colors ${
                  i < step ? 'text-green-700' : i === step ? 'text-red-700' : 'text-gray-500'
                }`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={isFirst}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all font-semibold text-sm"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {isLast ? (
              <button
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all font-semibold text-sm shadow-lg shadow-red-950/40"
              >
                Done  ✓
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all font-semibold text-sm shadow-lg shadow-red-950/40"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-red-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}

