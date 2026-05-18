import { createContext, useContext, useState } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => storage.getAuth());

  // 🔐 valida JWT (token + expiração)
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
    storage.clearAuth();
    storage.removeToken();
    storage.removeRefreshToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated // ✅ AGORA É FUNÇÃO
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);