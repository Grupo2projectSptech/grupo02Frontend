/**
 * Marketplace.jsx  →  src/pages/Marketplace.jsx
 *
 * Integrado com:
 *  - Design system do projeto (index.css — fontes, tokens CSS, classes)
 *  - MarketplaceContext (estado global compartilhado com Dashboard e Vendas)
 *  - Topbar, AuthContext, ThemeContext do projeto
 */

import { useState } from 'react';
import {
  ShoppingBag, Store, Plus, Pencil, Trash2, X,
  PauseCircle, PlayCircle, RotateCcw, Search,
  AlertTriangle, TrendingUp, Package, Star,
  BarChart2, Download, ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar';
import { useMarketplace } from '../context/MarketplaceContext';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const disc = (p, o) => (o > p ? Math.round(((o - p) / o) * 100) : 0);

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ v, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 16 16">
          <polygon
            points="8,1 10,6 15,6 11,10 12.5,15 8,12 3.5,15 5,10 1,6 6,6"
            fill={v >= s ? '#FFBA42' : '#2d3f4e'}
          />
        </svg>
      ))}
    </span>
  );
}

// ── HealthBar ─────────────────────────────────────────────────────────────────
function HealthBar({ value }) {
  const color =
    value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="progress-bar-wrap" style={{ flex: 1 }}>
        <div className="progress-bar" style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{value}%</span>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, store }) {
  if (store === 'ml') {
    const map = {
      active: ['badge-active', 'Ativo'],
      paused: ['badge-warn', 'Pausado'],
      closed: ['badge-inactive', 'Encerrado'],
    };
    const [cls, label] = map[status] || ['badge-info', status];
    return <span className={`badge ${cls}`}>{label}</span>;
  }
  const map = {
    NORMAL: ['badge-active', 'Ativo'],
    BANNED: ['badge-inactive', 'Banido'],
    UNLIST: ['badge-warn', 'Inativo'],
  };
  const [cls, label] = map[status] || ['badge-info', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ListingBadge({ listing }) {
  const map = {
    gold_special: ['badge-warn', 'Ouro'],
    gold_premium: ['badge-orange', 'Ouro Premium'],
    bronze:       ['badge-inactive', 'Bronze'],
  };
  const [cls, label] = map[listing] || ['badge-info', listing];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Seção do painel lateral ───────────────────────────────────────────────────
function DSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{
        margin: '0 0 8px',
        fontSize: 10.5, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--text3)',
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}>
        {title}
      </p>
      <div style={{
        background: 'var(--bg3)',
        borderRadius: 8,
        padding: '8px 12px',
        border: '1px solid var(--border)',
      }}>
        {children}
      </div>
    </div>
  );
}

function DRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontSize: 12.5 }}>{value}</span>
    </div>
  );
}

