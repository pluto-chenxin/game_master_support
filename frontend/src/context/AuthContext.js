import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { message } from 'antd';

// Create authentication context
const AuthContext = createContext();

// Set default axios auth header
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load user from token (if exists)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        setAuthToken(token);
        try {
          const res = await axios.get('http://localhost:5000/api/auth/me');
          setUser(res.data.user);
          
          // Make sure workspaces is always an array
          const workspacesData = Array.isArray(res.data.workspaces) ? res.data.workspaces : [];
          setWorkspaces(workspacesData);
          
          // Load last selected workspace if available
          const lastWorkspaceId = localStorage.getItem('currentWorkspaceId');
          if (lastWorkspaceId && workspacesData && workspacesData.length > 0) {
            const workspace = workspacesData.find(w => w.id === parseInt(lastWorkspaceId));
            if (workspace) {
              setCurrentWorkspace(workspace);
            } else if (workspacesData.length > 0) {
              // Fallback to first workspace if saved one not found
              setCurrentWorkspace(workspacesData[0]);
              localStorage.setItem('currentWorkspaceId', workspacesData[0].id.toString());
            }
          } else if (workspacesData && workspacesData.length > 0) {
            // No saved workspace, use first one
            setCurrentWorkspace(workspacesData[0]);
            localStorage.setItem('currentWorkspaceId', workspacesData[0].id.toString());
          }
        } catch (err) {
          console.error('Error loading user:', err);
          localStorage.removeItem('token');
          setAuthToken(null);
        }
      }
      setLoading(false);
      setInitialized(true);
    };

    loadUser();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      // Store token and set axios header
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      // Set user and workspaces
      setUser(res.data.user);
      setWorkspaces(res.data.workspaces || []);
      
      // Set first workspace as current if available
      if (res.data.workspaces && res.data.workspaces.length > 0) {
        setCurrentWorkspace(res.data.workspaces[0]);
        localStorage.setItem('currentWorkspaceId', res.data.workspaces[0].id);
      }
      
      setLoading(false);
      message.success('Registration successful!');
      return true;
    } catch (err) {
      setLoading(false);
      message.error(err.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Store token and set axios header
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      // Set user and workspaces
      setUser(res.data.user);
      setWorkspaces(res.data.workspaces || []);
      
      // Set first workspace as current if available
      if (res.data.workspaces && res.data.workspaces.length > 0) {
        setCurrentWorkspace(res.data.workspaces[0]);
        localStorage.setItem('currentWorkspaceId', res.data.workspaces[0].id);
      }
      
      setLoading(false);
      message.success('Login successful!');
      return true;
    } catch (err) {
      setLoading(false);
      message.error(err.response?.data?.error || 'Login failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentWorkspaceId');
    setAuthToken(null);
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    message.info('Logged out successfully');
  };

  // Switch workspace
  const switchWorkspace = (workspaceIdOrObject) => {
    try {
      // Handle the case where we're given a workspace ID instead of object
      let workspace = workspaceIdOrObject;
      
      // If we're given just an ID, find the workspace object
      if (typeof workspaceIdOrObject === 'number' || typeof workspaceIdOrObject === 'string') {
        const workspaceId = Number(workspaceIdOrObject);
        workspace = workspaces.find(w => w.id === workspaceId);
        
        if (!workspace) {
          console.error(`Workspace with ID ${workspaceId} not found`);
          message.error('Workspace not found');
          return;
        }
      }
      
      // Check if workspace is valid
      if (!workspace || typeof workspace !== 'object' || !workspace.id) {
        console.error('Invalid workspace object', workspace);
        message.error('Invalid workspace selected');
        return;
      }
      
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspace.id.toString());
      
      // Update axios headers with current workspace ID
      if (axios.defaults.headers.common['Authorization']) {
        axios.defaults.headers.common['X-Workspace-ID'] = workspace.id.toString();
      }
      
      message.info(`Switched to ${workspace.name} workspace`);
    } catch (error) {
      console.error('Error switching workspace:', error);
      message.error('Failed to switch workspace');
    }
  };

  // Set workspace ID in headers when user or workspace changes
  useEffect(() => {
    if (currentWorkspace && user) {
      axios.defaults.headers.common['X-Workspace-ID'] = currentWorkspace.id.toString();
    } else {
      delete axios.defaults.headers.common['X-Workspace-ID'];
    }
  }, [currentWorkspace, user]);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has a specific role in current workspace
  const hasWorkspaceRole = (requiredRole) => {
    if (!user || !currentWorkspace) return false;
    
    const roleHierarchy = {
      'USER': 1,
      'ADMIN': 2,
      'SUPER_ADMIN': 3
    };
    
    const userRole = currentWorkspace.role;
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        loading,
        initialized,
        register,
        login,
        logout,
        switchWorkspace,
        isAuthenticated,
        hasWorkspaceRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 