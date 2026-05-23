import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const cleanToken = token.replace(/["']/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==============================
// 1. Auth
// ==============================
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// ==============================
// 2. Product
// ==============================
export const productAPI = {
  getAll: (page = 0, size = 10) => api.get(`/products/public?page=${page}&size=${size}`),
  search: (keyword, page = 0, size = 10) =>
    api.get(`/products/search?keyword=${keyword}&page=${page}&size=${size}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (product) => api.post('/admin/products', product),
  adminGetAll: (page = 0, size = 100) => api.get(`/admin/products?page=${page}&size=${size}`),
  getLowStock: (threshold = 10) => api.get(`/admin/products/low-stock?threshold=${threshold}`),
  update: (id, productData) => api.put(`/admin/products/${id}`, productData),
  toggleActive: (id) => api.patch(`/admin/products/${id}/toggle-active`),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
};

// ==============================
// 3. Order
// ==============================
export const orderAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getById: (id) => api.get(`/orders/${id}`),
  getUserOrders: (page = 0, size = 10) => api.get(`/orders?page=${page}&size=${size}`),
  getAllOrders: (page = 0, size = 10) => api.get(`/orders/admin/all?page=${page}&size=${size}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/orders/admin/${id}/status?status=${status}`),
  // Hoàn tiền
  requestRefund: (id, reason) => api.post(`/orders/${id}/request-refund`, { reason }),
  approveRefund: (id) => api.put(`/orders/admin/${id}/approve-refund`),
  rejectRefund: (id) => api.put(`/orders/admin/${id}/reject-refund`),
};

// ==============================
// 4. Payment
// ==============================
export const paymentAPI = {
  process: (paymentData) => api.post('/payments/process', paymentData),
  confirm: (paymentId) => api.post(`/payments/${paymentId}/confirm`),
};

// ==============================
// 6. User Profile (thông tin cá nhân)
// ==============================
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData) => api.put('/user/profile', profileData),
  changePassword: (passwordData) => api.post('/user/change-password', passwordData),
};

// ==============================
// 7. Admin Statistics (Dashboard)
// ==============================
export const statisticsAPI = {
  getDashboardStats: () => api.get('/admin/statistics/dashboard'),
  getRevenueChart:   (months = 6) => api.get(`/admin/statistics/revenue-chart?months=${months}`),
};

// ==============================
// 8. Gộp admin API (tiện dùng)
// ==============================
export const adminAPI = {
  getAllOrders:      orderAPI.getAllOrders,
  updateOrderStatus: orderAPI.updateStatus,
  getDashboardStats: statisticsAPI.getDashboardStats,
  getRevenueChart:   statisticsAPI.getRevenueChart,
};

export default api;