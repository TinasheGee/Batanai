import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/business_payment.css';

const BusinessPayments = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: 'Company Name',
    business_email: 'email@company.com',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      alert('Please confirm your business name.');
      return;
    }

    if (!formData.business_email.trim()) {
      alert('Please confirm your email address.');
      return;
    }

    // TODO: replace with API call
    console.log('Business confirmed:', formData);
    alert('Payment successful (Mock)! Please login.');
    navigate('/login');
  };

  return (
    <div id="container">
      <div id="wb_Form1">
        <form id="Form1" onSubmit={handleSubmit}>
          <div id="wb_Heading1">
            <h1 id="Heading1">Confirm your business</h1>
          </div>

          <div className="confirm-field">
            <label htmlFor="company_name">Business name</label>
            <div className="input-edit-row">
              <input
                type="text"
                id="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
              <button type="button" className="edit-btn">
                Edit
              </button>
            </div>
          </div>

          <div className="confirm-field">
            <label htmlFor="business_email">Email address</label>
            <div className="input-edit-row">
              <input
                type="email"
                id="business_email"
                value={formData.business_email}
                onChange={handleChange}
              />
              <button type="button" className="edit-btn">
                Edit
              </button>
            </div>
          </div>

          <div id="wb_Text1">
            <span>
              One-time registration fee: <strong>$50</strong>
            </span>
          </div>

          <input type="submit" id="business_register" value="Continue" />
        </form>
      </div>
    </div>
  );
};

export default BusinessPayments;
