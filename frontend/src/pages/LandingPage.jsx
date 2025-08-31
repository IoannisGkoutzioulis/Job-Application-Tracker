// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import dashboardPreviewLight from '../assets/dashboard-preview-light.png';
import dashboardPreviewDark from '../assets/dashboard-preview-dark.png';
import companyDashboardLight from '../assets/company-dashboard-light.png';
import companyDashboardDark from '../assets/company-dashboard-dark.png';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  // Define all your carousel images with light and dark versions
  const carouselImages = [
    {
      light: dashboardPreviewLight,
      dark: dashboardPreviewDark,
      alt: 'Dashboard Preview',
      caption: 'Track all your applications in one place'
    },
    {
      light: companyDashboardLight,
      dark: companyDashboardDark,
      alt: 'Company Dashboard',
      caption: 'Manage company information and contacts'
    }
  ];

  // State to track the current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Effect to change the image every 5 seconds
  useEffect(() => {
    // Only run the carousel if we have more than one image
    if (carouselImages.length <= 1) return;
    
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [carouselImages.length]);

  return (
    <div className="landing-container">
      <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        {isDarkMode ? '🌙' : '☀️'}
      </button>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Track Your Job Search Journey</h1>
          <p>Organize applications, monitor progress, and land your dream job faster.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
          </div>
        </div>
        <div className="hero-image-carousel">
          {carouselImages.map((image, index) => (
            <div 
              key={index}
              className={`carousel-item ${index === currentImageIndex ? 'active' : ''}`}
            >
              <img src={isDarkMode ? image.dark : image.light} alt={image.alt} />
              <div className="carousel-caption">{image.caption}</div>
            </div>
          ))}
          
          {/* Navigation dots */}
          <div className="carousel-dots">
            {carouselImages.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Features to Enhance Your Job Search</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Applications</h3>
            <p>Keep all your job applications organized in one place with status updates.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Interview Scheduler</h3>
            <p>Never miss an interview with our built-in scheduling tools.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Resume Management</h3>
            <p>Store different versions of your resume for various job applications.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Progress Analytics</h3>
            <p>Visualize your job search progress with insightful analytics.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-text">
              "This app helped me organize my job search and land my dream role within two months!"
            </div>
            <div className="testimonial-author">- Alex Johnson, Software Engineer</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-text">
              "The dashboard makes it so easy to track where I am in the application process for each company."
            </div>
            <div className="testimonial-author">- Jamie Smith, Marketing Specialist</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-text">
              "I love how I can see all my applications at a glance and get reminders about following up."
            </div>
            <div className="testimonial-author">- Taylor Williams, Project Manager</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Streamline Your Job Search?</h2>
        <p>Join thousands of job seekers who have found success with our platform.</p>
        <Link to="/register" className="btn btn-primary btn-large">Create Free Account</Link>
      </section>
    </div>
  );
};

export default LandingPage;