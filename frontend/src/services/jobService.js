// src/services/jobService.js
import api from './api';

const jobService = {
  getAllJobs: async (params) => {
    const response = await api.get('/jobs/', { params });
    return response.data.data;
  },
  
  getJob: async (id) => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data.data;
  },
  
  createJob: async (jobData) => {
    const response = await api.post('/jobs/create/', jobData);
    return response.data.data;
  },
  
  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}/update/`, jobData);
    return response.data.data;
  },
  
  updateJobStatus: async (id, status) => {
    const response = await api.put(`/jobs/${id}/update/`, { status });
    return response.data.data;
  },
  
  searchJobs: async (params) => {
    const response = await api.get('/jobs/search/', { params });
    return response.data.data;
  },
  
  getCompanyJobs: async () => {
    const response = await api.get('/jobs/company/');
    return response.data.data;
  }
};

export default jobService;