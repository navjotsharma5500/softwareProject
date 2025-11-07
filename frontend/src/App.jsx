import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Collection from './pages/Collection.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'

const App = () => {
  return (
       <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <Navbar />

      <Routes>    
        <Route path='/' element = {<Home/>} />
        <Route path='/collection' element={<Collection />}/>
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        
        
      </Routes>
      <Footer /> 
      </div>
  )
}

export default App