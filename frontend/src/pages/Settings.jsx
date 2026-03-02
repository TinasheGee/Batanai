import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/login.css'; 

export default function Settings() {
  const navigate = useNavigate();
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setPassData({
      ...passData,
      [e.target.name]: e.target.value
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
        newPassword: passData.newPassword
      });
      setSuccess('Password changed successfully');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="login-page">
     <div className="login-card" style={{ alignItems: 'normal' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h2 style={{ margin: 0 }}>Account Settings</h2>
             <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#ddd' }}>Back</button>
        </div>
      
      <div className="settings-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0 }}>Change Password</h3>
        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: '20px' }}>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passData.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" style={{ background: '#007bff' }}>
            Update Password
          </button>
        </form>
      </div>

       <div className="settings-section" style={{ background: '#fff0f0', padding: '20px', borderRadius: '8px', border: '1px solid #f5c6cb', marginTop: '30px' }}>
        <h3 style={{ color: '#d9534f', marginTop: 0 }}>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => alert('This feature is coming soon!')}>
            Delete Account
        </button>
      </div>

    </div>
    </div>
  );
}
