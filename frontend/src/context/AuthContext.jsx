import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import { tokenStorage } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const savedUser = tokenStorage.getUser();
    const token     = tokenStorage.getToken();
    if (savedUser && token) setUser(savedUser);
    setLoading(false);

    // Listen for 401 global event
    const handle401 = () => { setUser(null); };
    window.addEventListener('inventiq:unauthorized', handle401);
    return () => window.removeEventListener('inventiq:unauthorized', handle401);
  }, []);

  const login = async (email, password, role) => {
    const result = await authService.login({ email, password, role });
    if (result.data) {
      setUser(result.data.user);
      return { success: true, role: result.data.user?.role };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
