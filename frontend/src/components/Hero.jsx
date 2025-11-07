import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const Hero = ({ darkMode }) => {
  return (
    <div className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-teal-50 to-blue-100'} rounded-3xl mb-16 transition-colors duration-300`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute -top-20 -right-20 w-64 h-64 ${darkMode ? 'bg-blue-600/10' : 'bg-blue-300/20'} rounded-full blur-3xl`}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className={`absolute -bottom-20 -left-20 w-64 h-64 ${darkMode ? 'bg-teal-600/10' : 'bg-teal-300/20'} rounded-full blur-3xl`}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative px-8 py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Find What You've Lost,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Return What You've Found
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
        >
          Your community-driven platform to reunite lost items with their owners
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className={`relative ${darkMode ? 'bg-slate-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-xl p-3 border ${darkMode ? 'border-slate-700' : 'border-white/50'}`}>
            <div className="flex items-center gap-3">
              <Search className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-3`} size={24} />
              <input
                type="text"
                placeholder="Search by item name or location..."
                className={`flex-1 ${darkMode ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'} outline-none text-lg py-3`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
              >
                Search
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Floating icons */}
        <motion.div
          className="absolute top-10 left-10 text-4xl opacity-20"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          📱
        </motion.div>
        <motion.div
          className="absolute bottom-10 right-10 text-4xl opacity-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -10, 10, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎒
        </motion.div>
        <motion.div
          className="absolute top-1/2 right-20 text-3xl opacity-20"
          animate={{
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💼
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
