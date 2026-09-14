// Centralized API Client for UoH Marketplace
const API_BASE = '/api';

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('uoh_token');
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if body is FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Network request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (formData) => fetchWithAuth('/auth/register', {
    method: 'POST',
    body: formData instanceof FormData ? formData : JSON.stringify(formData)
  }),
  getMe: () => fetchWithAuth('/auth/me'),
  updateProfile: (formData) => fetchWithAuth('/auth/profile', {
    method: 'PUT',
    body: formData
  }),
  forgotPassword: (email) => fetchWithAuth('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: (token, newPassword) => fetchWithAuth('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  }),
  changePassword: (currentPassword, newPassword) => fetchWithAuth('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  }),

  // Categories
  getCategories: () => fetchWithAuth('/categories'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetchWithAuth(`/products?${query.toString()}`);
  },
  getProductById: (id) => fetchWithAuth(`/products/${id}`),
  createProduct: (formData) => fetchWithAuth('/products', {
    method: 'POST',
    body: formData
  }),
  updateProduct: (id, formData) => fetchWithAuth(`/products/${id}`, {
    method: 'PUT',
    body: formData
  }),
  deleteProduct: (id) => fetchWithAuth(`/products/${id}`, {
    method: 'DELETE'
  }),
  markAsSold: (id) => fetchWithAuth(`/products/${id}/status`, {
    method: 'PATCH'
  }),
  getMyListings: (status) => fetchWithAuth(`/products/my-listings${status ? `?status=${status}` : ''}`),

  // Wishlist
  getWishlist: () => fetchWithAuth('/wishlist'),
  toggleWishlist: (productId) => fetchWithAuth(`/wishlist/${productId}`, {
    method: 'POST'
  }),

  // Messages
  getConversations: () => fetchWithAuth('/messages/conversations'),
  startConversation: (productId, sellerId) => fetchWithAuth('/messages/start', {
    method: 'POST',
    body: JSON.stringify({ productId, sellerId })
  }),
  getMessages: (conversationId) => fetchWithAuth(`/messages/conversations/${conversationId}`),
  sendMessage: (conversationId, messageText) => fetchWithAuth(`/messages/conversations/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify({ messageText })
  }),

  // Payments / Orders
  createOrder: (productId) => fetchWithAuth('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ productId })
  }),
  verifyPayment: (payload) => fetchWithAuth('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getUserOrders: (role = 'buyer') => fetchWithAuth(`/payments/orders?role=${role}`),
  getOrderById: (id) => fetchWithAuth(`/payments/orders/${id}`),

  // Reviews
  createReview: (payload) => fetchWithAuth('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getSellerReviews: (sellerId) => fetchWithAuth(`/reviews/seller/${sellerId}`),

  // Notifications
  getNotifications: () => fetchWithAuth('/notifications'),
  markNotificationAsRead: (id) => fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PATCH'
  }),
  markAllNotificationsAsRead: () => fetchWithAuth('/notifications/read-all', {
    method: 'PATCH'
  }),

  // Admin
  getAdminStats: () => fetchWithAuth('/admin/stats'),
  getAdminLogs: () => fetchWithAuth('/admin/logs'),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/admin/users${query ? `?${query}` : ''}`);
  },
  banUser: (id) => fetchWithAuth(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  unbanUser: (id) => fetchWithAuth(`/admin/users/${id}/unban`, { method: 'PATCH' }),
  deleteUser: (id) => fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/admin/products${query ? `?${query}` : ''}`);
  },
  delistProduct: (id) => fetchWithAuth(`/admin/products/${id}/delist`, { method: 'PATCH' }),
  relistProduct: (id) => fetchWithAuth(`/admin/products/${id}/relist`, { method: 'PATCH' }),
  addCategory: (payload) => fetchWithAuth('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  editCategory: (id, payload) => fetchWithAuth(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteCategory: (id) => fetchWithAuth(`/admin/categories/${id}`, { method: 'DELETE' }),
  getAdminOrders: () => fetchWithAuth('/admin/orders')
};
