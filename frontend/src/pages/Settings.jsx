import React, { useState } from 'react';
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setPassData({
      ...passData,
      [e.target.name]: e.target.value,
    });
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

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
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
                <button className="back-btn" onClick={() => navigate(-1)}>
                  &lt; Back
                </button>
                <h2>Account Settings</h2>
              </div>

              <div className="account-grid two-col">
                {/* Row 1: Profile */}
                <div className="left-cell">
                  <div className="section-heading">Profile</div>
                  <div className="avatar-block">
                    <div className="avatar">MG</div>
                    <button className="change-photo">Change Photo</button>
                  </div>
                </div>
                <div className="right-cell">
                  <div className="profile-content settings-section">
                    <label>Privacy Name</label>
                    <input type="text" defaultValue="Brandon Otto" />

                    <label>Email</label>
                    <input type="email" defaultValue="brandon@email.com" />
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
