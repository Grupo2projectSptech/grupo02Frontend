import axios from 'axios';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// 🔐 REQUEST — injeta token em toda requisição
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔁 RESPONSE — refresh automático em 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.getRefreshToken();

        if (refreshToken) {
          const response = await axios.post(
            'http://localhost:8080/api/auth/refresh',
            { refreshToken }
          );

          const newToken = response.data.token;
          storage.setToken(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        storage.clearAuth();
        storage.removeToken();
        storage.removeRefreshToken();
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message ||
      'Erro ao conectar com o servidor';

    return Promise.reject(new Error(message));
  }
);


// ─────────────────────────────────────────────
// 👤 AUTH / USER
// ─────────────────────────────────────────────
export const userService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    const { token, refreshToken, id, name, username, role } = response.data;

    if (token) storage.setToken(token);
    if (refreshToken) storage.setRefreshToken(refreshToken);

    const user = { id, name, username, role };

    return { token, refreshToken, user };
  },

  cadastro: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      storage.clearAuth();
      storage.removeToken();
      storage.removeRefreshToken();
    }
  },
};


// ─────────────────────────────────────────────
// 🚚 FORNECEDORES
// ─────────────────────────────────────────────
export const fornecedorService = {
  // Português
  listar: () => api.get('/api/fornecedores'),
  buscar: (id) => api.get(`/api/fornecedores/${id}`),
  criar: (data) => api.post('/api/fornecedores', data),
  atualizar: (id, data) => api.put(`/api/fornecedores/${id}`, data),
  deletar: (id) => api.delete(`/api/fornecedores/${id}`),

  // Inglês (aliases)
  getAll: () => api.get('/api/fornecedores'),
  getById: (id) => api.get(`/api/fornecedores/${id}`),
  create: (data) => api.post('/api/fornecedores', data),
  update: (id, data) => api.put(`/api/fornecedores/${id}`, data),
  delete: (id) => api.delete(`/api/fornecedores/${id}`),
};


// ─────────────────────────────────────────────
// 📦 PRODUTOS
// ─────────────────────────────────────────────
export const produtoService = {
  // Português
  listar: () => api.get('/api/produtos'),
  buscar: (id) => api.get(`/api/produtos/${id}`),
  criar: (data) => api.post('/api/produtos', data),
  atualizar: (id, data) => api.put(`/api/produtos/${id}`, data),
  deletar: (id) => api.delete(`/api/produtos/${id}`),

  // Inglês (aliases)
  getAll: () => api.get('/api/produtos'),
  getById: (id) => api.get(`/api/produtos/${id}`),
  create: (data) => api.post('/api/produtos', data),
  update: (id, data) => api.put(`/api/produtos/${id}`, data),
  delete: (id) => api.delete(`/api/produtos/${id}`),
};


// ─────────────────────────────────────────────
// 💰 VENDAS
// ─────────────────────────────────────────────
export const vendaService = {
  // Português
  listar: () => api.get('/api/vendas'),
  buscar: (id) => api.get(`/api/vendas/${id}`),
  criar: (data) => api.post('/api/vendas', data),
  cancelar: (id) => api.delete(`/api/vendas/${id}`),

  // Inglês (aliases)
  getAll: () => api.get('/api/vendas'),
  getById: (id) => api.get(`/api/vendas/${id}`),
  create: (data) => api.post('/api/vendas', data),
  delete: (id) => api.delete(`/api/vendas/${id}`),
};

export default api;