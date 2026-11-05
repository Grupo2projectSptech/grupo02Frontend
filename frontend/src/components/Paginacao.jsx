import { ChevronLeft, ChevronRight } from 'lucide-react';

// page é 0-based. Mostra "x–y de total", seletor de tamanho e botões de página.
export default function Paginacao({ page, pageSize, total, onPage, onSize, sizes = [10, 25, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cur   = Math.min(page, totalPages - 1);
  const from  = total === 0 ? 0 : cur * pageSize + 1;
  const to    = Math.min((cur + 1) * pageSize, total);

  // janela de até 5 botões em volta da página atual
  const start = Math.max(0, Math.min(cur - 2, totalPages - 5));
  const nums  = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 10, marginTop: 16, fontSize: 13, color: 'var(--text3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Mostrando {from}–{to} de {total}</span>
        <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
          value={pageSize} onChange={e => onSize(parseInt(e.target.value))}>
          {sizes.map(s => <option key={s} value={s}>{s} / página</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="btn btn-ghost btn-sm btn-icon" disabled={cur === 0}
          onClick={() => onPage(cur - 1)} title="Anterior"><ChevronLeft size={14} /></button>
        {nums.map(n => (
          <button key={n} onClick={() => onPage(n)}
            className={`btn btn-sm ${n === cur ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minWidth: 30, fontSize: 12 }}>{n + 1}</button>
        ))}
        <button className="btn btn-ghost btn-sm btn-icon" disabled={cur >= totalPages - 1}
          onClick={() => onPage(cur + 1)} title="Próxima"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
