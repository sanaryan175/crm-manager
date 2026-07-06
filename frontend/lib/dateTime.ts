export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
export type TimeFormat = '12h' | '24h';

export function formatDateTime(
  date: Date | string | null | undefined,
  timezone: string,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
  includeTime = true,
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;

  const tz = { timeZone: timezone };

  const dateParts = new Intl.DateTimeFormat('en-CA', {
    ...tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = dateParts.find(p => p.type === 'year')?.value ?? '';
  const month = dateParts.find(p => p.type === 'month')?.value ?? '';
  const day = dateParts.find(p => p.type === 'day')?.value ?? '';

  let dateStr: string;
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      dateStr = `${day}/${month}/${year}`;
      break;
    case 'MM/DD/YYYY':
      dateStr = `${month}/${day}/${year}`;
      break;
    default:
      dateStr = `${year}-${month}-${day}`;
  }

  if (!includeTime) return dateStr;

  const timeStr = d.toLocaleTimeString('en-CA', {
    ...tz,
    hour: timeFormat === '24h' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });

  return `${dateStr}, ${timeStr}`;
}
