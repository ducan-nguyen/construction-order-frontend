import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext) ?? { user: null, loading: true, login: async () => false, register: async () => false, logout: () => {} };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');

    if (token && userEmail) {
      setUser({ email: userEmail, role: userRole });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, email: userEmail, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('userRole', role);

      setUser({ email: userEmail, role });
      toast.success('Đăng nhập thành công!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
      return false;
    }
  };

  const logout = () => {
    // Xóa guest cart nếu có (tránh rò rỉ giữa các session)
    localStorage.removeItem('construction_cart_undefined');
    localStorage.removeItem('construction_cart_null');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setUser(null);
    toast.success('Đã đăng xuất');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};