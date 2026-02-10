import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/Thapar_Logo-Photoroom.png" 
                alt="Thapar Institute Logo" 
                className="h-10 w-auto mr-3"
              />
              <span className="text-gray-900 font-bold text-xl">Lost & Found</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Helping reunite people with their lost belongings. Report lost items, browse found items, and make claims all in one place.
            </p>
          </div>

          {/* Quick Links - 2 columns */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-gray-900 transition-colors">Home</Link></li>
                <li><Link to="/report-lost-item" className="hover:text-gray-900 transition-colors">Report Lost Item</Link></li>
                <li><Link to="/how-it-works" className="hover:text-gray-900 transition-colors">How It Works</Link></li>
              </ul>
              <ul className="space-y-2">
                <li><Link to="/profile" className="hover:text-gray-900 transition-colors">Profile</Link></li>
                <li><Link to="/login" className="hover:text-gray-900 transition-colors">Login</Link></li>
                <li><Link to="/dev" className="hover:text-gray-900 transition-colors">Developers</Link></li>
              </ul>
            </div>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">SUPPORT</h3>
            <ul className="space-y-3">
              <li>
                <div className="text-sm">
                  <p className="font-medium mb-1">Technical/Item Glitches:</p>
                  <a 
                    href="mailto:itmh@thapar.edu" 
                    className="text-gray-900 hover:text-gray-700 transition-colors break-all"
                  >
                    itmh@thapar.edu
                  </a>
                </div>
              </li>
              <li>
                <div className="text-sm">
                  <p className="font-medium mb-1">Website Glitches:</p>
                  <a 
                    href="mailto:adminofficer@thapar.edu" 
                    className="text-gray-900 hover:text-gray-700 transition-colors break-all"
                  >
                    adminofficer@thapar.edu
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-gray-600 text-sm text-center">
              © {currentYear} Lost & Found. All rights reserved.
            </p>
            <div className="flex items-center text-gray-600 text-sm space-x-4">
              <span>Crafted by</span>
              <a 
                href="https://github.com/SuryaKTiwari11/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-gray-900 transition-colors"
              >
                <span className="mr-1">Surya</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <span>&</span>
              <a 
                href="https://github.com/akshatkakkar1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-gray-900 transition-colors"
              >
                <span className="mr-1">Akshat</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;