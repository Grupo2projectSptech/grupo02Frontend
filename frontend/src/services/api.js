import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      'Erro ao conectar com o servidor';
    return Promise.reject(new Error(message));
  }
);

// =======================
// 👤 USER SERVICE
// =======================
export const userService = {
  // 🔐 Login via Spring Boot Auth API
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', {
      username: credentials.email || credentials.username,
      password: credentials.password,
    });

    return response.data;
  },

  cadastro: (data) => api.post('/api/auth/register', data),

  getProfile: () => api.get('/api/auth/profile'),

  logout: () => api.post('/api/auth/logout'),

  delete: (id) => api.delete(`/users/${id}`),

  atualizar: (id, data) => api.put(`/users/${id}`, data),
};

// =======================
// 🏢 EMPRESA SERVICE
// =======================
export const empresaService = {
  getAll: () => api.get('/api/empresas'),

  getById: (id) => api.get(`/api/empresas/${id}`),

  create: (data) => api.post('/api/empresas', data),

  update: (id, data) => api.put(`/api/empresas/${id}`, data),

  delete: (id) => api.delete(`/api/empresas/${id}`),
};

// =======================
// 🚚 FORNECEDOR SERVICE
// =======================
export const fornecedorService = {
  getAll: () => api.get('/api/fornecedores'),

  getAtivos: () => api.get('/api/fornecedores/ativos'),

  getById: (id) => api.get(`/api/fornecedores/${id}`),

  create: (data) => api.post('/api/fornecedores', data),

  update: (id, data) => api.put(`/api/fornecedores/${id}`, data),

  delete: (id) => api.delete(`/api/fornecedores/${id}`),
};

// =======================
// 📦 PRODUTO SERVICE
// =======================
export const produtoService = {
  getAll: () => api.get('/api/produtos'),

  getById: (id) => api.get(`/api/produtos/${id}`),

  getByFornecedor: (id) =>
    api.get(`/api/produtos/fornecedor/${id}`),

  getByEmpresa: (id) =>
    api.get(`/api/produtos/empresa/${id}`),

  create: (data) => api.post('/api/produtos', data),

  update: (id, data) => api.put(`/api/produtos/${id}`, data),

  delete: (id) => api.delete(`/api/produtos/${id}`),
};

export default api;