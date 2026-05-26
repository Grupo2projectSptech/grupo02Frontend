import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle, actions }) {
  const { theme, toggle } = useTheme();   // ✅ era "isDark" — usa "theme" corretamente
  const { user } = useAuth();

  return (
    <div className="topbar">
      <div className="page-heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        {actions}
        <button className="theme-toggle" onClick={toggle} title="Alternar tema">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}  {/* ✅ */}
        </button>
      </div>
    </div>
  );
}
