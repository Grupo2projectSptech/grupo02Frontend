import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = storage.getAuth();
    const token      = storage.getToken();

    if (storedUser && token) {
      // Valida se o token ainda não expirou
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(storedUser); // ✅ Token válido, restaura sessão
        } else {
          _clearAll();         // ⚠️ Token expirado, limpa tudo
        }
      } catch {
        _clearAll();           // ⚠️ Token malformado, limpa tudo
      }
    } else {
      _clearAll();             // ⚠️ Sem dados, garante limpeza
    }

    setLoading(false);         // 🔓 Libera o render das rotas
  }, []);

  const _clearAll = () => {
    storage.clearAuth();
    storage.removeToken();
    storage.removeRefreshToken();
  };

  const isAuthenticated = () => {
    const token = storage.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const login = (userData) => {
    storage.setAuth(userData);
    setUser(userData);
  };

  const logout = () => {
    _clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);