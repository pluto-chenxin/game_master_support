import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import { message } from 'antd';

const ProtectedRoute = ({ 
  requireAuth = true, 
  requireWorkspace = false, 
  requiredRole = null 
}) => {
  const { 
    isAuthenticated, 
    initialized, 
    loading, 
    currentWorkspace, 
    hasWorkspaceRole,
    user
  } = useAuth();
  const location = useLocation();

  // For debugging
  console.log('ProtectedRoute state:', {
    path: location.pathname,
    requireAuth,
    requireWorkspace,
    isAuthenticated: isAuthenticated(),
    initialized,
    loading,
    hasWorkspace: !!currentWorkspace,
    workspaceId: currentWorkspace?.id,
    userId: user?.id
  });

  // Wait until the auth state is loaded
  if (loading || !initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading authentication..." />
      </div>
    );
  }

  // Redirect to login if authentication is required but not present
  if (requireAuth && !isAuthenticated()) {
    console.log('Redirecting to login - not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to workspace selection if a workspace is required but not selected
  // We only redirect if the path is not already /workspaces and a workspace is required
  if (requireWorkspace && !currentWorkspace && location.pathname !== '/workspaces') {
    console.log('Redirecting to workspace selector - no workspace selected');
    message.info('Please select a workspace to continue');
    return <Navigate to="/workspaces" state={{ from: location }} replace />;
  }

  // Check required role if specified
  if (requiredRole && !hasWorkspaceRole(requiredRole)) {
    console.log('Redirecting to unauthorized - missing required role');
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 