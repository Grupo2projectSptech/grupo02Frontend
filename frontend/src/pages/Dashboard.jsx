import { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { vendaService, produtoService } from '../services/api';
import { useMarketplace } from '../context/MarketplaceContext';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';

const fmt    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

const calculos = (f) => {
  const custoTotal   = (parseFloat(f.custoUnidade) || 0) * (parseInt(f.quantidade) || 0);
  const impostoValor = ((parseFloat(f.imposto) || 0) / 100) * (parseFloat(f.valorVenda) || 0);
  const custoCheio   = custoTotal
    + (parseFloat(f.motoboy)     || 0)
    + (parseFloat(f.freteFlex)   || 0)
    + impostoValor
    + (parseFloat(f.operacional) || 0)
    + (parseFloat(f.tarifa)      || 0);
  const margem = (parseFloat(f.valorVenda) || 0) - custoCheio;
  const frete  = (parseFloat(f.motoboy) || 0) + (parseFloat(f.freteFlex) || 0);
  return { custoTotal, custoCheio, margem, impostoValor, frete };
};

const MESES       = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const COLORS_PLAT = {
  'Shopee':        '#FFBA42',
  'Mercado Livre': '#1a7fa8',
  'Manual':        '#2ec98a',
  'Outro':         '#A8E8F9',
};

// ── Gráfico de linha ──────────────────────────────────────
function LineChart({ data, color = '#1a7fa8', height = 120 }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width || 600);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth || 600);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length < 2) return <div ref={containerRef} style={{ width: '100%' }} />;

  const PAD_LEFT = 56, PAD_RIGHT = 12, PAD_TOP = 10, PAD_BOT = 28;
  const w = width;
  const h = height + PAD_TOP + PAD_BOT;
  const max = Math.max(...data.map(d => d.value), 1);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    value: max * t,
    y: h - PAD_BOT - t * height,
  }));

  const xOf = (i) => PAD_LEFT + (i / (data.length - 1)) * (w - PAD_LEFT - PAD_RIGHT);
  const yOf = (v) => h - PAD_BOT - (v / max) * height;

  const pts  = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');
  const area = `${pts} ${xOf(data.length - 1)},${h - PAD_BOT} ${xOf(0)},${h - PAD_BOT}`;

  const [hovered, setHovered] = useState(null);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {hovered !== null && (
        <div style={{
          position: 'absolute',
          top: yOf(data[hovered].value) - 44,
          left: Math.min(Math.max(xOf(hovered) - 52, 0), w - 110),
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px',
          fontSize: 12, fontWeight: 700, color: 'var(--text)',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ color: 'var(--text3)', fontWeight: 500 }}>{data[hovered].mes} · </span>
          {fmt(data[hovered].value)}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lg-fatur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_LEFT} x2={w - PAD_RIGHT} y1={t.y} y2={t.y}
              stroke="var(--border)" strokeWidth="1"
              strokeDasharray={i === 0 ? 'none' : '4 3'} opacity={0.5} />
            <text x={PAD_LEFT - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text3)">
              {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value.toFixed(0)}
            </text>
          </g>
        ))}
        <polygon points={area} fill="url(#lg-fatur)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <text key={d.mes} x={xOf(i)} y={h - PAD_BOT + 16} textAnchor="middle" fontSize="10" fill="var(--text3)">
            {(w > 480 || i % 2 === 0) ? d.mes : ''}
          </text>
        ))}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(d.value)} r="3.5"
              fill={hovered === i ? '#fff' : color}
              stroke={hovered === i ? color : '#fff'} strokeWidth="2" />
            <circle cx={xOf(i)} cy={yOf(d.value)} r="14" fill="transparent"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Donut ─────────────────────────────────────────────────
