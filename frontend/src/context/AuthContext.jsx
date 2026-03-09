import { createContext, useContext, useState } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getAuth());

  const login = (userData) => {
    storage.setAuth(userData);
    setUser(userData);
  };

  const logout = () => {
    storage.clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
