import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import { User, LogOut, LayoutDashboard, Moon, Sun, AlertCircle } from 'lucide-react'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { darkMode, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-gray-900 dark:text-white font-semibold text-lg">
              <svg className="h-6 w-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l6 6-6 6M21 7l-6 6 6 6"></path>
              </svg>
              Thapar University - Lost & Found
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link to="/report-lost-item" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <AlertCircle size={18} />
              Report Lost Item
            </Link>
            <Link to="/how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors flex items-center gap-1">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <User size={18} />
                  Profile
                </Link>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <LogOut size={18} />
                  Logout
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400 border-l pl-4">
                  {user?.name}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Link to="/login" className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Sign in with Google
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className={`h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-2">
            <Link to="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Home
            </Link>
            
            <button
              onClick={() => {
                toggleDarkMode();
                setOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <Link to="/report-lost-item" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                Report Lost Item
              </div>
            </Link>
            <Link to="/how-it-works" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard size={18} />
                      Dashboard
                    </div>
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Logout
                </button>
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-t">
                  Logged in as: {user?.name}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Sign in with Google
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar