import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { empresaService } from '../services/api';
import { validators, validateForm } from '../utils/validators';
import { formatCNPJ, formatPhone, formatCEP } from '../utils/formatters';
import Topbar from '../components/layout/Topbar';
import toast from 'react-hot-toast';

const SCHEMA = {
  razaoSocial: [v => validators.required(v, 'Razão Social'), v => validators.minLength(v, 3, 'Razão Social')],
  cnpj: [v => validators.cnpj(v)],
  email: [v => validators.email(v)],
};

const EMPTY = { razaoSocial: '', cnpj: '', nomeFantasia: '', email: '', telefone: '', endereco: '', cidade: '', estado: '', cep: '', segmento: '', ativo: true };
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function Empresas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

const load = () => {
  setLoading(true);
  empresaService.listar()           // ✅
    .then(r => setItems(r.data))
    .catch(() => toast.error('Erro ao carregar'))
    .finally(() => setLoading(false));
};
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setErrors({}); setModal(true); };
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
      await empresaService.atualizar(editing.id, form); // ✅
      toast.success('Empresa atualizada!');
    } else {
      await empresaService.criar(form);                 // ✅
      toast.success('Empresa cadastrada!');
    }
    closeModal(); load();
  } catch (err) {
    toast.error(err.message || 'Erro ao salvar empresa'); // ✅
  } finally {
    setSaving(false);
  }
};

const handleDelete = async (id) => {
  if (!window.confirm('Excluir esta empresa?')) return;  // ✅
  try {
    await empresaService.deletar(id);                    // ✅
    toast.success('Removida!');
    load();
  } catch (err) {
    toast.error(err.message || 'Erro ao remover empresa');
  }
};

  const filtered = items.filter(i =>
    i.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
    i.cnpj.includes(search) ||
    (i.nomeFantasia || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar
        title="Empresas"
        subtitle={`${items.length} empresa(s) cadastrada(s)`}
        actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Nova Empresa</button>}
      />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="search-wrap">
            <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input className="search-input" placeholder="Buscar empresa…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} resultado(s)</div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">🏢</div><h3>Nenhuma empresa</h3><p>Clique em "Nova Empresa" para começar</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Razão Social</th><th>CNPJ</th><th>Email</th><th>Cidade / UF</th><th>Segmento</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.razaoSocial}</div>
                      {item.nomeFantasia && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.nomeFantasia}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.cnpj}</td>
                    <td style={{ color: 'var(--text2)' }}>{item.email}</td>
                    <td style={{ color: 'var(--text2)' }}>{item.cidade ? `${item.cidade} / ${item.estado}` : '—'}</td>
                    <td>{item.segmento ? <span className="badge badge-info">{item.segmento}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                    <td><span className={`badge ${item.ativo ? 'badge-active' : 'badge-inactive'}`}>{item.ativo ? 'Ativa' : 'Inativa'}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)} title="Editar"><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Empresa' : 'Nova Empresa'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Razão Social *</label>
                  <input className={`form-input${errors.razaoSocial ? ' error' : ''}`} value={form.razaoSocial} onChange={e => setField('razaoSocial', e.target.value)} placeholder="Nome LTDA" />
                  {errors.razaoSocial && <div className="field-error">{errors.razaoSocial}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <input className={`form-input${errors.cnpj ? ' error' : ''}`} value={form.cnpj} onChange={e => setField('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0001-00" />
                  {errors.cnpj && <div className="field-error">{errors.cnpj}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Fantasia</label>
                  <input className="form-input" value={form.nomeFantasia} onChange={e => setField('nomeFantasia', e.target.value)} placeholder="Nome Fantasia" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className={`form-input${errors.email ? ' error' : ''}`} type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="contato@empresa.com" />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-input" value={form.telefone} onChange={e => setField('telefone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label">Segmento</label>
                  <input className="form-input" value={form.segmento} onChange={e => setField('segmento', e.target.value)} placeholder="Ex: Tecnologia" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-input" value={form.endereco} onChange={e => setField('endereco', e.target.value)} placeholder="Rua, número, bairro" />
              </div>
              <div className="form-row3">
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" value={form.cidade} onChange={e => setField('cidade', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={form.estado} onChange={e => setField('estado', e.target.value)}>
                    <option value="">—</option>
                    {UFS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <input className="form-input" value={form.cep} onChange={e => setField('cep', formatCEP(e.target.value))} placeholder="00000-000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.ativo ? 'true' : 'false'} onChange={e => setField('ativo', e.target.value === 'true')}>
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
