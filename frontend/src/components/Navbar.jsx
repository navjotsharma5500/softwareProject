import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, LayoutDashboard, AlertCircle } from 'lucide-react'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-gray-900 font-bold text-sm sm:text-base lg:text-lg">
              <img 
                src="/Thapar_Logo-Photoroom.png" 
                alt="Thapar Institute Logo" 
                className="h-8 w-auto sm:h-10 mr-2 sm:mr-3"
              />
              <span className="hidden sm:inline ">TIET</span>
              <span className="sm:hidden">TIET L&F</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/report-lost-item" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
              <AlertCircle size={18} />
              Report Lost Item
            </Link>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Link to="/admin" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                  <User size={18} />
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <LogOut size={18} />
                  Logout
                </button>
                <div className="text-sm text-gray-600 border-l pl-4">
                  {user?.name}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors">
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
            <Link to="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
              Home
            </Link>
            
            <Link to="/report-lost-item" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                Report Lost Item
              </div>
            </Link>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard size={18} />
                      Dashboard
                    </div>
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
                <div className="px-3 py-2 text-sm text-gray-600 border-t">
                  Logged in as: {user?.name}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gray-900 hover:bg-gray-800">
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