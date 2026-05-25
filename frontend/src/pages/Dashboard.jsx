import { useState, useEffect } from 'react';
import { Building2, Truck, Package, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { empresaService, fornecedorService, produtoService } from '../services/api';
import Topbar from '../components/layout/Topbar';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ✅ Nome com fallback para username, email ou 'usuário'
  const nomeExibido = (user?.name || user?.username || user?.email?.split('@')[0] || 'usuário')
    .split(' ')[0];

  useEffect(() => {
    Promise.all([
      empresaService.listar(),    // ✅ era getAll()
      fornecedorService.listar(), // ✅ era getAll()
      produtoService.listar(),    // ✅ era getAll()
    ]).then(([e, f, p]) => {
      const empresas     = e.data;
      const fornecedores = f.data;
      const produtos     = p.data;

      const totalEstoque = produtos.reduce((a, p) => a + (p.estoque || 0), 0);
      const valorEstoque = produtos.reduce((a, p) => a + ((p.estoque || 0) * parseFloat(p.preco || 0)), 0);
      const semEstoque   = produtos.filter(p => !p.estoque || p.estoque === 0).length;
      const ativas       = empresas.filter(e => e.ativo).length;
      const fornAtivos   = fornecedores.filter(f => f.ativo).length;

      const catMap = {};
      produtos.forEach(p => {
        const cat = p.categoria || 'Sem categoria';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const categorias = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const fornMap = {};
      produtos.forEach(p => {
        if (p.fornecedor) {
          const k = p.fornecedor.nome;
          fornMap[k] = (fornMap[k] || 0) + 1;
        }
      });
      const topForn = Object.entries(fornMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const stockBars = produtos.slice(0, 7).map(p => ({
        name: p.nome.length > 10 ? p.nome.slice(0, 10) + '…' : p.nome,
        value: p.estoque || 0,
      }));
      const maxStock = Math.max(...stockBars.map(b => b.value), 1);

      setData({ empresas, fornecedores, produtos, totalEstoque, valorEstoque, semEstoque, ativas, fornAtivos, categorias, topForn, stockBars, maxStock });
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const COLORS = ['var(--primary)', 'var(--info)', 'var(--success)', 'var(--warning)', 'var(--accent)'];

  if (loading) return (
    <div>
      <Topbar title="Dashboard" subtitle="Carregando dados…" />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </div>
  );

  if (error) return (
    <div>
      <Topbar title="Dashboard" />
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <AlertTriangle size={32} color="var(--warning)" style={{ marginBottom: 12 }} />
        <h3>Sem conexão com a API</h3>
        <p style={{ color: 'var(--text2)', marginTop: 6 }}>Verifique se o backend está rodando em <code>localhost:8080</code></p>
      </div>
    </div>
  );

  const { empresas, fornecedores, produtos, totalEstoque, valorEstoque, semEstoque, ativas, fornAtivos, categorias, topForn, stockBars, maxStock } = data;

  const stats = [
    { label: 'Empresas Ativas',  value: ativas,                  sub: `${empresas.length} no total`,        icon: Building2,  color: 'var(--primary)', dim: 'var(--primary-dim)' },
    { label: 'Fornecedores',     value: fornAtivos,               sub: `${fornecedores.length} cadastrados`, icon: Truck,      color: 'var(--info)',    dim: 'var(--info-dim)'    },
    { label: 'Produtos',         value: produtos.length,          sub: `${semEstoque} sem estoque`,          icon: Package,    color: 'var(--success)', dim: 'var(--success-dim)' },
    { label: 'Valor em Estoque', value: formatCurrency(valorEstoque), sub: `${totalEstoque} unidades`,       icon: DollarSign, color: 'var(--warning)', dim: 'var(--warning-dim)' },
  ];

  return (
    <div>
      <Topbar
        title={`Olá, ${nomeExibido} 👋`}  
        subtitle="Aqui está o resumo do seu sistema"
      />

      <div className="stat-grid">
        {stats.map(({ label, value, sub, icon: Icon, color, dim }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-inner">
              <div>
                <div className="stat-value" style={{ fontSize: typeof value === 'string' ? 22 : 34 }}>{value}</div>
                <div className="stat-label">{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 6 }}>{sub}</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: dim, color }}>
                <Icon size={20} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📦 Estoque por Produto</div>
          {stockBars.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Nenhum produto cadastrado</p></div>
          ) : (
            <div className="bar-chart">
              {stockBars.map((b, i) => (
                <div key={b.name} className="bar-wrap">
                  <div className="bar-val">{b.value}</div>
                  <div className="bar" style={{ height: `${Math.max((b.value / maxStock) * 100, 4)}%`, background: COLORS[i % COLORS.length], opacity: 0.85 }} />
                  <div className="bar-label">{b.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">🏷️ Categorias</div>
          {categorias.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Sem dados</p></div>
          ) : (
            <div className="donut-list">
              {categorias.map(([cat, qty], i) => {
                const pct = produtos.length ? Math.round((qty / produtos.length) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="donut-item">
                      <div className="donut-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="donut-name">{cat}</div>
                      <div className="donut-pct">{qty}</div>
                    </div>
                    <div className="progress-bar-wrap" style={{ marginTop: 4 }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="chart-title" style={{ marginBottom: 14 }}>🚚 Top Fornecedores por Produtos</div>
          {topForn.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Nenhum produto vinculado a fornecedor</p></div>
          ) : (
            <div className="activity-list">
              {topForn.map(([nome, qty], i) => (
                <div key={nome} className="activity-item">
                  <div className="activity-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="activity-text"><strong>{nome}</strong></div>
                  <span className="badge badge-orange">{qty} produtos</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="chart-title" style={{ marginBottom: 14 }}>🔔 Alertas do Sistema</div>
          <div className="activity-list">
            {semEstoque > 0 && (
              <div className="activity-item">
                <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                <div className="activity-text"><strong>{semEstoque} produto(s)</strong> sem estoque</div>
                <span className="badge badge-warn">Atenção</span>
              </div>
            )}
            {empresas.filter(e => !e.ativo).length > 0 && (
              <div className="activity-item">
                <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div className="activity-text"><strong>{empresas.filter(e => !e.ativo).length} empresa(s)</strong> inativa(s)</div>
                <span className="badge badge-inactive">Inativo</span>
              </div>
            )}
            {fornecedores.filter(f => !f.ativo).length > 0 && (
              <div className="activity-item">
                <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div className="activity-text"><strong>{fornecedores.filter(f => !f.ativo).length} fornecedor(es)</strong> inativo(s)</div>
                <span className="badge badge-inactive">Inativo</span>
              </div>
            )}
            {semEstoque === 0 && empresas.filter(e => !e.ativo).length === 0 && fornecedores.filter(f => !f.ativo).length === 0 && (
              <div className="activity-item">
                <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                <div className="activity-text" style={{ color: 'var(--success)' }}>Tudo em ordem! Nenhum alerta.</div>
              </div>
            )}
            <div className="activity-item">
              <Package size={16} color="var(--info)" style={{ flexShrink: 0 }} />
              <div className="activity-text"><strong>{totalEstoque}</strong> unidades totais em estoque</div>
            </div>
            <div className="activity-item">
              <DollarSign size={16} color="var(--success)" style={{ flexShrink: 0 }} />
              <div className="activity-text">Valor total: <strong>{formatCurrency(valorEstoque)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}