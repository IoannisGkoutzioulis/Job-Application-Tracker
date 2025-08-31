// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://job-application-tracker-xuyf.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Log the request
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });

    // Add token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log the error
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: originalRequest?.headers
    });
    
    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make API calls
export const makeApiCall = async (method, endpoint, data = null) => {
  try {
    const response = await api({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`API call failed (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

export default api;
