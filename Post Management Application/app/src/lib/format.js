/**
 * Formats an ISO date string for display, e.g. "4 Oct 2026".
 * Returns an empty string for missing/invalid input so callers can inline it.
 */
export function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human-readable relative time, e.g. "3 hours ago". */
export function formatRelative(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const [unit, secondsPerUnit] of units) {
    const amount = Math.round(seconds / secondsPerUnit);
    if (Math.abs(amount) >= 1) return formatter.format(-amount, unit);
  }

  return 'just now';
}

/** Truncates text on a word boundary and appends an ellipsis. */
export function truncate(text, maxLength = 180) {
  if (typeof text !== 'string' || text.length <= maxLength) return text ?? '';

  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}
