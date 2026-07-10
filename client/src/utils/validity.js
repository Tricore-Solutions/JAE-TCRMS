export const VALIDITY_OPTIONS = [
  { id: '14d', label: '2 weeks', days: 14, months: null },
  { id: '1m', label: '1 month', days: null, months: 1 },
  { id: '1.5m', label: '1.5 months', days: null, months: 1.5 },
  { id: '2m', label: '2 months', days: null, months: 2 },
  { id: '3m', label: '3 months', days: null, months: 3 },
  { id: '6m', label: '6 months', days: null, months: 6 },
  { id: '12m', label: '12 months (1 year)', days: null, months: 12 },
];

export const DEFAULT_VALIDITY_OPTION = '12m';

export function recordToValidityOption(record) {
  if (!record) return DEFAULT_VALIDITY_OPTION;
  if (Number(record.validity_days) === 14) return '14d';
  if (record.validity_months != null && Number(record.validity_months) > 0) {
    const months = Number(record.validity_months);
    const match = VALIDITY_OPTIONS.find(o => o.months === months);
    if (match) return match.id;
    return `legacy-${months}`;
  }
  return DEFAULT_VALIDITY_OPTION;
}

export function getValidityOptionsForForm(record) {
  const options = [...VALIDITY_OPTIONS];
  if (record) {
    const current = recordToValidityOption(record);
    if (current.startsWith('legacy-')) {
      const months = Number(current.replace('legacy-', ''));
      options.push({
        id: current,
        label: `${months} months (legacy)`,
        days: null,
        months,
      });
    }
  }
  return options;
}

export function formatValidityLabel(record) {
  if (!record) return '—';
  if (Number(record.validity_months) === 0 && !record.validity_days) return 'No expiry';
  const optionId = recordToValidityOption(record);
  const option = VALIDITY_OPTIONS.find(o => o.id === optionId);
  if (option) return option.label;
  if (optionId.startsWith('legacy-')) {
    return `${optionId.replace('legacy-', '')} months`;
  }
  if (record.validity_days) return `${record.validity_days} days`;
  if (record.validity_months != null) return `${record.validity_months} months`;
  return '—';
}

export function validityOptionToPayload(optionId) {
  const option = VALIDITY_OPTIONS.find(o => o.id === optionId)
    || (optionId?.startsWith('legacy-')
      ? { months: Number(optionId.replace('legacy-', '')), days: null }
      : null);
  if (!option) {
    return { validity_months: 12, validity_days: null };
  }
  return {
    validity_months: option.months,
    validity_days: option.days,
  };
}

export function calcExpirationPreview(trainingDate, optionId) {
  if (!trainingDate || !optionId) return null;
  const option = VALIDITY_OPTIONS.find(o => o.id === optionId)
    || (optionId?.startsWith('legacy-')
      ? { months: Number(optionId.replace('legacy-', '')), days: null }
      : null);
  if (!option) return null;

  const d = new Date(`${trainingDate}T00:00:00`);
  if (option.days) {
    d.setDate(d.getDate() + option.days);
    return d.toISOString().split('T')[0];
  }
  if (option.months) {
    const whole = Math.floor(option.months);
    const frac = option.months - whole;
    d.setMonth(d.getMonth() + whole);
    if (frac) {
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(d.getDate() + Math.round(daysInMonth * frac));
    }
    return d.toISOString().split('T')[0];
  }
  return null;
}

export function getValidityPreviewLabel(optionId) {
  const option = VALIDITY_OPTIONS.find(o => o.id === optionId)
    || (optionId?.startsWith('legacy-')
      ? { label: `${optionId.replace('legacy-', '')} months` }
      : null);
  return option?.label || '';
}
