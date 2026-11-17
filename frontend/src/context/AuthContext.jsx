import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          const userData = {
            id: res.data.id,
            username: res.data.username,
            email: res.data.email,
            role: res.data.role,
            full_name: res.data.full_name,
            phone_number: res.data.phone_number,
            profile_id: res.data.profile_id,
            profile: res.data.profile,
          };
          setUser(userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session expired or invalid token, clearing session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { access, refresh, user: userInfo } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_data', JSON.stringify(userInfo));
    setUser(userInfo);
    return userInfo;
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTutor = user?.role === 'TUTOR';
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTutor, isParent, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
