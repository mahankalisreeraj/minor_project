import React from 'react';
import BuyerDashboard from './BuyerDashboard';
import SellerDashboard from './SellerDashboard'; 

const Dashboard = ({ userType, user, onLogout, darkMode, toggleDarkMode }) => {
  if (userType === 'buyer') {
    return <BuyerDashboard user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  } else {
    return <SellerDashboard user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }
};

export default Dashboard;