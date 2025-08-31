// src/pages/PrivacyPolicy.jsx
import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="page-container">
      <div className="privacy-container">
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Last updated: May 20, 2025</p>
        
        <section className="privacy-section intro-section contact-section">
          <p className="privacy-intro">
            This Privacy Policy describes how your personal information is collected, used, and shared when you visit or interact with our website.
          </p>
        </section>

        <section className="privacy-section contact-section">
          <h2 className="section-title">Information We Collect</h2>
          <p>
            We collect information about you when you register on our site, place an order, subscribe to our newsletter, or fill out a form.
          </p>
        </section>
        
        <section className="privacy-section contact-section">
          <h2 className="section-title">How We Use Your Information</h2>
          <p>
            We use the information we collect from you to personalize your experience, improve our website, process transactions, and send periodic emails.
          </p>
        </section>
        
        <section className="privacy-section contact-section">
          <h2 className="section-title">Sharing Your Information</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties unless required by law.
          </p>
        </section>
        
        <section className="privacy-section contact-section">
          <h2 className="section-title">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please <a href="/contact" className="privacy-link">contact us</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;