import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { vendaService, produtoService } from '../services/api';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

const calculos = (f) => {
  const custoTotal   = (parseFloat(f.custoUnidade) || 0) * (parseInt(f.quantidade) || 0);
  const impostoValor = ((parseFloat(f.imposto) || 0) / 100) * (parseFloat(f.valorVenda) || 0);
  const custoCheio   = custoTotal
    + (parseFloat(f.motoboy)      || 0)
    + (parseFloat(f.freteFlex)    || 0)
    + impostoValor
    + (parseFloat(f.operacional)  || 0)
    + (parseFloat(f.tarifa)       || 0);
  const margem    = (parseFloat(f.valorVenda) || 0) - custoCheio;
  const margemPct = (parseFloat(f.valorVenda) || 0)
    ? (margem / parseFloat(f.valorVenda)) * 100 : 0;
  const frete = (parseFloat(f.motoboy) || 0) + (parseFloat(f.freteFlex) || 0);
  return { custoTotal, custoCheio, margem, margemPct, impostoValor, frete };
};

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const COLORS_PLAT = { 'Shopee': 'var(--warning)', 'Mercado Livre': 'var(--primary)', 'Manual': 'var(--success)', 'Outro': 'var(--info)' };

// ─── Mini gráfico de linha ────────────────────────────────
function LineChart({ data, color = 'var(--primary)', height = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 300; const h = height;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.value / max) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (d.value / max) * (h - 10) - 5;
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
    </svg>
  );
}

