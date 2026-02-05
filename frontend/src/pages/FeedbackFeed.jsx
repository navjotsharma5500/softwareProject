import React, { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const FeedbackFeed = () => {
  const { darkMode } = useDarkMode();
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const response = await api.get('/feedback/feed?limit=100');
        setFeedbacks(response.data.feedbacks);
        setStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    };

    fetchFeedback();
  }, []);

  const getCategoryInfo = (category) => {
    const categories = [
      { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
      { value: 'feature_request', label: 'Feature Request', icon: '✨' },
      { value: 'ui_ux', label: 'UI/UX', icon: '🎨' },
      { value: 'performance', label: 'Performance', icon: '⚡' },
      { value: 'general', label: 'General', icon: '💬' },
      { value: 'other', label: 'Other', icon: '📝' },
    ];
    return categories.find(c => c.value === category) || { label: category, icon: '📝' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
            Community Feedback
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            See what others are saying about the Lost & Found Portal
          </p>
          <Link
            to="/feedback"
            className={`inline-block px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Submit Your Feedback
          </Link>
        </div>

        {/* Statistics */}
        {stats && (
          <div className={`mb-8 p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {/* Top row - Average Rating and Total Feedback */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-700">
              <div className="text-center">
                <div className={`text-4xl md:text-5xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {stats.avgRating?.toFixed(1) || '0.0'}
                </div>
                <div className={`text-sm md:text-base mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Avg Rating
                </div>
              </div>
              <div className="text-center">
                <div className={`text-4xl md:text-5xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {stats.totalFeedback || 0}
                </div>
                <div className={`text-sm md:text-base mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Feedback
                </div>
              </div>
            </div>
            
            {/* Bottom row - Star breakdown */}
            <div className="grid grid-cols-5 gap-2 md:gap-4">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="text-center">
                  <div className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}StarCount`] || 0}
                  </div>
                  <div className={`text-xs md:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {star}★
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Grid */}
        {loading ? (
          <LoadingSpinner 
            showColdStartMessage={isInitialLoad.current}
            message="Loading feedback..."
          />
        ) : feedbacks.length === 0 ? (
          <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xl">No feedback found. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks.map((feedback) => {
              const categoryInfo = getCategoryInfo(feedback.category);
              return (
                <div
                  key={feedback._id}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 transition-all hover:shadow-xl`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{categoryInfo.icon}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      {renderStars(feedback.rating)}
                    </div>
                  </div>

                  {/* Subject */}
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {feedback.subject}
                  </h3>

                  {/* Message */}
                  <p className={`text-sm mb-4 line-clamp-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feedback.message}
                  </p>

                  {/* Footer */}
                  <div className={`flex justify-between items-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feedback.name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatDate(feedback.createdAt)}
                      </p>
                    </div>
                    {feedback.adminResponse && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        Responded
                      </span>
                    )}
                  </div>

                  {/* Admin Response */}
                  {feedback.adminResponse && (
                    <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Admin Response:
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feedback.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackFeed;
