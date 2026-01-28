import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote, MessageSquare, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';

const FeedbackCarousel = () => {
  const { darkMode } = useDarkMode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef(null);
  const slideRefs = useRef({});
  const [measuredHeight, setMeasuredHeight] = useState(null);

  // Mock approved feedback data
  const testimonials = [
    {
      id: 1,
      name: "Arjun Sharma",
      rating: 5,
      message: "Found my lost wallet within 24 hours! The portal is incredibly user-friendly and efficient. Thank you team!",
      category: "general",
      date: "2024-11-28"
    },
    {
      id: 2,
      name: "Priya Patel",
      rating: 5,
      message: "Amazing service! Lost my ID card and got it back the same day. The notification system works perfectly.",
      category: "feature_request",
      date: "2024-11-27"
    },
    {
      id: 3,
      name: "Rahul Singh",
      rating: 4,
      message: "Great initiative by the college. The interface is clean and the search functionality is top-notch. Keep it up!",
      category: "ui_ux",
      date: "2024-11-26"
    },
    {
      id: 4,
      name: "Sneha Gupta",
      rating: 5,
      message: "This portal is a lifesaver! Lost my laptop charger and found it listed here. The community is very helpful.",
      category: "general",
      date: "2024-11-25"
    },
    {
      id: 5,
      name: "Vikram Malhotra",
      rating: 5,
      message: "Excellent platform! The claim process is smooth and transparent. Recovered my lost books effortlessly.",
      category: "performance",
      date: "2024-11-24"
    },
    {
      id: 6,
      name: "Ananya Reddy",
      rating: 4,
      message: "Very impressed with the quick response time. The admin team is doing a fantastic job managing lost items.",
      category: "general",
      date: "2024-11-23"
    }
  ];

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Measure current slide height and update container height to avoid layout jumps
  useLayoutEffect(() => {
    const measure = () => {
      const el = slideRefs.current[currentIndex];
      if (el) {
        const h = el.offsetHeight;
        setMeasuredHeight(h);
        if (containerRef.current) containerRef.current.style.height = `${h}px`;
      }
    };

    // Measure after a small delay to allow framer-motion to mount elements
    const id = window.requestAnimationFrame(measure);
    // Also measure on next tick in case fonts/images changed layout
    const tid = setTimeout(measure, 50);

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(id);
      clearTimeout(tid);
      window.removeEventListener('resize', measure);
    };
  }, [currentIndex, testimonials.length]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className={`${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-teal-50'} py-16 px-4 rounded-3xl mb-16 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            What Our Community Says
          </h2>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real experiences from students who've used our portal
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div
            ref={containerRef}
            className="overflow-hidden relative"
            style={{
              minHeight: measuredHeight ? undefined : '14rem',
              height: measuredHeight ? `${measuredHeight}px` : undefined,
              transition: 'height 300ms ease'
            }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                ref={(el) => (slideRefs.current[currentIndex] = el)}
                className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 md:p-12 relative w-full absolute inset-0`}
              >
                {/* Quote Icon */}
                <div className="absolute top-6 left-6 opacity-10">
                  <Quote size={80} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                </div>

                <div className="relative z-10">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        className={i < testimonials[currentIndex].rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>

                  {/* Message */}
                  <p className={`text-xl md:text-2xl mb-8 italic leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    "{testimonials[currentIndex].message}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(testimonials[currentIndex].date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {testimonials[currentIndex].rating}.0 ★
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={prevSlide}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50'
            } p-3 rounded-full shadow-lg transition-all hover:scale-110`}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={nextSlide}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50'
            } p-3 rounded-full shadow-lg transition-all hover:scale-110`}
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? darkMode ? 'bg-blue-400 w-8' : 'bg-blue-600 w-8'
                    : darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
        >
          <Link
            to="/feedback"
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
            }`}
          >
            <MessageSquare size={24} />
            Share Your Feedback
          </Link>
          <Link
            to="/feedback-feed"
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-600' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300'
            }`}
          >
            <Eye size={24} />
            View All Feedback
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackCarousel;
