import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/login.css'; // Reusing login styles for form consistency
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div className="login-page">
      <div className="login-card" style={{ alignItems: 'normal' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>My Profile</h2>
             <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#ddd' }}>Back</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
              src={user?.profile_image} 
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px' }} 
          />
          <h3>{user?.full_name}</h3>
          <p style={{ color: '#666' }}>{user?.role?.toUpperCase()}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" style={{ marginTop: '20px' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
