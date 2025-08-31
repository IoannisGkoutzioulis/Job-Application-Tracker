// src/pages/About.jsx
import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="page-container">
      <div className="about-container">
        <h1 className="about-title">About Us</h1>
        
        <section className="about-section intro-section contact-section">
          <p className="about-intro">
            We are the Tech Dojo Defenders, simplifying the job application process. Our platform helps job seekers organize their applications and companies find the right talent. We believe in making the job search journey more efficient and less stressful for everyone involved.
          </p>
        </section>

        <section className="about-section mission-section contact-section">
          <h2 className="section-title">Our Mission</h2>
          <p>
            Our mission is to streamline the job application process by providing powerful tools for tracking, organizing, and analyzing your job search journey. We aim to help job seekers land their dream roles faster and assist companies in finding the perfect candidates.
          </p>
        </section>

        <section className="about-section team-section contact-section">
          <h2 className="section-title">Our Team</h2>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">DF</div>
              <h3>Despoina Falegkou</h3>
              <p className="team-role">Project Manager</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">IG</div>
              <h3>Ioannis Gkoutzioulis</h3>
              <p className="team-role">Full Stack Developer</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">DT</div>
              <h3>Dimitra Tsintali</h3>
              <p className="team-role">Backend Developer</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">SG</div>
              <h3>Stylianos Gakis</h3>
              <p className="team-role">Frontend Developer</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">AB</div>
              <h3>Antonis Bilbilis</h3>
              <p className="team-role">Tester</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;