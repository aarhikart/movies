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

/**
 * Detects if an item is Hindi / Bollywood content based on language code,
 * industry, category, genre, or title.
 */
export function isHindiOrBollywood(item: any): boolean {
  if (!item) return false;
  const lang = (item.languageCode || '').toUpperCase();
  if (lang === 'HI' || lang === 'HIN') return true;

  const ind = (item.industry || '').toLowerCase();
  if (ind === 'bollywood' || ind.includes('bollywood') || ind.includes('hindi')) return true;

  const cat = (item.category || '').toLowerCase();
  if (cat.includes('hindi') || cat.includes('bollywood')) return true;

  const title = (item.title || '').toLowerCase();
  if (title.includes('hindi') || title.includes('bollywood')) return true;

  const genre = (item.genre || '').toLowerCase();
  if (genre.includes('hindi') || genre.includes('bollywood')) return true;

  return false;
}

/**
 * Universal catalog sorting function for all tabs:
 * 1. Current month data first (e.g. September 2026)
 * 2. Last month data second (e.g. August 2026)
 * 3. Previous months of current year (July 2026, June 2026... descending)
 * 4. Future announced releases of current year (Oct 2026, Nov 2026, Dec 2026)
 * 5. Older years (2025, 2024, 2023... descending)
 * 6. Within each group/month: Hindi & Bollywood data is prioritized FIRST!
 */
export function compareCatalogItems(
  a: any,
  b: any,
  getDateFn: (item: any) => string = (m) => m.releaseDate
): number {
  const tsA = parseDateToTimestamp(getDateFn(a), a.title);
  const tsB = parseDateToTimestamp(getDateFn(b), b.title);

  const dA = tsA ? new Date(tsA) : null;
  const dB = tsB ? new Date(tsB) : null;

  const yA = dA ? dA.getFullYear() : 0;
  const mA = dA ? dA.getMonth() : -1;

  const yB = dB ? dB.getFullYear() : 0;
  const mB = dB ? dB.getMonth() : -1;

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const isUpcoming = (ts: number, y: number, m: number): boolean => {
    if (!ts) return false;
    if (ts > endOfToday) return true;
    if (y > currentYear) return true;
    if (y === currentYear && m > currentMonth) return true;
    return false;
  };

  const isUpA = isUpcoming(tsA, yA, mA);
  const isUpB = isUpcoming(tsB, yB, mB);

  const getTier = (year: number, month: number, isUp: boolean): number => {
    // 1. Current month already-released content (e.g. Sep 2026 <= today)
    if (!isUp && year === currentYear && month === currentMonth) return 1;

    // 2. Last month already-released content (e.g. Aug 2026)
    if (!isUp && year === lastMonthYear && month === lastMonth) return 2;

    // 3. Earlier months of current year (e.g. Jul 2026, Jun 2026... Jan 2026)
    if (!isUp && year === currentYear && month < lastMonth) return 3;

    // 4. Previous years (e.g. 2025, 2024, 2023... descending)
    if (!isUp && year > 0 && year < currentYear) return 4;

    // 5. Upcoming / Future releases (dates after today, October 2026, November 2026, 2027...)
    // Placed at the very end so they NEVER appear in starting!
    if (isUp) return 5;

    // 6. Undated or unknown
    return 6;
  };

  const tierA = getTier(yA, mA, isUpA);
  const tierB = getTier(yB, mB, isUpB);

  // 1. Prioritize by tier (Current month released first, then Last month released, etc.)
  if (tierA !== tierB) {
    return tierA - tierB;
  }

  // 2. Chronological within Tier 3 (earlier months of 2026) or Tier 4 (earlier years)
  if (tierA === 3) {
    if (mA !== mB) return mB - mA;
  } else if (tierA === 4) {
    if (yA !== yB) return yB - yA;
    if (mA !== mB) return mB - mA;
  } else if (tierA === 5) {
    if (tsA !== tsB) return tsA - tsB; // Soonest upcoming first
  }

  // 3. Within the current month or month group: Hindi / Bollywood content first!
  const hiA = isHindiOrBollywood(a) ? 1 : 0;
  const hiB = isHindiOrBollywood(b) ? 1 : 0;
  if (hiA !== hiB) {
    return hiB - hiA;
  }

  // 4. Within same language priority: newest day first
  if (tsA !== tsB) {
    return tsB - tsA;
  }

  return 0;
}
