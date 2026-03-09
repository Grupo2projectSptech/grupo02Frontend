// ─── Outlet Party — Storage helpers ─────────────────────────────────────────

const AUTH_KEY = 'op_auth';
const THEME_KEY = 'op_theme';

export const storage = {
  getAuth: () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
    catch { return null; }
  },
  setAuth: (user) => localStorage.setItem(AUTH_KEY, JSON.stringify(user)),
  clearAuth: () => localStorage.removeItem(AUTH_KEY),

  getTheme: () => localStorage.getItem(THEME_KEY) || 'dark',
  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
};
