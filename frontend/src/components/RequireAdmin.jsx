import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default RequireAdmin;
