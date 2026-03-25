import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

import logo from '../styles/images/logo.png';
import bgImage from '../styles/images/Lucid_Origin_A_sleek_professional_world_map_vector_illustratio_2.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');

    if (token) {
      if (role === 'business') {
        navigate('/home');
      } else {
        navigate('/home');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await api.post('/auth/login', { email, password });

      if (rememberMe) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.user.role);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
      } else {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('role', res.data.user.role);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }

      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleNavigation = (path) => {
    if (email || password) {
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
    <div className="min-h-screen flex items-center justify-center bg-transparent fixed inset-0">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-[90%] max-w-[450px] text-center relative">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to </h1>
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="w-[200px] object-contain" />
        </div>
        <p className="text-lg text-gray-700 mb-1 font-semibold">
          Log in. Shop smart. Save big.
        </p>
        <p className="text-gray-500 mb-6 text-sm">
          Choose better, together. Batanai.
        </p>

        {/* Login/Register toggle */}
        <div className="bg-gray-200 p-1 rounded-full flex mb-6">
          <button className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all bg-white shadow-sm text-brand-600">
            Login
          </button>
          <button
            className="flex-1 py-2 px-4 rounded-full text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
            onClick={() => handleNavigation('/register-customer')}
          >
            Register
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all pr-10"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-brand-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                // Eye Slash Icon (Hide)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20px"
                  height="20px"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                </svg>
              ) : (
                // Eye Icon (Show)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20px"
                  height="20px"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="rememberMe" className="cursor-pointer">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-2"
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-7 w-[90%] max-w-[400px] shadow-2xl text-center">
            <h3 className="text-brand-600 mb-2.5 text-lg font-bold">Warning</h3>
            <p className="mb-5 text-gray-700">
              You have data in the fields. Are you sure you want to navigate
              away?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                className="px-5 py-2 rounded-full border-none bg-brand-600 text-white cursor-pointer hover:bg-brand-500 transition"
                onClick={confirmLeave}
              >
                Yes
              </button>
              <button
                className="px-5 py-2 rounded-full border border-gray-300 bg-transparent text-gray-600 cursor-pointer hover:bg-gray-100 transition"
                onClick={cancelLeave}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
