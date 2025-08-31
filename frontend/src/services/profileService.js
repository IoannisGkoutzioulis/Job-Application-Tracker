// src/services/profileService.js
import api from './api';

const profileService = {
  // Fetches the logged-in user's profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile/');
      if (!response.data.data) {
        throw new Error('Profile data is missing in the response');
      }
      return response.data.data; // Only use backend data
    } catch (error) {
      throw error;
    }
  },

  // Updates jobseeker profile; handles file upload for resume and profile image
  updateJobseekerProfile: async (profileData) => {
    try {
      const formData = new FormData();
      let hasFileUploads = false;
      Object.keys(profileData).forEach(key => {
        const value = profileData[key];
        if (key === 'resume' || key === 'profile_image' && value instanceof File) {
          formData.append(key, value);
          hasFileUploads = true;
        } else {
          formData.append(key, value);
        }
      });
      const response = await api.put(
        '/users/profile/jobseeker/update/',
        formData,
        {
          headers: {
            'Content-Type': hasFileUploads ? 'multipart/form-data' : 'application/json'
          },
          timeout: 60000
        }
      );
      if (!response.data.data) {
        throw new Error('Updated profile data is missing in the response');
      }
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Updates company profile; handles file upload for logo
  updateCompanyProfile: async (profileData) => {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      const value = profileData[key];
      if (key === 'company_logo') {
        if (value instanceof File) {
          formData.append(key, value);
        }
        // Omit company_logo if not a File (prevents backend error)
      } else if (key === 'profile_image') {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else {
        formData.append(key, value);
      }
    });
    const response = await api.put(
      '/users/profile/company/update/',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  // Skills functions
  getJobseekerSkills: async () => {
    const response = await api.get('/users/profile/skills/');
    return response.data.data;
  },

  addSkill: async (skillName) => {
    const response = await api.post('/users/profile/skills/', { name: skillName });
    return response.data.data;
  },

  deleteSkill: async (skillId) => {
    const response = await api.delete(`/users/profile/skills/${skillId}/`);
    return response.data.data;
  },

  // Experience functions
  getExperiences: async () => {
    const response = await api.get('/users/profile/experience/');
    return response.data.data;
  },

  addExperience: async (experienceData) => {
    const response = await api.post('/users/profile/experience/', experienceData);
    return response.data.data;
  },

  updateExperience: async (experienceId, experienceData) => {
    const response = await api.put(`/users/profile/experience/${experienceId}/`, experienceData);
    return response.data.data;
  },

  deleteExperience: async (experienceId) => {
    const response = await api.delete(`/users/profile/experience/${experienceId}/`);
    return response.data.data;
  },

  // Education functions
  getEducations: async () => {
    const response = await api.get('/users/profile/education/');
    return response.data.data;
  },

  addEducation: async (educationData) => {
    const response = await api.post('/users/profile/education/', educationData);
    return response.data.data;
  },

  updateEducation: async (educationId, educationData) => {
    const response = await api.put(`/users/profile/education/${educationId}/`, educationData);
    return response.data.data;
  },

  deleteEducation: async (educationId) => {
    const response = await api.delete(`/users/profile/education/${educationId}/`);
    return response.data.data;
  },

  // Social Links CRUD
  getSocialLinks: async () => {
    const res = await api.get('/users/profile/social-links/');
    return res.data.data?.results || res.data.data;
  },
  addSocialLink: async (platform, url) => {
    const res = await api.post('/users/profile/social-links/', { platform, url });
    return res.data.data;
  },
  updateSocialLink: async (id, platform, url) => {
    const res = await api.put(`/users/profile/social-links/${id}/`, { platform, url });
    return res.data.data;
  },
  deleteSocialLink: async (id) => {
    const res = await api.delete(`/users/profile/social-links/${id}/`);
    return res.data.data;
  },

  // Fetches a company profile by ID
  getCompanyProfile: async (companyId) => {
    try {
      const response = await api.get(`/users/profile/company/${companyId}/`);
      if (!response.data.data) {
        throw new Error('Company profile data is missing in the response');
      }
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService;