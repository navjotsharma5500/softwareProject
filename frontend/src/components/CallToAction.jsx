import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Bell } from 'lucide-react';

const CallToAction = () => {
  const features = [
    {
      icon: <Search size={32} />,
      title: "Search Items",
      description: "Browse through lost items and help reunite them with their owners"
    },
    {
      icon: <FileText size={32} />,
      title: "Report Lost Item",
      description: "Lost something? Create a detailed listing to help others find it"
    },
    {
      icon: <Bell size={32} />,
      title: "Post Found Item",
      description: "Found something? Post it here and make someone's day better"
    }
  ];

  return (
    <div className="my-20">
      {/* Main CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-center shadow-2xl"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join our community and help reunite lost items with their owners
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              Report Lost Item
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Post Found Item
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white border-gray-200 p-8 rounded-2xl shadow-lg border text-center hover:shadow-xl transition-all duration-300"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="inline-block bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl text-white mb-4"
            >
              {feature.icon}
            </motion.div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CallToAction;
