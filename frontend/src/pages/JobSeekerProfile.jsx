import React, { useState, useEffect } from 'react';
import profileService from '../services/profileService';
import './Profile.css';

const JobSeekerProfile = ({ profile: initialProfile, userData, refreshProfile }) => {
  // Create a combined state that includes both user and jobseeker data
  const [profile, setProfile] = useState({
    ...userData,
    ...initialProfile
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // New state variables for editable features
  const [skillInput, setSkillInput] = useState('');
  const [tempSkills, setTempSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [currentEducation, setCurrentEducation] = useState(null);
  const [experienceFormData, setExperienceFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });
  const [educationFormData, setEducationFormData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });

  // Social platform icons (SVG or font-awesome, here as placeholders)
  const SOCIAL_PLATFORMS = [
    { key: 'linkedin', label: 'LinkedIn', icon: <i className="fab fa-linkedin"></i> },
    { key: 'github', label: 'GitHub', icon: <i className="fab fa-github"></i> },
    { key: 'twitter', label: 'Twitter', icon: <i className="fab fa-twitter"></i> },
    { key: 'facebook', label: 'Facebook', icon: <i className="fab fa-facebook"></i> },
    { key: 'instagram', label: 'Instagram', icon: <i className="fab fa-instagram"></i> },
  ];

  // Social Links state
  const [socialLinks, setSocialLinks] = useState([]);
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialForm, setSocialForm] = useState({ platform: '', url: '' });
  const [platformToAdd, setPlatformToAdd] = useState('');

  const resumeInputRef = React.useRef();

  // Debug profile data
  useEffect(() => {
    console.log("Complete profile data:", profile);
  }, [profile]);

  // Initialize profile from props
  useEffect(() => {
    if (initialProfile || userData) {
      setProfile(prev => ({
        ...prev,
        ...userData,
        ...initialProfile
      }));
    }
  }, [initialProfile, userData]);

  // Initialize edit form data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Reset success message when entering edit mode
      setSaveSuccess(false);
      
      // Initialize tempSkills from profile.skills
      if (Array.isArray(profile?.skills)) {
        setTempSkills(profile.skills.map(skill => ({ 
          id: typeof skill === 'object' ? skill.id : null, 
          name: typeof skill === 'object' ? skill.name : skill 
        })));
      } else {
        setTempSkills([]);
      }
      
      // Make sure experiences is always an array
      if (Array.isArray(profile?.experience)) {
        setExperiences(profile.experience);
      } else {
        setExperiences([]); // Initialize as empty array
        loadExperiences();
      }
      
      // Similar check for educations
      if (Array.isArray(profile?.education)) {
        setEducations(profile.education);
      } else {
        setEducations([]); // Initialize as empty array
        loadEducations();
      }

      // Initialize socialLinks from profile.social_links
      if (Array.isArray(profile?.social_links)) {
        setSocialLinks(profile.social_links);
      } else {
        setSocialLinks([]);
      }
    }
  }, [isEditing, profile]);

  // Load social links on mount or when editing
  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const links = await profileService.getSocialLinks();
        setSocialLinks(Array.isArray(links) ? links : []);
      } catch (err) {
        setSocialLinks([]);
      }
    };
    loadSocialLinks();
  }, [saveSuccess, profile, isEditing]);

  // Data loading functions
  const loadExperiences = async () => {
    try {
      const response = await profileService.getExperiences();
      if (response) {
        setExperiences(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      console.error('Failed to load experiences:', err);
      setError('Failed to load experience data.');
      setExperiences([]);
    }
  };

  const loadEducations = async () => {
    try {
      const response = await profileService.getEducations();
      if (response) {
        setEducations(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      console.error('Failed to load educations:', err);
      setError('Failed to load education data.');
      setEducations([]);
    }
  };

  // Basic form input handlers
  const handleInputChange = e => {
    const { name, value } = e.target;
    // Don't set 'undefined' as a string value
    setProfile(prev => ({ 
      ...prev, 
      [name]: value === "undefined" ? "" : value 
    }));
  };

  const handleResumeUpload = e => {
    const file = e.target.files[0];
    if (file) setProfile(prev => ({ ...prev, resume: file }));
  };

  const handleProfileImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload an image file (JPEG, PNG, GIF)');
        return;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      setProfile(prev => ({ ...prev, profile_image: file }));
      setError('');
    }
  };

  // Skills management
  const handleAddSkill = async () => {
    if (skillInput.trim()) {
      try {
        const addedSkill = await profileService.addSkill(skillInput.trim());
        setTempSkills([...tempSkills, addedSkill]);
      setSkillInput('');
      } catch (err) {
        setError('Failed to add skill.');
        console.error('Failed to add skill:', err);
      }
    }
  };

  const handleRemoveSkill = async (index) => {
    try {
      const skillToRemove = tempSkills[index];
      if (skillToRemove && skillToRemove.id) {
        await profileService.deleteSkill(skillToRemove.id);
      }
    const updatedSkills = [...tempSkills];
    updatedSkills.splice(index, 1);
    setTempSkills(updatedSkills);
    } catch (err) {
      setError('Failed to delete skill.');
      console.error('Failed to delete skill:', err);
    }
  };

  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
  };

  const handleSkillInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Experience management
  const handleExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExperienceFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If current position is checked, clear end date
    if (name === 'is_current' && checked) {
      setExperienceFormData(prev => ({ ...prev, end_date: '' }));
    }
  };

  const resetExperienceForm = () => {
    setExperienceFormData({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    });
    setCurrentExperience(null);
  };

  const openExperienceForm = (exp = null) => {
    if (exp) {
      // Edit mode - populate form with experience data
      setExperienceFormData({
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        start_date: exp.start_date || '',
        end_date: exp.end_date || '',
        is_current: exp.is_current || false,
        description: exp.description || ''
      });
      setCurrentExperience(exp);
    } else {
      // Add mode
      resetExperienceForm();
    }
    setShowExperienceForm(true);
  };

  const closeExperienceForm = () => {
    setShowExperienceForm(false);
    resetExperienceForm();
  };

  const handleExperienceSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload
      const payload = { ...experienceFormData };
      if (payload.is_current) {
        // If current position, remove end_date from payload
        delete payload.end_date;
      }
  
      let response;
      if (currentExperience && currentExperience.id) {
        // Update existing
        response = await profileService.updateExperience(
          currentExperience.id, 
          payload
        );
        const updatedExperiences = experiences.map(exp => 
          exp.id === currentExperience.id ? response : exp
        );
        setExperiences(updatedExperiences);
      } else {
        // Add new
        response = await profileService.addExperience(payload);
        setExperiences([...experiences, response]);
      }
      closeExperienceForm();
    } catch (err) {
      console.error('Failed to save experience:', err);
      setError('Failed to save experience data.');
    }
  };

  const handleDeleteExperience = async (expId) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      try {
        await profileService.deleteExperience(expId);
        setExperiences(experiences.filter(exp => exp.id !== expId));
      } catch (err) {
        console.error('Failed to delete experience:', err);
        setError('Failed to delete experience.');
      }
    }
  };

  // Education management
  const handleEducationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEducationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If currently studying is checked, clear end date
    if (name === 'is_current' && checked) {
      setEducationFormData(prev => ({ ...prev, end_date: '' }));
    }
  };

  const resetEducationForm = () => {
    setEducationFormData({
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    });
    setCurrentEducation(null);
  };

  const openEducationForm = (edu = null) => {
    if (edu) {
      // Edit mode - populate form with education data
      setEducationFormData({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field_of_study: edu.field_of_study || '',
        start_date: edu.start_date || '',
        end_date: edu.end_date || '',
        is_current: edu.is_current || false,
        description: edu.description || ''
      });
      setCurrentEducation(edu);
    } else {
      // Add mode
      resetEducationForm();
    }
    setShowEducationForm(true);
  };

  const closeEducationForm = () => {
    setShowEducationForm(false);
    resetEducationForm();
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload
      const payload = { ...educationFormData };
      if (payload.is_current) {
        // If currently studying, remove end_date from payload
        delete payload.end_date;
      }
  
      let response;
      if (currentEducation && currentEducation.id) {
        // Update existing
        response = await profileService.updateEducation(
          currentEducation.id, 
          payload
        );
        const updatedEducations = educations.map(edu => 
          edu.id === currentEducation.id ? response : edu
        );
        setEducations(updatedEducations);
      } else {
        // Add new
        response = await profileService.addEducation(payload);
        setEducations([...educations, response]);
      }
      closeEducationForm();
    } catch (err) {
      console.error('Failed to save education:', err);
      setError('Failed to save education data.');
    }
  };

  const handleDeleteEducation = async (eduId) => {
    if (window.confirm('Are you sure you want to delete this education?')) {
      try {
        await profileService.deleteEducation(eduId);
        setEducations(educations.filter(edu => edu.id !== eduId));
      } catch (err) {
        console.error('Failed to delete education:', err);
        setError('Failed to delete education.');
      }
    }
  };

  // Form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      console.log('Starting profile update with data:', {
        full_name: profile.full_name,
        title: profile.title,
        location: profile.location,
        about: profile.about,
        phone: profile.phone,
        email: profile.email,
        has_resume: !!profile.resume,
        has_profile_image: !!profile.profile_image
      });

      // Prepare payload with only the fields we want to update
      const payload = {
        full_name: profile.full_name || "",
        title: (profile.title && profile.title !== "undefined") ? profile.title : "",
        location: profile.location || "",
        about: profile.about || "",
        phone: profile.phone || "",
        email: profile.email || ""   
      };
      
      // Only include resume in payload if it's a new file
      if (profile.resume instanceof File) {
        payload.resume = profile.resume;
      } else if (profile.resume === null) {
        payload.resume = '';
      }
      
      // Only include profile_image in payload if it's a new file or being deleted
      if (profile.profile_image instanceof File) {
        payload.profile_image = profile.profile_image;
      } else if (profile.profile_image === null || profile.profile_image === '') {
        payload.profile_image = '';
      }

      console.log('Sending update payload:', payload);

      // 1. Update main profile
      const updatedProfile = await profileService.updateJobseekerProfile(payload);
      console.log('Received updated profile from backend:', updatedProfile);
      
      // 2. Update the profile state with the response data
      setProfile(prev => {
        const newProfile = {
          ...prev,
          ...updatedProfile,
          ...updatedProfile.profile
        };
        console.log('Setting new profile state:', newProfile);
        return newProfile;
      });

      // 3. Close edit mode and show success message
      setIsEditing(false);
      setSaveSuccess(true);

      // 4. Call parent's refresh function if available
      if (typeof refreshProfile === 'function') {
        console.log('Calling parent refresh function');
        refreshProfile();
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError('Failed to save profile. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Function to view the updated profile
  const viewUpdatedProfile = async () => {
    try {
      console.log('Fetching fresh profile data');
      // Fetch fresh profile data from the backend
      const freshProfileData = await profileService.getUserProfile();
      console.log('Received fresh profile data:', freshProfileData);
      
      // Update the profile state with the fresh data
      setProfile(prev => ({
        ...prev,
        ...freshProfileData,
        ...freshProfileData.profile
      }));
      
      // Close edit mode and clear success message
      setIsEditing(false);
      setSaveSuccess(false);
      
      // Call parent's refresh function if available
      if (typeof refreshProfile === 'function') {
        console.log('Calling parent refresh function from viewUpdatedProfile');
        refreshProfile();
      }
          } catch (err) {
      console.error("Error refreshing profile:", err);
      setError('Failed to refresh profile data. Please try again.');
    }
  };

  // Add useEffect to log profile state changes
  useEffect(() => {
    console.log('Profile state updated:', profile);
  }, [profile]);

  // Add these new functions for handling file deletions
  const handleDeleteProfileImage = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      // Create a minimal payload with only the profile_image field
      const payload = {
        profile_image: ''
      };

      const updatedProfile = await profileService.updateJobseekerProfile(payload);
      setProfile(prev => ({
        ...prev,
        ...updatedProfile,
        ...updatedProfile.profile
      }));
      
      setSaveSuccess(true);
    } catch (err) {
      console.error("Error deleting profile image:", err);
      setError('Failed to delete profile image. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      // Create a payload with null for resume
      const payload = {
        ...profile,
        resume: null
      };

      const updatedProfile = await profileService.updateJobseekerProfile(payload);
      setProfile(prev => ({
        ...prev,
        ...updatedProfile,
        ...updatedProfile.profile
      }));
      
      setSaveSuccess(true);
    } catch (err) {
      console.error("Error deleting resume:", err);
      setError('Failed to delete resume. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Update the profile image section in the form
  const renderProfileImageSection = () => (
    <div className="form-group">
      <label>Profile Picture</label>
      {profile.profile_image && (
        <div className="current-image-preview">
          <img 
            src={typeof profile.profile_image === 'object' ? 
              URL.createObjectURL(profile.profile_image) : 
              (profile.profile_image && profile.profile_image.startsWith && profile.profile_image.startsWith('http') ? 
                profile.profile_image : 
                `/media/profile_images/${typeof profile.profile_image === 'string' ? 
                  profile.profile_image.split('/').pop() : ''}`)}
            alt="Profile preview" 
            className="profile-image-preview" 
          />
          <button
            type="button"
            className="delete-image-btn"
            onClick={handleDeleteProfileImage}
            disabled={isSaving}
          >
            Delete Image
          </button>
        </div>
      )}
      <input
        type="file"
        onChange={handleProfileImageUpload}
        accept="image/jpeg,image/png,image/gif"
      />
      <span className="field-note">Recommended: Square image, max 5MB (JPG, PNG, GIF)</span>
    </div>
  );

  // Helper to get the correct resume URL
  const getResumeUrl = (resume) => {
    if (!resume) return '';
    // Use full backend URL in development, relative in production
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (resume.startsWith('http')) return resume;
    return isDev ? `http://localhost:8000${resume}` : resume;
  };

  // Update the resume section in the form
  const renderResumeSection = () => (
    <div className="form-group">
      <label>Resume</label>
      {profile.resume && typeof profile.resume === 'string' ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a
            href={getResumeUrl(profile.resume)}
            className="resume-link"
            download
          >
            View Resume
          </a>
          <button
            type="button"
            className="edit-btn"
            onClick={() => resumeInputRef.current && resumeInputRef.current.click()}
            disabled={isSaving}
          >
            Edit
          </button>
          <button
            type="button"
            className="delete-resume-btn"
            onClick={handleDeleteResume}
            disabled={isSaving}
          >
            Delete
          </button>
          <input
            type="file"
            ref={resumeInputRef}
            onChange={handleResumeUpload}
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
          />
        </div>
      ) : profile.resume instanceof File ? (
        <span>{profile.resume.name}</span>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="file"
            onChange={handleResumeUpload}
            accept=".pdf,.doc,.docx"
          />
        </div>
      )}
    </div>
  );

  const handleSocialFormChange = e => {
    const { name, value } = e.target;
    setSocialForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSocial = () => {
    setPlatformToAdd('');
    setSocialForm({ platform: '', url: '' });
    setEditingSocial(null);
    setShowSocialForm(true);
  };

  const handlePlatformSelect = (platform) => {
    setPlatformToAdd(platform);
    setSocialForm({ platform, url: '' });
  };

  const handleEditSocial = link => {
    setPlatformToAdd(link.platform);
    setSocialForm({ platform: link.platform, url: link.url });
    setEditingSocial(link);
    setShowSocialForm(true);
  };

  const handleDeleteSocial = async id => {
    if (window.confirm('Delete this social link?')) {
      try {
        await profileService.deleteSocialLink(id);
        setSocialLinks(socialLinks.filter(l => l.id !== id));
      } catch (err) {
        setError('Failed to delete social link.');
      }
    }
  };

  const handleSocialFormSubmit = async e => {
    e.preventDefault();
    try {
      let link;
      const platform = socialForm.platform;
      if (editingSocial) {
        link = await profileService.updateSocialLink(editingSocial.id, platform, socialForm.url);
        setSocialLinks(socialLinks.map(l => l.id === editingSocial.id ? link : l));
      } else {
        link = await profileService.addSocialLink(platform, socialForm.url);
        setSocialLinks([...socialLinks, link]);
      }
      setShowSocialForm(false);
      setEditingSocial(null);
      setSocialForm({ platform: '', url: '' });
      setPlatformToAdd('');
    } catch (err) {
      setError('Failed to save social link.');
    }
  };
  
  if (!profile) {
    return <div className="profile-container">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-header">
        <div className="profile-image-container">
          {profile.profile_image ? (
            <img 
              src={typeof profile.profile_image === 'object' ? 
                URL.createObjectURL(profile.profile_image) : 
                (profile.profile_image && profile.profile_image.startsWith && profile.profile_image.startsWith('http') ? 
                  profile.profile_image : 
                  `/media/profile_images/${typeof profile.profile_image === 'string' ? 
                    profile.profile_image.split('/').pop() : ''}`)}
              alt="Profile" 
              className="profile-image-photo" 
            />
          ) : (
            <div className="profile-image">
              {profile && profile.full_name ? profile.full_name.charAt(0).toUpperCase() : ''}
            </div>
          )}
        </div>
        <div className="profile-header-info">
          <h2>{profile && profile.full_name ? profile.full_name : ''}</h2>
          <p className="profile-title-text">
            {profile && profile.title && profile.title !== "undefined" ? profile.title : ''}
          </p>
          <p>{profile && profile.location ? profile.location : ''}</p>
        </div>
        {!saveSuccess && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="edit-profile-btn"
              onClick={() => setIsEditing(edit => !edit)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <a href="/change-password" className="edit-profile-btn" style={{ background: '#e25c4a' }}>
              Change Password
            </a>
          </div>
        )}
      </div>

      {error && <div className="app-error">{error}</div>}
      
      {saveSuccess && (
        <div className="save-success">
          <p>Profile saved successfully!</p>
          <button 
            className="view-profile-btn"
            onClick={viewUpdatedProfile}
          >
            View Updated Profile
          </button>
        </div>
      )}

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={profile.full_name || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          {renderProfileImageSection()}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={profile.location || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Professional Title</label>
            <input
              type="text"
              name="title"
              value={profile.title === "undefined" ? "" : (profile.title || '')}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Skills</label>
            <div className="skills-edit-container">
              <div className="skills-input-row">
                <input
                  type="text"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyPress={handleSkillInputKeyPress}
                  placeholder="Add a skill"
                />
                <button 
                  type="button" 
                  className="add-skill-btn"
                  onClick={handleAddSkill}
                >
                  Add
                </button>
              </div>
              <div className="skills-list-edit">
                {Array.isArray(tempSkills) && tempSkills.length > 0 ? (
                  tempSkills.map((skill, index) => (
                    <div key={index} className="skill-tag-edit">
                      <span>{skill.name}</span>
                      <button 
                        type="button" 
                        className="remove-skill-btn"
                        onClick={() => handleRemoveSkill(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No skills added yet</p>
                )}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>About Me</label>
            <textarea
              name="about"
              value={profile.about || ''}
              onChange={handleInputChange}
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Experience</label>
            <div className="experience-list-edit">
              {Array.isArray(experiences) && experiences.length > 0 ? (
                experiences.map((exp, index) => (
                  <div key={exp.id || index} className="experience-item-edit">
                    <div className="experience-item-content">
                      <h5>{exp.title}</h5>
                      <p>{exp.company}</p>
                    </div>
                    <div className="experience-item-actions">
                      <button 
                        type="button" 
                        className="edit-btn"
                        onClick={() => openExperienceForm(exp)}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="delete-btn"
                        onClick={() => handleDeleteExperience(exp.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No experience entries yet</p>
              )}
              <button 
                type="button" 
                className="add-btn"
                onClick={() => openExperienceForm()}
              >
                Add Experience
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Education</label>
            <div className="education-list-edit">
              {Array.isArray(educations) && educations.length > 0 ? (
                educations.map((edu, index) => (
                  <div key={edu.id || index} className="education-item-edit">
                    <div className="education-item-content">
                      <h5>{edu.institution}</h5>
                      <p>{edu.degree}</p>
                    </div>
                    <div className="education-item-actions">
                      <button 
                        type="button" 
                        className="edit-btn"
                        onClick={() => openEducationForm(edu)}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="delete-btn"
                        onClick={() => handleDeleteEducation(edu.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No education entries yet</p>
              )}
              <button 
                type="button" 
                className="add-btn"
                onClick={() => openEducationForm()}
              >
                Add Education
              </button>
            </div>
          </div>
          {renderResumeSection()}
          <div className="form-group">
            <label>Social Links</label>
            <ul className="profile-social-list">
              {socialLinks.map(link => (
                <li key={link.id} className="profile-social-item">
                  <span className="profile-social-platform">{link.platform}</span>: 
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                  <button type="button" className="profile-social-edit" onClick={() => handleEditSocial(link)}>Edit</button>
                  <button type="button" className="profile-social-delete" onClick={() => handleDeleteSocial(link.id)}>Delete</button>
                </li>
              ))}
            </ul>
            <button type="button" className="profile-social-add" onClick={handleAddSocial}>Add Social Link</button>
            {showSocialForm && (
              <div className="profile-social-form">
                {!platformToAdd ? (
                  <div className="social-platform-icons">
                    {SOCIAL_PLATFORMS.map(p => (
                      <button key={p.key} type="button" className="social-icon-btn" onClick={() => handlePlatformSelect(p.key)} title={p.label}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label>
                      {SOCIAL_PLATFORMS.find(p => p.key === platformToAdd)?.label || platformToAdd} URL:
                      <input type="url" name="url" value={socialForm.url} onChange={handleSocialFormChange} required placeholder={`https://${platformToAdd}.com/yourprofile`} />
                    </label>
                    <button type="button" onClick={handleSocialFormSubmit}>{editingSocial ? 'Update' : 'Add'}</button>
                    <button type="button" onClick={() => { setShowSocialForm(false); setEditingSocial(null); setPlatformToAdd(''); }}>Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {saveSuccess ? (
            <div className="form-actions">
              <button
                type="button"
                className="view-profile-btn"
                onClick={viewUpdatedProfile}
              >
                View Updated Profile
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="save-profile-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Profile'}
            </button>
          )}
        </form>
      ) : (
        <div className="profile-details">
          <section className="profile-section">
            <h3>Contact Information</h3>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Location:</strong> {profile.location}</p>
          </section>
          <section className="profile-section">
            <h3>About Me</h3>
            <p>{profile.about}</p>
          </section>
          <section className="profile-section">
            <h3>Skills</h3>
            <div className="skills-list">
              {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} className="skill-tag">{typeof skill === 'object' ? skill.name : skill}</span>
                ))
              ) : (
                <p>No skills listed</p>
              )}
            </div>
          </section>
          <section className="profile-section">
            <h3>Experience</h3>
            {Array.isArray(profile.experience) && profile.experience.length > 0 ? (
              profile.experience.map((exp, index) => (
                <div key={exp.id || index} className="experience-item">
                  <h4>{exp.title}</h4>
                  <p className="company-name">{exp.company}</p>
                  <p className="date-range">
                    {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                  </p>
                  <p>{exp.description}</p>
                </div>
              ))
            ) : (
              <p>No experience listed</p>
            )}
          </section>

          <section className="profile-section">
            <h3>Education</h3>
            {Array.isArray(profile.education) && profile.education.length > 0 ? (
              profile.education.map((edu, index) => (
                <div key={edu.id || index} className="education-item">
                  <h4>{edu.institution}</h4>
                  <p>{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</p>
                  <p className="date-range">
                    {edu.start_date} – {edu.is_current ? 'Present' : edu.end_date}
                  </p>
                  <p>{edu.description}</p>
                </div>
              ))
            ) : (
              <p>No education listed</p>
            )}
          </section>
          <section className="profile-section">
            <h3>Resume</h3>
            {profile.resume && typeof profile.resume === 'string' ? (
              <a
                href={getResumeUrl(profile.resume)}
                className="resume-link"
                download
              >
                View Resume
              </a>
            ) : profile.resume instanceof File ? (
              <span>{profile.resume.name}</span>
            ) : (
              <p>No resume uploaded</p>
            )}
          </section>
          <section className="profile-section">
            <h3>Social Links</h3>
            {(!profile.social_links || profile.social_links.length === 0) && <p>No social links added.</p>}
            <ul className="profile-social-list">
              {(profile.social_links || []).map(link => (
                <li key={link.id} className="profile-social-item">
                  <span className="profile-social-platform">{link.platform}</span>: 
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Experience Form Modal */}
      {showExperienceForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentExperience ? 'Edit Experience' : 'Add Experience'}</h3>
              <button 
                type="button" 
                className="modal-close"
                onClick={closeExperienceForm}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleExperienceSubmit}>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={experienceFormData.title}
                  onChange={handleExperienceChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  value={experienceFormData.company}
                  onChange={handleExperienceChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={experienceFormData.location}
                  onChange={handleExperienceChange}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={experienceFormData.start_date}
                  onChange={handleExperienceChange}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_current"
                    checked={experienceFormData.is_current}
                    onChange={handleExperienceChange}
                  />
                  Current Position
                </label>
              </div>
              {!experienceFormData.is_current && (
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={experienceFormData.end_date}
                    onChange={handleExperienceChange}
                    required={!experienceFormData.is_current}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={experienceFormData.description}
                  onChange={handleExperienceChange}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeExperienceForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Form Modal */}
      {showEducationForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentEducation ? 'Edit Education' : 'Add Education'}</h3>
              <button 
                type="button" 
                className="modal-close"
                onClick={closeEducationForm}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEducationSubmit}>
              <div className="form-group">
                <label>Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={educationFormData.institution}
                  onChange={handleEducationChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={educationFormData.degree}
                  onChange={handleEducationChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Field of Study</label>
                <input
                  type="text"
                  name="field_of_study"
                  value={educationFormData.field_of_study}
                  onChange={handleEducationChange}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={educationFormData.start_date}
                  onChange={handleEducationChange}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_current"
                    checked={educationFormData.is_current}
                    onChange={handleEducationChange}
                  />
                  Currently Studying
                </label>
              </div>
              {!educationFormData.is_current && (
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={educationFormData.end_date}
                    onChange={handleEducationChange}
                    required={!educationFormData.is_current}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={educationFormData.description}
                  onChange={handleEducationChange}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeEducationForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerProfile;