/**
 * @file DarkModeToggle.jsx
 * @description Fixed-position dark/light mode toggle button.
 *
 * @component
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

/**
 * Renders a fixed button in the top-right area that flips between dark and
 * light mode. The icon rotates 180° when switching from light to dark.
 *
 * @component
 * @param {object}   props
 * @param {boolean}  props.darkMode     - Current dark mode state.
 * @param {Function} props.setDarkMode  - Setter from {@link DarkModeContext}.
 * @returns {JSX.Element}
 */
const DarkModeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setDarkMode(!darkMode)}
      className={`fixed top-24 right-6 z-50 p-4 rounded-full shadow-lg ${
        darkMode 
          ? 'bg-slate-800 text-yellow-400 border border-slate-700' 
          : 'bg-white text-blue-600 border border-gray-200'
      } hover:shadow-xl transition-all duration-300`}
      aria-label="Toggle dark mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </motion.div>
    </motion.button>
  );
};

export default DarkModeToggle;
