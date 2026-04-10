/**
 * @file CategoryFilter.jsx
 * @description Horizontally-scrolling animated chip bar for filtering items
 * by category on the Home page.
 *
 * @component
 */
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Renders a staggered list of animated category filter chips.
 *
 * The "All" chip is always prepended. Selecting a chip calls
 * `setActiveCategory` with the chip value; the active chip is visually
 * highlighted.
 *
 * @component
 * @param {object}   props
 * @param {string[]} props.categories       - Array of category slug strings.
 * @param {string}   props.activeCategory   - Currently selected slug (or `''` for all).
 * @param {Function} props.setActiveCategory - Called with the new slug when a chip is clicked.
 * @returns {JSX.Element}
 */
const CategoryFilter = ({ categories, activeCategory, setActiveCategory }) => {
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
        className={`text-3xl font-bold mb-6 text-gray-900`}
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
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg'
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
