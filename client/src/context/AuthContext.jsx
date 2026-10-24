import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getCurrentUser, setCurrentUser, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setCurrentUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setCurrentUser(res.user);
    setUser(res.user);
    return res;
  };

  const register = async (email, password, displayName, studentId) => {
    const res = await api.register({ email, password, displayName, studentId });
    setAuthToken(res.token);
    setCurrentUser(res.user);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  const isSuperAdmin = user?.admin_permissions?.some((p) => p.role === 'SUPER_ADMIN') || false;
  const isDeptAdmin = user?.admin_permissions?.some((p) => p.role === 'DEPARTMENT_ADMIN') || false;
  const isAdmin = isSuperAdmin || isDeptAdmin;
  const assignedDeptId = user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN')?.department_id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isSuperAdmin,
        isDeptAdmin,
        assignedDeptId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
