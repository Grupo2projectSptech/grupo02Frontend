import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { produtoService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function FornecedorRow({ item, onEdit, onDelete, allProdutos }) {
  const [expanded, setExpanded] = useState(false);
  const [produtos, setProdutos] = useState(null);
  const [loadingProds, setLoadingProds] = useState(false);

const toggle = async () => {
  if (!expanded && produtos === null) {
    setLoadingProds(true);
    try {
      const linked = allProdutos
        ? allProdutos.filter(p =>
            p.fornecedor?.id === item.id ||
            p.fornecedor?.nome === item.nome
          )
        : []; // ✅ fallback seguro — sem método inexistente
      setProdutos(linked);
    } catch {
      setProdutos([]);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoadingProds(false);
    }
  }
  setExpanded(e => !e);
};

  const totalEstoque = produtos?.reduce((a, p) => a + (p.estoque || 0), 0) ?? null;

  return (
    <>
      <tr>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={toggle}
              title={expanded ? 'Recolher produtos' : 'Ver produtos vinculados'}
              style={{ color: expanded ? 'var(--primary)' : 'var(--text3)' }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <strong style={{ color: 'var(--text)' }}>{item.nome}</strong>
          </div>
        </td>
        <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text2)' }}>
          {item.cnpj || '—'}
        </td>
        <td style={{ color: 'var(--text2)' }}>{item.contato || '—'}</td>
        <td style={{ color: 'var(--text2)' }}>{item.telefone || '—'}</td>
        <td>
          {item.categoria
            ? <span className="badge badge-orange">{item.categoria}</span>
            : <span style={{ color: 'var(--text3)' }}>—</span>}
        </td>
        <td style={{ color: 'var(--text2)' }}>
          {item.cidade ? `${item.cidade} / ${item.estado}` : '—'}
        </td>
        <td>
          <span className={`badge ${item.ativo ? 'badge-active' : 'badge-inactive'}`}>
            {item.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div className="row-actions">
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(item)} title="Editar">
              <Pencil size={14} />
            </button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(item.id)} title="Excluir">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{
              padding: '14px 20px 18px',
              background: 'var(--bg2)',
              borderTop: '2px solid var(--primary)',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Sub-header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Package size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  Produtos vinculados a <em>{item.nome}</em>
                </span>
                {totalEstoque !== null && (
                  <span className="badge badge-info" style={{ fontSize: 11 }}>
                    Estoque total: {totalEstoque}
                  </span>
                )}
              </div>

              {loadingProds ? (
                <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>
                  Carregando produtos…
                </div>
              ) : !produtos || produtos.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} />
                  Nenhum produto vinculado a este fornecedor.
                </div>
              ) : (
                <div className="table-wrap" style={{ marginBottom: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Código</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Valor em Estoque</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.nome}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text3)' }}>
                            {p.codigoInterno || '—'}
                          </td>
                          <td>
                            {p.categoria
                              ? <span className="badge badge-info" style={{ fontSize: 11 }}>{p.categoria}</span>
                              : <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                            {formatCurrency(p.preco)}
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: p.estoque === 0
                                ? 'var(--danger)'
                                : p.estoque <= 5
                                  ? 'var(--warning)'
                                  : 'var(--text)',
                            }}>
                              {p.estoque || 0} {p.unidade || 'UN'}
                            </span>
                            {p.estoque === 0 && (
                              <span className="badge badge-inactive" style={{ marginLeft: 6, fontSize: 10 }}>
                                Zerado
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text2)' }}>
                            {formatCurrency((p.estoque || 0) * parseFloat(p.preco || 0))}
                          </td>
                          <td>
                            <span className={`badge ${p.ativo ? 'badge-active' : 'badge-inactive'}`}>
                              {p.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
