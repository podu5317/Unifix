// Global auth state - who is logged in and with what role.
import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('unifix_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (token, userData) => {
    sessionStorage.setItem('unifix_token', token);
    sessionStorage.setItem('unifix_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    saveSession(data.token, data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/api/auth/register', form);
    saveSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('unifix_token');
    sessionStorage.removeItem('unifix_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
