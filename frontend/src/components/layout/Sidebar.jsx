import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, LogOut, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import logo_outlet from '../../assets/images/logo_outlet.png';

const links = [
  { to: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/vendas',       label: 'Vendas',       icon: ShoppingBag     },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck           },
  { to: '/produtos',     label: 'Produtos',     icon: Package         },
  { to: '/marketplace',  label: 'Marketplace',  icon: Store           },
];

export default function Sidebar() {
  const { user, logout }        = useAuth();
  const { semEstoqueCount }     = useMarketplace();
  const navigate                = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const nomeExibido = user?.name || user?.username || user?.email?.split('@')[0] || 'Usuário';
  const roleExibido = user?.role || '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <img
              src={logo_outlet}
              alt="Logo Outlet Party"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="logo-text">
            <div className="logo-sub">Sistema de Gestão</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu Principal</div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
            {/* Badge de alerta para estoque zerado no Marketplace */}
            {to === '/marketplace' && semEstoqueCount > 0 && (
              <span className="nav-badge" style={{
                background: 'var(--danger-dim)',
                color: 'var(--danger)',
              }}>
                {semEstoqueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '8px 10px', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sidebar-text, var(--text))' }}>
            {nomeExibido}
          </div>
          {roleExibido && (
            <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
              <span style={{
                background: 'var(--primary-dim)',
                color: 'var(--primary)',
                padding: '1px 7px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {roleExibido}
              </span>
            </div>
          )}
        </div>

        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
