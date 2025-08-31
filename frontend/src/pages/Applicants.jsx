// src/pages/Applicants.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import applicationService from '../services/applicationService';
import { getStatusClassName } from '../utils/helpers';
import './Applicants.css';

const Applicants = () => {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        let data;
        if (jobId) {
          data = await applicationService.getJobApplications(jobId);
        } else {
          data = await applicationService.getCompanyApplications();
        }
        const applicantsArray = data?.results || data || [];
        setApplicants(Array.isArray(applicantsArray) ? applicantsArray : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load applicants.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [jobId]);

  const updateStatus = async (id, status) => {
    try {
      await applicationService.updateApplicationStatus(id, status);
      setApplicants(applicants.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error(err);
      alert('Unable to update status.');
    }
  };

  const filtered = applicants
    .filter(a => filter === 'all' || a.status === filter);

  const title = jobId
    ? `Applicants for ${filtered[0]?.job_title || ''}`
    : 'All Applicants';

  if (loading) return <div className="app-loading">Loading applicants…</div>;
  if (error) return <div className="app-error">{error}</div>;

  return (
    <div className="app-container">
      <h1 className="app-title">{title}</h1>
      <p className="app-subtitle">Review and manage applicants for your jobs</p>

      <div className="app-filters">
        {['all','New','Under Review','Shortlisted','Interviewed','Rejected','Hired','Withdrawn'].map(status => (
          <button
            key={status}
            className={filter === status ? 'app-filter active' : 'app-filter'}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
        {!jobId && (
          <select
            className="app-job-select"
            onChange={e => window.location.href = e.target.value === 'all'
              ? '/applicants'
              : `/applicants/${e.target.value}`
            }
          >
            <option value="all">All Jobs</option>
            {Array.from(new Set(applicants.map(a => a.job_id))).map(id => (
              <option key={id} value={id}>{applicants.find(a => a.job_id===id).job_title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="app-stats">
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.length}</div>
          <div className="app-stat-label">Total</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='New').length}</div>
          <div className="app-stat-label">New</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='Under Review').length}</div>
          <div className="app-stat-label">Under Review</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='Shortlisted').length}</div>
          <div className="app-stat-label">Shortlisted</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='Offer').length}</div>
          <div className="app-stat-label">Offer</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='Hired').length}</div>
          <div className="app-stat-label">Hired</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-count">{filtered.filter(a => a.status==='Withdrawn').length}</div>
          <div className="app-stat-label">Withdrawn</div>
        </div>
      </div>

      {filtered.length > 0 ? filtered.map(app => (
        <div key={app.id} className="app-card">
          <div className="app-card-header">
            <div>
              <h3>{app.jobseeker_name}</h3>
              <p>{app.jobseeker_email}</p>
              <div className="app-skills">
                {(app.jobseeker_skills || []).map((skill, i) => (
                  <span key={i} className="app-skill">{skill}</span>
                ))}
              </div>
              <p>Applied: {new Date(app.applied_date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className={`app-badge ${getStatusClassName(app.status)}`}>{app.status}</span>
            </div>
          </div>
          <p className="app-field"><strong>Job They Applied For:</strong> {app.job_title}</p>
          <div className="app-actions">
            <Link to={`/applicant/${app.id}`} className="app-btn view">View Details</Link>
            <select
              className="app-select"
              value={app.status}
              onChange={e=>updateStatus(app.id, e.target.value)}
            >
              <option>New</option>
              <option>Under Review</option>
              <option>Shortlisted</option>
              <option>Interviewed</option>
              <option>Rejected</option>
              <option>Hired</option>
              <option>Withdrawn</option>
            </select>
          </div>
        </div>
      )) : (
        <div className="app-empty">
          <p>No applicants found.</p>
          <Link to="/job-postings" className="app-btn back">Back to Job Postings</Link>
        </div>
      )}
    </div>
  );
};

export default Applicants;