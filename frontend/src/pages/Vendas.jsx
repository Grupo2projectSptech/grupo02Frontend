import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Search, ShoppingBag, TrendingUp, DollarSign, Package } from 'lucide-react';
import { vendaService, produtoService } from '../services/api';
import { useMarketplace } from '../context/MarketplaceContext';
import Topbar from '../components/layout/Topbar';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────
const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtPct  = (v) => `${(v || 0).toFixed(1)}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const calculos = (f) => {
  const custoTotal   = (parseFloat(f.custoUnidade) || 0) * (parseInt(f.quantidade) || 0);
  const freteDiff    = (parseFloat(f.freteVenda)   || 0) - (parseFloat(f.freteFlex) || 0);
  const impostoValor = ((parseFloat(f.imposto)     || 0) / 100) * (parseFloat(f.valorVenda) || 0);
  const custoCheio   = custoTotal
    + (parseFloat(f.motoboy)     || 0)
    + (parseFloat(f.freteFlex)   || 0)
    + impostoValor
    + (parseFloat(f.operacional) || 0)
    + (parseFloat(f.tarifa)      || 0);
  const margem    = (parseFloat(f.valorVenda) || 0) - custoCheio;
  const margemPct = (parseFloat(f.valorVenda) || 0) ? (margem / parseFloat(f.valorVenda)) * 100 : 0;
  return { custoTotal, freteDiff, impostoValor, custoCheio, margem, margemPct };
};

const EMPTY = {
  data: new Date().toISOString().slice(0, 10),
  nomeProduto: '', tipo: 'Shopee', produto: null,  // ✅ era '' — backend espera objeto ou null
  quantidade: '', custoUnidade: '', valorVenda: '', idPedido: '',
  motoboy: '', freteFlex: '', freteVenda: '',
  tarifa: '', imposto: '', operacional: '',
};

const TIPOS    = ['Shopee', 'Mercado Livre', 'Manual', 'Outro'];
const PERIODOS = [
  { label: 'Todos',       value: 'all'   },
  { label: 'Hoje',        value: 'today' },
  { label: 'Esta semana', value: 'week'  },
  { label: 'Este mês',    value: 'month' },
];

// ─── Componente principal ────────────────────────────────
export default function Vendas() {
  const { mkVendas }           = useMarketplace();   // ← vendas do Marketplace
  const [apiItems, setApiItems] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [errors,   setErrors]   = useState({});

  const [search,  setSearch]  = useState('');
  const [tipo,    setTipo]    = useState('all');
  const [periodo, setPeriodo] = useState('all');
  const [origem,  setOrigem]  = useState('all'); // all | api | marketplace

  const load = () => {
    setLoading(true);
    Promise.all([vendaService.listar(), produtoService.listar()])
      .then(([v, p]) => { setApiItems(v.data || []); setProdutos(p.data || []); })
      .catch(() => toast.error('Erro ao carregar vendas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Mescla API + Marketplace com flag de origem
  const allItems = useMemo(() => [
    ...apiItems.map(i => ({ ...i, _source: 'api' })),
    ...mkVendas.map(i => ({ ...i, _source: 'marketplace' })),
  ], [apiItems, mkVendas]);

  // Filtros
  const filtered = useMemo(() => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allItems.filter(i => {
      const q = search.toLowerCase();
      const matchSearch  = !q || (i.nomeProduto || '').toLowerCase().includes(q) || (i.idPedido || '').toLowerCase().includes(q) || (i.tipo || '').toLowerCase().includes(q);
      const matchTipo    = tipo === 'all' || i.tipo === tipo;
      const matchOrigem  = origem === 'all' || i._source === origem;

      let matchPeriodo = true;
      if (periodo !== 'all' && i.data) {
        const d = new Date(i.data);
        if (periodo === 'today') matchPeriodo = d >= today;
        if (periodo === 'week')  matchPeriodo = d >= new Date(today - 6 * 864e5);
        if (periodo === 'month') matchPeriodo = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchTipo && matchOrigem && matchPeriodo;
    });
  }, [allItems, search, tipo, periodo, origem]);

  // Totalizadores
  const totais = useMemo(() => filtered.reduce((acc, i) => {
    const c = calculos(i);
    acc.vendas += parseFloat(i.valorVenda) || 0;
    acc.custo  += c.custoCheio;
    acc.margem += c.margem;
    acc.qtd    += parseInt(i.quantidade)   || 0;
    return acc;
  }, { vendas: 0, custo: 0, margem: 0, qtd: 0 }), [filtered]);

  // Form helpers
  const setField   = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: null })); };
  const openModal  = () => { setForm(EMPTY); setErrors({}); setModal(true); };
  const closeModal = () => { setModal(false); };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = {};
    if (!form.nomeProduto && !form.produto) errs.nomeProduto = 'Informe o produto';
    if (!form.quantidade  || form.quantidade <= 0) errs.quantidade = 'Quantidade inválida';
    if (!form.valorVenda  || form.valorVenda <= 0) errs.valorVenda = 'Valor de venda inválido';
    if (!form.data)                                errs.data       = 'Data obrigatória';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const c = calculos(form);

      // ✅ monta produto como objeto { id } só se houver um produto selecionado,
      //    nunca envia string vazia (quebrava a deserialização no backend)
      const produtoRef = form.produto
        ? { id: typeof form.produto === 'object' ? form.produto.id : parseInt(form.produto) }
        : null;

      const payload = {
        ...form,
        produto: produtoRef, // ✅ nunca mais string vazia
        custoTotal: c.custoTotal, freteDiff: c.freteDiff,
        impostoValor: c.impostoValor, custoCheio: c.custoCheio,
        margem: c.margem, margemPct: c.margemPct,
        nomeProduto: form.nomeProduto || produtos.find(p => p.id === produtoRef?.id)?.nome || '',
      };
      await vendaService.criar(payload);
      toast.success('Venda cadastrada!');
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar venda');
    } finally {
      setSaving(false);
    }
  };

  const preview = calculos(form);

  // ─────────────────────────────────────────────────────
  return (
    <div>
      <Topbar
        title="Vendas"
        subtitle={`${allItems.length} venda(s) · ${apiItems.length} da API · ${mkVendas.length} do Marketplace`}
        actions={
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={15} /> Nova Venda
          </button>
        }
      />

      {/* Cards de totais */}
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Vendido',  value: fmt(totais.vendas), icon: DollarSign, color: 'var(--success)', dim: 'var(--success-dim)' },
          { label: 'Custo Total',    value: fmt(totais.custo),  icon: ShoppingBag, color: 'var(--danger)',  dim: 'var(--danger-dim)'  },
          { label: 'Margem Total',   value: fmt(totais.margem), icon: TrendingUp,  color: 'var(--primary)', dim: 'var(--primary-dim)' },
          { label: 'Itens Vendidos', value: totais.qtd,         icon: Package,     color: 'var(--info)',    dim: 'var(--info-dim)'    },
        ].map(({ label, value, icon: Icon, color, dim }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-inner">
              <div>
                <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: dim, color }}><Icon size={20} /></div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '0 0 12px 12px', opacity: 0.6 }} />
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="card">
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="search-input" placeholder="Buscar produto, pedido…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="form-select" style={{ width: 'auto', minWidth: 140 }}
            value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="all">Todas plataformas</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="form-select" style={{ width: 'auto', minWidth: 130 }}
            value={periodo} onChange={e => setPeriodo(e.target.value)}>
            {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {/* Filtro de origem — novo */}
          <select className="form-select" style={{ width: 'auto', minWidth: 150 }}
            value={origem} onChange={e => setOrigem(e.target.value)}>
            <option value="all">Todas as origens</option>
            <option value="api">Somente API</option>
            <option value="marketplace">Somente Marketplace</option>
          </select>

          <div style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
            {filtered.length} resultado(s)
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🛒</div>
            <h3>Nenhuma venda encontrada</h3>
            <p>Clique em "Nova Venda" para registrar</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Origem</th>
                  <th>Qtd</th>
                  <th>$ Custo Un.</th>
                  <th>$ Custo Total</th>
                  <th>$ Venda</th>
                  <th>Id Pedido</th>
                  <th>$ Motoboy</th>
                  <th>$ Frete Flex</th>
                  <th>$ Frete Dif.</th>
                  <th>Tarifa</th>
                  <th>% Imposto</th>
                  <th>$ Imposto</th>
                  <th>Operacional</th>
                  <th>$ Custo Ch.</th>
                  <th>% Margem</th>
                  <th>$ Margem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, idx) => {
                  const c = calculos(i);
                  const margemColor = c.margem >= 0 ? 'var(--success)' : 'var(--danger)';
                  return (
                    <tr key={i.id || idx}>
                      <td>{fmtDate(i.data)}</td>
                      <td><strong>{i.nomeProduto || '—'}</strong></td>
                      <td>
                        <span className={`badge ${
                          i.tipo === 'Shopee'        ? 'badge-orange' :
                          i.tipo === 'Mercado Livre' ? 'badge-warn'   : 'badge-inactive'
                        }`}>{i.tipo}</span>
                      </td>
                      <td>
                        <span className={`badge ${i._source === 'marketplace' ? 'badge-info' : 'badge-inactive'}`}
                          style={{ fontSize: 10 }}>
                          {i._source === 'marketplace' ? 'Marketplace' : 'API'}
                        </span>
                      </td>
                      <td>{i.quantidade}</td>
                      <td>{fmt(i.custoUnidade)}</td>
                      <td>{fmt(c.custoTotal)}</td>
                      <td><strong>{fmt(i.valorVenda)}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{i.idPedido || '—'}</td>
                      <td>{fmt(i.motoboy)}</td>
                      <td>{fmt(i.freteFlex)}</td>
                      <td>{fmt(c.freteDiff)}</td>
                      <td>{fmt(i.tarifa)}</td>
                      <td>{fmtPct(i.imposto)}</td>
                      <td>{fmt(c.impostoValor)}</td>
                      <td>{fmt(i.operacional)}</td>
                      <td>{fmt(c.custoCheio)}</td>
                      <td style={{ color: margemColor, fontWeight: 600 }}>{fmtPct(c.margemPct)}</td>
                      <td style={{ color: margemColor, fontWeight: 600 }}>{fmt(c.margem)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Venda */}
      {modal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Venda</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input type="date" className={`form-input${errors.data ? ' error' : ''}`}
                    value={form.data} onChange={e => setField('data', e.target.value)} />
                  {errors.data && <div className="field-error">{errors.data}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Plataforma</label>
                  <select className="form-select" value={form.tipo} onChange={e => setField('tipo', e.target.value)}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ID Pedido</label>
                  <input className="form-input" placeholder="Ex: 123456789"
                    value={form.idPedido} onChange={e => setField('idPedido', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Produto *</label>
                  <input className={`form-input${errors.nomeProduto ? ' error' : ''}`}
                    placeholder="Nome do produto vendido"
                    value={form.nomeProduto} onChange={e => setField('nomeProduto', e.target.value)} />
                  {errors.nomeProduto && <div className="field-error">{errors.nomeProduto}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Qtd *</label>
                  <input type="number" min="1" className={`form-input${errors.quantidade ? ' error' : ''}`}
                    placeholder="1" value={form.quantidade} onChange={e => setField('quantidade', e.target.value)} />
                  {errors.quantidade && <div className="field-error">{errors.quantidade}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">$ Custo Unidade</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.custoUnidade} onChange={e => setField('custoUnidade', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">$ Valor de Venda *</label>
                  <input type="number" step="0.01" className={`form-input${errors.valorVenda ? ' error' : ''}`}
                    placeholder="0,00" value={form.valorVenda} onChange={e => setField('valorVenda', e.target.value)} />
                  {errors.valorVenda && <div className="field-error">{errors.valorVenda}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">$ Motoboy</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.motoboy} onChange={e => setField('motoboy', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">$ Frete Flex</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.freteFlex} onChange={e => setField('freteFlex', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">$ Frete Venda</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.freteVenda} onChange={e => setField('freteVenda', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">$ Tarifa</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.tarifa} onChange={e => setField('tarifa', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Imposto</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.imposto} onChange={e => setField('imposto', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">$ Operacional</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0,00"
                    value={form.operacional} onChange={e => setField('operacional', e.target.value)} />
                </div>
              </div>

              {(form.valorVenda || form.custoUnidade) && (
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    ['Custo Total',     fmt(preview.custoTotal)],
                    ['Custo Cheio',     fmt(preview.custoCheio)],
                    ['Imposto',         fmt(preview.impostoValor)],
                    ['Frete Diferença', fmt(preview.freteDiff)],
                    ['% Margem',        fmtPct(preview.margemPct)],
                    ['$ Margem',        fmt(preview.margem)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontWeight: 600, color: label.includes('Margem') ? (preview.margem >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text)' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando…' : 'Cadastrar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
