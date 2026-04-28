export default function MiniBar({ value, max, color = 'var(--primary)' }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 4) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99,
        background: 'var(--border)',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          borderRadius: 99, background: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: 'var(--text2)',
        minWidth: 28, textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
