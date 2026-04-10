/**
 * @file main.jsx
 * @description Application entry point.
 *
 * Bootstraps the React 18 root, wraps the tree with global providers, and
 * mounts Vercel Analytics + SpeedInsights for production observability.
 *
 * Provider order (outer → inner):
 *   BrowserRouter → AuthProvider  → App + ToastContainer
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/lostnfound">
    <AuthProvider>
        <App />
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
    </AuthProvider>
  </BrowserRouter>,
)
