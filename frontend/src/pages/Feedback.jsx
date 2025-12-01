import React, { useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Feedback = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    rating: 5,
    category: 'general',
    subject: '',
    message: '',
    isPublic: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
    { value: 'feature_request', label: 'Feature Request', icon: '✨' },
    { value: 'ui_ux', label: 'UI/UX', icon: '🎨' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'general', label: 'General Feedback', icon: '💬' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!user) {
        setError('Please login to submit feedback');
        navigate('/login');
        return;
      }

      // Only send required fields - backend doesn't accept isPublic
      const { rating, category, subject, message } = formData;
      
      // Log what we're sending for debugging
      console.log('Sending feedback:', { rating, category, subject, message });
      
      await api.post('/feedback', { rating, category, subject, message });
      
      // Show success toast
      toast.success('🎉 Feedback submitted successfully! Thank you for your input!', {
        position: 'top-center',
        autoClose: 3000,
      });
      
      setFormData({
        rating: 5,
        category: 'general',
        subject: '',
        message: '',
        isPublic: true,
      });

      // Redirect to feedback feed after 2 seconds
      setTimeout(() => {
        navigate('/feedback-feed');
      }, 2000);
    } catch (err) {
      console.error('Feedback submission error:', err.response?.data);
      const errorMessage = err.response?.data?.details || err.response?.data?.message || 'Failed to submit feedback';
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
            Submit Feedback
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            We value your feedback! Help us improve the Lost & Found Portal.
          </p>
          <Link 
            to="/feedback-feed"
            className={`inline-block mt-4 text-sm ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            View Community Feedback →
          </Link>
        </div>

        {/* Feedback Form */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8`}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error submitting feedback</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  {error.includes('Authentication') && (
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                    >
                      Click here to login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="mt-1 text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                    className={`text-4xl transition-all ${
                      star <= formData.rating ? 'text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'
                    } hover:scale-110`}
                  >
                    ★
                  </button>
                ))}
                <span className={`ml-4 self-center text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {formData.rating} / 5
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.category === cat.value
                        ? darkMode
                          ? 'border-indigo-500 bg-indigo-900 text-white'
                          : 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={200}
                placeholder="Brief summary of your feedback (min 3 characters)"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.subject.length} / 200 characters (minimum 3)
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                placeholder="Please provide detailed feedback (min 10 characters)..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.message.length} / 2000 characters (minimum 10)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !formData.subject || !formData.message}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  loading || !formData.subject || !formData.message
                    ? 'bg-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
