const WEEKDAYS = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
const MONTHS = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];

export function dateParts(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    weekday: WEEKDAYS[date.getDay()],
    day: String(date.getDate()).padStart(2, '0'),
    month: MONTHS[date.getMonth()],
  };
}

export function formatDayMonth(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

export function formatTimeRange(start: string | null, end: string | null) {
  if (!start || !end) return '—';
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

export function formatEuro(cents: number) {
  return `${(cents / 100).toLocaleString('de-DE')} €`;
}

export function euroToCents(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function formatDateLong(isoDate: string) {
  const { weekday, day } = dateParts(isoDate);
  const date = new Date(`${isoDate}T00:00:00`);
  const monthNum = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday} ${day}.${monthNum}.${date.getFullYear()}`;
}

export function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
  return String(value);
}

export function formatDelta(current: number, previous: number) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((new Date(`${toIso}T00:00:00`).getTime() - new Date(`${fromIso}T00:00:00`).getTime()) / 86400000);
}

const WINDOW_BUCKETS = [7, 30, 90] as const;

export function windowBucket(periodStart: string, periodEnd: string): (typeof WINDOW_BUCKETS)[number] {
  const span = daysBetween(periodStart, periodEnd) + 1;
  return WINDOW_BUCKETS.reduce((closest, bucket) => (Math.abs(bucket - span) < Math.abs(closest - span) ? bucket : closest));
}

export function formatDueLabel(dueDate: string | null) {
  if (!dueDate) return '—';
  const today = new Date().toISOString().slice(0, 10);
  return dueDate === today ? 'HEUTE' : formatDayMonth(dueDate);
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function toDatetimeLocal(isoDateTime: string | null) {
  if (!isoDateTime) return '';
  const date = new Date(isoDateTime);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatPostTime(isoDateTime: string) {
  const date = new Date(isoDateTime);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const key = dateKey(date);
  if (key === dateKey(today)) return `HEUTE · ${time}`;
  if (key === dateKey(tomorrow)) return `MORGEN · ${time}`;
  return `${WEEKDAYS[date.getDay()]} · ${time}`;
}
