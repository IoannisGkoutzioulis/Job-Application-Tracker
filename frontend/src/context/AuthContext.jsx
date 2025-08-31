// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already logged in
    const user = authService.getCurrentUser();
    if (user) {
      console.log("User data in AuthContext:", user);
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    window.location.href = '/login';
  };
  
  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};