import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
  admin: { manageUsers: true, manageProjects: true, manageTestCases: true, execute: true, viewOnly: false },
  test_lead: { manageUsers: false, manageProjects: true, manageTestCases: true, execute: true, viewOnly: false },
  tester: { manageUsers: false, manageProjects: false, manageTestCases: false, execute: true, viewOnly: false },
  read_only: { manageUsers: false, manageProjects: false, manageTestCases: false, execute: false, viewOnly: true },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { data } = await client.post('/auth/register', { email, password, name });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const permissions = useMemo(
    () => (user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.read_only),
    [user],
  );

  const value = useMemo(
    () => ({ user, login, register, logout, permissions }),
    [user, login, register, logout, permissions],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
