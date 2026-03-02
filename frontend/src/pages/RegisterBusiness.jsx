import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../styles/images/logo.png';
import '../styles/login.css';
import '../styles/register.css';
import api from '../api/axios'; // Axios helper to include baseURL etc.

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const [activeType] = useState('business');
  const [formData, setFormData] = useState({
    companyName: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    website: '',
    linkedin: '',
    facebook: '',
    allowLocation: false,
    agree: false,
  });
  const [error, setError] = useState('');
  const [malls, setMalls] = useState([]);
  const [selectedMall, setSelectedMall] = useState('');
  const [newMallName, setNewMallName] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  useEffect(() => {
    // fetch malls for dropdown
    const fetchMalls = async () => {
      try {
        const res = await api.get('/malls');
        setMalls(res.data || []);
      } catch (err) {
        console.warn('Failed to load malls', err?.message || err);
      }
    };
    fetchMalls();
  }, []);

  // ✅ Handle form submission (Business Registration)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // -----------------------------
    // 1. Frontend Validation
    // -----------------------------
    if (
      !formData.companyName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.phone
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.agree) {
      setError('You must agree to the terms.');
      return;
    }

    setError('');

    // -----------------------------
    // 2. Send Business Registration to Backend
    // -----------------------------
    try {
      const payload = {
        name: formData.companyName,
        description: formData.description,
        category: formData.category,
        location: formData.address,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        logo_url: null,
      };

      if (selectedMall && selectedMall !== 'new')
        payload.mall_id = selectedMall;
      if (selectedMall === 'new' && newMallName)
        payload.mall_name = newMallName;

      const res = await api.post('/business/register', payload);

      console.log('✅ Business registered:', res.data);

      // -----------------------------
      // 3. Navigate to Payment Page
      // -----------------------------
      navigate('/business-payment', {
        state: {
          businessId: res.data.business.id, // ✅ REQUIRED
          businessName: res.data.business.name,
          businessEmail: res.data.business.email,
        },
      });
    } catch (err) {
      console.error('❌ Business registration failed:', err.response?.data);

      setError(
        err.response?.data?.error ||
          'Business registration failed. Please try again.'
      );
    }
  };

  // Navigation with modal check
  const handleNavigation = (path) => {
    const hasData = Object.values(formData).some(
      (val) => val !== '' && val !== false
    );
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

  return (
    <div className="login-page">
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
          <button
            className={
              activeType === 'customer' ? 'reg_form_btn active' : 'reg_form_btn'
            }
            onClick={() => handleNavigation('/register-customer')}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
            Customer
          </button>
          <button className="reg_form_btn active">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
            Business
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="error-text">{error}</p>}

          <input
            name="companyName"
            placeholder="Company Name *"
            value={formData.companyName}
            onChange={handleChange}
          />
          <div className="select-wrapper">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">-- Select a Business Category --</option>
              <option value="Grocery">Grocery</option>
              <option disabled>Hardware & Electricals (Coming Soon)</option>
            </select>
          </div>
          <div className="select-wrapper">
            <select
              name="mall"
              value={selectedMall}
              onChange={(e) => setSelectedMall(e.target.value)}
            >
              <option value="">-- (Optional) Select a Mall --</option>
              {malls.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="new">Create new mall...</option>
            </select>
          </div>
          {selectedMall === 'new' && (
            <input
              name="newMallName"
              placeholder="New Mall Name"
              value={newMallName}
              onChange={(e) => setNewMallName(e.target.value)}
            />
          )}
          <input
            name="address"
            placeholder="Business Address"
            value={formData.address}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone Number *"
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email *"
            value={formData.email}
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
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <textarea
            name="description"
            placeholder="Describe your business..."
            value={formData.description}
            onChange={handleChange}
          />
          <input
            name="website"
            placeholder="Website URL"
            value={formData.website}
            onChange={handleChange}
          />
          <input
            name="linkedin"
            placeholder="LinkedIn URL"
            value={formData.linkedin}
            onChange={handleChange}
          />
          <input
            name="facebook"
            placeholder="Facebook URL"
            value={formData.facebook}
            onChange={handleChange}
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="allowLocation"
              checked={formData.allowLocation}
              onChange={handleChange}
            />
            <span>Allow location tracking</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <span>I agree to the terms and conditions</span>
          </label>

          <button type="submit" className="login-submit">
            Proceed to Payment
          </button>
        </form>
      </div>

      {/* Modal */}
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
