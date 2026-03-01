import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import Login from './pages/login.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/admin.jsx'
 import AdminReports from './pages/AdminReports.jsx'
import ReportLostItem from './pages/ReportLostItem.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Stats from './pages/Stats.jsx'
import ReportDetail from './pages/ReportDetail.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { PublicRoute } from './components/PublicRoute.jsx'
import NotFound from './pages/NotFound.jsx'
import DevelopersPage from './pages/DevelopersPage.jsx'

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path = 'dev' element = {<DevelopersPage/>} />
          <Route path='/' element={<Home />} />
          <Route path='/item/:id' element={<ItemDetail />} />
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
          <Route path='/how-it-works' element={<HowItWorks />} />
          <Route path='/stats' element={<Stats />} />
          {/* Admin Routes */}
          <Route path='/admin' element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path='/admin/reports' element={
            <ProtectedRoute adminOnly={true}>
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path='/admin/report/:id' element={
            <ProtectedRoute adminOnly={true}>
              <ReportDetail />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />  
    </div>
  );
}

export default App