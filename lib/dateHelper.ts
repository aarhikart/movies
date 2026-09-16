const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Robust date parser for all movie & series date formats across the platform.
 * Returns millisecond timestamp for chronological sorting.
 */
export function parseDateToTimestamp(dateStr?: string, title: string = ""): number {
  if (!dateStr || typeof dateStr !== "string") {
    const yMatch = title.match(/\b(20\d\d|19\d\d)\b/);
    if (yMatch) return new Date(parseInt(yMatch[1], 10), 0, 1).getTime();
    return 0;
  }
  let clean = dateStr.replace(/\(.*?\)/g, "").trim();

  // Correct typos like 20019 using title year
  const titleYMatch = title.match(/\b(20\d\d|19\d\d)\b/);
  if (titleYMatch && clean.match(/\b20\d{3,}\b/)) {
    clean = clean.replace(/\b20\d{3,}\b/, titleYMatch[1]);
  }

  // Direct Date.parse for standard ISO or RFC formats
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const y = new Date(parsed).getFullYear();
    if (y > 2030 || y < 1950) {
      if (titleYMatch) return new Date(parseInt(titleYMatch[1], 10), 0, 1).getTime();
    }
    return parsed;
  }

  // "10 Jul 2026" or "09 Sep 2026"
  const dmyMatch = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const p = Date.parse(`${dmyMatch[2]} ${dmyMatch[1]}, ${dmyMatch[3]}`);
    if (!isNaN(p)) return p;
  }

  // "September 11, 2026"
  const mdyMatch = clean.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const p = Date.parse(`${mdyMatch[1]} ${mdyMatch[2]}, ${mdyMatch[3]}`);
    if (!isNaN(p)) return p;
  }

  // Fallback to year only
  const yMatch = clean.match(/\b(20\d\d|19\d\d)\b/) || titleYMatch;
  if (yMatch) {
    return new Date(parseInt(yMatch[1], 10), 0, 1).getTime();
  }

  return 0;
}

/**
 * Returns formatted release month and year: e.g. "Sep 2026", "Aug 2026", "Jul 2026", "2025"
 */
export function formatReleaseMonth(dateStr?: string, title: string = ""): string {
  const ts = parseDateToTimestamp(dateStr, title);
  if (!ts) {
    const yMatch = title.match(/\b(20\d\d|19\d\d)\b/);
    return yMatch ? yMatch[1] : "";
  }
  const d = new Date(ts);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Extracts 4-digit release year: e.g. "2026", "2025", "2024"
 */
export function getYearFromDate(dateStr?: string, title: string = ""): string {
  const ts = parseDateToTimestamp(dateStr, title);
  if (ts) {
    return String(new Date(ts).getFullYear());
  }
  const yMatch = title.match(/\b(20\d\d|19\d\d)\b/);
  return yMatch ? yMatch[1] : "";
}
