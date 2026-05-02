import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erro ao conectar com o servidor';
    return Promise.reject(new Error(message));
  }
);

export const userService = {
  login: (credentials) => api.post('/auth/login', credentials),
  cadastro: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const empresaService = {
  getAll: () => api.get('/empresas'),
  getById: (id) => api.get(`/empresas/${id}`),
  create: (data) => api.post('/empresas', data),
  update: (id, data) => api.put(`/empresas/${id}`, data),
  delete: (id) => api.delete(`/empresas/${id}`),
};

export const fornecedorService = {
  getAll: () => api.get('/fornecedores'),
  getAtivos: () => api.get('/fornecedores/ativos'),
  getById: (id) => api.get(`/fornecedores/${id}`),
  create: (data) => api.post('/fornecedores', data),
  update: (id, data) => api.put(`/fornecedores/${id}`, data),
  delete: (id) => api.delete(`/fornecedores/${id}`),
};

export const produtoService = {
  getAll: () => api.get('/produtos'),
  getById: (id) => api.get(`/produtos/${id}`),
  getByFornecedor: (id) => api.get(`/produtos/fornecedor/${id}`),
  getByEmpresa: (id) => api.get(`/produtos/empresa/${id}`),
  create: (data) => api.post('/produtos', data),
  update: (id, data) => api.put(`/produtos/${id}`, data),
  delete: (id) => api.delete(`/produtos/${id}`),
};

export default api;