// ── Painel lateral de detalhe ─────────────────────────────────────────────────
function DetailPanel({ product, store, onClose, onAction }) {
  if (!product) return null;
  const isML = store === 'ml';
  const accentColor = isML ? 'var(--primary)' : '#FFBA42';
  const accentText  = isML ? '#fff' : '#1a1a1a';
  const totalDist   = !isML ? product.dist?.reduce((a, b) => a + b, 0) || 1 : 1;

  const canPause    = isML ? product.status === 'active'  : product.status === 'NORMAL';
  const canActivate = isML ? product.status === 'paused'  : product.status === 'UNLIST' || product.status === 'BANNED';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: 'var(--bg)', borderLeft: '1px solid var(--border)',
      zIndex: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header fixo */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1,
      }}>
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 15,
        }}>
          Detalhes do produto
        </span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {/* Hero */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 'var(--radius)',
          padding: 16, marginBottom: 20, border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: accentColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentText, fontWeight: 800, fontSize: 10, flexShrink: 0,
              letterSpacing: '-0.3px',
            }}>
              {product.sku?.split('-')[0]}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>
                {product.title}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text3)' }}>
                {product.category}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                {isML ? product.id : `ID: ${product.id}`}
              </p>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onAction('edit', product)}
            style={{ flexDirection: 'column', gap: 4, padding: '10px 4px', fontSize: 11 }}
          >
            <Pencil size={14} /> Editar
          </button>
          {canPause && (
            <button
              className="btn btn-sm"
              style={{
                flexDirection: 'column', gap: 4, padding: '10px 4px', fontSize: 11,
                background: 'var(--warning-dim)', color: 'var(--warning)',
                border: '1px solid var(--border)',
              }}
              onClick={() => onAction('pause', product)}
            >
              <PauseCircle size={14} /> Pausar
            </button>
          )}
          {canActivate && (
            <button
              className="btn btn-sm"
              style={{
                flexDirection: 'column', gap: 4, padding: '10px 4px', fontSize: 11,
                background: 'var(--success-dim)', color: 'var(--success)',
                border: '1px solid var(--border)',
              }}
              onClick={() => onAction('activate', product)}
            >
              <PlayCircle size={14} /> Ativar
            </button>
          )}
          <button
            className="btn btn-sm"
            style={{
              flexDirection: 'column', gap: 4, padding: '10px 4px', fontSize: 11,
              background: 'var(--danger-dim)', color: 'var(--danger)',
              border: '1px solid var(--border)',
            }}
            onClick={() => onAction('delete', product)}
          >
            <Trash2 size={14} /> Remover
          </button>
        </div>

        <DSection title="Preço">
          <DRow label="Preço atual" value={
            <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
              {fmt(product.price)}
            </span>
          } />
          <DRow label="Preço original" value={
            <span style={{ textDecoration: 'line-through', color: 'var(--text3)' }}>
              {fmt(product.originalPrice)}
            </span>
          } />
          <DRow label="Desconto" value={
            <span className="badge badge-warn">-{disc(product.price, product.originalPrice)}%</span>
          } />
        </DSection>

        <DSection title="Estoque & Vendas">
          <DRow label="Em estoque" value={
            <span style={{
              fontWeight: 700,
              color: product.stock === 0 ? 'var(--danger)' : product.stock < 8 ? 'var(--warning)' : 'var(--text)',
            }}>
              {product.stock} un
            </span>
          } />
          <DRow label="Total vendido" value={`${product.sold} unidades`} />
        </DSection>

        <DSection title="Avaliação dos clientes">
          <DRow label="Nota" value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Stars v={product.rating} size={14} />
              <strong>{Number(product.rating).toFixed(1)}</strong>
            </span>
          } />
          <DRow label="Avaliações" value={product.reviews} />
          {!isML && <DRow label="Curtidas" value={(product.likes || 0).toLocaleString('pt-BR')} />}
          {!isML && product.dist && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Distribuição</p>
              {[5, 4, 3, 2, 1].map((s) => {
                const cnt = product.dist[s - 1] || 0;
                const pct = totalDist > 0 ? Math.round((cnt / totalDist) * 100) : 0;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)', width: 18, textAlign: 'right' }}>{s}★</span>
                    <div className="progress-bar-wrap" style={{ flex: 1 }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: '#FFBA42' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', width: 24 }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DSection>

        <DSection title="Status & Configurações">
          <DRow label="Status" value={<StatusBadge status={product.status} store={store} />} />
          {isML && <DRow label="Anúncio" value={<ListingBadge listing={product.listing} />} />}
          {isML && (
            <DRow label="Frete grátis" value={
              product.freeShipping
                ? <span className="badge badge-active">Sim</span>
                : <span className="badge badge-inactive">Não</span>
            } />
          )}
          {isML && (
            <DRow label="Logística" value={
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {(product.logistic || '').replace(/_/g, ' ')}
              </span>
            } />
          )}
          {!isML && (
            <DRow label="Impulsionado" value={
              product.boosted
                ? <span className="badge badge-warn">Ativo</span>
                : <span className="badge badge-inactive">Inativo</span>
            } />
          )}
          {!isML && product.logistics && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Transportadoras</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {product.logistics.map((l) => (
                  <span key={l} className="badge badge-info" style={{ fontSize: 11 }}>{l}</span>
                ))}
              </div>
            </div>
          )}
        </DSection>

        {isML && (
          <DSection title="Saúde do anúncio">
            <HealthBar value={product.health || 0} />
            <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 6 }}>
              {product.health >= 80
                ? 'Anúncio bem otimizado'
                : product.health >= 60
                ? 'Melhorias recomendadas'
                : 'Atenção: otimização necessária'}
            </p>
          </DSection>
        )}

        <DSection title="Visibilidade">
          <DRow label="Visitas / 7 dias"  value={(product.visits7  || 0).toLocaleString('pt-BR')} />
          <DRow label="Visitas / 30 dias" value={(product.visits30 || 0).toLocaleString('pt-BR')} />
        </DSection>

        {/* Endpoint da API */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 8,
          padding: '10px 12px', border: '1px solid var(--border)', marginTop: 4,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            API Endpoint
          </p>
          <code style={{
            fontSize: 11, color: isML ? 'var(--info)' : '#FFBA42',
            fontFamily: 'monospace', wordBreak: 'break-all',
          }}>
            {isML
              ? `GET /items/${product.id}`
              : `GET /v2/item/get?item_id=${product.id}&shop_id=87654321`}
          </code>
        </div>
      </div>
    </div>
  );
}

