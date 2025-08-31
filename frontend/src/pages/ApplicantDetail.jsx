// src/pages/ApplicantDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import applicationService from '../services/applicationService';
import { getStatusClassName } from '../utils/helpers';
import './ApplicantDetail.css';

const ApplicantDetail = () => {
  const { applicantId } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchApplicant = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getApplication(applicantId);
        setApplicant(data);
        setStatus(data.status);
      } catch (err) {
        console.error(err);
        setError('Failed to load applicant');
      } finally {
        setLoading(false);
      }
    };
    fetchApplicant();
  }, [applicantId]);

  const handleStatusChange = async e => {
    const newStatus = e.target.value;
    try {
      await applicationService.updateApplicationStatus(applicantId, newStatus);
      setStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert('Status update failed');
    }
  };

  if (loading) return <div className="ad-loading">Loading applicant…</div>;
  if (error) return <div className="ad-error">{error}</div>;

  return (
    <div className="ad-container">
      <h1 className="ad-name">{applicant.jobseeker_name}</h1>
      <div className="ad-contact">
        <p><strong>Email:</strong> {applicant.jobseeker_email}</p>
        <p><strong>Title:</strong> {applicant.jobseeker_title}</p>
        <p><strong>Location:</strong> {applicant.jobseeker_location}</p>
        <p><strong>Applied:</strong> {new Date(applicant.applied_date).toLocaleDateString()}</p>
      </div>
      <div className="ad-about">
        <h3>About</h3>
        <p>{applicant.jobseeker_about}</p>
      </div>
      <div className="ad-skills">
        <h3>Skills</h3>
        <div className="ad-skill-list">
          {(applicant.jobseeker_skills || []).map((s,i) => (
            <span key={i} className="ad-skill">{s}</span>
          ))}
        </div>
      </div>
      <div className="ad-education">
        <h3>Education</h3>
        {(applicant.jobseeker_education || []).length > 0 ? (
          <ul>
            {applicant.jobseeker_education.map((edu, i) => (
              <li key={i}>
                <strong>{edu.degree}</strong> at {edu.institution} ({edu.start_date} - {edu.end_date || 'Present'})<br/>
                <span>{edu.field_of_study}</span><br/>
                <span>{edu.description}</span>
              </li>
            ))}
          </ul>
        ) : <p>No education listed.</p>}
      </div>
      <div className="ad-experience">
        <h3>Experience</h3>
        {(applicant.jobseeker_experience || []).length > 0 ? (
          <ul>
            {applicant.jobseeker_experience.map((exp, i) => (
              <li key={i}>
                <strong>{exp.title}</strong> at {exp.company} ({exp.start_date} - {exp.end_date || 'Present'})<br/>
                <span>{exp.location}</span><br/>
                <span>{exp.description}</span>
              </li>
            ))}
          </ul>
        ) : <p>No experience listed.</p>}
      </div>
      <div className="ad-social">
        <h3>Social Links</h3>
        {(applicant.jobseeker_social_links || []).length > 0 ? (
          <ul>
            {applicant.jobseeker_social_links.map((link, i) => (
              <li key={i}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.platform}</a></li>
            ))}
          </ul>
        ) : <p>No social links listed.</p>}
      </div>
      <div className="ad-resume">
        <a
          href={applicant.jobseeker_resume || '#'}
          className="ad-resume-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Resume
        </a>
      </div>
      <div className="ad-status">
        <label htmlFor="status">Status:</label>
        <select id="status" value={status} onChange={handleStatusChange}>
          {['New', 'Under Review', 'Shortlisted', 'Interviewed', 'Offer', 'Rejected', 'Hired', 'Withdrawn'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ApplicantDetail;