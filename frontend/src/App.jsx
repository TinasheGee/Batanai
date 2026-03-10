import React from 'react';
import { ToastProvider } from './components/ToastContext';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import RegisterCustomer from './pages/RegisterCustomer';
import RegisterBusiness from './pages/RegisterBusiness';
import BusinessPayment from './pages/BusinessPayment';
import HomepageBusiness from './pages/HomepageBusiness';
import BusinessDashboard from './pages/BusinessDashboard';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MyNetwork from './pages/Network';
import Messaging from './pages/Messaging';
import Reviews from './pages/Reviews';
import Catalogue from './pages/Catalogue';
import Portfolio from './pages/Portfolio';
import ContactUs from './pages/ContactUs';
import RequireAuth from './components/RequireAuth';
import bgImage from './styles/images/Lucid_Origin_A_sleek_professional_world_map_vector_illustratio_2.jpg';

function App() {
  return (
    <ToastProvider>
      <div
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        }}
      >
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-customer" element={<RegisterCustomer />} />
            <Route path="/register-business" element={<RegisterBusiness />} />
            <Route path="/business-payment" element={<BusinessPayment />} />

            {/* Protected Routes */}
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <HomepageBusiness />
                </RequireAuth>
              }
            />
            <Route
              path="/business-dashboard"
              element={
                <RequireAuth>
                  <BusinessDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/marketplace"
              element={
                <RequireAuth>
                  <Marketplace />
                </RequireAuth>
              }
            />
            <Route
              path="/network"
              element={
                <RequireAuth>
                  <MyNetwork />
                </RequireAuth>
              }
            />
            <Route
              path="/messaging"
              element={
                <RequireAuth>
                  <Messaging />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            <Route
              path="/reviews"
              element={
                <RequireAuth>
                  <Reviews />
                </RequireAuth>
              }
            />
            <Route
              path="/catalogue"
              element={
                <RequireAuth>
                  <Catalogue />
                </RequireAuth>
              }
            />
            <Route
              path="/portfolio"
              element={
                <RequireAuth>
                  <Portfolio />
                </RequireAuth>
              }
            />
            <Route
              path="/contact-us"
              element={
                <RequireAuth>
                  <ContactUs />
                </RequireAuth>
              }
            />
          </Routes>
        </Router>
      </div>
    </ToastProvider>
  );
}

export default App;
