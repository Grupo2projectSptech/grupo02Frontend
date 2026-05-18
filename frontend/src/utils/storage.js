const AUTH_KEY = 'op_auth';
const THEME_KEY = 'op_theme';

export const storage = {

  // 🔐 USER
  getAuth: () => {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setAuth: (user) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },

  clearAuth: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  // 🔐 TOKEN (centralizado — melhora MUITO o projeto)
  getToken: () => localStorage.getItem('token'),

  setToken: (token) => localStorage.setItem('token', token),

  removeToken: () => localStorage.removeItem('token'),

  // 🔐 REFRESH TOKEN
  getRefreshToken: () => localStorage.getItem('refreshToken'),

  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),

  removeRefreshToken: () => localStorage.removeItem('refreshToken'),

  // 🎨 THEME
  getTheme: () => localStorage.getItem(THEME_KEY) || 'dark',

  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
};