// ── Modal de produto (criar / editar) ─────────────────────────────────────────
const EMPTY_FORM = {
  title: '', sku: '', category: '', price: '', originalPrice: '',
  stock: 0, freeShipping: false, listing: 'gold_special',
  logistic: 'fulfillment', status: 'active', boosted: false,
};

function ProductModal({ product, store, onClose, onSave }) {
  const isML = store === 'ml';
  const [form, setForm]     = useState(product ? { ...product } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Preencha Nome e Preço'); return; }
    setSaving(true);
    setTimeout(() => {
      onSave({
        ...form,
        price:         parseFloat(form.price)         || 0,
        originalPrice: parseFloat(form.originalPrice) || parseFloat(form.price) || 0,
        stock:         parseInt(form.stock)            || 0,
      });
      setSaving(false);
      toast.success(product ? 'Produto atualizado!' : 'Produto criado!');
      onClose();
    }, 500);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-input" value={form.title}
                onChange={(e) => set('title', e.target.value)} placeholder="Nome do produto" />
            </div>
            <div className="form-group">
              <label className="form-label">SKU / Código</label>
              <input className="form-input" value={form.sku || ''}
                onChange={(e) => set('sku', e.target.value)} placeholder="SKU-001" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preço de venda (R$) *</label>
              <input className="form-input" type="number" min="0" step="0.01"
                value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label className="form-label">Preço original (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01"
                value={form.originalPrice || ''}
                onChange={(e) => set('originalPrice', e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estoque (un)</label>
              <input className="form-input" type="number" min="0"
                value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <input className="form-input" value={form.category || ''}
                onChange={(e) => set('category', e.target.value)} placeholder="Ex: Eletrônicos" />
            </div>
          </div>

          {isML && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo de anúncio</label>
                <select className="form-select" value={form.listing}
                  onChange={(e) => set('listing', e.target.value)}>
                  <option value="gold_special">Ouro</option>
                  <option value="gold_premium">Ouro Premium</option>
                  <option value="bronze">Bronze</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Logística</label>
                <select className="form-select" value={form.logistic}
                  onChange={(e) => set('logistic', e.target.value)}>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="xd_drop_off">XD Drop-off</option>
                  <option value="drop_off">Drop-off</option>
                  <option value="me2">ME2</option>
                </select>
              </div>
            </div>
          )}

          {isML && (
            <div className="form-group">
              <label className="form-label">Frete grátis</label>
              <select className="form-select"
                value={form.freeShipping ? 'true' : 'false'}
                onChange={(e) => set('freeShipping', e.target.value === 'true')}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          )}

          {!isML && (
            <div className="form-group">
              <label className="form-label">Impulsionar produto (Boost)</label>
              <select className="form-select"
                value={form.boosted ? 'true' : 'false'}
                onChange={(e) => set('boosted', e.target.value === 'true')}>
                <option value="true">Sim — produto impulsionado</option>
                <option value="false">Não</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status}
              onChange={(e) => set('status', e.target.value)}>
              {isML ? (
                <>
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="closed">Encerrado</option>
                </>
              ) : (
                <>
                  <option value="NORMAL">Normal (Ativo)</option>
                  <option value="UNLIST">Inativo</option>
                </>
              )}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : product ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de confirmação de ação ──────────────────────────────────────────────
function ConfirmModal({ action, product, store, onConfirm, onClose }) {
  const map = {
    pause:    { title: 'Pausar anúncio',   msg: 'O produto ficará invisível para compradores até ser reativado.', btn: 'Pausar',  cls: 'btn-ghost',   icon: <PauseCircle size={15} /> },
    activate: { title: 'Ativar produto',   msg: 'O produto voltará a aparecer nos resultados de busca.',          btn: 'Ativar',  cls: 'btn-success', icon: <PlayCircle size={15} /> },
    delete:   { title: 'Remover produto',  msg: 'Esta ação não pode ser desfeita.',                               btn: 'Remover', cls: 'btn-danger',  icon: <Trash2 size={15} /> },
  };
  const cfg = map[action];
  if (!cfg) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cfg.title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
          Você está prestes a <strong>{cfg.btn.toLowerCase()}</strong>{' '}
          <strong style={{ color: 'var(--text)' }}>"{product?.title}"</strong>{' '}
          na plataforma {store === 'ml' ? 'Mercado Livre' : 'Shopee'}.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>{cfg.msg}</p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className={`btn ${cfg.cls}`} onClick={onConfirm}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {cfg.icon} {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Marketplace() {
  const {
    mlProducts, shopeeProducts,
    updateMlProduct, deleteMlProduct, addMlProduct,
    updateShopeeProduct, deleteShopeeProduct, addShopeeProduct,
    semEstoqueCount,
  } = useMarketplace();

  const [store,        setStore]        = useState('ml');
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected,     setSelected]     = useState(null);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [confirm,      setConfirm]      = useState(null);

  const isML    = store === 'ml';
  const items   = isML ? mlProducts : shopeeProducts;
  const accentColor = isML ? 'var(--primary)' : '#FFBA42';
  const accentText  = isML ? '#fff' : '#1a1a1a';

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const filtered = items.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Métricas ─────────────────────────────────────────────────────────────────
  const revenue     = items.reduce((a, p) => a + p.price * p.sold, 0);
  const avgRating   = items.length
    ? (items.reduce((a, p) => a + (p.rating || 0), 0) / items.length).toFixed(1)
    : '—';
  const totalStock  = items.reduce((a, p) => a + (p.stock || 0), 0);
  const activeCount = items.filter((p) =>
    isML ? p.status === 'active' : p.status === 'NORMAL'
  ).length;
  const semEstoque  = items.filter((p) => (p.stock || 0) === 0).length;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAction = (action, product) => {
    if (action === 'edit') { setEditing(product); setModal(true); return; }
    setConfirm({ action, product });
  };

  const executeAction = () => {
    const { action, product } = confirm;
    const id = product.id;

    if (action === 'delete') {
      isML ? deleteMlProduct(id) : deleteShopeeProduct(id);
      if (selected?.id === id) setSelected(null);
      toast.success('Produto removido!');
    } else if (action === 'pause') {
      const newStatus = isML ? 'paused' : 'UNLIST';
      isML ? updateMlProduct(id, { status: newStatus }) : updateShopeeProduct(id, { status: newStatus });
      if (selected?.id === id) setSelected((p) => ({ ...p, status: newStatus }));
      toast.success('Produto pausado!');
    } else if (action === 'activate') {
      const newStatus = isML ? 'active' : 'NORMAL';
      isML ? updateMlProduct(id, { status: newStatus }) : updateShopeeProduct(id, { status: newStatus });
      if (selected?.id === id) setSelected((p) => ({ ...p, status: newStatus }));
      toast.success('Produto ativado!');
    }
    setConfirm(null);
  };

  const handleSave = (data) => {
    if (editing) {
      isML ? updateMlProduct(editing.id, data) : updateShopeeProduct(editing.id, data);
      if (selected?.id === editing.id) setSelected((p) => ({ ...p, ...data }));
    } else {
      isML ? addMlProduct(data) : addShopeeProduct(data);
    }
    setEditing(null);
  };

  const switchStore = (s) => {
    setStore(s);
    setSelected(null);
    setSearch('');
    setFilterStatus('all');
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingRight: selected ? 396 : 0, transition: 'padding-right 0.25s' }}>
      <Topbar
        title="Marketplace"
        subtitle={`${items.length} produto(s) · ${activeCount} ativos${semEstoque > 0 ? ` · ${semEstoque} sem estoque` : ''}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Toggle ML / Shopee */}
            <div style={{
              display: 'flex',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: 3, gap: 2,
            }}>
              {[
                { key: 'ml',     label: 'Mercado Livre', icon: ShoppingBag },
                { key: 'shopee', label: 'Shopee',        icon: Store       },
              ].map(({ key, label, icon: Icon }) => {
                const active = store === key;
                const bg     = active ? (key === 'ml' ? 'var(--primary)' : '#FFBA42') : 'transparent';
                const color  = active ? (key === 'ml' ? '#fff' : '#1a1a1a') : 'var(--text3)';
                const shadow = active
                  ? key === 'ml'
                    ? '0 2px 8px var(--primary-glow)'
                    : '0 2px 8px rgba(255,186,66,0.35)'
                  : 'none';
                return (
                  <button
                    key={key}
                    onClick={() => switchStore(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600, fontSize: 12.5,
                      transition: 'all 0.18s',
                      background: bg, color, boxShadow: shadow,
                    }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => { setEditing(null); setModal(true); }}
            >
              <Plus size={15} /> Novo Produto
            </button>
          </div>
        }
      />

      {/* Badge da plataforma */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: accentColor,
          borderRadius: 8, padding: '5px 14px',
        }}>
          {isML
            ? <ShoppingBag size={14} color={accentText} />
            : <Store size={14} color={accentText} />}
          <span style={{
            fontWeight: 700, fontSize: 13, color: accentText,
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}>
            {isML ? 'Mercado Livre' : 'Shopee'}
          </span>
          <span style={{
            fontSize: 10,
            background: 'rgba(0,0,0,0.18)', borderRadius: 4,
            padding: '1px 6px', color: accentText,
          }}>
            {isML ? 'API v2' : 'Open Platform v2'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            {isML
              ? 'Conectado · Seller ID 87654321'
              : 'Conectado · Shop ID 87654321'}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          {
            label: 'Receita acumulada', value: fmt(revenue),
            sub: 'total de vendas', icon: TrendingUp,
            color: 'var(--success)', dim: 'var(--success-dim)',
          },
          {
            label: 'Produtos ativos', value: `${activeCount} / ${items.length}`,
            sub: 'anúncios publicados', icon: Package,
            color: isML ? 'var(--primary)' : '#FFBA42',
            dim: isML ? 'var(--primary-dim)' : 'rgba(255,186,66,0.14)',
          },
          {
            label: 'Estoque total', value: `${totalStock} un`,
            sub: semEstoque > 0 ? `${semEstoque} zerados` : 'tudo em estoque',
            icon: BarChart2,
            color: semEstoque > 0 ? 'var(--warning)' : 'var(--text2)',
            dim: semEstoque > 0 ? 'var(--warning-dim)' : 'var(--bg3)',
          },
          {
            label: 'Avaliação média', value: `${avgRating} ★`,
            sub: 'de todos os produtos', icon: Star,
            color: '#FFBA42', dim: 'rgba(255,186,66,0.14)',
          },
        ].map((m) => (
          <div key={m.label} className="stat-card" style={{ background: 'var(--bg3)' }}>
            <div className="stat-card-inner">
              <div>
                <div className="stat-value" style={{ fontSize: 24, color: m.color }}>
                  {m.value}
                </div>
                <div className="stat-label">{m.label}</div>
                <div className="stat-sub">{m.sub}</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: m.dim, color: m.color }}>
                <m.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <div className="search-wrap">
            <Search className="search-ico" size={14} />
            <input
              className="search-input"
              placeholder="Buscar por nome, SKU ou categoria…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 290 }}
            />
          </div>

          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
          >
            <option value="all">Todos os status</option>
            {isML ? (
              <>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="closed">Encerrado</option>
              </>
            ) : (
              <>
                <option value="NORMAL">Normal</option>
                <option value="BANNED">Banido</option>
                <option value="UNLIST">Inativo</option>
              </>
            )}
          </select>

          {semEstoque > 0 && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setFilterStatus('all')}
              style={{ gap: 5, color: 'var(--warning)', borderColor: 'var(--warning)' }}
            >
              <AlertTriangle size={13} /> {semEstoque} sem estoque
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
            {filtered.length} resultado(s)
          </span>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Avaliação</th>
                <th>Status</th>
                <th>{isML ? 'Saúde' : 'Visibilidade'}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon">📦</div>
                      <h3>Nenhum produto encontrado</h3>
                      <p>Tente outro filtro ou crie um novo produto</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isSelected = selected?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected((s) => (s?.id === p.id ? null : p))}
                      style={{
                        cursor: 'pointer',
                        background: isSelected
                          ? isML
                            ? 'var(--primary-dim)'
                            : 'rgba(255,186,66,0.07)'
                          : 'transparent',
                      }}
                    >
                      {/* Produto */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 8,
                            background: accentColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: accentText, fontSize: 9, fontWeight: 800, flexShrink: 0,
                          }}>
                            {(p.sku || '').split('-')[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                              {p.category} ·{' '}
                              <span style={{ fontFamily: 'monospace' }}>{p.sku}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Preço */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13.5 }}>
                          {fmt(p.price)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>
                          {fmt(p.originalPrice)}
                        </div>
                        {disc(p.price, p.originalPrice) > 0 && (
                          <span className="badge badge-warn" style={{ fontSize: 10, marginTop: 2 }}>
                            -{disc(p.price, p.originalPrice)}%
                          </span>
                        )}
                      </td>

                      {/* Estoque */}
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: p.stock === 0 ? 'var(--danger)' : p.stock <= 5 ? 'var(--warning)' : 'var(--text)',
                        }}>
                          {p.stock}
                        </span>
                        {p.stock === 0 && (
                          <span className="badge badge-inactive" style={{ marginLeft: 5, fontSize: 10 }}>Zerado</span>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                          {p.sold} vendidos
                        </div>
                      </td>

                      {/* Avaliação */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Stars v={p.rating || 0} />
                          <span style={{ fontWeight: 700, fontSize: 12.5 }}>
                            {Number(p.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {p.reviews} avaliações
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <StatusBadge status={p.status} store={store} />
                          {isML && <ListingBadge listing={p.listing} />}
                          {isML && p.freeShipping && (
                            <span className="badge badge-info" style={{ fontSize: 10 }}>Frete grátis</span>
                          )}
                          {!isML && p.boosted && (
                            <span className="badge badge-warn" style={{ fontSize: 10 }}>⚡ Boost</span>
                          )}
                        </div>
                      </td>

                      {/* Saúde / Visibilidade */}
                      <td>
                        {isML ? (
                          <HealthBar value={p.health || 0} />
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {(p.visits7 || 0).toLocaleString('pt-BR')}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>views / semana</div>
                          </div>
                        )}
                      </td>

                      {/* Ações — stopPropagation para não abrir o painel */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Editar"
                            onClick={() => { setEditing(p); setModal(true); }}
                          >
                            <Pencil size={14} />
                          </button>

                          {(isML ? p.status === 'active' : p.status === 'NORMAL') && (
                            <button
                              className="btn btn-sm btn-icon"
                              title="Pausar"
                              style={{ color: 'var(--warning)', border: '1px solid var(--border)', background: 'transparent' }}
                              onClick={() => setConfirm({ action: 'pause', product: p })}
                            >
                              <PauseCircle size={14} />
                            </button>
                          )}

                          {(isML
                            ? p.status === 'paused'
                            : p.status === 'UNLIST' || p.status === 'BANNED') && (
                            <button
                              className="btn btn-sm btn-icon"
                              title="Ativar"
                              style={{ color: 'var(--success)', border: '1px solid var(--border)', background: 'transparent' }}
                              onClick={() => setConfirm({ action: 'activate', product: p })}
                            >
                              <PlayCircle size={14} />
                            </button>
                          )}

                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Remover"
                            onClick={() => setConfirm({ action: 'delete', product: p })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela */}
        {filtered.length > 0 && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              Mostrando {filtered.length} de {items.length} produtos ·{' '}
              clique em uma linha para ver detalhes
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
                <Download size={13} /> Exportar CSV
              </button>
              <button className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
                <RotateCcw size={13} /> Sincronizar API
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Painel lateral de detalhe */}
      {selected && (
        <DetailPanel
          product={selected}
          store={store}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}

      {/* Modal criar / editar */}
      {modal && (
        <ProductModal
          product={editing}
          store={store}
          onClose={() => { setModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* Modal confirmação */}
      {confirm && (
        <ConfirmModal
          action={confirm.action}
          product={confirm.product}
          store={store}
          onConfirm={executeAction}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
