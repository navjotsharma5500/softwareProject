import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ darkMode }) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-600 to-teal-600 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
      aria-label="Add new item"
    >
      <motion.div
        animate={{ rotate: 0 }}
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.3 }}
      >
        <Plus size={32} strokeWidth={2.5} />
      </motion.div>
      
      {/* Tooltip */}
      <div className={`absolute right-full mr-4 top-1/2 -translate-y-1/2 ${darkMode ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'} px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
        Report Lost/Found Item
      </div>

      {/* Pulse effect */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-teal-600"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
};

export default FloatingActionButton;
