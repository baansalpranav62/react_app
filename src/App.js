import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserPlus, Shield } from 'lucide-react';
import GuestRegistration from './components/GuestRegistration';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import ScrollToButton from './components/ScrollToButton';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        <UserPlus size={20} />
        Guest Registration
      </Link>
      <Link 
        to="/admin" 
        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
      >
        <Shield size={20} />
        Admin Panel
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        
        <div className="container">
          <div className="header">
            <h1>Welcome to Haven</h1>
            <p>Secure and easy guest registration process</p>
          </div>
          
          <Navigation />
          
          <Routes>
            <Route path="/" element={<GuestRegistration />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <ScrollToButton />
      </div>
    </Router>
  );
}

export default App; 