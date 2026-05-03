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
  // 🔐 Login via JSON Server
  login: async (credentials) => {
    const response = await api.get(
      `/users?email=${credentials.email}&password=${credentials.password}`
    );

    if (response.data.length === 0) {
      throw new Error('Email ou senha inválidos');
    }

    return response.data[0]; // retorna usuário direto
  },

  cadastro: (data) => api.post('/users', data),

  getProfile: (id) => api.get(`/users/${id}`),

  logout: () => Promise.resolve(),

  delete: (id) => api.delete(`/users/${id}`),

  atualizar: (id, data) => api.put(`/users/${id}`, data),
};

// =======================
// 🏢 EMPRESA SERVICE
// =======================
export const empresaService = {
  getAll: () => api.get('/empresas'),

  getById: (id) => api.get(`/empresas/${id}`),

  create: (data) => api.post('/empresas', data),

  update: (id, data) => api.put(`/empresas/${id}`, data),

  delete: (id) => api.delete(`/empresas/${id}`),
};

// =======================
// 🚚 FORNECEDOR SERVICE
// =======================
export const fornecedorService = {
  getAll: () => api.get('/fornecedores'),

  getAtivos: () => api.get('/fornecedores?ativo=true'),

  getById: (id) => api.get(`/fornecedores/${id}`),

  create: (data) => api.post('/fornecedores', data),

  update: (id, data) => api.put(`/fornecedores/${id}`, data),

  delete: (id) => api.delete(`/fornecedores/${id}`),
};

// =======================
// 📦 PRODUTO SERVICE
// =======================
export const produtoService = {
  getAll: () => api.get('/produtos'),

  getById: (id) => api.get(`/produtos/${id}`),

  getByFornecedor: (id) =>
    api.get(`/produtos?fornecedorId=${id}`),

  getByEmpresa: (id) =>
    api.get(`/produtos?empresaId=${id}`),

  create: (data) => api.post('/produtos', data),

  update: (id, data) => api.put(`/produtos/${id}`, data),

  delete: (id) => api.delete(`/produtos/${id}`),
};

export default api;