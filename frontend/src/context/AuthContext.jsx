import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  // ------------------------------------------------------
  // Check logged-in user on page reload
  // ------------------------------------------------------
  const checkUser = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Show change password modal if first login
        if (userData.isFirstLogin) {
          setShowChangePasswordModal(true);
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);

      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      // Show change password modal if first login
      if (data.user.isFirstLogin) {
        setShowChangePasswordModal(true);
      }
      
      navigate('/dashboard');
      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // ------------------------------------------------------
  // Logout
  // ------------------------------------------------------
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowChangePasswordModal(false);
    navigate('/login');
  };

  // ------------------------------------------------------
  // Provider
  // ------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
      user, 
      loading, 
      login, 
      logout, 
      showChangePasswordModal,
        setShowChangePasswordModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
