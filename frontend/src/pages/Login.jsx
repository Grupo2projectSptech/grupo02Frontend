import { useState, useEffect } from 'react'; // ✅ acrescentei useEffect
import { useNavigate } from 'react-router-dom';
import { User, Lock, BarChart2, Package, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validators } from '../utils/validators';
import { userService } from '../services/api';
import icone from '../assets/images/icone_outlet.png';
import "../app.css";
import "../index.css";

export default function Login() {
  const { login, isAuthenticated } = useAuth(); // ✅ acrescentei isAuthenticated
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ NOVO: REDIRECIONA SE JÁ ESTIVER LOGADO
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = {};
    const usrErr = validators.required(form.email, 'Usuário');
    const pwdErr = validators.password(form.password);

    if (usrErr) errs.email = usrErr;
    if (pwdErr) errs.password = pwdErr;

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);

      const response = await userService.login({
        email: form.email,
        password: form.password
      });

      login(response.user);

      // ✅ NOVO: LIMPA FORM (não altera visual)
      setForm({ email: '', password: '' });
      setErrors({});
      setAuthError('');

      navigate('/');

    } catch (error) {

      setAuthError(error.message || 'Usuário ou senha inválidos');

    } finally {
      setLoading(false);
    }
  };

  return (
 <div className="login-page">
      {/* LEFT */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <img src={icone} alt="Logo Outlet Party" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div>
            <h1>
              Outlet<br />
              <span>Party</span>
            </h1>
            <p>
              Sistema de gestão completo para empresas, fornecedores e produtos.
            </p>
          </div>

          <div className="login-features">
            {[
              {
                icon: <BarChart2 size={15} />,
                label: 'Dashboard em tempo real',
                color: 'var(--primary-dim)',
                c: 'var(--primary)'
              },
              {
                icon: <Package size={15} />,
                label: 'Gestão de produtos',
                color: 'var(--success-dim)',
                c: 'var(--success)'
              },
              {
                icon: <Truck size={15} />,
                label: 'Controle de fornecedores',
                color: 'var(--info-dim)',
                c: 'var(--info)'
              },
            ].map(({ icon, label, color, c }) => (
              <div key={label} className="login-feature">
                <div
                  className="login-feature-icon"
                  style={{ background: color, color: c }}
                >
                  {icon}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div style={{ position: 'absolute', top: 20, right: 45 }}>
          <button className="theme-toggle" onClick={toggle}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <p className="login-form-title">Bem-vindo</p>
        <p className="login-form-sub">Faça login para continuar</p>

        <p className="login-form-sub">
          Não tem conta?{' '}
          <span
            className="cursor-pointer text-blue-200"
            onClick={() => navigate('/cadastro')}
          >
            Cadastre-se
          </span>
        </p>

        {authError && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-input-wrap">
            <User size={16} className="login-input-ico" />
            <input
              className={`login-input${errors.email ? ' error' : ''}`}
              placeholder="E-mail"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="login-input-wrap">
            <Lock size={16} className="login-input-ico" />
            <input
              type="password"
              className={`login-input${errors.password ? ' error' : ''}`}
              placeholder="Senha"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  );
}