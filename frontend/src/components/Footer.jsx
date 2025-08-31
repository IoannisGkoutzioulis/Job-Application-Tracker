// src/components/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Simulate newsletter signup
    setNewsletterMsg('Thank you for subscribing!');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMsg(''), 3000);
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo" aria-label="Logo">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="22" fill="#4361ee"/>
                <text x="22" y="28" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">T.D.D</text>
            </svg>
          </span>
          <p className="footer-tagline">Empowering your job search journey.</p>
        </div>
        <div className="footer-links-section">
          <h4>Links</h4>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service">Terms of Service</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: info@techdojo.com</p>
          <p>Phone: +1 234 567 8901</p>
          <p>123 Main St, City, Country</p>
        </div>
        <div className="footer-newsletter">
          <h4>Newsletter</h4>
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder="Your email"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>
          {newsletterMsg && <div className="newsletter-msg">{newsletterMsg}</div>}
        </div>
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">🐦</a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">💼</a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">🐙</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Tech Dojo Defenders. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
