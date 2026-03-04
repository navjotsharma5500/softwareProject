/**
 * @file DarkModeContext.jsx
 * @description Global dark mode state provider.
 *
 * State is initialised from `localStorage.darkMode` (defaults to `false`).
 * The `dark` class is toggled on `document.documentElement` so Tailwind's
 * `darkMode: 'class'` strategy works application-wide.
 *
 * Context value shape:
 * ```ts
 * {
 *   darkMode: boolean;
 *   setDarkMode: (value: boolean) => void;
 *   toggleDarkMode: () => void;
 * }
 * ```
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

/**
 * Custom hook for consuming the dark mode context.
 * Throws if used outside of {@link DarkModeProvider}.
 *
 * @returns {{ darkMode: boolean, setDarkMode: Function, toggleDarkMode: Function }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

/**
 * Provides dark mode state and toggle to all descendant components.
 *
 * @component
 * @param {{ children: React.ReactNode }} props
 */
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    const isDark = saved ? JSON.parse(saved) : false; // Default to light mode
    
    // Apply initial dark class immediately
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return isDark;
  });

  // Persist preference + update DOM class whenever darkMode toggles.
  // ─ Deps: [darkMode]. Cleanup: none needed.
  useEffect(() => {
    // Save to localStorage whenever darkMode changes
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Apply or remove 'dark' class from the document element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  /**
   * Flips the dark mode boolean.
   * @returns {void}
   */
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
