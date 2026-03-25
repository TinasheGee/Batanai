// src/pages/RegisterCustomer.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TermsContentCustomer from '../components/TermsContentCustomer';
import logo from '../styles/images/logo.png';
import '../styles/login.css';
import '../styles/register.css';
import api from '../api/axios'; // Axios helper

export default function RegisterCustomer() {
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  // Modal for unsaved data
  const [showModal, setShowModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Navigate with modal warning if fields have data
  const handleNavigation = (path) => {
    const hasData = Object.values(formData).some((v) => v !== '');
    if (hasData) {
      setNavigatePath(path);
      setShowModal(true);
    } else {
      navigate(path);
    }
  };

  const confirmLeave = () => {
    setShowModal(false);
    navigate(navigatePath);
  };
  const cancelLeave = () => setShowModal(false);

  // Submit registration as customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!formData.agree) {
      alert('You must agree to the terms and conditions.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      // Send registration request
      const registerRes = await api.post('/auth/register', {
        role: 'customer', // Automatically assign role
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      });

      console.log('Customer registered:', registerRes.data);

      // Auto-login after successful registration
      const loginRes = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Store token and role in localStorage (auto-remember)
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('role', loginRes.data.user.role);

      alert('Registration successful! Welcome to Batanai!');

      // Navigate to home page
      navigate('/home');
    } catch (err) {
      console.error(err.response || err);
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="login-page" style={{ overflowY: 'hidden' }}>
      <div className="login-card">
        <h1 className="login-title">Create your account</h1>
        <h2>
          <img src={logo} alt="Logo" width={250} />
        </h2>
        <p className="login-subtitle-strong">Buy better. Sell smarter.</p>
        <p className="login-subtitle">Customers and businesses win together.</p>

        {/* Login/Register toggle */}
        <div className="toggle-group">
          <button
            className="toggle-btn"
            onClick={() => handleNavigation('/login')}
          >
            Login
          </button>
          <button className="toggle-btn active">Register</button>
        </div>

        {/* Customer / Business toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '50px',
            marginBottom: '25px',
          }}
        >
          <button className="reg_form_btn active">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
            Customer
          </button>
          <button
            className="reg_form_btn"
            onClick={() => handleNavigation('/register-business')}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
            Business
          </button>
        </div>

        {/* Registration form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            name="firstName"
            placeholder="First name *"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Last name *"
            value={formData.lastName}
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email *"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password *"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password *"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <span>
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-brand-600 hover:underline bg-transparent border-0 p-0"
              >
                Customer Terms and Conditions
              </button>{' '}
              and Privacy Policy.
            </span>
          </label>
          <button className="login-submit">Create account</button>
        </form>
      </div>

      {/* Modal for unsaved data */}
      {showModal && (
        <div style={backdropStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ color: '#0d6efd', marginBottom: '10px' }}>Warning</h3>
            <p style={{ marginBottom: '20px' }}>
              You have data in the fields. Are you sure you want to navigate
              away?
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button style={modalConfirmBtn} onClick={confirmLeave}>
                Yes
              </button>
              <button style={modalCancelBtn} onClick={cancelLeave}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Terms Modal */}
      {showTerms && (
        <div
          style={backdropStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTerms(false);
          }}
        >
          <div
            style={{
              ...modalCardStyle,
              maxWidth: '900px',
              maxHeight: '80vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0 }}>Customer Terms</h3>
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <TermsContentCustomer />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                onClick={() => {
                  setFormData((p) => ({ ...p, agree: true }));
                  setShowTerms(false);
                }}
                style={modalConfirmBtn}
              >
                I Agree
              </button>
              <button
                onClick={() => setShowTerms(false)}
                style={modalCancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal styles
const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};
const modalCardStyle = {
  backgroundColor: 'rgba(248, 249, 250, 0.92)',
  borderRadius: '25px',
  padding: '24px 28px',
  width: '90%',
  maxWidth: '400px',
  boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
  textAlign: 'center',
};
const modalConfirmBtn = {
  padding: '8px 18px',
  borderRadius: '22px',
  border: 'none',
  backgroundColor: '#0d6efd',
  color: 'white',
  cursor: 'pointer',
};
const modalCancelBtn = {
  padding: '8px 18px',
  borderRadius: '22px',
  border: '1px solid #c0c0c0',
  background: 'transparent',
  cursor: 'pointer',
};
