// src/components/CompanyDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import '../pages/Dashboard.css';

const CompanyDashboard = ({ user }) => {
  const [jobPostings, setJobPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch job postings
        const jobsResponse = await jobService.getCompanyJobs();
        const jobs = jobsResponse.results || jobsResponse;
        setJobPostings(jobs);
        
        // Fetch applications
        const applicationsResponse = await applicationService.getCompanyApplications();
        const applicationsData = applicationsResponse.results || applicationsResponse;
        setApplications(applicationsData);
        
        // Calculate stats
        const activeJobs = jobs.filter(job => job.status === 'active').length;
        const closedJobs = jobs.filter(job => job.status === 'closed').length;
        const totalApplications = applicationsData.length;
        
        setStats({
          activeJobs,
          closedJobs,
          totalApplications
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your dashboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="loading-container">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Company Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome back, {user.profile?.company_name || user.email}! Here's an overview of your job postings.
      </p>

      {/* Summary Section */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Postings</h3>
          <p className="summary-count">{jobPostings.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active</h3>
          <p className="summary-count">{stats.activeJobs}</p>
        </div>
        <div className="summary-card">
          <h3>Closed</h3>
          <p className="summary-count">{stats.closedJobs}</p>
        </div>
        <div className="summary-card">
          <h3>Total Applications</h3>
          <p className="summary-count">{stats.totalApplications}</p>
        </div>
      </div>

      {/* Recent Job Postings */}
      <div className="dashboard-recent">
        <h2>Recent Job Postings</h2>
        <div className="job-cards">
          {jobPostings.length > 0 ? (
            jobPostings.slice(0, 3).map((posting) => (
              <div key={posting.id} className="job-card">
                <h3>{posting.title}</h3>
                <p>
                  <strong>Applications:</strong>{' '}
                  <Link to={`/applicants/${posting.id}`} className="applications-link">
                    {posting.application_count || 0}
                  </Link>
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge ${posting.status}`}>
                    {posting.status.charAt(0).toUpperCase() + posting.status.slice(1)}
                  </span>
                </p>
                <p>
                  <strong>Date Posted:</strong> {new Date(posting.created_at).toLocaleDateString()}
                </p>
                <div className="job-card-actions">
                  <Link to={`/jobs/${posting.id}`} className="job-card-link">
                    View Details
                  </Link>
                  <Link to={`/edit-job/${posting.id}`} className="job-card-edit-link">
                    Edit
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data-message">You haven't posted any jobs yet.</p>
          )}
        </div>
        <div className="view-all">
          <Link to="/job-postings" className="view-all-link">
            View All Postings
          </Link>
          <Link to="/add-job" className="add-job-link">
            Post New Job
          </Link>
        </div>
      </div>

      {/* Recent Applicants Section */}
      <div className="dashboard-recent">
        <h2>Recent Applicants</h2>
        <div className="applicant-cards">
          {applications.length > 0 ? (
            applications.slice(0, 2).map((app) => (
              <div key={app.id} className="applicant-card">
                <div className="applicant-info">
                  <h3>{app.applicant_name}</h3>
                  <p>Applied for: <strong>{app.job_title}</strong></p>
                  <p>
                    Status: 
                    <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                      {app.status}
                    </span>
                  </p>
                  <p>Applied on: {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="applicant-actions">
                  <Link to={`/applicant/${app.id}`} className="applicant-link">
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data-message">You don't have any applicants yet.</p>
          )}
        </div>
        <div className="view-all">
          <Link to="/applicants" className="view-all-link">
            View All Applicants
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;