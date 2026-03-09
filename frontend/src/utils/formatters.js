// ─── Outlet Party — Formatters ───────────────────────────────────────────────

export const formatCNPJ = (value) => {
  const raw = value.replace(/\D/g, '').slice(0, 14);
  return raw
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatPhone = (value) => {
  const raw = value.replace(/\D/g, '').slice(0, 11);
  if (raw.length <= 10)
    return raw.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return raw.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};

export const formatCEP = (value) => {
  const raw = value.replace(/\D/g, '').slice(0, 8);
  return raw.replace(/^(\d{5})(\d)/, '$1-$2');
};

export const formatCurrency = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR');

export const formatNumber = (n) =>
  Number(n).toLocaleString('pt-BR');
