import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import ItemCard from '../components/ItemCard';
import CallToAction from '../components/CallToAction';
import DarkModeToggle from '../components/DarkModeToggle';
import FloatingActionButton from '../components/FloatingActionButton';
import { lostItemsData, categories } from '../data/lostItems';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [darkMode, setDarkMode] = useState(false);

  // Filter items based on selected category
  const filteredItems = activeCategory === 'All' 
    ? lostItemsData 
    : lostItemsData.filter(item => item.category === activeCategory);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-8">
        {/* Dark Mode Toggle */}
        <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Hero Section */}
        <Hero darkMode={darkMode} />

        {/* Category Filter */}
        <CategoryFilter 
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          darkMode={darkMode}
        />

        {/* Lost Items Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {filteredItems.map((item, index) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              index={index}
              darkMode={darkMode}
            />
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <p className="text-2xl font-semibold mb-2">No items found</p>
            <p>Try selecting a different category</p>
          </motion.div>
        )}

        {/* Call to Action */}
        <CallToAction darkMode={darkMode} />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton darkMode={darkMode} />
    </div>
  );
};

export default Home;