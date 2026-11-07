/**
 * Global Date Formatting Utilities for Ecommerce Back-Office & Storefront
 * Standard: Day/Month/Year (DD/MM/YYYY)
 * Standard Time: 12-Hour format with AM/PM (hh:mm A)
 */

export function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value;
    return new Date(y, m - 1, d, h, min, s);
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(value).trim();
  if (!str || str === '-') return null;

  // Handle DD/MM/YYYY or DD/MM/YYYY, hh:mm A or DD/MM/YYYY hh:mm A
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    let hour = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
    const minute = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
    const second = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
    const ampm = ddmmyyyyMatch[7]?.toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const d = new Date(year, month, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle YYYY-MM-DD or YYYY-MM-DD hh:mm a
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    let hour = yyyymmddMatch[4] ? parseInt(yyyymmddMatch[4], 10) : 0;
    const minute = yyyymmddMatch[5] ? parseInt(yyyymmddMatch[5], 10) : 0;
    const second = yyyymmddMatch[6] ? parseInt(yyyymmddMatch[6], 10) : 0;
    const ampm = yyyymmddMatch[7]?.toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const d = new Date(year, month, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date as Day/Month/Year (DD/MM/YYYY)
 * Example: "04/11/2026"
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date and time as Day/Month/Year with 12-hour AM/PM (DD/MM/YYYY, hh:mm A)
 * Example: "04/11/2026, 08:30 AM"
 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Format time only with AM/PM (hh:mm A)
 * Example: "08:30 AM"
 */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '-';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Format date for export filenames (DD-MM-YYYY)
 * Example: "04-11-2026"
 */
export function formatDateForFilename(value?: string | number | Date | null): string {
  const d = parseDate(value ?? new Date());
  if (!d) return 'report';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format relative time elapsed (e.g. "Just now", "5m ago", "2h ago", "3d ago")
 * Accurately parses DD/MM/YYYY hh:mm A, ISO timestamps, and array date formats
 */
export function formatTimeAgo(value?: any): string {
  if (!value) return 'Just now';
  try {
    const d = parseDate(value);
    if (!d) return 'Recently';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff <= 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / (86400 * 30))}mo ago`;
  } catch {
    return 'Recently';
  }
}
