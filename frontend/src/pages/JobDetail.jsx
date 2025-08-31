// src/pages/JobDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import { AuthContext } from '../context/AuthContext';
import profileService from '../services/profileService';
import './JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Application form state (for jobseekers)
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await jobService.getJob(id);
        setJob(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Fetch user profile on mount (for resume check)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getUserProfile();
        setUserProfile(data);
      } catch (err) {
        // Ignore error, just don't show apply button
      }
    };
    if (currentUser?.user_type === 'jobseeker') {
      fetchProfile();
    }
  }, [currentUser]);

  // Check if user has already applied to this job
  useEffect(() => {
    const checkAlreadyApplied = async () => {
      try {
        const applications = await applicationService.getJobseekerApplications();
        console.log('DEBUG: applications fetched for alreadyApplied check:', applications);
        console.log('DEBUG: current jobId:', id);
        const appList = applications.results || applications;
        if (appList.some(app => String(app.job) === String(id) || String(app.job_id) === String(id))) {
          setAlreadyApplied(true);
        }
      } catch (err) {
        // Ignore error
      }
    };
    if (currentUser?.user_type === 'jobseeker') {
      checkAlreadyApplied();
    }
  }, [currentUser, id]);

  const handleResumeChange = e => {
    const file = e.target.files[0];
    setResumeFile(file);
  };

  const handleApply = async e => {
    e.preventDefault();
    if (!resumeFile) {
      setApplyError('Please upload your resume to apply.');
      return;
    }
    setApplyError('');
    setApplying(true);
    try {
      const payload = { job: id, resume: resumeFile };
      await applicationService.applyForJob(payload);
      setAppliedSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.detail && err.response.data.detail.includes('already applied')) {
        setApplyError('You have already applied to this job.');
      } else {
        setApplyError('Application failed. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  // Helper to get company ID from job object (handles object or primitive)
  const getCompanyId = (job) => {
    const val = job.company_id || job.company || job.company_profile;
    if (typeof val === 'object' && val !== null) {
      return val.id || val._id;
    }
    return val;
  };

  if (loading) return <div className="jd-loading">Loading job…</div>;
  if (error) return <div className="jd-error">{error}</div>;

  return (
    <div className="jd-container">
      <h1 className="jd-title">{job.title}</h1>
      <div className="jd-meta">
        <span>{job.location}</span> • <span>{job.employment_type}</span>
      </div>
      {getCompanyId(job) && (
        <div style={{marginBottom: '1rem'}}>
          <a href={`/company/${getCompanyId(job)}`} className="jd-view-company-btn">View Company Profile</a>
        </div>
      )}
      <section className="jd-section">
        <h3>Description</h3>
        <p>{job.description}</p>
      </section>
      <section className="jd-section">
        <h3>Requirements</h3>
        <p>{job.requirements}</p>
      </section>
      <section className="jd-section">
        <h3>Salary</h3>
        <p>{job.salary || 'Not specified'}</p>
      </section>
      <section className="jd-section">
        <h3>Deadline</h3>
        <p>{new Date(job.application_deadline).toLocaleDateString()}</p>
      </section>

      {currentUser?.user_type === 'jobseeker' && (
        <div className="jd-apply">
          <h3>Apply for this job</h3>
          {alreadyApplied ? (
            <p className="jd-success">You have already applied to this job.</p>
          ) : appliedSuccess ? (
            <p className="jd-success">Your application has been submitted!</p>
          ) : (
            <form onSubmit={handleApply} className="jd-form">
              {applyError && <div className="jd-form-error">{applyError}</div>}
              <label htmlFor="resume-upload">Upload Resume (PDF, DOCX, etc.):</label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                onChange={handleResumeChange}
                required
              />
              <button type="submit" disabled={applying} className="jd-apply-btn">
                {applying ? 'Applying…' : 'Apply'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetail;
