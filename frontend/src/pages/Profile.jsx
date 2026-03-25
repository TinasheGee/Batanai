import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import '../styles/login.css'; // Reusing login styles for form consistency
import '../styles/settings.css';
import UserProfileDropdown from '../components/UserProfileDropdown';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/user/profile', formData);
      setSuccess('Profile updated successfully!');
      // Update local storage user data if necessary, or just refresh state
      setUser({ ...user, ...formData });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
    );

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
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
              <button className="card-back">Back</button>
              <div className="profile-card-inner">
                <div className="avatar-large">
                  <img src={user?.profile_image} alt="Profile" />
                </div>

                <div className="profile-main">
                  <div className="profile-header">
                    <h2 className="profile-name">{user?.full_name}</h2>
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

                  <div className="profile-actions">
                    <button className="action-btn primary">Follow</button>
                    <button className="action-btn outline">Message</button>
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
              </div>
            </div>
          </main>

          <aside className="right-panel">
            <div className="dashboard-card">
              <h4>Dashboard (coming soon)</h4>
              <div className="dash-buttons">
                <button>Looking For</button>
                <button>Selling</button>
                <button>Jobs/Opportunities</button>
                <button>My Network</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
