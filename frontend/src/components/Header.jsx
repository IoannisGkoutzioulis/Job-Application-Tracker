// src/components/Header.jsx
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const Header = () => {
  // grab these directly from your AuthProvider
  const { currentUser, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const isLoggedIn = Boolean(currentUser);
  
  // Get current location to check which page we're on
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if we're on any of the pages where auth links should be hidden
  const isAuthRelatedPage = 
    currentPath === '/' ||      // Landing page
    currentPath === '/login' || // Login page
    currentPath === '/register'; // Register page
  
  // Hide auth links on landing, login, and register pages for non-logged in users
  const showAuthLinks = !(isAuthRelatedPage && !isLoggedIn);

  // Get user's display name with fallback options
  const displayName = currentUser?.first_name || 
                     currentUser?.profile?.full_name || 
                     currentUser?.email?.split('@')[0] || 
                     'User';

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="header-logo">
          Job Application Tracker
        </Link>

        <nav className="navbar">
          {isLoggedIn ? (
            <>
              <div className="nav-links">
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Hello, {displayName}
                </span>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                {currentUser.user_type === 'company' ? (
                  <>
                    <Link to="/job-postings" className="nav-link">
                      Job Postings
                    </Link>
                    <Link to="/add-job" className="nav-link">
                      Add New
                    </Link>
                    <Link to="/applicants" className="nav-link">
                      Applicants
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/jobs" className="nav-link">
                      My Applications
                    </Link>
                    <Link to="/job-search" className="nav-link">
                      Search Jobs
                    </Link>
                  </>
                )}
                <Link to="/profile" className="nav-link">Profile</Link>
              </div>
              <div className="header-actions">
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
                <button 
                  onClick={toggleTheme} 
                  className="theme-toggle"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </>
          ) : (
            showAuthLinks && (
              <div className="nav-links">
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;