import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/login.jsx'
import Signup from './pages/signup.jsx'

const App = () => {
  return (
      <div>
      <Navbar />

      <Routes>    
        <Route path='/' element = {<Home/>} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
      </Routes>
      
      <Footer /> 
      </div>
  )
}

export default App