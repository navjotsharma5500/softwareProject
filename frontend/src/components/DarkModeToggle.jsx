import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

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
