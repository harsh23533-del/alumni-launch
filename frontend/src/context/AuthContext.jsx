import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    _persistSession(res.data);
    return res.data;
  };

  const signupAlumni = async (payload) => {
    const res = await api.post('/auth/signup/alumni', payload);
    _persistSession(res.data);
    return res.data;
  };

  const signupStudent = async (payload) => {
    const res = await api.post('/auth/signup/student', payload);
    _persistSession(res.data);
    return res.data;
  };

  const _persistSession = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    setToken(data.access_token);
    setRole(data.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, role, isAuthenticated: !!token, login, signupAlumni, signupStudent, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
