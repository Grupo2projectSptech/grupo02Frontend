import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MarketplaceProvider } from './context/MarketplaceContext';

import Sidebar      from './components/layout/Sidebar';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Produtos     from './pages/Produtos';
import Cadastro     from './pages/Cadastro';
import Vendas       from './pages/Vendas';
import Marketplace  from './pages/Marketplace';

import './index.css';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      Carregando...
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login"    element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/cadastro" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Cadastro />} />
      <Route path="/dashboard"    element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/fornecedores" element={<PrivateRoute><AppLayout><Fornecedores /></AppLayout></PrivateRoute>} />
      <Route path="/produtos"     element={<PrivateRoute><AppLayout><Produtos /></AppLayout></PrivateRoute>} />
      <Route path="/vendas"       element={<PrivateRoute><AppLayout><Vendas /></AppLayout></PrivateRoute>} />
      <Route path="/marketplace"  element={<PrivateRoute><AppLayout><Marketplace /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketplaceProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg3)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13.5px',
                },
                success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg3)' } },
                error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'var(--bg3)' } },
              }}
            />
            <AppRoutes />
          </BrowserRouter>
        </MarketplaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
