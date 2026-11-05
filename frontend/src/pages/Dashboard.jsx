import { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { vendaService, produtoService } from '../services/api';
import { useMarketplace } from '../context/MarketplaceContext';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';

// A API agora devolve Page<T> ({ content, totalElements, ... }); aceita também array puro.
const lista = (res) => Array.isArray(res?.data) ? res.data : (res?.data?.content ?? []);

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

// KPIs do mês/dia para qualquer subconjunto de vendas (todas, só Shopee ou só Mercado Livre)
const calcKpis = (vs) => {
  const now      = new Date();
  const hoje     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  const vendasMes  = vs.filter(v => { const d = new Date(v.data); return d.getMonth() === mesAtual && d.getFullYear() === anoAtual; });
  const vendasHoje = vs.filter(v => new Date(v.data) >= hoje);

  const somaV = (a) => a.reduce((t, v) => t + (parseFloat(v.valorVenda) || 0), 0);
  const somaC = (a) => a.reduce((t, v) => t + calculos(v).custoCheio,          0);
  const somaF = (a) => a.reduce((t, v) => t + calculos(v).frete,               0);
  const somaM = (a) => a.reduce((t, v) => t + calculos(v).margem,              0);

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
    freteValor:         frete,
    rendaHoje:          somaV(vendasHoje),
    qtdHoje:            vendasHoje.length,
    totalMes:           vendasMes.length,
  };
};

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

// Cores oficiais de cada loja (e variações): main = cor da marca · light/dark = degradês · text = legível sobre fundo escuro
const BRAND = {
  shopee: { main: '#EE4D2D', light: '#FF7A5C', dark: '#C23A1E', text: '#FF6A4D', ink: '#FFFFFF' },
  ml:     { main: '#FFE600', light: '#FFF27A', dark: '#E6CF00', text: '#FFE600', ink: '#2D3277', edge: '#2D3277' },
};
const COLORS_PLAT = {
  'Shopee':        BRAND.shopee.main,
  'Mercado Livre': BRAND.ml.main,
  'Manual':        '#2ec98a',
  'Outro':         '#A8E8F9',
};

// Bolinha/quadradinho de legenda (o amarelo do ML ganha um contorno azul para aparecer no tema claro)
function Dot({ color, ml = false, square = false, size = 10 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: square ? 3 : '50%',
      background: color,
      boxShadow: ml ? `0 0 0 1px ${BRAND.ml.edge}80` : 'none',
    }} />
  );
}

// Etiqueta com o nome da loja nas cores da marca
function PlatTag({ k, children }) {
  const b = BRAND[k];
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 999,
      background: b.main, color: b.ink, fontWeight: 700, fontSize: 11.5,
      border: k === 'ml' ? `1px solid ${b.edge}55` : '1px solid transparent',
    }}>
      {children}
    </span>
  );
}

