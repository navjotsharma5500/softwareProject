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
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
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
        <Analytics />
        <SpeedInsights />
    </AuthProvider>
  </BrowserRouter>,
)
