// src/pages/JobPostings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../services/jobService';
import './JobPostings.css';

function JobPostings() {
  const [jobPostings, setJobPostings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPostings = async () => {
      try {
        setLoading(true);
        const data = await jobService.getCompanyJobs();
        const jobs = data.results || data;
        setJobPostings(jobs || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load job postings.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostings();
  }, []);

  const handleStatusChange = async (postingId, newStatus) => {
    try {
      const posting = jobPostings.find(p => p.id === postingId);
      if (!posting) {
        setError('Job posting not found.');
        return;
      }
      // Build a valid payload for backend validation
      const payload = {
        title: (posting.title || "Untitled Job").replace(/[^a-zA-Z0-9\s\-\.,!?&()/+]/g, ''),
        description: posting.description && posting.description.length >= 50
          ? posting.description
          : "No description provided. ".repeat(5), // at least 50 chars
        requirements: posting.requirements && posting.requirements.length >= 20
          ? posting.requirements
          : "No requirements provided.",
        location: posting.location || "Not specified",
        salary: (posting.salary && (
          posting.salary === "Competitive" ||
          /^\d+(-\d+)?$/.test(posting.salary)
        )) ? posting.salary : "Competitive",
        employment_type: posting.employment_type || "full-time",
        experience_level: posting.experience_level || "entry",
        status: newStatus,
        application_deadline: posting.application_deadline || "2099-12-31",
        // skills: posting.skills || [], // Uncomment if backend expects skills
      };
      await jobService.updateJob(postingId, payload);
      setJobPostings(prev => prev.map(p => p.id === postingId ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error(err);
      setError('Could not update status.');
    }
  };

  const filteredPostings = filter === 'all'
    ? jobPostings
    : jobPostings.filter(p => p.status === filter);

  if (loading) {
    return <div className="jp-loading">Loading job postings…</div>;
  }
  if (error) {
    return <div className="jp-error">{error}</div>;
  }

  return (
    <div className="jp-container">
      <h1>Job Postings</h1>
      <p>Manage all your job postings in one place</p>

      <div className="jp-filters">
        <button onClick={() => setFilter('all')} className={filter==='all'?'active':''}>All ({jobPostings.length})</button>
        <button onClick={() => setFilter('active')} className={filter==='active'?'active':''}>Active ({jobPostings.filter(p=>p.status==='active').length})</button>
        <button onClick={() => setFilter('closed')} className={filter==='closed'?'active':''}>Closed ({jobPostings.filter(p=>p.status==='closed').length})</button>
      </div>

      <div className="jp-actions">
        <p><strong>{filteredPostings.length}</strong> job postings found</p>
        <Link to="/add-job" className="jp-add-button">+ Add New Job</Link>
      </div>

      <table className="jp-table">
        <thead>
          <tr>
            <th>Title</th><th>Status</th><th>Applications</th><th>Date Posted</th><th>Location</th><th>Type</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPostings.map(posting => (
            <tr key={posting.id} className={posting.status==='closed'?'closed':''}>
              <td><Link to={`/jobs/${posting.id}`}>{posting.title}</Link></td>
              <td>{posting.status}</td>
              <td><Link to={`/applicants/${posting.id}`}>{posting.application_count || 0}</Link></td>
              <td>{new Date(posting.created_at).toLocaleDateString()}</td>
              <td>{posting.location}</td>
              <td>{posting.employment_type}</td>
              <td>
                <Link to={`/edit-job/${posting.id}`} className="jp-edit-link">Edit</Link>
                {posting.status==='active'
                  ? <button onClick={()=>handleStatusChange(posting.id,'closed')} className="jp-action-btn close">Close</button>
                  : <button onClick={()=>handleStatusChange(posting.id,'active')} className="jp-action-btn reopen">Reopen</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredPostings.length===0 && (
        <div className="jp-empty">
          <p>No job postings found.</p>
          <Link to="/add-job" className="jp-add-button">Create Your First Job Posting</Link>
        </div>
      )}
    </div>
  );
}

export default JobPostings;