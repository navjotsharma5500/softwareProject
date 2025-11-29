import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import Login from './pages/login.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/admin.jsx'
import ReportLostItem from './pages/ReportLostItem.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { PublicRoute } from './components/PublicRoute.jsx'

const App = () => {
  return (
      <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <Routes>    
          <Route path='/' element = {<Home/>} />
          <Route path='/item/:id' element = {<ItemDetail/>} />
          
          {/* Public Routes - redirect if already logged in */}
          <Route path='/login' element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path='/report-lost-item' element={<ReportLostItem />} />
          
          {/* Admin Routes */}
          <Route path='/admin' element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      
      <Footer /> 
      </div>
  )
}

export default App