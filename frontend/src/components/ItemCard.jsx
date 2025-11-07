import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Eye } from 'lucide-react';

const ItemCard = ({ item, index, darkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-3 right-3 ${darkMode ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold`}>
          <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>
          {item.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-600 flex-shrink-0" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.location}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-teal-600 flex-shrink-0" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Lost on {new Date(item.dateLost).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>

        <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {item.description}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
        >
          <Eye size={18} />
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ItemCard;
