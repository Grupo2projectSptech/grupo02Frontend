import { useRef, useState } from 'react';
import { BarChart2, TrendingUp, Package, Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import MiniBar from './MiniBar';

// Paleta alinhada à paleta do projeto (primary, info, success, warning, accent)
const COLORS = [
  'var(--primary)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--accent)',
];

export default function ReportPanel({ fornecedores, allProdutos }) {
  const reportRef = useRef(null);
  const [filterForn, setFilterForn] = useState('');
  const [sortBy, setSortBy] = useState('estoque');

  const now = new Date().toLocaleString('pt-BR');

  // ── Dados por fornecedor ────────────────────────────────────────────────────
  const rows = fornecedores.map(f => {
    const prods = allProdutos.filter(
      p => p.fornecedor?.id === f.id || p.fornecedor?.nome === f.nome
    );
    const totalEstoque = prods.reduce((a, p) => a + (p.estoque || 0), 0);
    const valorTotal   = prods.reduce((a, p) => a + ((p.estoque || 0) * parseFloat(p.preco || 0)), 0);
    return { fornecedor: f, prods, totalEstoque, valorTotal };
  }).filter(r => r.prods.length > 0);

  const filtered = filterForn
    ? rows.filter(r => r.fornecedor.id === parseInt(filterForn))
    : rows;

  // ── Top 10 produtos ordenados ───────────────────────────────────────────────
  const allLinked = allProdutos
    .filter(p => p.fornecedor)
    .map(p => ({ ...p, fornNome: p.fornecedor?.nome || '—' }));

  const sorted = [...allLinked].sort((a, b) => {
    if (sortBy === 'estoque') return (b.estoque || 0) - (a.estoque || 0);
    if (sortBy === 'preco')   return parseFloat(b.preco || 0) - parseFloat(a.preco || 0);
    return a.nome.localeCompare(b.nome);
  }).slice(0, 10);

  const maxEstoque = Math.max(...sorted.map(p => p.estoque || 0), 1);

  // ── Impressão ───────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Relatório de Fornecedores — Outlet Party</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', sans-serif;
              padding: 36px;
              color: #14213D;
              font-size: 13px;
              background: #fff;
            }
            .header { margin-bottom: 28px; border-bottom: 3px solid #FCA311; padding-bottom: 14px; }
            .header h1 { font-size: 22px; font-weight: 800; color: #14213D; }
            .header .sub { font-size: 12px; color: #666; margin-top: 4px; }
            .section-title {
              font-size: 14px; font-weight: 700;
              margin: 24px 0 10px;
              padding-left: 10px;
              border-left: 3px solid #FCA311;
              color: #14213D;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            thead th {
              background: #14213D; color: #fff;
              padding: 8px 12px; text-align: left;
              font-size: 11.5px; font-weight: 700;
            }
            tbody td { padding: 7px 12px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
            tbody tr:nth-child(even) td { background: #f8f8fb; }
            .forn-header {
              display: flex; justify-content: space-between;
              background: #f0f0f7; padding: 8px 12px;
              border-left: 3px solid #FCA311;
              border-radius: 4px; margin-bottom: 6px;
              font-size: 12.5px;
            }
            .forn-header strong { font-weight: 700; color: #14213D; }
            .badge {
              display: inline-block; padding: 2px 8px;
              border-radius: 99px; font-size: 10.5px; font-weight: 700;
            }
            .badge-ok   { background: #d1fae5; color: #065f46; }
            .badge-warn { background: #fef3c7; color: #92400e; }
            .badge-zero { background: #fee2e2; color: #991b1b; }
            .rank-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
            .rank-num {
              width: 22px; height: 22px; border-radius: 50%;
              background: #FCA311; color: #fff;
              font-size: 11px; font-weight: 800;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .rank-bar-wrap { flex: 1; height: 6px; background: #e5e5e5; border-radius: 99px; overflow: hidden; }
            .rank-bar { height: 100%; background: #FCA311; border-radius: 99px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛍️ Outlet Party — Relatório de Fornecedores</h1>
            <div class="sub">Emitido em ${now}</div>
          </div>

          <div class="section-title">Top 10 Produtos por Estoque</div>
          ${sorted.map((p, i) => {
            const pct = Math.round(((p.estoque || 0) / maxEstoque) * 100);
            return `
              <div class="rank-row">
                <div class="rank-num">${i + 1}</div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:12.5px">${p.nome}</div>
                  <div style="font-size:11px;color:#666">${p.fornNome} · ${p.categoria || 'Sem categoria'}</div>
                  <div class="rank-bar-wrap" style="margin-top:4px">
                    <div class="rank-bar" style="width:${pct}%"></div>
                  </div>
                </div>
                <div style="text-align:right;min-width:120px">
                  <div style="font-size:11px;color:#666">Estoque: <strong>${p.estoque || 0}</strong></div>
                  <div style="font-size:11px;color:#666">Valor: <strong>${formatCurrency((p.estoque || 0) * parseFloat(p.preco || 0))}</strong></div>
                </div>
              </div>
            `;
          }).join('')}

          <div class="section-title" style="margin-top:32px">Detalhamento por Fornecedor</div>
          ${filtered.map(({ fornecedor, prods, totalEstoque, valorTotal }) => `
            <div class="forn-header">
              <strong>${fornecedor.nome}</strong>
              <span>${prods.length} produto(s) · Estoque: ${totalEstoque} · Valor: ${formatCurrency(valorTotal)}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Produto</th><th>Código</th><th>Categoria</th>
                  <th>Preço Unit.</th><th>Estoque</th><th>Valor Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${prods.map(p => `
                  <tr>
                    <td><strong>${p.nome}</strong></td>
                    <td style="font-family:monospace">${p.codigoInterno || '—'}</td>
                    <td>${p.categoria || '—'}</td>
                    <td><strong>${formatCurrency(p.preco)}</strong></td>
                    <td><strong>${p.estoque || 0} ${p.unidade || 'UN'}</strong></td>
                    <td>${formatCurrency((p.estoque || 0) * parseFloat(p.preco || 0))}</td>
                    <td>
                      <span class="badge ${p.estoque === 0 ? 'badge-zero' : p.ativo ? 'badge-ok' : 'badge-warn'}">
                        ${p.estoque === 0 ? 'Zerado' : p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="card" style={{ marginTop: 20 }}>
      {/* Cabeçalho do painel */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
        flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} color="var(--primary)" />
            <span style={{
              fontWeight: 700, fontSize: 15,
              fontFamily: 'Bricolage Grotesque, sans-serif',
              color: 'var(--text)',
            }}>
              Relatório de Produtos por Fornecedor
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            Gerado em {now}
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ fontSize: 12.5, padding: '7px 10px', minWidth: 190 }}
            value={filterForn}
            onChange={e => setFilterForn(e.target.value)}
          >
            <option value="">Todos os fornecedores</option>
            {fornecedores.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ fontSize: 12.5, padding: '7px 10px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="estoque">Ranking: Maior estoque</option>
            <option value="preco">Ranking: Maior preço</option>
            <option value="nome">Ranking: Nome A-Z</option>
          </select>

          <button
            className="btn btn-primary"
            style={{ fontSize: 12.5, gap: 6 }}
            onClick={handlePrint}
          >
            <Printer size={14} /> Emitir Relatório
          </button>
        </div>
      </div>

      {/* Divisor com accent */}
      <div style={{ height: 2, background: 'var(--primary)', borderRadius: 99, marginBottom: 20, opacity: 0.35 }} />

      {/* ── Ranking visual ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text)',
          fontFamily: 'Bricolage Grotesque, sans-serif',
        }}>
          <TrendingUp size={14} color="var(--primary)" />
          Top 10 Produtos com Maior Estoque
        </div>

        {sorted.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>
            Nenhum produto vinculado a fornecedores.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr 110px 140px',
                gap: 12, alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
              }}>
                {/* Posição */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i < 3 ? 'var(--primary)' : 'var(--bg4)',
                  color: i < 3 ? '#fff' : 'var(--text3)',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>

                {/* Info + barra */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{p.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>
                    {p.fornNome} · {p.categoria || 'Sem categoria'}
                  </div>
                  <MiniBar value={p.estoque || 0} max={maxEstoque} color={COLORS[i % COLORS.length]} />
                </div>

                {/* Preço */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Preço unit.</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>
                    {formatCurrency(p.preco)}
                  </div>
                </div>

                {/* Valor total */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Valor em estoque</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {formatCurrency((p.estoque || 0) * parseFloat(p.preco || 0))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divisor */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0' }} />

      {/* ── Detalhamento por fornecedor ─────────────────────────────────────── */}
      <div style={{
        fontSize: 13, fontWeight: 700, marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'var(--text)',
        fontFamily: 'Bricolage Grotesque, sans-serif',
      }}>
        <Package size={14} color="var(--info)" />
        Detalhamento por Fornecedor
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>
          Nenhum dado disponível para o filtro selecionado.
        </div>
      ) : (
        filtered.map(({ fornecedor, prods, totalEstoque, valorTotal }) => (
          <div key={fornecedor.id} style={{ marginBottom: 24 }}>
            {/* Header do fornecedor */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 14px', borderRadius: 8,
              background: 'var(--bg2)',
              borderLeft: '3px solid var(--primary)',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>
                  {fornecedor.nome}
                </span>
                {fornecedor.categoria && (
                  <span className="badge badge-orange" style={{ fontSize: 11 }}>
                    {fornecedor.categoria}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text2)' }}>
                <span>{prods.length} produto(s)</span>
                <span>Estoque: <strong style={{ color: 'var(--text)' }}>{totalEstoque}</strong></span>
                <span>Valor: <strong style={{ color: 'var(--success)' }}>{formatCurrency(valorTotal)}</strong></span>
              </div>
            </div>

            {/* Tabela de produtos */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Preço Unit.</th>
                    <th>Estoque</th>
                    <th>Valor Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prods.map(p => (
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
          </div>
        ))
      )}
    </div>
  );
}
