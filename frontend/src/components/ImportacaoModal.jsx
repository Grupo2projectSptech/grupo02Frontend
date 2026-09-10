import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, Download, CheckCircle, AlertTriangle, FileSpreadsheet, Loader } from 'lucide-react';
import { vendaService, produtoService, fornecedorService } from '../services/api';
import toast from 'react-hot-toast';

// ─── Mapeamento de colunas por entidade ──────────────────
// Aceita variações de nomes de coluna que o usuário pode usar na planilha
const MAPEAMENTO = {
  venda: {
    label: 'Vendas',
    icon: '💰',
    colunas: {
      data:         ['data', 'date', 'data venda', 'data da venda'],
      nomeProduto:  ['produto', 'nome produto', 'nomeproduto', 'item', 'nome do produto'],
      tipo:         ['tipo', 'plataforma', 'canal', 'marketplace'],
      quantidade:   ['quantidade', 'qtd', 'qty', 'qtde'],
      valorVenda:   ['valor venda', 'valor', 'preço venda', 'preco venda', 'venda', 'receita'],
      custoUnidade: ['custo unidade', 'custo unit', 'custo unitário', 'custo/un', 'custo'],
      idPedido:     ['id pedido', 'pedido', 'order id', 'id', 'numero pedido'],
      motoboy:      ['motoboy', 'entregador', 'frete motoboy'],
      freteFlex:    ['frete flex', 'frete_flex', 'freteflex'],
      freteVenda:   ['frete venda', 'frete', 'freight'],
      tarifa:       ['tarifa', 'taxa', 'fee'],
      imposto:      ['imposto', 'imposto %', '% imposto', 'tax', 'tributação'],
      operacional:  ['operacional', 'custo operacional', 'overhead'],
    },
    obrigatorios: ['nomeProduto', 'valorVenda'],
    servico: vendaService.criar,
  },
  produto: {
    label: 'Produtos',
    icon: '📦',
    colunas: {
      nome:          ['nome', 'produto', 'name', 'descrição', 'descricao'],
      preco:         ['preco', 'preço', 'price', 'valor', 'custo'],
      estoque:       ['estoque', 'quantidade', 'qtd', 'stock', 'qty'],
      categoria:     ['categoria', 'category', 'grupo', 'tipo'],
      codigoInterno: ['codigo', 'código', 'sku', 'cod', 'code', 'codigo interno', 'ref'],
      unidade:       ['unidade', 'un', 'unit', 'medida'],
      descricao:     ['descricao', 'descrição', 'description', 'obs', 'observacao'],
    },
    obrigatorios: ['nome', 'preco'],
    servico: produtoService.criar,
  },
  fornecedor: {
    label: 'Fornecedores',
    icon: '🚚',
    colunas: {
      nome:      ['nome', 'fornecedor', 'name', 'razão social', 'razao social'],
      cnpj:      ['cnpj', 'cpf', 'documento', 'doc'],
      email:     ['email', 'e-mail', 'mail'],
      telefone:  ['telefone', 'tel', 'fone', 'phone', 'celular'],
      contato:   ['contato', 'responsavel', 'responsável', 'contact'],
      categoria: ['categoria', 'tipo', 'segmento', 'category'],
      cidade:    ['cidade', 'city'],
      estado:    ['estado', 'uf', 'state'],
      endereco:  ['endereco', 'endereço', 'address', 'logradouro'],
      cep:       ['cep', 'zip', 'postal'],
    },
    obrigatorios: ['nome'],
    servico: fornecedorService.criar,
  },
};

