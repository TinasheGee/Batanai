import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import '../styles/login.css';
import '../styles/settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    privacyName: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    setPassData({
      ...passData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/me');
      setUser(res.data);
      setProfileData({
        privacyName: res.data.full_name || '',
        email: res.data.email || '',
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        full_name: profileData.privacyName,
        email: profileData.email,
      };
      await api.put('/user/profile', payload);
      setSuccess('Profile updated successfully');
      // refresh local user
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const triggerFileSelect = () =>
    fileInputRef.current && fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSavePhoto = async () => {
    if (!imageFile) return;
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.append('image', imageFile);
    try {
      const up = await api.post('/user/profile/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (up.data?.profile_image) {
        setUser((prev) => ({ ...prev, profile_image: up.data.profile_image }));
        setImageFile(null);
        setPreviewUrl(null);
        setSuccess('Profile photo updated');
      }
    } catch (err) {
      console.error('save photo failed', err);
      setError('Failed to upload profile photo');
    }
  };

  const handleRemovePhoto = async () => {
    setError(null);
    setSuccess(null);
    try {
      await api.delete('/user/profile/image');
      // fall back to initials
      setUser((prev) => ({
        ...prev,
        profile_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          prev.full_name || ''
        )}&background=random&color=fff&rounded=true`,
      }));
      setImageFile(null);
      setPreviewUrl(null);
      setSuccess('Profile photo removed');
    } catch (err) {
      console.error('remove photo failed', err);
      setError('Failed to remove profile photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passData.newPassword !== passData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    try {
      await api.put('/user/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      setSuccess('Password changed successfully');
      setPassData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
    );
  if (!user)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        Failed to load user profile. Please log in again or check your
        connection.
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10 route-transition">
      <Header title="Settings" />

      <div className="settings-page">
        <div className="settings-wrapper">
          <aside className="left-panel">
            <div className="profile-box">
              <h4>Profile</h4>
              <ul className="profile-options">
                <li className="profile-option">
                  <span className="icon" aria-hidden>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.48L10 14.77 5.06 16.69 6 11.21 2 7.31l5.53-.8L10 1.5z"
                        fill="#0f172a"
                      />
                    </svg>
                  </span>
                  <span className="label">Reviews</span>
                </li>

                <li className="profile-option">
                  <span className="icon" aria-hidden>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6h14M3 10h14M3 14h14"
                        stroke="#0f172a"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="label">Following</span>
                </li>

                <li className="profile-option">
                  <span className="icon" aria-hidden>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
                        stroke="#0f172a"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 7V5a2 2 0 012-2h0a2 2 0 012 2v2"
                        stroke="#0f172a"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="label">Listed Items</span>
                </li>

                <li className="profile-option">
                  <span className="icon" aria-hidden>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 5.5v9A1.5 1.5 0 003.5 16h13a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0016.5 4h-13A1.5 1.5 0 002 5.5z"
                        stroke="#0f172a"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.5 6.5l6 4 6-4"
                        stroke="#0f172a"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="label">Contact</span>
                </li>
              </ul>
            </div>
          </aside>

          <main className="center-panel">
            <div className="center-card">
              <div className="center-header">
                <button
                  className="card-back"
                  onClick={() => {
                    try {
                      navigate('/home');
                    } catch (e) {
                      navigate('/home');
                    }
                  }}
                >
                  ← Back
                </button>
                <div className="center-header-titles">
                  <h2>Account Settings</h2>
                  <p className="center-subtitle">
                    Manage your Batanai profile and security
                  </p>
                </div>
              </div>

              <div className="account-grid two-col">
                {/* Row 1: Profile */}
                <div className="left-cell">
                  <div className="section-heading">Profile</div>
                  <div className="avatar-block">
                    {previewUrl ? (
                      <div className="avatar">
                        <img src={previewUrl} alt="Preview" />
                      </div>
                    ) : user?.profile_image ? (
                      <div className="avatar">
                        <img src={user.profile_image} alt="Profile" />
                      </div>
                    ) : (
                      <div className="avatar">
                        {(user?.full_name || 'U')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div className="avatar-actions">
                      <button
                        className="change-photo"
                        onClick={triggerFileSelect}
                      >
                        Change Photo
                      </button>
                      {imageFile && (
                        <button
                          className="save-photo-btn"
                          type="button"
                          onClick={handleSavePhoto}
                        >
                          Save photo
                        </button>
                      )}
                      {user?.profile_image &&
                        typeof user.profile_image === 'string' &&
                        user.profile_image.includes('/uploads/') && (
                          <button
                            className="remove-photo-btn"
                            type="button"
                            onClick={handleRemovePhoto}
                          >
                            Remove photo
                          </button>
                        )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="right-cell">
                  <div className="profile-content settings-section">
                    <form onSubmit={handleProfileSubmit}>
                      {error && <div className="form-error">{error}</div>}
                      {success && <div className="form-success">{success}</div>}

                      <label>Privacy Name</label>
                      <input
                        type="text"
                        name="privacyName"
                        value={profileData.privacyName}
                        onChange={handleProfileChange}
                      />

                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                      />

                      <div className="form-actions" style={{ marginTop: 12 }}>
                        <button type="submit" className="primary-btn">
                          Save Profile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Row 2: Security */}
                <div className="left-cell">
                  <div className="section-heading">Security</div>
                </div>
                <div className="right-cell">
                  <div className="security-content settings-section">
                    <h4 className="sr-only">Security</h4>
                    <form onSubmit={handleSubmit} className="settings-form">
                      {error && <div className="form-error">{error}</div>}
                      {success && <div className="form-success">{success}</div>}

                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passData.currentPassword}
                        onChange={handleChange}
                        required
                      />

                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passData.newPassword}
                        onChange={handleChange}
                        required
                      />

                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passData.confirmPassword}
                        onChange={handleChange}
                        required
                      />

                      <div className="form-actions">
                        <button type="submit" className="primary-btn">
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Row 3: Danger Zone */}
                <div className="left-cell">
                  <div className="section-heading">Danger Zone</div>
                </div>
                <div className="right-cell">
                  <div className="danger-content settings-section">
                    <h4 className="sr-only">Danger Zone</h4>
                    <p>
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                    <button
                      className="danger-btn"
                      onClick={() => alert('This feature is coming soon!')}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="right-panel">
            <div className="dashboard-card">
              <h4>Dashboard (coming soon)</h4>
              <div className="dash-buttons">
                <button disabled className="disabled-btn" type="button">
                  Looking For
                </button>
                <button disabled className="disabled-btn" type="button">
                  Selling
                </button>
                <button disabled className="disabled-btn" type="button">
                  Jobs/Opportunities
                </button>
                <button type="button" onClick={() => navigate('/network')}>
                  My Network
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
