import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TermsContentBusiness from '../components/TermsContentBusiness';
import MapPicker from '../components/MapPicker';
import { useNavigate } from 'react-router-dom';
import logo from '../styles/images/logo.png';
import '../styles/login.css';
import '../styles/register.css';
import api from '../api/axios'; // Axios helper to include baseURL etc.
import { toast } from 'react-hot-toast';

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
  // Categories loaded from backend
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/business/categories');
        if (res.data && Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.warn('Failed to load categories', err?.message || err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [showPickMap, setShowPickMap] = useState(false);
  const [pickLat, setPickLat] = useState('');
  const [pickLng, setPickLng] = useState('');

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

      // If registration created a new mall, the business may be pending admin approval.
      if (res.data?.pending_admin_approval) {
        toast.success(
          'Registration submitted — pending admin approval for your mall. You will be notified when approved.'
        );
        // Show the confirmation page and let the user click the button to go to login.
        navigate('/business-registered', {
          state: {
            business: res.data.business,
            trial_end_date: res.data.trial_end_date,
            pending_admin_approval: res.data.pending_admin_approval,
          },
        });
        return;
      }

      // -----------------------------
      // 3. Navigate to Registration Confirmation Page for non-pending cases
      // -----------------------------
      navigate('/business-registered', {
        state: {
          business: res.data.business,
          trial_end_date: res.data.trial_end_date,
          pending_admin_approval: res.data.pending_admin_approval,
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
              {categories &&
              categories.length > 0 &&
              typeof categories[0] === 'object'
                ? categories.map((cat) => (
                    <optgroup key={cat.name} label={cat.name}>
                      <option value={cat.name}>{cat.name}</option>
                      {Array.isArray(cat.subcategories) &&
                        cat.subcategories.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </optgroup>
                  ))
                : categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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

          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="login-submit"
              onClick={() => setShowLocationOptions(true)}
            >
              Set Business Location
            </button>
            {formData.address && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                Selected: {formData.address}
              </div>
            )}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-brand-600 hover:underline bg-transparent border-0 p-0"
              >
                terms and conditions
              </button>
            </span>
          </label>

          <button type="submit" className="login-submit">
            Register
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
      {/* Location Options Modal */}
      {showLocationOptions && (
        <div
          style={backdropStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLocationOptions(false);
          }}
        >
          <div style={{ ...modalCardStyle, maxWidth: '420px', padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Set Business Location</h3>
            <p style={{ marginTop: 6 }}>
              Choose how you'd like to set the business location:
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 12,
              }}
            >
              <button
                style={modalConfirmBtn}
                onClick={() => {
                  // use browser geolocation
                  if (!navigator.geolocation) {
                    alert('Geolocation is not supported by your browser');
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      const coord = `Lat:${latitude.toFixed(6)},Lng:${longitude.toFixed(6)}`;
                      setFormData((p) => ({ ...p, address: coord }));
                      setShowLocationOptions(false);
                    },
                    (err) => {
                      alert('Unable to retrieve your location: ' + err.message);
                    },
                    { timeout: 10000 }
                  );
                }}
              >
                Use current location
              </button>

              <button
                style={modalCancelBtn}
                onClick={() => {
                  setShowPickMap(true);
                }}
              >
                Pick from map
              </button>

              <button
                style={{ ...modalCancelBtn, marginTop: 6 }}
                onClick={() => setShowLocationOptions(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pick-from-map Modal (simple coordinates input fallback) */}
      {showPickMap && (
        <div
          style={backdropStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPickMap(false);
          }}
        >
          <div
            style={{
              ...modalCardStyle,
              maxWidth: '880px',
              padding: 12,
              textAlign: 'left',
              width: '95%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0 }}>Pick Location</h3>
              <button
                onClick={() => setShowPickMap(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <MapPicker
                initialPosition={
                  formData.address
                    ? (() => {
                        const m = formData.address.match(
                          /Lat:([\d.-]+),Lng:([\d.-]+)/
                        );
                        if (m)
                          return {
                            lat: parseFloat(m[1]),
                            lng: parseFloat(m[2]),
                          };
                        return { lat: -17.8252, lng: 31.0522 };
                      })()
                    : { lat: -17.8252, lng: 31.0522 }
                }
                onChange={(latlng) => {
                  setPickLat(latlng.lat.toFixed(6));
                  setPickLng(latlng.lng.toFixed(6));
                }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  placeholder="Latitude"
                  value={pickLat}
                  onChange={(e) => setPickLat(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="Longitude"
                  value={pickLng}
                  onChange={(e) => setPickLng(e.target.value)}
                  style={{ flex: 1 }}
                />
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
                  style={modalConfirmBtn}
                  onClick={() => {
                    if (!pickLat || !pickLng) {
                      alert(
                        'Please select a location on the map or enter coordinates'
                      );
                      return;
                    }
                    const coord = `Lat:${parseFloat(pickLat).toFixed(6)},Lng:${parseFloat(pickLng).toFixed(6)}`;
                    setFormData((p) => ({ ...p, address: coord }));
                    setShowPickMap(false);
                    setShowLocationOptions(false);
                  }}
                >
                  Set location
                </button>
                <button
                  style={modalCancelBtn}
                  onClick={() => setShowPickMap(false)}
                >
                  Cancel
                </button>
              </div>
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
              <h3 style={{ margin: 0 }}>Terms and Conditions</h3>
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
              <TermsContentBusiness />
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
