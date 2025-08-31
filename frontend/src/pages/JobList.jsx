// src/pages/JobList.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import applicationService from "../services/applicationService";
import { AuthContext } from "../context/AuthContext";
import { getStatusClassName } from "../utils/helpers";
import "./JobList.css";

const JobList = () => {
  const { currentUser } = useContext(AuthContext);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getJobseekerApplications();
        const applicationsData = data.results || data;
        setApplications(applicationsData || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await applicationService.updateApplicationStatus(id, status);
      setApplications(apps =>
        apps.map(a => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error(err);
      setError("Could not update status.");
    }
  };

  const filtered = filter === "all"
    ? applications
    : applications.filter(a => a.status === filter);

  const searchFiltered = searchTerm
    ? filtered.filter(a =>
        [a.job_title, a.company_name, a.location]
          .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : filtered;

  if (loading) return <div className="jl-loading">Loading applications…</div>;
  if (error)   return <div className="jl-error">{error}</div>;

  return (
    <div className="jl-container">
      <h1 className="jl-title">My Job Applications</h1>

      <div className="jl-actions">
        <input
          type="text"
          placeholder="Search by company, position..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="jl-search-input"
        />
        <Link to="/job-search" className="jl-add-btn">+ Add New Application</Link>
      </div>

      <div className="jl-filters">
        {['all', 'New', 'Under Review', 'Shortlisted', 'Interviewed', 'Offer', 'Rejected', 'Hired', 'Withdrawn'].map(f => (
          <button
            key={f}
            className={`jl-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {searchFiltered.length > 0 ? (
        <div className="jl-list">
          {searchFiltered.map(app => (
            <div key={app.id} className="jl-card">
              <div className="jl-header">
                <h2 className="jl-position">{app.job_title}</h2>
                <span className={`jl-badge ${getStatusClassName(app.status)}`}>
                  {app.status}
                </span>
              </div>
              <div className="jl-company">{app.company_name}</div>
              <div className="jl-location">{app.location}</div>
              <div className="jl-details">
                <div><span className="jl-detail-label">Applied:</span> {new Date(app.applied_date).toLocaleDateString()}</div>
                <div><span className="jl-detail-label">Salary:</span> {app.salary || "Not specified"}</div>
              </div>
              <div className="jl-actions-btns">
                <Link to={`/jobs/${app.job_id}`} className="jl-view-btn">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="jl-empty">
          <p>No applications match your filters.</p>
          <Link to="/job-search">Search for Jobs</Link>
        </div>
      )}
    </div>
  );
};

export default JobList;