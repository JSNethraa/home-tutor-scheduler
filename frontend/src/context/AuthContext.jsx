import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Verify user on initial load if tokens exist
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !user) {
      setLoading(true);
      authApi.getMe()
        .then(res => {
          const userData = res.data;
          localStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const isAdmin   = user?.role === 'ADMIN';
  const isTutor   = user?.role === 'TUTOR';
  const isParent  = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTutor, isParent, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