// ── Gráfico de linha (uma linha por loja) ─────────────────
function LineChart({ labels, series, height = 120 }) {
  const containerRef = useRef(null);
  const [width, setWidth]     = useState(600);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width || 600);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth || 600);
    return () => ro.disconnect();
  }, []);

  if (!labels || labels.length < 2 || !series?.length) return <div ref={containerRef} style={{ width: '100%' }} />;

  const PAD_LEFT = 56, PAD_RIGHT = 12, PAD_TOP = 10, PAD_BOT = 28;
  const w = width;
  const h = height + PAD_TOP + PAD_BOT;
  const n = labels.length;
  const max = Math.max(...series.flatMap(s => s.values), 1);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    value: max * t,
    y: h - PAD_BOT - t * height,
  }));

  const xOf = (i) => PAD_LEFT + (i / (n - 1)) * (w - PAD_LEFT - PAD_RIGHT);
  const yOf = (v) => h - PAD_BOT - (v / max) * height;
  const colW = (w - PAD_LEFT - PAD_RIGHT) / (n - 1);

  const pointsOf = (s) => s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
  const areaOf   = (s) => `${pointsOf(s)} ${xOf(n - 1)},${h - PAD_BOT} ${xOf(0)},${h - PAD_BOT}`;
  const totalAt  = (i) => series.reduce((a, s) => a + s.values[i], 0);

  const boxH = 30 + series.length * 18 + (series.length > 1 ? 18 : 0);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {hovered !== null && (
        <div style={{
          position: 'absolute',
          top: Math.max(yOf(Math.max(...series.map(s => s.values[hovered]))) - boxH - 8, 0),
          left: Math.min(Math.max(xOf(hovered) - 70, 0), w - 160),
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 12, fontWeight: 700, color: 'var(--text)',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: 'var(--shadow-sm)', minWidth: 140,
        }}>
          <div style={{ color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{labels[hovered]}</div>
          {series.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, lineHeight: '18px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: 'var(--text2)' }}>
                <Dot color={s.color} ml={!!s.casing} size={8} />{s.name}
              </span>
              <span>{fmt(s.values[hovered])}</span>
            </div>
          ))}
          {series.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, lineHeight: '18px', marginTop: 2, paddingTop: 2, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text3)' }}>Total</span>
              <span>{fmt(totalAt(hovered))}</span>
            </div>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`lg-fatur-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0"    />
            </linearGradient>
          ))}
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
        {hovered !== null && (
          <line x1={xOf(hovered)} x2={xOf(hovered)} y1={PAD_TOP} y2={h - PAD_BOT}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {series.map((s, si) => <polygon key={`a${si}`} points={areaOf(s)} fill={`url(#lg-fatur-${si})`} />)}
        {series.map((s, si) => (
          <g key={`l${si}`}>
            {s.casing && (
              <polyline points={pointsOf(s)} fill="none" stroke={s.casing} strokeOpacity="0.55"
                strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            )}
            <polyline points={pointsOf(s)} fill="none" stroke={s.color}
              strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {labels.map((mes, i) => (
          <text key={mes} x={xOf(i)} y={h - PAD_BOT + 16} textAnchor="middle" fontSize="10" fill="var(--text3)">
            {(w > 480 || i % 2 === 0) ? mes : ''}
          </text>
        ))}
        {series.map((s, si) => s.values.map((v, i) => (
          <circle key={`${si}-${i}`} cx={xOf(i)} cy={yOf(v)} r="3.5"
            fill={hovered === i ? '#fff' : s.color}
            stroke={hovered === i ? s.color : (s.casing || '#fff')} strokeWidth="2" />
        )))}
        {labels.map((mes, i) => (
          <rect key={`h${i}`} x={xOf(i) - colW / 2} y={PAD_TOP} width={colW} height={height}
            fill="transparent" style={{ cursor: 'default' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
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
// split = { sp, ml, wSp, wMl }: valor de cada loja (nas cores da marca) e peso para a barra inferior
function KpiCard({ label, value, sub, accentColor, split }) {
  const wSp  = Math.max(split?.wSp || 0, 0);
  const wMl  = Math.max(split?.wMl || 0, 0);
  const wTot = wSp + wMl;

  return (
    <div style={{
      background: '#14213D',
      border: `1px solid ${accentColor}33`,
      borderRadius: 12, padding: '18px 20px 22px',
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

      {split && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 10, fontSize: 11.5, fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: BRAND.shopee.text }}>
            <Dot color={BRAND.shopee.main} size={7} />{split.sp}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: BRAND.ml.text }}>
            <Dot color={BRAND.ml.main} size={7} />{split.ml}
          </span>
        </div>
      )}

      {/* barra inferior: dividida entre Shopee e Mercado Livre quando há dados das lojas */}
      {split && wTot > 0 ? (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'flex', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
          <div style={{ flex: wSp, background: `linear-gradient(90deg, ${BRAND.shopee.dark}, ${BRAND.shopee.main})` }} />
          <div style={{ flex: wMl, background: `linear-gradient(90deg, ${BRAND.ml.main}, ${BRAND.ml.light})` }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '0 0 12px 12px', opacity: 0.7 }} />
      )}
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
      .then(([v, p]) => { setApiVendas(lista(v)); setProdutos(lista(p)); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Mescla vendas da API + vendas do Marketplace ─────────────────────────────
  const vendas = useMemo(() => [...apiVendas, ...mkVendas], [apiVendas, mkVendas]);

  // ── KPIs (geral + por loja) ──────────────────────────────────────────────────
  const kpis   = useMemo(() => calcKpis(vendas),                                          [vendas]);
  const kpisSp = useMemo(() => calcKpis(vendas.filter(v => v.tipo === 'Shopee')),         [vendas]);
  const kpisMl = useMemo(() => calcKpis(vendas.filter(v => v.tipo === 'Mercado Livre')),  [vendas]);

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
    return MESES.map((mes, i) => {
      const doMes = vendas.filter(v => { const d = new Date(v.data); return d.getFullYear() === anoFilt && d.getMonth() === i; });
      const soma  = (fn) => doMes.filter(fn).reduce((a, v) => a + (parseFloat(v.valorVenda) || 0), 0);
      const shopee = soma(v => v.tipo === 'Shopee');
      const ml     = soma(v => v.tipo === 'Mercado Livre');
      const outros = soma(v => v.tipo !== 'Shopee' && v.tipo !== 'Mercado Livre');
      return { mes, shopee, ml, outros, total: shopee + ml + outros };
    });
  }, [vendas, anoFilt]);

  // Uma linha por loja, cada uma na cor da marca
  const seriesEvolucao = useMemo(() => {
    const out = [
      { name: 'Shopee',        color: BRAND.shopee.main, values: evolucao.map(e => e.shopee) },
      { name: 'Mercado Livre', color: BRAND.ml.main, casing: BRAND.ml.edge, values: evolucao.map(e => e.ml) },
    ];
    if (evolucao.some(e => e.outros > 0)) {
      out.push({ name: 'Outros', color: COLORS_PLAT['Manual'], values: evolucao.map(e => e.outros) });
    }
    return out;
  }, [evolucao]);

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
            (<PlatTag k="ml">ML</PlatTag> + <PlatTag k="shopee">Shopee</PlatTag>) incluídas nos indicadores abaixo.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Renda Atual"       value={fmt(kpis.renda)}                 sub={`${kpis.totalMes} pedido(s) no mês`}      accentColor="#2ec98a"
          split={{ sp: fmt(kpisSp.renda), ml: fmt(kpisMl.renda), wSp: kpisSp.renda, wMl: kpisMl.renda }} />
        <KpiCard label="Lucro Total Mês"   value={fmtPct(kpis.lucroMesPct)}        sub={fmt(kpis.margemValor)}                    accentColor={kpis.lucroMesPct >= 0 ? '#2ec98a' : '#f05365'}
          split={{ sp: fmtPct(kpisSp.lucroMesPct), ml: fmtPct(kpisMl.lucroMesPct), wSp: kpisSp.margemValor, wMl: kpisMl.margemValor }} />
        <KpiCard label="Custo Total"       value={fmtPct(kpis.custoPct)}           sub={fmt(kpis.custoValor)}                     accentColor="#A8E8F9"
          split={{ sp: fmtPct(kpisSp.custoPct), ml: fmtPct(kpisMl.custoPct), wSp: kpisSp.custoValor, wMl: kpisMl.custoValor }} />
        <KpiCard label="Custo por Entrega" value={fmtPct(kpis.custoPorEntregaPct)} sub={`${fmt(kpis.custoPorEntrega)} / pedido`} accentColor="#A8E8F9"
          split={{ sp: fmtPct(kpisSp.custoPorEntregaPct), ml: fmtPct(kpisMl.custoPorEntregaPct), wSp: kpisSp.freteValor, wMl: kpisMl.freteValor }} />
        <KpiCard label="Vendas Hoje"       value={fmt(kpis.rendaHoje)}             sub={`${kpis.qtdHoje} pedido(s)`}              accentColor="#A8E8F9"
          split={{ sp: fmt(kpisSp.rendaHoje), ml: fmt(kpisMl.rendaHoje), wSp: kpisSp.rendaHoje, wMl: kpisMl.rendaHoje }} />
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
                    <Dot color={color} ml={label === 'Mercado Livre'} square />
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', height: 130 }}>
                {topProdutos.map(p => (
                  <div key={p.nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%' }}>
                      <div style={{ flex: 1, height: `${Math.max((p.shopee / maxBar) * 110, p.shopee > 0 ? 4 : 0)}px`, background: `linear-gradient(180deg, ${BRAND.shopee.light}, ${BRAND.shopee.main})`, borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
                      <div style={{ flex: 1, height: `${Math.max((p.ml     / maxBar) * 110, p.ml     > 0 ? 4 : 0)}px`, background: `linear-gradient(180deg, ${BRAND.ml.light}, ${BRAND.ml.main})`, boxShadow: `inset 0 0 0 1px ${BRAND.ml.edge}55`, borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
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
                      <Dot color={m.color} ml={m.label === 'Mercado Livre'} />
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
              Total: {fmt(evolucao.reduce((a, e) => a + e.total, 0))} em {anoFilt}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
              {seriesEvolucao.map(sr => (
                <div key={sr.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  <Dot color={sr.color} ml={!!sr.casing} square />
                  {sr.name}
                </div>
              ))}
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
        {evolucao.every(e => e.total === 0) ? (
          <div className="empty" style={{ padding: 20 }}><p>Sem vendas em {anoFilt}</p></div>
        ) : (
          <LineChart labels={MESES} series={seriesEvolucao} height={120} />
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
          Dados de <PlatTag k="shopee">Shopee</PlatTag> e{' '}
          <PlatTag k="ml">Mercado Livre</PlatTag> integrados via{' '}
          Marketplace · vendas da API backend também incluídas quando disponíveis.
        </span>
      </div>
    </div>
  );
}
