// src/services/authService.js
import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/users/token/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (userData) => {
    try {
      console.log('Registering user with data:', userData);
      const response = await api.post('/users/register/', userData);
      console.log('Registration response:', response.data);
      
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Only attempt to call the server if we have a token
        await api.post('/users/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // We'll continue with local cleanup even if server logout fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};

export default authService;