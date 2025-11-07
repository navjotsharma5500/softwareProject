import React from 'react';
import { motion } from 'framer-motion';

const CategoryFilter = ({ categories, activeCategory, setActiveCategory, darkMode }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const chipVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="mb-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}
      >
        Browse Lost Items
      </motion.h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-wrap gap-3"
      >
        {categories.map((category) => (
          <motion.button
            key={category}
            variants={chipVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeCategory === category
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                : darkMode
                ? 'bg-slate-800 text-gray-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default CategoryFilter;
