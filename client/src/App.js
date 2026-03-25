import React, { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('buyer');
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.add('fade-in');
    
    const savedUser = localStorage.getItem('ecommerce_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('Loaded user from localStorage:', userData);
      setUser(userData);
      setUserType(userData.userType);
      setCurrentView('dashboard');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleLogin = (userData) => {
    const userWithId = {
      ...userData,
      id: userData.id || userData._id || userData.userId || Date.now().toString()
    };
    
    console.log('Setting user in App.js:', userWithId);
    
    setUser(userWithId);
    setUserType(userWithId.userType);
    setCurrentView('dashboard');
    localStorage.setItem('ecommerce_user', JSON.stringify(userWithId));
  };

  const handleSignup = (userData) => {
    const userWithId = {
      ...userData,
      id: userData.id || userData._id || userData.userId || Date.now().toString()
    };
    
    console.log('Setting user in App.js:', userWithId);
    
    setUser(userWithId);
    setUserType(userWithId.userType);
    setCurrentView('dashboard');
    localStorage.setItem('ecommerce_user', JSON.stringify(userWithId));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    localStorage.removeItem('ecommerce_user');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading EcommerceHub...</p>
      </div>
    );
  }

  if (currentView === 'dashboard' && user) {
    return <Dashboard userType={userType} user={user} onLogout={handleLogout} darkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
  }

  return (
    <div className="App">
      <header className="slide-up">
        <h1>EcommerceHub</h1>
      </header>

      <main>
        <div className="auth-container fade-in">
          <div className="auth-header">
            <button 
              className={`auth-tab ${currentView === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentView('login')}
            >
              Log In
            </button>
            <button 
              className={`auth-tab ${currentView === 'signup' ? 'active' : ''}`}
              onClick={() => setCurrentView('signup')}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-content">
            {currentView === 'login' ? 
              <LoginForm onLogin={handleLogin} /> : 
              <SignupForm onSignup={handleSignup} />
            }
          </div>
        </div>

        {currentView === 'signup' && (
          <div className="benefits-section slide-up">
            <h2>Why should you join EcommerceHub?</h2>
            <div className="benefits-grid">
              <div className="benefit-card">
                <h3>For Buyers</h3>
                <ul>
                  <li>Access to thousands of premium products</li>
                  <li>Secure payment with multiple options</li>
                  <li>Lightning-fast delivery nationwide</li>
                  <li>Hassle-free returns & full refunds</li>
                  <li>24/7 customer support</li>
                  <li>Exclusive deals and discounts</li>
                </ul>
              </div>
              <div className="benefit-card">
                <h3>For Sellers</h3>
                <ul>
                  <li>Reach millions of verified customers</li>
                  <li>Easy product listing with AI assistance</li>
                  <li>Advanced analytics & insights dashboard</li>
                  <li>Powerful marketing & promotion tools</li>
                  <li>Secure payment processing</li>
                  <li>Dedicated seller support team</li>
                </ul>
                </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 EcommerceHub. All rights reserved. | Crafted with ❤️ for seamless commerce</p>
      </footer>
    </div>
  );
}

export default App;