import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShoppingBag, BarChart2, Package, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validators } from '../utils/validators';
import Login from './Login';
import "../app.css";
import "../index.css";

// Simulated user store — in a real app this comes from backend
const USERS = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Administrador', role: 'Admin' },
  { id: 2, username: 'gerente', password: 'gerente123', name: 'Gerente Geral', role: 'Gerente' },
];

export default function Cadastro() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    setAuthError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const usrErr = validators.required(form.username, 'Usuário');
    const pwdErr = validators.password(form.password);
    if (usrErr) errs.username = usrErr;
    if (pwdErr) errs.password = pwdErr;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === form.username && u.password === form.password);
      if (user) {
        login({ id: user.id, name: user.name, username: user.username, role: user.role });
        navigate('/');
      } else {
        setAuthError('Usuário ou senha incorretos');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">🛍️</div>
          <div>
            <h1>Outlet<br />
              <span>Party</span>
            </h1>
            <p>Sistema de gestão completo para empresas, fornecedores e produtos — tudo em um só lugar.</p>
          </div>
          <div className="login-features">
            {[
              { icon: <BarChart2 size={15} />, label: 'Dashboard com métricas em tempo real', color: 'var(--primary-dim)', c: 'var(--primary)' },
              { icon: <Package size={15} />, label: 'Gestão de produtos e estoque', color: 'var(--success-dim)', c: 'var(--success)' },
              { icon: <Truck size={15} />, label: 'Controle de fornecedores', color: 'var(--info-dim)', c: 'var(--info)' },
            ].map(({ icon, label, color, c }) => (
              <div key={label} className="login-feature">
                <div className="login-feature-icon" style={{ background: color, color: c }}>{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <button className="theme-toggle" onClick={toggle} title="Alternar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <p className="login-form-title">Bem-vindo de volta</p>
        <p className="login-form-sub">Entre com suas credenciais para continuar</p>
        <p className="login-form-sub">
          Já tem Login{' '}
          <span className='cursor-pointer text-blue-200' onClick={() => navigate('/login')}>
            Entrar
          </span>
        </p>

        {authError && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-input-wrap">
            <User size={16} className="login-input-ico" />
            <input
              className={`login-input${errors.username ? ' error' : ''}`}
              placeholder="Nome de usuário"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              autoComplete="username"
            />
            {errors.username && <div className="field-error" style={{ marginTop: 4 }}>{errors.username}</div>}
          </div>

          <div className="login-input-wrap">
            <Lock size={16} className="login-input-ico" />
            <input
              className={`login-input${errors.password ? ' error' : ''}`}
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <div className="field-error" style={{ marginTop: 4 }}>{errors.password}</div>}
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Credenciais de teste:</strong><br />
          admin / admin123 &nbsp;·&nbsp; gerente / gerente123
        </div>
      </div>
    </div>
  );
}
