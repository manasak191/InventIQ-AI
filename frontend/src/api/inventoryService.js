import api from './api';

function extractError(err) {
  if (err && err.response) {
    const detail = err.response.data;
    const message =
      (typeof detail === 'string' && detail) ||
      detail?.detail || detail?.message ||
      err.message || 'Something went wrong.';
    return { message, status: err.response.status };
  }
  return { message: 'Network error.', status: null };
}

/* ── PRODUCTS / INVENTORY ───────────────────────────── */
export const inventoryService = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/inventory/products', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getOne: async (id) => {
    try {
      const { data } = await api.get(`/inventory/products/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  create: async (payload) => {
    try {
      const { data } = await api.post('/inventory/products', payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  update: async (id, payload) => {
    try {
      const { data } = await api.put(`/inventory/products/${id}`, payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  delete: async (id) => {
    try {
      const { data } = await api.delete(`/inventory/products/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getLowStock: async () => {
    try {
      const { data } = await api.get('/inventory/products/low-stock');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  exportCSV: async () => {
    try {
      const response = await api.get('/inventory/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { error: null };
    } catch (err) { return { error: extractError(err).message }; }
  },
};


/* ── SUPPLIERS ──────────────────────────────────────── */
export const supplierService = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/suppliers', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getOne: async (id) => {
    try {
      const { data } = await api.get(`/suppliers/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  create: async (payload) => {
    try {
      const { data } = await api.post('/suppliers', payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  update: async (id, payload) => {
    try {
      const { data } = await api.put(`/suppliers/${id}`, payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  delete: async (id) => {
    try {
      const { data } = await api.delete(`/suppliers/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── TRANSACTIONS ───────────────────────────────────── */
export const transactionService = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/transactions', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  create: async (payload) => {
    try {
      const { data } = await api.post('/transactions', payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getSummary: async (params = {}) => {
    try {
      const { data } = await api.get('/transactions/summary', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── PURCHASE ORDERS ────────────────────────────────── */
export const orderService = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/orders', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  create: async (payload) => {
    try {
      const { data } = await api.post('/orders', payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  approve: async (id) => {
    try {
      const { data } = await api.patch(`/orders/${id}/approve`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  reject: async (id) => {
    try {
      const { data } = await api.patch(`/orders/${id}/reject`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── NOTIFICATIONS ──────────────────────────────────── */
export const notificationService = {
  getAll: async () => {
    try {
      const { data } = await api.get('/notifications');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  markRead: async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  markAllRead: async () => {
    try {
      const { data } = await api.patch('/notifications/read-all');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  /* Trigger low-stock email alert to admin */
  sendLowStockAlert: async (productIds) => {
    try {
      const { data } = await api.post('/notifications/low-stock-alert', { product_ids: productIds });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  delete: async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  deleteAllRead: async () => {
    try {
      const { data } = await api.delete('/notifications');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── REPORTS / ANALYTICS ────────────────────────────── */
export const reportService = {
  getSummary: async (params = {}) => {
    try {
      const { data } = await api.get('/reports/summary', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getInventoryReport: async (params = {}) => {
    try {
      const { data } = await api.get('/reports/inventory', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getRevenueReport: async (params = {}) => {
    try {
      const { data } = await api.get('/reports/revenue', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getSupplierReport: async (params = {}) => {
    try {
      const { data } = await api.get('/reports/suppliers', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── AI ASSISTANT ───────────────────────────────────── */
export const aiService = {
  chat: async (message, history = []) => {
    try {
      const { data } = await api.post('/ai/chat', { message, history });
      return { data, error: null, status: null };
    } catch (err) {
      const { message: errMessage, status } = extractError(err);
      return { data: null, error: errMessage, status };
    }
  },
  getForecast: async (skuId) => {
    try {
      const { data } = await api.get(`/ai/forecast/${skuId}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── USERS (admin only) ─────────────────────────────── */
export const userService = {
  getAll: async () => {
    try {
      const { data } = await api.get('/admin/users');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  update: async (id, payload) => {
    try {
      const { data } = await api.put(`/admin/users/${id}`, payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  suspend: async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/suspend`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  restore: async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/restore`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};

/* ── DASHBOARD KPIs ─────────────────────────────────── */
export const dashboardService = {
  getUserKPIs: async () => {
    try {
      const { data } = await api.get('/dashboard/user-kpis');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getAdminKPIs: async () => {
    try {
      const { data } = await api.get('/dashboard/admin-kpis');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getWarehouseStats: async () => {
    try {
      const { data } = await api.get('/dashboard/warehouses');
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};


/* ── GLOBAL SEARCH ────────────────────────────────────── */
export const searchService = {
  search: async (q) => {
    try {
      const { data } = await api.get('/dashboard/search', { params: { q } });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};


export const warehouseService = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/inventory/warehouses', { params });
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  getOne: async (id) => {
    try {
      const { data } = await api.get(`/inventory/warehouses/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  create: async (payload) => {
    try {
      const { data } = await api.post('/inventory/warehouses', payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  update: async (id, payload) => {
    try {
      const { data } = await api.put(`/inventory/warehouses/${id}`, payload);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
  delete: async (id) => {
    try {
      const { data } = await api.delete(`/inventory/warehouses/${id}`);
      return { data, error: null };
    } catch (err) { return { data: null, error: extractError(err).message }; }
  },
};