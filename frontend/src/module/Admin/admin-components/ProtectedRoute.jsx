import React from 'react';
import { Navigate } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import safeLocalStorage from '../../../utils/safeLocalStorage';

const ProtectedRoute = ({ children }) => {
  // Check if admin is logged in using adminToken
  const adminToken = safeLocalStorage.getItem('adminToken', null);
  const adminLoggedIn = safeLocalStorage.getItem('admin_logged_in', null);

  // If no admin token or not logged in, redirect to login
  if (!adminToken || adminLoggedIn !== 'true') {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin is authenticated, render the protected content
  return <SidebarLayout>{children}</SidebarLayout>;
};

export default ProtectedRoute;

