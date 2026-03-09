// ─── Outlet Party — Validators ───────────────────────────────────────────────

export const validators = {
  required: (value, label = 'Campo') => {
    if (!value || String(value).trim() === '') return `${label} é obrigatório`;
    return null;
  },

  cnpj: (value) => {
    if (!value) return 'CNPJ é obrigatório';
    const raw = value.replace(/\D/g, '');
    if (raw.length !== 14) return 'CNPJ deve ter 14 dígitos';
    if (/^(\d)\1+$/.test(raw)) return 'CNPJ inválido';
    const calc = (digits, len) => {
      let sum = 0, pos = len - 7;
      for (let i = len; i >= 1; i--) {
        sum += digits.charAt(len - i) * pos--;
        if (pos < 2) pos = 9;
      }
      return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    };
    if (calc(raw, 12) !== parseInt(raw.charAt(12))) return 'CNPJ inválido';
    if (calc(raw, 13) !== parseInt(raw.charAt(13))) return 'CNPJ inválido';
    return null;
  },

  email: (value) => {
    if (!value) return 'Email é obrigatório';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Email inválido';
    return null;
  },

  minLength: (value, min, label = 'Campo') => {
    if (!value || value.length < min) return `${label} deve ter ao menos ${min} caracteres`;
    return null;
  },

  positiveNumber: (value, label = 'Valor') => {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) return `${label} deve ser um número positivo`;
    return null;
  },

  nonNegativeInt: (value, label = 'Quantidade') => {
    const n = parseInt(value);
    if (isNaN(n) || n < 0) return `${label} não pode ser negativo`;
    return null;
  },

  phone: (value) => {
    if (!value) return null; // optional
    const raw = value.replace(/\D/g, '');
    if (raw.length < 10 || raw.length > 11) return 'Telefone inválido (DDD + número)';
    return null;
  },

  cep: (value) => {
    if (!value) return null;
    const raw = value.replace(/\D/g, '');
    if (raw.length !== 8) return 'CEP deve ter 8 dígitos';
    return null;
  },

  password: (value) => {
    if (!value) return 'Senha é obrigatória';
    if (value.length < 6) return 'Senha deve ter ao menos 6 caracteres';
    return null;
  },
};

// Run multiple validators and return first error
export function validate(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

// Validate an entire form object: { field: [validators] }
export function validateForm(data, schema) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const error = validate(data[field], rules);
    if (error) errors[field] = error;
  }
  return errors; // empty = valid
}
