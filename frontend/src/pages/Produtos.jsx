import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { produtoService, fornecedorService } from '../services/api';
import { validators, validateForm } from '../utils/validators';
import { formatCurrency } from '../utils/formatters';
import Topbar from '../components/layout/Topbar';
import toast from 'react-hot-toast';

const SCHEMA = {
  nome:    [v => validators.required(v, 'Nome')],
  preco:   [v => validators.required(v, 'Preço'), v => validators.positiveNumber(v, 'Preço')],
  estoque: [v => validators.nonNegativeInt(v, 'Estoque')],
};

const EMPTY = {
  nome: '', descricao: '', preco: '', estoque: 0,
  categoria: '', codigoInterno: '', unidade: 'UN',
  ativo: true, fornecedor: null, // ✅ sem "empresa" — campo removido do model
};

export default function Produtos() {
  const [items,        setItems]        = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterLow,    setFilterLow]    = useState(false);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);

  // ── Load ──────────────────────────────────────────────
  const load = () => {
    setLoading(true);
    Promise.all([
      produtoService.listar(),
      fornecedorService.listar(),
    ])
      .then(([p, f]) => {
        setItems(p.data);
        setFornecedores(f.data);
      })
      .catch(() => toast.error('Erro ao carregar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Modal helpers ─────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...item,
      preco:      item.preco,
      fornecedor: item.fornecedor ? { id: item.fornecedor.id } : null,
      // ✅ sem empresa — não existe mais no model do backend
    });
    setErrors({});
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validateForm(form, SCHEMA);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // ✅ remove qualquer campo fantasma (ex: empresa) antes de enviar
      const { empresa, ...rest } = form;

      const payload = {
        ...rest,
        // ✅ aceita tanto "10.50" quanto "10,50" digitado pelo usuário
        preco:   parseFloat(String(form.preco).replace(',', '.')),
        estoque: parseInt(form.estoque) || 0,
      };

      if (editing) {
        await produtoService.atualizar(editing.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await produtoService.criar(payload);
        toast.success('Produto cadastrado!');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await produtoService.deletar(id);
      toast.success('Removido!');
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover produto');
    }
  };

  // ── Filtros ───────────────────────────────────────────
  let filtered = items.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.categoria     || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.codigoInterno || '').toLowerCase().includes(search.toLowerCase())
  );
  if (filterLow) filtered = filtered.filter(i => !i.estoque || i.estoque === 0);

  const semEstoque = items.filter(i => !i.estoque || i.estoque === 0).length;

  // ─────────────────────────────────────────────────────
  return (
    <div>
      <Topbar
        title="Produtos"
        subtitle={`${items.length} produto(s) · ${semEstoque} sem estoque`}
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Novo Produto
          </button>
        }
      />

      {/* ── Tabela ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-wrap">
              <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                placeholder="Buscar produto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {semEstoque > 0 && (
              <button
                className={`btn btn-sm ${filterLow ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => setFilterLow(f => !f)}
                style={{ gap: 5 }}
              >
                <AlertTriangle size={13} />
                Sem estoque ({semEstoque})
              </button>
            )}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            {filtered.length} resultado(s)
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <h3>Nenhum produto</h3>
            <p>Clique em "Novo Produto" para adicionar</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Cód.</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nome}</div>
                      {item.categoria && (
                        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
                          {item.categoria}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text3)' }}>
                      {item.codigoInterno || '—'}
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                      {formatCurrency(item.preco)}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: item.estoque === 0
                          ? 'var(--danger)'
                          : item.estoque <= 5
                            ? 'var(--warning)'
                            : 'var(--text)',
                      }}>
                        {item.estoque} {item.unidade || 'UN'}
                      </span>
                      {item.estoque === 0 && (
                        <span className="badge badge-inactive" style={{ marginLeft: 6, fontSize: 10 }}>
                          Zerado
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>
                      {item.fornecedor?.nome || <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${item.ativo ? 'badge-active' : 'badge-inactive'}`}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => openEdit(item)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(item.id)}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Nome + Código */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    className={`form-input${errors.nome ? ' error' : ''}`}
                    value={form.nome}
                    onChange={e => setField('nome', e.target.value)}
                    placeholder="Nome do produto"
                  />
                  {errors.nome && <div className="field-error">{errors.nome}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Código Interno</label>
                  <input
                    className="form-input"
                    value={form.codigoInterno}
                    onChange={e => setField('codigoInterno', e.target.value)}
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-textarea"
                  value={form.descricao}
                  onChange={e => setField('descricao', e.target.value)}
                  placeholder="Descrição detalhada…"
                />
              </div>

              {/* Preço + Estoque */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preço (R$) *</label>
                  <input
                    className={`form-input${errors.preco ? ' error' : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.preco}
                    onChange={e => setField('preco', e.target.value)}
                    placeholder="0.00"
                  />
                  {errors.preco && <div className="field-error">{errors.preco}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Estoque</label>
                  <input
                    className={`form-input${errors.estoque ? ' error' : ''}`}
                    type="number"
                    min="0"
                    value={form.estoque}
                    onChange={e => setField('estoque', e.target.value)}
                  />
                  {errors.estoque && <div className="field-error">{errors.estoque}</div>}
                </div>
              </div>

              {/* Categoria + Unidade */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input
                    className="form-input"
                    value={form.categoria}
                    onChange={e => setField('categoria', e.target.value)}
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <select
                    className="form-select"
                    value={form.unidade}
                    onChange={e => setField('unidade', e.target.value)}
                  >
                    {['UN', 'KG', 'L', 'M', 'CX', 'PC', 'PAR'].map(u => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="form-group">
                <label className="form-label">Fornecedor</label>
                <select
                  className="form-select"
                  value={form.fornecedor?.id || ''}
                  onChange={e => setField('fornecedor', e.target.value ? { id: parseInt(e.target.value) } : null)}
                >
                  <option value="">Selecione…</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.ativo ? 'true' : 'false'}
                  onChange={e => setField('ativo', e.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
