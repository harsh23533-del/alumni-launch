import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    _persistSession(res.data);
    return res.data;
  };

  const loginAdmin = async (email, password) => {
    // Separate endpoint from the normal /auth/login — only accounts whose
    // email matches ADMIN_EMAIL on the backend are allowed through.
    const res = await api.post('/admin/login', { email, password });
    _persistSession(res.data);
    return res.data;
  };

  const signupAlumni = async (payload) => {
    const res = await api.post('/auth/signup/alumni', payload);
    _persistSession(res.data);
    return res.data;
  };

  const signupStudent = async (payload) => {
    // Student signups go into a pending-approval queue — no session yet.
    const res = await api.post('/auth/signup/student', payload);
    return res.data;
  };

  const signupCompany = async (payload) => {
    const res = await api.post('/auth/signup/company', payload);
    _persistSession(res.data);
    return res.data;
  };

  const _persistSession = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
    setToken(data.access_token);
    setRole(data.role);
    setIsAdmin(!!data.is_admin);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('isAdmin');
    setToken(null);
    setRole(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ token, role, isAdmin, isAuthenticated: !!token, login, loginAdmin, signupAlumni, signupStudent, signupCompany, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
