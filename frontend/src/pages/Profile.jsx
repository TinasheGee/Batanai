import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';
import Header from '../components/Header';
import '../styles/login.css'; // Reusing login styles for form consistency
import '../styles/settings.css';
import UserProfileDropdown from '../components/UserProfileDropdown';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef(null);
  const prevLocationRef = useRef(null);
  const location = useLocation();
  const attemptedPathRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/user/me');
      setUser(response.data);
      setFormData({
        full_name: response.data.full_name,
        email: response.data.email,
      });
      // store initial data snapshot for dirty-checks
      initialDataRef.current = {
        full_name: response.data.full_name,
        email: response.data.email,
      };
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // mark dirty if value differs from initial snapshot
    const name = e.target.name;
    const value = e.target.value;
    if (!initialDataRef.current) {
      setIsDirty(true);
    } else {
      const initial = initialDataRef.current[name] || '';
      setIsDirty(
        value !== initial ||
          Object.keys(formData).some(
            (k) =>
              k !== name && formData[k] !== (initialDataRef.current[k] || '')
          )
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // if a new profile image was selected, upload it first
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        try {
          const up = await api.post('/user/profile/image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (up.data?.profile_image) {
            setUser((prev) => ({
              ...prev,
              profile_image: up.data.profile_image,
            }));
            // reflect preview as current image
            setPreviewUrl(null);
            setImageFile(null);
          }
        } catch (uErr) {
          console.error('profile image upload failed', uErr);
          setError('Failed to upload profile image');
          return;
        }
      }

      const response = await api.put('/user/profile', formData);
      setSuccess('Profile updated successfully!');
      // Update local storage user data if necessary, or just refresh state
      setUser({ ...user, ...formData });
      // clear dirty state and refresh initial snapshot
      initialDataRef.current = { ...formData };
      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsDirty(true);
  };

  const triggerFileSelect = () =>
    fileInputRef.current && fileInputRef.current.click();

  // cleanup preview object URL
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
        setPreviewUrl(null);
        setImageFile(null);
        setSuccess('Profile photo updated');
        setIsDirty(false);
      }
    } catch (uErr) {
      console.error('profile image upload failed', uErr);
      setError('Failed to upload profile image');
    }
  };

  const handleRemovePhoto = async () => {
    setError(null);
    setSuccess(null);
    try {
      await api.delete('/user/profile/image');
      setUser((prev) => ({
        ...prev,
        profile_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          prev.full_name || ''
        )}&background=random&color=fff&rounded=true`,
      }));
      setPreviewUrl(null);
      setImageFile(null);
      setIsDirty(false);
      setSuccess('Profile photo removed');
    } catch (err) {
      console.error('remove photo failed', err);
      setError('Failed to remove profile photo');
    }
  };

  // warn on browser/tab close when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // in-app navigation guard: prompt when location changes and there are unsaved changes
  useEffect(() => {
    // initialize prev location
    if (!prevLocationRef.current) prevLocationRef.current = location.pathname;
    // run when location changes
    if (location.pathname !== prevLocationRef.current) {
      if (isDirty) {
        // user attempted to navigate to a different route while dirty
        attemptedPathRef.current = location.pathname;
        // immediately revert to previous location to keep user on this page
        try {
          navigate(prevLocationRef.current, { replace: true });
        } catch (e) {
          // fallback: use history.back()
          try {
            window.history.back();
          } catch (err) {}
        }
        // show modal to confirm
        setShowUnsavedModal(true);
      } else {
        prevLocationRef.current = location.pathname;
      }
    }
  }, [location, isDirty]);

  const handleConfirmUnsaved = async () => {
    setShowUnsavedModal(false);
    setIsDirty(false);
    const target = attemptedPathRef.current;
    attemptedPathRef.current = null;
    if (target) {
      navigate(target);
    }
  };

  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
    attemptedPathRef.current = null;
    // stay on page
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
    );
  if (error)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        Failed to load user profile. Please log in again or check your
        connection.
      </div>
    );
  if (!user)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        No user data found. Please log in again.
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10 route-transition">
      <Header title="Profile" />

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
              <button
                className="card-back"
                onClick={() => {
                  if (isDirty) {
                    attemptedPathRef.current = '/home';
                    setShowUnsavedModal(true);
                    return;
                  }
                  navigate('/home');
                }}
              >
                Back
              </button>
              <div className="profile-card-inner">
                <div className="avatar-column">
                  <div className="avatar-large">
                    <img
                      src={previewUrl || user?.profile_image}
                      alt="Profile"
                    />
                  </div>
                  <div className="avatar-actions">
                    {/* Change photo removed on Profile page per layout decision */}
                    {imageFile && (
                      <button
                        type="button"
                        className="save-photo-btn"
                        onClick={handleSavePhoto}
                      >
                        Save photo
                      </button>
                    )}

                    {user?.profile_image &&
                      typeof user.profile_image === 'string' &&
                      user.profile_image.startsWith('/uploads/') && (
                        <button
                          type="button"
                          className="remove-photo-btn"
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
                <div className="profile-main">
                  <div className="profile-header">
                    <h2 className="profile-name">{user?.full_name}</h2>
                    <div
                      className="profile-role"
                      style={{
                        marginTop: 4,
                        fontWeight: 600,
                        color: '#1e63d6',
                        fontSize: 14,
                      }}
                    >
                      {user?.role && user.role.toUpperCase()}
                    </div>
                    {user?.business_name && (
                      <div
                        className="profile-business"
                        style={{ marginTop: 2, color: '#475569', fontSize: 13 }}
                      >
                        Business: <b>{user.business_name}</b>
                      </div>
                    )}
                    {user?.phone && (
                      <div
                        className="profile-phone"
                        style={{ marginTop: 2, color: '#475569', fontSize: 13 }}
                      >
                        Phone: <b>{user.phone}</b>
                      </div>
                    )}
                    {user?.email && (
                      <div
                        className="profile-email"
                        style={{ marginTop: 2, color: '#475569', fontSize: 13 }}
                      >
                        Email: <b>{user.email}</b>
                      </div>
                    )}
                    <div className="profile-meta">
                      Member since{' '}
                      {new Date(user?.created_at || Date.now()).toLocaleString(
                        'default',
                        { month: 'long', year: 'numeric' }
                      )}
                    </div>
                    <div className="profile-location">
                      {user?.location || 'Harare Zimbabwe'}
                    </div>
                    <div className="profile-stats">
                      <div className="stat-line">
                        <strong>Following:</strong>{' '}
                        {user?.following_businesses_count ??
                          user?.following_businesses ??
                          0}{' '}
                        Businesses {user?.following_customers_count ?? 0}{' '}
                        Customers
                      </div>
                      <div className="stat-line">
                        {user?.listed_items_count ?? user?.listed_items ?? 0}{' '}
                        Listed Items
                      </div>
                    </div>
                  </div>

                  {/* profile-actions moved below to span full width */}

                  {/* profile-widgets moved below full-width actions */}
                </div>
              </div>
              <div className="profile-actions-fullwidth">
                <button className="action-btn primary">Follow</button>
                <button className="action-btn primary">Message</button>
              </div>

              <div className="profile-widgets two-column">
                <div className="column">
                  <div className="profile-widget">
                    <h5>Following Businesses</h5>
                    <div className="widget-row">
                      Sam Levy Boutique • Fresh Market
                    </div>
                  </div>

                  <div className="profile-widget">
                    <h5>Reviews</h5>
                    <div className="widget-row">
                      4.8 ★ — Great customer, quick payment
                    </div>
                  </div>
                </div>

                <div className="column">
                  <div className="profile-widget">
                    <h5>Listed Items</h5>
                    <div className="widget-row">5 Listed Items</div>
                  </div>

                  <div className="profile-widget">
                    <h5>Following</h5>
                    <div className="widget-row">
                      Sam Levy Boutique • Fresh Market
                    </div>
                  </div>

                  <div className="profile-widget">
                    <h5>Verification</h5>
                    <div className="widget-row">
                      <div>✅ Email Verified</div>
                      <div>✅ Phone Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="right-panel">
            <div className="dashboard-card">
              <div className="mini-avatar">
                <img
                  src={
                    user?.profile_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.full_name || ''
                    )}&background=random&color=fff&rounded=true`
                  }
                  alt="Profile"
                />
              </div>
              <h4>Dashboard (coming soon)</h4>
              <div className="dash-buttons">
                <button disabled className="disabled-btn">
                  Looking For
                </button>
                <button disabled className="disabled-btn">
                  Selling
                </button>
                <button disabled className="disabled-btn">
                  Jobs/Opportunities
                </button>
                <button onClick={() => navigate('/network')}>My Network</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <ConfirmModal
        open={showUnsavedModal}
        title="Unsaved changes"
        description="You have unsaved changes. Leave this page and discard changes?"
        onConfirm={handleConfirmUnsaved}
        onCancel={handleCancelUnsaved}
      />
    </div>
  );
}
