// src/pages/Profile.jsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import profileService from '../services/profileService';
import JobSeekerProfile from './JobSeekerProfile';
import CompanyProfile from './CompanyProfile';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use useCallback to create a memoized fetchProfile function that can be reused
  const fetchProfile = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    console.log('DEBUGGING - fetchProfile called');
    setLoading(true);
    setError('');
    
    try {
      console.log('DEBUGGING - Fetching profile for user:', currentUser.email);
      const startTime = Date.now();
      const response = await profileService.getUserProfile();
      const endTime = Date.now();
      console.log(`DEBUGGING - Profile fetch took ${endTime - startTime}ms`);
      console.log('DEBUGGING - Profile data received:', JSON.stringify(response, null, 2));
      
      // Enhance the profile object with user data
      let enhancedProfile;
      if (response.profile) {
        // If backend returns a nested profile, merge root and profile
        enhancedProfile = {
          ...response.profile,
          ...response,
          email: response.email || currentUser.email,
          phone: response.phone || currentUser.phone
        };
      } else {
        enhancedProfile = {
          ...response,
          email: response.email || currentUser.email,
          phone: response.phone || currentUser.phone
        };
      }
      console.log('DEBUGGING - Enhanced profile:', JSON.stringify(enhancedProfile, null, 2));
      setProfile(enhancedProfile);
      setLoading(false);
    } catch (err) {
      console.error('DEBUGGING - Error fetching profile:', err);
      
      // Add more detailed error information
      let errorMessage = 'Failed to load profile.';
      if (err.response) {
        errorMessage += ` Server returned: ${err.response.status}`;
        console.error('DEBUGGING - Response data:', err.response.data);
        if (err.response.data && err.response.data.message) {
          errorMessage += ` - ${err.response.data.message}`;
        }
      } else if (err.request) {
        errorMessage += ' No response received from server.';
        console.error('DEBUGGING - Request sent but no response:', err.request);
      } else {
        errorMessage += ` ${err.message}`;
      }
      
      console.error('DEBUGGING - Final error message:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  }, [currentUser]);

  // Initial profile fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Pass the refreshProfile function to child components
  const refreshProfile = () => {
    console.log('Manual profile refresh requested');
    fetchProfile();
  };

  if (!currentUser) {
    return (
      <div className="profile-container">
        <h1 className="profile-title">Profile</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-indicator">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={fetchProfile}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return currentUser.user_type === 'jobseeker' ? (
    <JobSeekerProfile 
      profile={profile?.profile || {}} 
      userData={profile} 
      refreshProfile={refreshProfile} 
    />
  ) : (
    <CompanyProfile 
      profile={profile} 
      userData={profile} 
      refreshProfile={refreshProfile} 
    />
  );
};

export default Profile;