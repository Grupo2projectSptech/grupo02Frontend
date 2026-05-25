import { useState, useEffect } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { fornecedorService, produtoService } from '../services/api';
import { validators, validateForm } from '../utils/validators';
import { formatCNPJ, formatPhone } from '../utils/formatters';
import Topbar from '../components/layout/Topbar';
import toast from 'react-hot-toast';
import FornecedorRow from '../components/fornecedores/FornecedorRow';
import ReportPanel from '../components/fornecedores/ReportPanel';

const SCHEMA = {
  nome:  [v => validators.required(v, 'Nome'), v => validators.minLength(v, 2, 'Nome')],
  email: [v => v ? validators.email(v) : null],
};

const EMPTY = {
  nome: '', cnpj: '', contato: '', email: '',
  telefone: '', endereco: '', cidade: '', estado: '',
  categoria: '', ativo: true,
};

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

export default function Fornecedores() {
  const [items,       setItems]       = useState([]);
  const [allProdutos, setAllProdutos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fornecedorService.listar(),  // ✅ corrigido de getAll()
      produtoService.listar(),     // ✅ corrigido de getAll()
    ])
      .then(([f, p]) => {
        setItems(f.data);
        setAllProdutos(p.data);
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true); };
  const openEdit   = (item) => { setEditing(item); setForm({ ...item }); setErrors({}); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validateForm(form, SCHEMA);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editing) {
        await fornecedorService.atualizar(editing.id, form); // ✅ corrigido de update()
        toast.success('Fornecedor atualizado!');
      } else {
        await fornecedorService.criar(form);                 // ✅ corrigido de create()
        toast.success('Fornecedor cadastrado!');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este fornecedor?')) return; // ✅ window.confirm
    try {
      await fornecedorService.deletar(id);                   // ✅ corrigido de delete()
      toast.success('Removido!');
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover fornecedor');
    }
  };

  const filtered = items.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.categoria || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.cnpj || '').includes(search)
  );

  return (
    <div>
      <Topbar
        title="Fornecedores"
        subtitle={`${items.length} fornecedor(es) cadastrado(s)`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${showReport ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowReport(r => !r)}
              style={{ gap: 6 }}
            >
              <FileText size={15} />
              {showReport ? 'Ocultar Relatório' : 'Ver Relatório'}
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={15} /> Novo Fornecedor
            </button>
          </div>
        }
      />

      {/* Tabela principal */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="search-wrap">
            <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              placeholder="Buscar fornecedor…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} resultado(s)</div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚚</div>
            <h3>Nenhum fornecedor</h3>
            <p>Clique em "Novo Fornecedor" para adicionar</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Categoria</th>
                  <th>Cidade / UF</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <FornecedorRow
                    key={item.id}
                    item={item}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    allProdutos={allProdutos}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel de relatório */}
      {showReport && (
        <ReportPanel fornecedores={items} allProdutos={allProdutos} />
      )}

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    className={`form-input${errors.nome ? ' error' : ''}`}
                    value={form.nome}
                    onChange={e => setField('nome', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                  {errors.nome && <div className="field-error">{errors.nome}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input
                    className="form-input"
                    value={form.cnpj}
                    onChange={e => setField('cnpj', formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contato</label>
                  <input
                    className="form-input"
                    value={form.contato}
                    onChange={e => setField('contato', e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-input${errors.email ? ' error' : ''}`}
                    type="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="email@fornecedor.com"
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    className="form-input"
                    value={form.telefone}
                    onChange={e => setField('telefone', formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input
                    className="form-input"
                    value={form.categoria}
                    onChange={e => setField('categoria', e.target.value)}
                    placeholder="Ex: Eletrônicos, Alimentos…"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input
                  className="form-input"
                  value={form.endereco}
                  onChange={e => setField('endereco', e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    className="form-input"
                    value={form.cidade}
                    onChange={e => setField('cidade', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={form.estado}
                    onChange={e => setField('estado', e.target.value)}
                  >
                    <option value="">—</option>
                    {UFS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

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
