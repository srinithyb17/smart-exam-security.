import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_exam_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smart_exam_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('/auth/me')
        .then((res) => {
          setUser(res.user);
          localStorage.setItem('smart_exam_user', JSON.stringify(res.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginAdmin = async (username, password) => {
    const res = await apiRequest('/auth/admin/login', {
      method: 'POST',
      body: { username, password },
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('smart_exam_token', res.token);
    localStorage.setItem('smart_exam_user', JSON.stringify(res.user));
    return res.user;
  };

  const loginStudent = async (register_number, password) => {
    const res = await apiRequest('/auth/student/login', {
      method: 'POST',
      body: { register_number, password },
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('smart_exam_token', res.token);
    localStorage.setItem('smart_exam_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_exam_token');
    localStorage.removeItem('smart_exam_user');
    window.location.hash = '#/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
        loginAdmin,
        loginStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

