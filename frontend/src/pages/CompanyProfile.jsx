import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import profileService from '../services/profileService';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const companySizeLabels = {
  "1-10": "1-10 employees",
  "11-50": "11-50 employees",
  "51-200": "51-200 employees",
  "201-500": "201-500 employees",
  "501-1000": "501-1000 employees",
  "1001-5000": "1001-5000 employees",
  "5000+": "5000+ employees"
};

const CompanyProfile = ({ profile: initialProfile }) => {
  const { companyId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (companyId) {
      // Fetch company profile by ID
      profileService.getCompanyProfile(companyId)
        .then(data => setProfile(data))
        .catch(() => setError('Failed to load company profile.'));
    } else {
      setProfile(initialProfile);
    }
  }, [companyId, initialProfile]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = e => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [name]: value
      }
    }));
  };

  const handleLogoUpload = e => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({ ...prev, company_logo: file }));
    }
  };

  const handleDeleteLogo = async () => {
    setIsSaving(true);
    setError('');
    try {
      await profileService.updateCompanyProfile({ ...profile, company_logo: '' });
      setProfile(prev => ({ ...prev, company_logo: null }));
      setIsEditing(false);
    } catch (err) {
      setError('Failed to delete logo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await profileService.updateCompanyProfile(profile);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if the logged-in user is the owner of this company profile
  const isOwner = currentUser && profile && currentUser.id === profile.user;

  // Add safety check to prevent errors if profile is undefined
  if (!profile) {
    return <div className="profile-container">Loading profile...</div>;
  }

  // Ensure social_links exists with default values to prevent errors
  if (!profile.social_links) {
    profile.social_links = { linkedin: '', twitter: '', facebook: '' };
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Company Profile</h1>
      <div className="profile-header">
        <div className="profile-image-container">
          {profile.company_logo ? (
            <img
              src={
                typeof profile.company_logo === 'string'
                  ? profile.company_logo
                  : URL.createObjectURL(profile.company_logo)
              }
              alt="Company logo"
              className="company-logo"
            />
          ) : (
            <div className="profile-image">
              {profile.company_name ? profile.company_name.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
        </div>
        <div className="profile-header-info">
          <h2>{profile.company_name}</h2>
          <p className="profile-title-text">{profile.industry}</p>
          <p>{profile.location}</p>
        </div>
        {isOwner && (
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

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="company_name"
              value={profile.company_name || ''}
              onChange={handleInputChange}
              required
            />
          </div>
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
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={profile.website || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Industry</label>
            <input
              type="text"
              name="industry"
              value={profile.industry || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Company Size</label>
            <select
              name="company_size"
              value={profile.company_size || ''}
              onChange={handleInputChange}
            >
              <option value="">Select company size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1001-5000">1001-5000 employees</option>
              <option value="5000+">5000+ employees</option>
            </select>
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
            <label>Founded Year</label>
            <input
              type="text"
              name="founded_year"
              value={profile.founded_year || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>About the Company</label>
            <textarea
              name="about"
              value={profile.about || ''}
              onChange={handleInputChange}
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Company Logo</label>
            {profile.company_logo ? (
              <div className="logo-edit-preview">
                <img
                  src={
                    typeof profile.company_logo === 'string'
                      ? profile.company_logo
                      : URL.createObjectURL(profile.company_logo)
                  }
                  alt="Company logo"
                  className="company-logo"
                />
                <button
                  type="button"
                  className="delete-logo-btn"
                  onClick={async () => {
                    await handleDeleteLogo();
                    if (typeof window !== 'undefined' && window.location) {
                      window.location.reload(); // Ensure UI refreshes after deletion
                    }
                  }}
                  disabled={isSaving}
                >
                  Delete Logo
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </div>
          <div className="social-links">
            <h3>Social Media Links</h3>
            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={profile.social_links.linkedin || ''}
                onChange={handleSocialLinkChange}
              />
            </div>
            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                name="twitter"
                value={profile.social_links.twitter || ''}
                onChange={handleSocialLinkChange}
              />
            </div>
            <div className="form-group">
              <label>Facebook</label>
              <input
                type="url"
                name="facebook"
                value={profile.social_links.facebook || ''}
                onChange={handleSocialLinkChange}
              />
            </div>
          </div>
          <button
            type="submit"
            className="save-profile-btn"
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Company Profile'}
          </button>
        </form>
      ) : (
        <div className="profile-details">
          <section className="profile-section">
            <h3>Contact Information</h3>
            <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
            {profile.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a
                  href={
                    profile.website.startsWith('http')
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.website}
                </a>
              </p>
            )}
            <p><strong>Location:</strong> {profile.location || 'Not provided'}</p>
          </section>
          <section className="profile-section">
            <h3>Company Overview</h3>
            <p><strong>Industry:</strong> {profile.industry || 'Not provided'}</p>
            <p><strong>Size:</strong> <span>{companySizeLabels[profile.company_size] || profile.company_size}</span></p>
            <p><strong>Founded:</strong> {profile.founded_year || 'Not provided'}</p>
          </section>
          <section className="profile-section">
            <h3>About the Company</h3>
            <p>{profile.about || 'No information provided.'}</p>
          </section>
          <section className="profile-section">
            <h3>Social Media</h3>
            <div className="social-links-display">
              {profile.social_links.linkedin && (
                <a
                  href={
                    profile.social_links.linkedin.startsWith('http')
                      ? profile.social_links.linkedin
                      : `https://${profile.social_links.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  LinkedIn
                </a>
              )}
              {profile.social_links.twitter && (
                <a
                  href={
                    profile.social_links.twitter.startsWith('http')
                      ? profile.social_links.twitter
                      : `https://${profile.social_links.twitter}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  Twitter
                </a>
              )}
              {profile.social_links.facebook && (
                <a
                  href={
                    profile.social_links.facebook.startsWith('http')
                      ? profile.social_links.facebook
                      : `https://${profile.social_links.facebook}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  Facebook
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;