import axios from 'axios';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// 🔐 REQUEST
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

// 🔁 RESPONSE (refresh automático)
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


// 👤 USER SERVICE
export const userService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', {
      username: credentials.email || credentials.username,
      password: credentials.password,
    });

    const { token, refreshToken, user } = response.data;

    if (token) storage.setToken(token);
    if (refreshToken) storage.setRefreshToken(refreshToken);

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


// 🏢 EMPRESAS
export const empresaService = {
  listar: () => api.get('/api/empresas'),
  buscar: (id) => api.get(`/api/empresas/${id}`),
  criar: (data) => api.post('/api/empresas', data),
  atualizar: (id, data) => api.put(`/api/empresas/${id}`, data),
  deletar: (id) => api.delete(`/api/empresas/${id}`),
};


// 🚚 FORNECEDORES
export const fornecedorService = {
  listar: () => api.get('/api/fornecedores'),
  buscar: (id) => api.get(`/api/fornecedores/${id}`),
  criar: (data) => api.post('/api/fornecedores', data),
  atualizar: (id, data) => api.put(`/api/fornecedores/${id}`, data),
  deletar: (id) => api.delete(`/api/fornecedores/${id}`),
};


// 📦 PRODUTOS
export const produtoService = {
  listar: () => api.get('/api/produtos'),
  buscar: (id) => api.get(`/api/produtos/${id}`),
  criar: (data) => api.post('/api/produtos', data),
  atualizar: (id, data) => api.put(`/api/produtos/${id}`, data),
  deletar: (id) => api.delete(`/api/produtos/${id}`),
};


// 💰 VENDAS
export const vendaService = {
  listar: () => api.get('/api/vendas'),
  buscar: (id) => api.get(`/api/vendas/${id}`),
  criar: (data) => api.post('/api/vendas', data),
  cancelar: (id) => api.delete(`/api/vendas/${id}`),
};