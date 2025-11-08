import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import Login from './pages/login.jsx'
import Signup from './pages/signup.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

const App = () => {
  return (
      <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <Routes>    
          <Route path='/' element = {<Home/>} />
          <Route path='/item/:id' element = {<ItemDetail/>} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
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