// src/pages/TermsOfService.jsx
import React from 'react';
import './TermsOfService.css';

const TermsOfService = () => {
  return (
    <div className="page-container">
      <div className="terms-container">
        <h1 className="terms-title">Terms of Service</h1>
        <p className="terms-updated">Last updated: May 20, 2025</p>
        
        <section className="terms-section intro-section contact-section">
          <p className="terms-intro">
            Welcome to Tech Dojo Defenders! These Terms of Service govern your use of our website and services.
            By accessing or using our website, you agree to these terms. Please read them carefully.
          </p>
        </section>

        <section className="terms-section contact-section">
          <h2 className="section-title">Acceptance of Terms</h2>
          <p>
            By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            If you do not agree, please do not use our website.
          </p>
        </section>
        
        <section className="terms-section contact-section">
          <h2 className="section-title">Modifications to the Terms</h2>
          <p>
            We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the site constitutes your acceptance of any changes.
          </p>
        </section>
        
        <section className="terms-section contact-section">
          <h2 className="section-title">User Responsibilities</h2>
          <p>
            You agree to use our website and services only for lawful purposes and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of this site by any third party.
          </p>
        </section>
        
        <section className="terms-section contact-section">
          <h2 className="section-title">Limitation of Liability</h2>
          <p>
            In no event shall Tech Dojo Defenders be liable for any indirect, incidental, special, consequential or punitive damages arising out of your access to, or use of, our website.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;