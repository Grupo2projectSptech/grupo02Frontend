import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, BarChart2, Package, Truck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validators } from '../utils/validators';
import { userService } from '../services/api';
import icone from '../assets/images/icone_outlet.png';
import "../app.css";
import "../index.css";

export default function Cadastro() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [cadastro, setCadastro] = useState(false);
  const [showPassword,        setShowPassword]        = useState(false); // ✅ olho senha
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ olho confirmar

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const usrErr = validators.required(form.name, 'Usuário');
    const pwdErr = validators.password(form.password);
    const emlErr = validators.email(form.email);
    if (usrErr) errs.name = usrErr;
    if (emlErr) errs.email = emlErr;
    if (pwdErr) errs.password = pwdErr;
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'As senhas não coincidem';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setCadastro(true);
      await userService.cadastro({ name: form.name, email: form.email, password: form.password, role: 'admin' });
      navigate('/login');
    } catch (error) {
      setAuthError(error.message || 'Erro ao cadastrar');
    } finally {
      setCadastro(false);
    }
  };

  // Botão de olho reutilizável
  const EyeButton = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', color: 'var(--text3)',
        display: 'flex', alignItems: 'center',
        padding: 0, transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="cadastro-page">
      <div className='cadastro-right'>
        <div style={{ position: 'absolute', top: 20, left: 45 }}>
          <button className='theme-toggle' onClick={toggle} title='Alternar tema'>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <p className="login-form-title">Bem-vindo, novo aqui?</p>
        <p className="login-form-sub">Faça o cadastro para aproveitar o máximo do site</p>
        <p className='login-form-sub'>
          Já tem cadastro?{' '}
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

          {/* Nome */}
          <div className='cadastro-input-wrap'>
            <User size={16} className="cadastro-input-ico" />
            <input
              className={`cadastro-input${errors.name ? ' error' : ''}`}
              placeholder="Nome de usuário"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoComplete="name"
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          {/* E-mail */}
          <div className='cadastro-input-wrap'>
            <User size={16} className="cadastro-input-ico" />
            <input
              className={`cadastro-input${errors.email ? ' error' : ''}`}
              type="email"
              placeholder='E-mail'
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete='email'
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          {/* Senha com olho */}
          <div className='cadastro-input-wrap'>
            <Lock size={16} className="cadastro-input-ico" />
            <input
              className={`cadastro-input${errors.password ? ' error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="new-password"
              style={{ paddingRight: 42 }}
            />
            <EyeButton show={showPassword} onToggle={() => setShowPassword(s => !s)} />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          {/* Confirmar senha com olho */}
          <div className='cadastro-input-wrap'>
            <Lock size={16} className="cadastro-input-ico" />
            <input
              className={`cadastro-input${errors.confirmPassword ? ' error' : ''}`}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar Senha"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              autoComplete="new-password"
              style={{ paddingRight: 42 }}
            />
            <EyeButton show={showConfirmPassword} onToggle={() => setShowConfirmPassword(s => !s)} />
            {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
          </div>

          <button className='cadastro-btn' type="submit" disabled={cadastro}>
            {cadastro ? 'Cadastrando...' : 'Cadastrar'}
          </button>

        </form>
      </div>

      <div className="cadastro-left">
        <div className='cadastro-brand'>
          <div className='cadastro-brand-icon'>
            <img src={icone} alt='Logo Outlet' />
          </div>
          <div>
            <h1>Outlet<br /><span>Party</span></h1>
            <p>Sistema de gestão completo para empresas, fornecedores e produtos — tudo em um só lugar.</p>
          </div>
          <div className="login-features">
            {[
              { icon: <BarChart2 size={15} />, label: 'Dashboard com métricas em tempo real', color: 'var(--primary-dim)', c: 'var(--primary)' },
              { icon: <Package size={15} />,   label: 'Gestão de produtos e estoque',          color: 'var(--success-dim)', c: 'var(--success)' },
              { icon: <Truck size={15} />,     label: 'Controle de fornecedores',              color: 'var(--info-dim)',    c: 'var(--info)'    },
            ].map(({ icon, label, color, c }) => (
              <div key={label} className="login-feature">
                <div className="login-feature-icon" style={{ background: color, color: c }}>{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