// ─── Helpers ─────────────────────────────────────────────
function normalizarColuna(col) {
  return String(col).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mapearLinhas(rows, entidade) {
  const config = MAPEAMENTO[entidade];
  if (!rows.length) return [];

  // Pega cabeçalhos da 1ª linha
  const cabecalhos = Object.keys(rows[0]).map(h => ({
    original: h,
    normalizado: normalizarColuna(h),
  }));

  // Monta mapa: campo_sistema -> coluna_original
  const mapa = {};
  for (const [campo, aliases] of Object.entries(config.colunas)) {
    const encontrado = cabecalhos.find(h =>
      aliases.some(alias => normalizarColuna(alias) === h.normalizado)
    );
    if (encontrado) mapa[campo] = encontrado.original;
  }

  // Converte cada linha
  return rows.map((row, idx) => {
    const obj = { _linha: idx + 2, _erros: [] };
    for (const [campo, col] of Object.entries(mapa)) {
      obj[campo] = row[col] ?? '';
    }
    // Valida obrigatórios
    for (const obr of config.obrigatorios) {
      if (!obj[obr] && obj[obr] !== 0) {
        obj._erros.push(`"${obr}" é obrigatório`);
      }
    }
    return obj;
  }).filter(r => Object.keys(r).length > 3); // remove linhas completamente vazias
}

function prepararPayload(obj, entidade) {
  const { _linha, _erros, ...dados } = obj;

  if (entidade === 'venda') {
    const custoTotal   = (parseFloat(dados.custoUnidade) || 0) * (parseInt(dados.quantidade) || 0);
    const impostoValor = ((parseFloat(dados.imposto) || 0) / 100) * (parseFloat(dados.valorVenda) || 0);
    const custoCheio   = custoTotal + (parseFloat(dados.motoboy) || 0) + (parseFloat(dados.freteFlex) || 0) + impostoValor + (parseFloat(dados.operacional) || 0) + (parseFloat(dados.tarifa) || 0);
    const margem       = (parseFloat(dados.valorVenda) || 0) - custoCheio;
    const freteDiff    = (parseFloat(dados.freteVenda) || 0) - (parseFloat(dados.freteFlex) || 0);
    return {
      ...dados,
      produto:     null,
      data:        dados.data || new Date().toISOString().slice(0, 10),
      tipo:        dados.tipo || 'Manual',
      quantidade:  parseInt(dados.quantidade) || 1,
      valorVenda:  parseFloat(String(dados.valorVenda).replace(',', '.')) || 0,
      custoUnidade: parseFloat(String(dados.custoUnidade || '0').replace(',', '.')) || 0,
      imposto:     parseFloat(dados.imposto) || 0,
      motoboy:     parseFloat(String(dados.motoboy || '0').replace(',', '.')) || 0,
      freteFlex:   parseFloat(String(dados.freteFlex || '0').replace(',', '.')) || 0,
      freteVenda:  parseFloat(String(dados.freteVenda || '0').replace(',', '.')) || 0,
      tarifa:      parseFloat(String(dados.tarifa || '0').replace(',', '.')) || 0,
      operacional: parseFloat(String(dados.operacional || '0').replace(',', '.')) || 0,
      custoTotal, impostoValor, custoCheio, margem, freteDiff,
      margemPct:   dados.valorVenda ? (margem / parseFloat(dados.valorVenda)) * 100 : 0,
    };
  }

  if (entidade === 'produto') {
    return {
      ...dados,
      preco:   parseFloat(String(dados.preco).replace(',', '.')) || 0,
      estoque: parseInt(dados.estoque) || 0,
      unidade: dados.unidade || 'UN',
      ativo:   true,
      fornecedor: null,
    };
  }

  if (entidade === 'fornecedor') {
    return { ...dados, ativo: true };
  }

  return dados;
}

function gerarPlanilhaModelo(entidade) {
  const config = MAPEAMENTO[entidade];
  const colunas = Object.values(config.colunas).map(aliases => aliases[0]);

  const exemplos = {
    venda: [{
      data: '2026-06-20', produto: 'Caixa de Som', tipo: 'Shopee',
      quantidade: 2, 'valor venda': 89.90, 'custo unidade': 35.00,
      'id pedido': 'SP123456', motoboy: 5.00, 'frete flex': 8.00,
      'frete venda': 12.00, tarifa: 3.00, imposto: 12, operacional: 2.00,
    }],
    produto: [{
      nome: 'Caixa de Som Bluetooth', preco: 89.90, estoque: 50,
      categoria: 'Eletrônicos', codigo: 'CSB-001', unidade: 'UN',
      descricao: 'Caixa de som portátil com bluetooth 5.0',
    }],
    fornecedor: [{
      nome: 'Fornecedor Exemplo Ltda', cnpj: '12.345.678/0001-99',
      email: 'contato@fornecedor.com', telefone: '(11) 99999-9999',
      contato: 'João Silva', categoria: 'Eletrônicos',
      cidade: 'São Paulo', estado: 'SP',
    }],
  };

  const ws = XLSX.utils.json_to_sheet(exemplos[entidade]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.label);
  XLSX.writeFile(wb, `modelo_${entidade}.xlsx`);
}

// ─── Componente principal ─────────────────────────────────
export default function ImportacaoModal({ onClose, onSuccess }) {
  const [entidade,   setEntidade]   = useState('venda');
  const [arquivo,    setArquivo]    = useState(null);
  const [linhas,     setLinhas]     = useState([]);
  const [erros,      setErros]      = useState([]);
  const [etapa,      setEtapa]      = useState('upload'); // upload | preview | importando | resultado
  const [resultado,  setResultado]  = useState({ ok: 0, falhas: [] });
  const [dragging,   setDragging]   = useState(false);
  const inputRef = useRef(null);

  const config = MAPEAMENTO[entidade];

  // ── Leitura da planilha ───────────────────────────────
  const lerArquivo = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Formato inválido. Use .xlsx, .xls ou .csv');
      return;
    }
    setArquivo(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows.length) { toast.error('Planilha vazia!'); return; }

        const mapeadas = mapearLinhas(rows, entidade);
        const comErros = mapeadas.filter(r => r._erros.length > 0);

        setLinhas(mapeadas);
        setErros(comErros);
        setEtapa('preview');
      } catch (err) {
        toast.error('Erro ao ler a planilha. Verifique o formato.');
      }
    };
    reader.readAsBinaryString(file);
  }, [entidade]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    lerArquivo(e.dataTransfer.files[0]);
  }, [lerArquivo]);

  const resetar = () => {
    setArquivo(null); setLinhas([]); setErros([]);
    setEtapa('upload'); setResultado({ ok: 0, falhas: [] });
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Importação ────────────────────────────────────────
  const importar = async () => {
    const validas = linhas.filter(r => r._erros.length === 0);
    if (!validas.length) { toast.error('Nenhuma linha válida para importar'); return; }

    setEtapa('importando');
    let ok = 0;
    const falhas = [];

    for (const linha of validas) {
      try {
        const payload = prepararPayload(linha, entidade);
        await config.servico(payload);
        ok++;
      } catch (err) {
        falhas.push({ linha: linha._linha, erro: err.message || 'Erro desconhecido' });
      }
    }

    setResultado({ ok, falhas });
    setEtapa('resultado');
    if (ok > 0) {
      toast.success(`${ok} registro(s) importado(s) com sucesso!`);
      onSuccess?.();
    }
  };

  const linhasValidas  = linhas.filter(r => r._erros.length === 0);
  const linhasComErros = linhas.filter(r => r._erros.length > 0);

  // ─────────────────────────────────────────────────────
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={20} color="var(--primary)" />
            <h2>Importar Planilha</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Seletor de entidade */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {Object.entries(MAPEAMENTO).map(([key, cfg]) => (
            <button
              key={key}
              className={`btn btn-sm ${entidade === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setEntidade(key); resetar(); }}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>

        {/* ── ETAPA: UPLOAD ── */}
        {etapa === 'upload' && (
          <>
            {/* Zona de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'var(--primary-dim)' : 'var(--bg3)',
                transition: 'all 0.2s',
                marginBottom: 16,
              }}
            >
              <Upload size={32} color={dragging ? 'var(--primary)' : 'var(--text3)'} style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {dragging ? 'Solte aqui!' : 'Clique ou arraste sua planilha'}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>
                Formatos aceitos: .xlsx, .xls, .csv
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={e => lerArquivo(e.target.files[0])}
              />
            </div>

            {/* Colunas aceitas */}
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Colunas reconhecidas para {config.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(config.colunas).map(([campo, aliases]) => (
                  <div key={campo} style={{
                    background: config.obrigatorios.includes(campo) ? 'var(--primary-dim)' : 'var(--bg4)',
                    color: config.obrigatorios.includes(campo) ? 'var(--primary)' : 'var(--text2)',
                    borderRadius: 6, padding: '3px 8px', fontSize: 11.5, fontWeight: 600,
                  }}>
                    {aliases[0]}
                    {config.obrigatorios.includes(campo) && ' *'}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                * Obrigatório — os nomes das colunas não precisam ser exatos, o sistema reconhece variações.
              </p>
            </div>

            {/* Baixar modelo */}
            <button
              className="btn btn-ghost"
              style={{ gap: 8, fontSize: 13 }}
              onClick={() => gerarPlanilhaModelo(entidade)}
            >
              <Download size={14} />
              Baixar planilha modelo para {config.label}
            </button>
          </>
        )}

        {/* ── ETAPA: PREVIEW ── */}
        {etapa === 'preview' && (
          <>
            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--success-dim)', border: '1px solid var(--success)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} color="var(--success)" />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{linhasValidas.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--success)' }}>linha(s) válida(s)</div>
                </div>
              </div>
              <div style={{ background: linhasComErros.length ? 'var(--danger-dim)' : 'var(--bg3)', border: `1px solid ${linhasComErros.length ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color={linhasComErros.length ? 'var(--danger)' : 'var(--text3)'} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: linhasComErros.length ? 'var(--danger)' : 'var(--text3)' }}>{linhasComErros.length}</div>
                  <div style={{ fontSize: 12, color: linhasComErros.length ? 'var(--danger)' : 'var(--text3)' }}>linha(s) com erro</div>
                </div>
              </div>
            </div>

            {/* Arquivo selecionado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 14 }}>
              <FileSpreadsheet size={14} color="var(--primary)" />
              <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>{arquivo?.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={resetar} style={{ fontSize: 11 }}>Trocar</button>
            </div>

            {/* Erros */}
            {linhasComErros.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>
                  Linhas com problemas (serão ignoradas):
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--danger-dim)', borderRadius: 8, padding: '8px 12px' }}>
                  {linhasComErros.map(r => (
                    <div key={r._linha} style={{ fontSize: 12, color: 'var(--danger)', padding: '2px 0' }}>
                      Linha {r._linha}: {r._erros.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview tabela */}
            {linhasValidas.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                  Preview das primeiras linhas válidas:
                </div>
                <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(linhasValidas[0])
                          .filter(k => !k.startsWith('_'))
                          .map(k => <th key={k}>{k}</th>)
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {linhasValidas.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          {Object.entries(r)
                            .filter(([k]) => !k.startsWith('_'))
                            .map(([k, v]) => (
                              <td key={k} style={{ fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {String(v || '—')}
                              </td>
                            ))
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {linhasValidas.length > 5 && (
                    <div style={{ fontSize: 11.5, color: 'var(--text3)', textAlign: 'center', padding: 8 }}>
                      + {linhasValidas.length - 5} linha(s) não exibida(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={resetar}>Voltar</button>
              <button
                className="btn btn-primary"
                onClick={importar}
                disabled={!linhasValidas.length}
              >
                Importar {linhasValidas.length} registro(s)
              </button>
            </div>
          </>
        )}

        {/* ── ETAPA: IMPORTANDO ── */}
        {etapa === 'importando' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Loader size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Importando registros…</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6 }}>
              Isso pode levar alguns segundos dependendo da quantidade.
            </p>
          </div>
        )}

        {/* ── ETAPA: RESULTADO ── */}
        {etapa === 'resultado' && (
          <>
            <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
              {resultado.ok > 0 ? (
                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 12 }} />
              ) : (
                <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: 12 }} />
              )}
              <div style={{ fontSize: 22, fontWeight: 800, color: resultado.ok > 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                {resultado.ok} importado(s) com sucesso
              </div>
              {resultado.falhas.length > 0 && (
                <div style={{ fontSize: 14, color: 'var(--danger)', marginTop: 6 }}>
                  {resultado.falhas.length} falha(s)
                </div>
              )}
            </div>

            {resultado.falhas.length > 0 && (
              <div style={{ background: 'var(--danger-dim)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
                  Registros que falharam:
                </div>
                {resultado.falhas.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--danger)', padding: '2px 0' }}>
                    Linha {f.linha}: {f.erro}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={resetar}>Nova importação</button>
              <button className="btn btn-primary" onClick={onClose}>Fechar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
