// src/pages/JobSearch.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import './JobSearch.css';

function JobSearch() {
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: ''
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Fetch all jobs on mount
  useEffect(() => {
    const fetchAllJobs = async () => {
      setIsSearching(true);
      setError('');
      try {
        const data = await jobService.getAllJobs();
        setResults(data.results || data);
      } catch (err) {
        setError('Unable to fetch jobs. Please try again.');
      } finally {
        setIsSearching(false);
      }
    };
    fetchAllJobs();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSearch = async e => {
    e.preventDefault();
    setIsSearching(true);
    setError('');
    try {
      const data = await jobService.searchJobs({
        search: filters.search,
        location: filters.location,
        employment_type: filters.jobType
      });
      setResults(data.results || data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch jobs. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = async jobId => {
    try {
      await applicationService.applyForJob({ job: jobId });
      alert('Application sent!');
    } catch {
      alert('Failed to apply. Try again later.');
    }
  };

  return (
    <div className="js-container">
      <h1>Find Your Next Opportunity</h1>

      <form className="js-form" onSubmit={handleSearch}>
        <div className="js-form-row">
          <div className="js-field">
            <label htmlFor="search" className="js-label">Keywords</label>
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Job title, skills, or company"
              value={filters.search}
              onChange={handleChange}
              className="js-input"
            />
          </div>

          <div className="js-field">
            <label htmlFor="location" className="js-label">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="City or remote"
              value={filters.location}
              onChange={handleChange}
              className="js-input"
            />
          </div>

          <div className="js-field">
            <label htmlFor="jobType" className="js-label">Job Type</label>
            <select
              id="jobType"
              name="jobType"
              value={filters.jobType}
              onChange={handleChange}
              className="js-input"
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full‑Time</option>
              <option value="part-time">Part‑Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="js-field js-field-btn">
            <button
              type="submit"
              className="js-btn"
              disabled={isSearching}
            >
              {isSearching ? 'Searching…' : 'Search Jobs'}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="js-error">{error}</div>}

      {results.length > 0 && (
        <>
          <h2 className="js-results-title">Job Matches ({results.length})</h2>
          <ul className="js-list">
            {results.map(job => (
              <li key={job.id} className="js-card">
                <div className="js-card-header">
                  <h3>{job.title}</h3>
                  <p className="js-company">{job.company_name}</p>
                </div>
                <p className="js-details">
                  {job.location} • {job.employment_type}
                </p>
                <div className="js-actions">
                  <Link to={`/jobs/${job.id}`} className="js-view-btn">
                    Details
                  </Link>
                  {job.company_id && (
                    <Link to={`/company/${job.company_id}`} className="js-view-btn" style={{background:'#38b000'}}>
                      View Company Profile
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default JobSearch;
