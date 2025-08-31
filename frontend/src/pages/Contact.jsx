// src/pages/Contact.jsx
import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="page-container">
      <div className="contact-container">
        <h1 className="contact-title">Contact Us</h1>
        
        <section className="contact-section intro-section">
          <p className="contact-intro">
            If you have any questions or need assistance, please reach out
            to us using the information below.
          </p>
        </section>

        <div className="contact-info-grid">
          <section className="contact-section info-card">
            <h2 className="section-title">Our Office</h2>
            <p>123 Tech Way, Innovation District</p>
            <p>Thessaloniki, 54624</p>
            <p>Greece</p>
          </section>
          
          <section className="contact-section info-card">
            <h2 className="section-title">Email</h2>
            <p>support@techdojo.com</p>
          </section>
          
          <section className="contact-section info-card">
            <h2 className="section-title">Phone</h2>
            <p>+1 (555) 123-4567</p>
          </section>
        </div>

        <section className="contact-section form-section">
          <h2 className="section-title">Contact Form</h2>
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Your name"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Your email address"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message" 
                name="message" 
                rows="5" 
                placeholder="How can we help you?"
                className="form-textarea"
              />
            </div>
            
            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;