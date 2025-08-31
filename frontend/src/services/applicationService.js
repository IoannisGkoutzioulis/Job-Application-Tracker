// src/services/applicationService.js
import api from './api';

const applicationService = {
  // Fetch all applications for the current jobseeker
  getJobseekerApplications: async () => {
    const res = await api.get('/applications/jobseeker/');
    return res.data.data;
  },

  // Fetch all applications for the current company
  getCompanyApplications: async () => {
    const res = await api.get('/applications/company/');
    return res.data.data;
  },

  // Fetch applications for a specific job (used in Applicants.jsx)
  getJobApplications: async (jobId) => {
    const res = await api.get(`/applications/job/${jobId}/`);
    return res.data.data;
  },

  // Fetch one application detail by ID
  getApplication: async (id) => {
    const res = await api.get(`/applications/${id}/`);
    return res.data.data;
  },

  // Update an application's status
  updateApplicationStatus: async (id, status) => {
    const res = await api.put(`/applications/${id}/status/`, { status });
    return res.data.data;
  },

  applyForJob: async (payload) => {
    // payload should include at least { job: jobId, resume: File }
    const formData = new FormData();
    Object.keys(payload).forEach(key => {
      formData.append(key, payload[key]);
    });
    const res = await api.post('/applications/apply/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  }
};

export default applicationService;