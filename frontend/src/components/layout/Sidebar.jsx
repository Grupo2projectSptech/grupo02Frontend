import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Truck, Package, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo_outlet from '../../assets/images/logo_outlet.png';
const links = [
  { to: '/',            label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/vendas',    label: 'Vendas  ',     icon: Building2 },
  { to: '/fornecedores',label: 'Fornecedores', icon: Truck },
  { to: '/produtos',    label: 'Produtos',     icon: Package },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <img src={logo_outlet} alt="Logo Outlet Party" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="logo-text">
            {/* <div className="logo-name">Outlet Party</div> */}
            <div className="logo-sub">Sistema de Gestão</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu Principal</div>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '8px 10px', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
            <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
              {user?.role}
            </span>
          </div>
        </div>
        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
