import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // changed to hook

export default function ProtectedRoute({ children, allowed = [] }) {
  const { user } = useAuth() || {};
  const role = user?.role || null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowed.length && !allowed.includes(role)) return <Navigate to="/" replace />;
  return children;
}
