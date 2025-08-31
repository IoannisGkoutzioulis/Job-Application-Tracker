import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jobService from '../services/jobService';
import './AddJobForm.css';

const EditJobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    employment_type: 'full-time',
    experience_level: 'entry',
    application_deadline: '',
    skills: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await jobService.getJob(id);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          requirements: data.requirements || '',
          location: data.location || '',
          salary: data.salary || '',
          employment_type: data.employment_type || 'full-time',
          experience_level: data.experience_level || 'entry',
          application_deadline: data.application_deadline || '',
          skills: data.skills ? data.skills.map(s => s.name) : []
        });
      } catch (err) {
        setError('Failed to load job data.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValidSalary = (salary) => {
    if (!salary) return true;
    if (["Competitive", "Negotiable"].includes(salary)) return true;
    if (/^\d+$/.test(salary)) return true;
    if (/^\d+\s*-\s*\d+$/.test(salary)) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // If salary is empty or null, set it to an empty string
    const submitData = { ...formData };
    if (!submitData.salary) {
      submitData.salary = "";
    }
    if (!isValidSalary(submitData.salary)) {
      setError('Salary must be a number, a range (e.g., 50000-70000), or "Competitive".');
      return;
    }
    setIsSubmitting(true);
    try {
      await jobService.updateJob(id, submitData);
      navigate('/job-postings');
    } catch (err) {
      console.error(err);
      setError('Failed to update job. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="add-job-container">Loading job data…</div>;
  }

  return (
    <div className="add-job-container">
      <h1>Edit Job Posting</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} className="add-job-form">
        {/* Title */}
        <div className="form-group">
          <label>Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        {/* Description */}
        <div className="form-group">
          <label>Job Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        {/* Requirements */}
        <div className="form-group">
          <label>Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            required
          />
        </div>
        {/* Location & Salary */}
        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Salary <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.95em' }}>
                (number, range like 1000-1000000, "Competitive", or "Negotiable")
              </span>
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder='e.g., 1000-1000000, Competitive, or Negotiable'
            />
          </div>
        </div>
        {/* Employment Type & Experience Level */}
        <div className="form-row">
          <div className="form-group">
            <label>Employment Type</label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Experience Level</label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive Level</option>
            </select>
          </div>
        </div>
        {/* Deadline */}
        <div className="form-group">
          <label>Application Deadline</label>
          <input
            type="date"
            name="application_deadline"
            value={formData.application_deadline}
            onChange={handleChange}
            required
          />
        </div>
        {/* Submit */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditJobForm; 