function Donut({ segments, size = 130 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="18" />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{total}</text>
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, value, sub, accentColor }) {
  return (
    <div style={{
      background: '#14213D',
      border: `1px solid ${accentColor}33`,
      borderRadius: 12, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', marginBottom: 10, fontFamily: 'Bricolage Grotesque, sans-serif' }}>
        {label}
      </div>
      <div style={{ fontSize: value.length > 8 ? 19 : 26, fontWeight: 800, color: accentColor, fontFamily: 'Bricolage Grotesque, sans-serif', lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '0 0 12px 12px', opacity: 0.7 }} />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
export default function Dashboard() {
  const { user }                        = useAuth();
  const { mkVendas }                    = useMarketplace();   // ← vendas do Marketplace
  const [apiVendas,   setApiVendas]     = useState([]);
  const [produtos,    setProdutos]      = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [error,       setError]         = useState(false);
  const [anoFilt,     setAnoFilt]       = useState(new Date().getFullYear());

  const nomeExibido = (user?.name || user?.username || user?.email?.split('@')[0] || 'usuário').split(' ')[0];

  useEffect(() => {
    Promise.all([vendaService.listar(), produtoService.listar()])
      .then(([v, p]) => { setApiVendas(v.data || []); setProdutos(p.data || []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Mescla vendas da API + vendas do Marketplace ─────────────────────────────
  const vendas = useMemo(() => [...apiVendas, ...mkVendas], [apiVendas, mkVendas]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const now      = new Date();
    const hoje     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    const vendasMes  = vendas.filter(v => { const d = new Date(v.data); return d.getMonth() === mesAtual && d.getFullYear() === anoAtual; });
    const vendasHoje = vendas.filter(v => new Date(v.data) >= hoje);

    const somaV = (a) => a.reduce((s, v) => s + (parseFloat(v.valorVenda)       || 0), 0);
    const somaC = (a) => a.reduce((s, v) => s + calculos(v).custoCheio,               0);
    const somaF = (a) => a.reduce((s, v) => s + calculos(v).frete,                    0);
    const somaM = (a) => a.reduce((s, v) => s + calculos(v).margem,                   0);

    const renda  = somaV(vendasMes);
    const custo  = somaC(vendasMes);
    const frete  = somaF(vendasMes);
    const margem = somaM(vendasMes);

    return {
      renda,
      lucroMesPct:        renda ? (margem / renda) * 100 : 0,
      margemValor:        margem,
      custoPct:           renda ? (custo  / renda) * 100 : 0,
      custoValor:         custo,
      custoPorEntregaPct: renda ? (frete  / renda) * 100 : 0,
      custoPorEntrega:    vendasMes.length ? frete / vendasMes.length : 0,
      rendaHoje:          somaV(vendasHoje),
      qtdHoje:            vendasHoje.length,
      totalMes:           vendasMes.length,
    };
  }, [vendas]);

  // ── Top produtos ──────────────────────────────────────────────────────────────
  const topProdutos = useMemo(() => {
    const map = {};
    vendas.forEach(v => {
      const key = v.nomeProduto || 'Sem nome';
      if (!map[key]) map[key] = { nome: key, shopee: 0, ml: 0, total: 0 };
      const c = calculos(v);
      if (v.tipo === 'Shopee')             map[key].shopee += c.margem;
      else if (v.tipo === 'Mercado Livre') map[key].ml     += c.margem;
      map[key].total += c.margem;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 4);
  }, [vendas]);

  // ── Marketplace donut ─────────────────────────────────────────────────────────
  const marketplace = useMemo(() => {
    const map = {};
    vendas.forEach(v => {
      const t = v.tipo || 'Outro';
      if (!map[t]) map[t] = 0;
      map[t] += parseInt(v.quantidade) || 1;
    });
    return Object.entries(map).map(([label, value]) => ({
      label, value, color: COLORS_PLAT[label] || '#A8E8F9',
    }));
  }, [vendas]);

  // ── Evolução mensal ───────────────────────────────────────────────────────────
  const anos = useMemo(() => {
    const s = new Set(vendas.map(v => new Date(v.data).getFullYear()));
    return [...s].sort((a, b) => b - a);
  }, [vendas]);

  const evolucao = useMemo(() => {
    return MESES.map((mes, i) => ({
      mes,
      value: vendas
        .filter(v => { const d = new Date(v.data); return d.getFullYear() === anoFilt && d.getMonth() === i; })
        .reduce((a, v) => a + (parseFloat(v.valorVenda) || 0), 0),
    }));
  }, [vendas, anoFilt]);

  const maxBar = Math.max(...topProdutos.map(p => Math.max(p.shopee, p.ml)), 1);

  // ─────────────────────────────────────────────────────────────────────────────
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
        <p style={{ color: 'var(--text2)', marginTop: 6 }}>
          Verifique se o backend está rodando em <code>localhost:8080</code>
        </p>
        <p style={{ color: 'var(--text3)', marginTop: 8, fontSize: 13 }}>
          Os dados do Marketplace continuam disponíveis abaixo.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <Topbar title={`Olá, ${nomeExibido} 👋`} subtitle="Aqui está o resumo do seu negócio" />

      {/* Indicador de dados do Marketplace */}
      {mkVendas.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 16,
          padding: '8px 14px',
          background: 'var(--primary-dim)',
          border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 12.5, color: 'var(--text2)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          <span>
            <strong style={{ color: 'var(--text)' }}>{mkVendas.length}</strong> vendas do Marketplace
            (ML + Shopee) incluídas nos indicadores abaixo.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Renda Atual"       value={fmt(kpis.renda)}                sub={`${kpis.totalMes} pedido(s) no mês`}         accentColor="#2ec98a" />
        <KpiCard label="Lucro Total Mês"   value={fmtPct(kpis.lucroMesPct)}       sub={fmt(kpis.margemValor)}                       accentColor={kpis.lucroMesPct >= 0 ? '#2ec98a' : '#f05365'} />
        <KpiCard label="Custo Total"       value={fmtPct(kpis.custoPct)}          sub={fmt(kpis.custoValor)}                        accentColor="#f05365" />
        <KpiCard label="Custo por Entrega" value={fmtPct(kpis.custoPorEntregaPct)} sub={`${fmt(kpis.custoPorEntrega)} / pedido`}    accentColor="#FFBA42" />
        <KpiCard label="Vendas Hoje"       value={fmt(kpis.rendaHoje)}            sub={`${kpis.qtdHoje} pedido(s)`}                 accentColor="#A8E8F9" />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Produtos Mais Lucrativos */}
        <div className="chart-card">
          <div className="chart-title">📊 Produtos Mais Lucrativos</div>
          {topProdutos.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Nenhuma venda cadastrada</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                {[['Shopee', COLORS_PLAT['Shopee']], ['Mercado Livre', COLORS_PLAT['Mercado Livre']]].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', height: 130 }}>
                {topProdutos.map(p => (
                  <div key={p.nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%' }}>
                      <div style={{ flex: 1, height: `${Math.max((p.shopee / maxBar) * 110, p.shopee > 0 ? 4 : 0)}px`, background: COLORS_PLAT['Shopee'],        borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
                      <div style={{ flex: 1, height: `${Math.max((p.ml     / maxBar) * 110, p.ml     > 0 ? 4 : 0)}px`, background: COLORS_PLAT['Mercado Livre'], borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text2)', textAlign: 'center', maxWidth: 70, lineHeight: 1.3 }}>
                      {p.nome.length > 12 ? p.nome.slice(0, 12) + '…' : p.nome}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desempenho por Marketplace */}
        <div className="chart-card">
          <div className="chart-title">🛒 Desempenho por Marketplace</div>
          {marketplace.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}><p>Sem dados</p></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
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

      {/* Evolução de Faturamento */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="chart-title" style={{ marginBottom: 0 }}>📈 Evolução de Faturamento</div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
              Total: {fmt(evolucao.reduce((a, e) => a + e.value, 0))} em {anoFilt}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(anos.length ? anos : [new Date().getFullYear()]).map(a => (
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
          <LineChart data={evolucao} color="var(--primary)" height={120} />
        )}
      </div>

      <div style={{
        padding: '12px 16px', background: 'var(--primary-dim)',
        border: '1px solid var(--border)', borderRadius: 10,
        fontSize: 12.5, color: 'var(--text2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <TrendingUp size={14} color="var(--primary)" />
        <span>
          Dados de <strong style={{ color: 'var(--text)' }}>Shopee</strong> e{' '}
          <strong style={{ color: 'var(--text)' }}>Mercado Livre</strong> integrados via{' '}
          Marketplace · vendas da API backend também incluídas quando disponíveis.
        </span>
      </div>
    </div>
  );
}
