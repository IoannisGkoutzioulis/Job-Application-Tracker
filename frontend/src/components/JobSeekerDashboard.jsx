// src/components/JobSeekerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import applicationService from '../services/applicationService';
import '../pages/Dashboard.css';
import { Button, Box, Typography } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PsychologyIcon from '@mui/icons-material/Psychology';

const JobSeekerDashboard = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  });

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const response = await applicationService.getJobseekerApplications();
        const applicationsData = response.results || response;
        setApplications(applicationsData);
        
        // Calculate stats
        const counts = applicationsData.reduce((acc, app) => {
          const status = app.status.toLowerCase();
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          applied: counts['new'] || 0,
          interview: counts['interviewed'] || 0,
          offer: counts['offer'] || 0,
          rejected: counts['rejected'] || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (isLoading) {
    return <div className="loading-container">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1 className="dashboard-title">Job Seeker Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back, {user.profile?.full_name || user.email}! Here's an overview of your job applications.
        </p>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/analytics"
            startIcon={<AnalyticsIcon />}
          >
            View Analytics
          </Button>
          <Button
            variant="contained"
            color="secondary"
            component={Link}
            to="/interview-prep"
            startIcon={<PsychologyIcon />}
          >
            Interview Prep
          </Button>
        </Box>

        {/* Application Status Summary */}
        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Applied</h3>
            <p className="summary-count">{stats.applied}</p>
          </div>
          <div className="summary-card">
            <h3>Interview</h3>
            <p className="summary-count">{stats.interview}</p>
          </div>
          <div className="summary-card">
            <h3>Offer</h3>
            <p className="summary-count">{stats.offer}</p>
          </div>
          <div className="summary-card">
            <h3>Rejected</h3>
            <p className="summary-count">{stats.rejected}</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="dashboard-recent">
          <h2>Recent Applications</h2>
          <div className="application-cards">
            {applications.length > 0 ? (
              applications.slice(0, 3).map((app) => (
                <div key={app.id} className="application-card">
                  <h3 className="position-title">{app.job_title}</h3>
                  <p className="company-name">{app.company_name}</p>
                  <div className="application-details">
                    <p>
                      <span className="detail-label">Status:</span> 
                      <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                        {app.status}
                      </span>
                    </p>
                    <p><span className="detail-label">Location:</span> {app.location}</p>
                    <p>
                      <span className="detail-label">Applied:</span> 
                      {new Date(app.applied_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="card-actions">
                    <Link to={`/jobs/${app.job_id}`} className="view-details-button">
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data-message">You haven't applied to any jobs yet.</p>
            )}
          </div>
          <div className="view-all">
            <Link to="/jobs" className="view-all-link">
              View All Applications
            </Link>
            <Link to="/job-search" className="search-jobs-link">
              Search Jobs
            </Link>
          </div>
        </div>

        {/* Job Search Activity */}
            <div className="completion-tips">
              <h3>Tips to Improve Your Profile</h3>
              <ul className="tips-list">
                <li>Add your work experience</li>
                <li>Upload your resume</li>
                <li>Add your education history</li>
                <li>List your skills</li>
              </ul>
            </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;