import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';
import './index.css';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/empresas" element={<PrivateRoute><AppLayout><Empresas /></AppLayout></PrivateRoute>} />
      <Route path="/fornecedores" element={<PrivateRoute><AppLayout><Fornecedores /></AppLayout></PrivateRoute>} />
      <Route path="/produtos" element={<PrivateRoute><AppLayout><Produtos /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13.5px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg2)' } },
              error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'var(--bg2)' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
