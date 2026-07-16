/** Display dates as MM/DD/YYYY. Storage/API values stay YYYY-MM-DD. */

export function formatDate(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${mm}/${dd}/${yyyy}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return fallback;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function formatDateTime(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  const raw = String(value).trim();
  const datePart = formatDate(raw, null);
  if (!datePart) return fallback;

  let d;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) {
    d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw.slice(0, 10))) {
    return datePart;
  } else {
    d = new Date(raw);
  }
  if (Number.isNaN(d.getTime())) return datePart;

  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${min}`;
}
