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
import TermsCustomer from './pages/TermsCustomer';
import Terms from './pages/Terms';
import RegisterBusiness from './pages/RegisterBusiness';
import TermsBusiness from './pages/TermsBusiness';
import BusinessPayment from './pages/BusinessPayment';
import BusinessRegistered from './pages/BusinessRegistered';
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
import BusinessPublic from './pages/BusinessPublic';
import AdminMalls from './pages/AdminMalls';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import RequireAdmin from './components/RequireAdmin';
import AdminProducts from './pages/AdminProducts';
import AdminMallsList from './pages/AdminMallsList';
import AdminBusinesses from './pages/AdminBusinesses';
import RequireAuth from './components/RequireAuth';
import Footer from './components/Footer';
import bgImage from './styles/images/Lucid_Origin_A_sleek_professional_world_map_vector_illustratio_2.jpg';
import ScrollToTop from './components/ScrollToTop';

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
          paddingBottom: '4rem',
        }}
      >
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-customer" element={<RegisterCustomer />} />
            <Route path="/terms-customer" element={<TermsCustomer />} />
            <Route path="/register-business" element={<RegisterBusiness />} />
            <Route path="/terms-business" element={<TermsBusiness />} />
            <Route path="/business-payment" element={<BusinessPayment />} />
            <Route
              path="/business-registered"
              element={<BusinessRegistered />}
            />
            <Route path="/terms" element={<Terms />} />

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
              path="/admin/malls"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminMalls />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminUsers />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/businesses"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminBusinesses />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminProducts />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/malls/list"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminMallsList />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
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
            <Route path="/business/:id" element={<BusinessPublic />} />
          </Routes>
          <Footer />
        </Router>
      </div>
    </ToastProvider>
  );
}

export default App;