// ─── Mini donut ───────────────────────────────────────────
function Donut({ segments, size = 120 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 40; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = segments.map((s, i) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const slice = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={s.color}
        strokeWidth="18"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    );
    offset += dash;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="18" />
      {slices}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">
        {total}
      </text>
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [vendas,   setVendas]   = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [anoFilt,  setAnoFilt]  = useState(new Date().getFullYear());

  const nomeExibido = (user?.name || user?.username || user?.email?.split('@')[0] || 'usuário').split(' ')[0];

  useEffect(() => {
    Promise.all([vendaService.listar(), produtoService.listar()])
      .then(([v, p]) => {
        setVendas(v.data || []);
        setProdutos(p.data || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── KPIs calculados das vendas ────────────────────────
  const kpis = useMemo(() => {
    if (!vendas.length) return null;

    const now   = new Date();
    const hoje  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    const vendasMes  = vendas.filter(v => {
      const d = new Date(v.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    const vendasHoje = vendas.filter(v => new Date(v.data) >= hoje);

    const somaVendas = (arr) => arr.reduce((a, v) => a + (parseFloat(v.valorVenda) || 0), 0);
    const somaCusto  = (arr) => arr.reduce((a, v) => a + calculos(v).custoCheio, 0);
    const somaFrete  = (arr) => arr.reduce((a, v) => a + calculos(v).frete, 0);
    const somaMargem = (arr) => arr.reduce((a, v) => a + calculos(v).margem, 0);

    const rendaMes   = somaVendas(vendasMes);
    const custoMes   = somaCusto(vendasMes);
    const freteMes   = somaFrete(vendasMes);
    const margemMes  = somaMargem(vendasMes);
    const lucroMesPct  = rendaMes ? (margemMes / rendaMes) * 100 : 0;
    const custoPct     = rendaMes ? (custoMes  / rendaMes) * 100 : 0;
    const custoPorEntrega = vendasMes.length ? freteMes / vendasMes.length : 0;
    const custoPorEntregaPct = rendaMes ? (freteMes / rendaMes) * 100 : 0;
    const rendaHoje  = somaVendas(vendasHoje);

    return { rendaMes, lucroMesPct, margemMes, custoMes, custoPct, custoPorEntrega, custoPorEntregaPct, rendaHoje, vendasHoje: vendasHoje.length };
  }, [vendas]);

  // ── Produtos mais lucrativos (top 4 por margem total) ─
  const topProdutos = useMemo(() => {
    const map = {};
    vendas.forEach(v => {
      const key = v.nomeProduto || 'Sem nome';
      if (!map[key]) map[key] = { nome: key, shopee: 0, ml: 0, total: 0 };
      const c = calculos(v);
      if (v.tipo === 'Shopee')        map[key].shopee += c.margem;
      else if (v.tipo === 'Mercado Livre') map[key].ml += c.margem;
      map[key].total += c.margem;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 4);
  }, [vendas]);

  // ── Desempenho por marketplace ─────────────────────────
  const marketplace = useMemo(() => {
    const map = {};
    vendas.forEach(v => {
      const t = v.tipo || 'Outro';
      if (!map[t]) map[t] = 0;
      map[t] += parseInt(v.quantidade) || 1;
    });
    return Object.entries(map).map(([label, value]) => ({
      label, value, color: COLORS_PLAT[label] || 'var(--accent)',
    }));
  }, [vendas]);

  // ── Evolução de faturamento por mês ───────────────────
  const anos = useMemo(() => {
    const s = new Set(vendas.map(v => new Date(v.data).getFullYear()));
    return [...s].sort((a, b) => b - a);
  }, [vendas]);

  const evolucao = useMemo(() => {
    return MESES.map((mes, i) => ({
      mes,
      value: vendas
        .filter(v => {
          const d = new Date(v.data);
          return d.getFullYear() === anoFilt && d.getMonth() === i;
        })
        .reduce((a, v) => a + (parseFloat(v.valorVenda) || 0), 0),
    }));
  }, [vendas, anoFilt]);

  const maxBar = Math.max(...topProdutos.map(p => Math.max(p.shopee, p.ml)), 1);

  // ─────────────────────────────────────────────────────
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

  return (
    <div>
      <Topbar
        title={`Olá, ${nomeExibido} 👋`}
        subtitle="Aqui está o resumo do seu negócio"
      />

      {/* ── KPI Cards ── */}
      {!kpis ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 24 }}>
          <Package size={32} color="var(--text3)" style={{ marginBottom: 10 }} />
          <p style={{ color: 'var(--text2)' }}>Nenhuma venda cadastrada ainda. Comece registrando suas vendas!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>

          {/* Renda Atual */}
          <div className="stat-card" style={{ background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Renda Atual</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {fmt(kpis.rendaMes)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', marginTop: 4 }}>este mês</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--success)', borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>

          {/* Lucro Total Mês */}
          <div className="stat-card" style={{ background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lucro Total Mês</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpis.lucroMesPct >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {fmtPct(kpis.lucroMesPct)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--stat-subtext)', marginTop: 4 }}>{fmt(kpis.margemMes)}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>

          {/* Custo Total */}
          <div className="stat-card" style={{ background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Custo Total</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {fmtPct(kpis.custoPct)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--stat-subtext)', marginTop: 4 }}>{fmt(kpis.custoMes)}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--danger)', borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>

          {/* Custo por Entrega */}
          <div className="stat-card" style={{ background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Custo por Entrega</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {fmtPct(kpis.custoPorEntregaPct)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--stat-subtext)', marginTop: 4 }}>{fmt(kpis.custoPorEntrega)} / pedido</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--warning)', borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>

          {/* Vendas Hoje */}
          <div className="stat-card" style={{ background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Vendas Hoje</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--info)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {fmt(kpis.rendaHoje)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--stat-subtext)', marginTop: 4 }}>{kpis.vendasHoje} pedido(s)</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--info)', borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>

        </div>
      )}

      {/* ── Gráficos linha 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Produtos Mais Lucrativos — barras agrupadas */}
        <div className="chart-card">
          <div className="chart-title">📊 Produtos Mais Lucrativos</div>
          {topProdutos.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Nenhuma venda cadastrada</p></div>
          ) : (
            <>
              {/* Legenda */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                {Object.entries(COLORS_PLAT).slice(0, 2).map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text2)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Barras */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', height: 140 }}>
                {topProdutos.map((p, i) => (
                  <div key={p.nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%' }}>
                      {/* Shopee */}
                      <div style={{
                        flex: 1,
                        height: `${Math.max((p.shopee / maxBar) * 120, p.shopee > 0 ? 4 : 0)}px`,
                        background: COLORS_PLAT['Shopee'],
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.5s ease',
                      }} />
                      {/* ML */}
                      <div style={{
                        flex: 1,
                        height: `${Math.max((p.ml / maxBar) * 120, p.ml > 0 ? 4 : 0)}px`,
                        background: COLORS_PLAT['Mercado Livre'],
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text3)', textAlign: 'center', maxWidth: 70, lineHeight: 1.2 }}>
                      {p.nome.length > 10 ? p.nome.slice(0, 10) + '…' : p.nome}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desempenho por Marketplace — donut */}
        <div className="chart-card">
          <div className="chart-title">🛒 Desempenho por Marketplace</div>
          {marketplace.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Sem dados</p></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Donut segments={marketplace} size={130} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {marketplace.map(m => {
                  const total = marketplace.reduce((a, x) => a + x.value, 0) || 1;
                  return (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {((m.value / total) * 100).toFixed(0)}% · {m.value} pedido(s)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gráfico linha 2 — Evolução de faturamento ── */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>📈 Evolução de Faturamento</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {anos.map(a => (
              <button
                key={a}
                onClick={() => setAnoFilt(a)}
                className={`btn btn-sm ${anoFilt === a ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {evolucao.every(e => e.value === 0) ? (
          <div className="empty" style={{ padding: 20 }}><p>Sem vendas em {anoFilt}</p></div>
        ) : (
          <>
            <LineChart data={evolucao} color="var(--primary)" height={100} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {evolucao.map(e => (
                <div key={e.mes} style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', flex: 1 }}>
                  {e.mes}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Nota APIs externas ── */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        background: 'var(--primary-dim)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        fontSize: 12.5,
        color: 'var(--text2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <TrendingUp size={14} color="var(--primary)" />
        <span>
          Os dados de <strong style={{ color: 'var(--text)' }}>Shopee</strong> e <strong style={{ color: 'var(--text)' }}>Mercado Livre</strong> serão integrados automaticamente quando as APIs externas estiverem configuradas.
          Por enquanto, os dados são extraídos das vendas cadastradas manualmente.
        </span>
      </div>
    </div>
  );
}
