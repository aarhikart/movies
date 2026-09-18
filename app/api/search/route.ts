import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { compareCatalogItems } from '@/lib/movieHelper';

interface CachedCatalog {
  mtime: number;
  data: any[];
}

let dubbedCache: CachedCatalog | null = null;
let originalCache: CachedCatalog | null = null;
let seriesCache: CachedCatalog | null = null;

function getDubbedMovies(): any[] {
  const filePath = path.join(process.cwd(), 'app', 'movies.json');
  try {
    const stat = fs.statSync(filePath);
    if (!dubbedCache || dubbedCache.mtime !== stat.mtimeMs) {
      const raw = fs.readFileSync(filePath, 'utf8');
      dubbedCache = { mtime: stat.mtimeMs, data: JSON.parse(raw) };
    }
    return dubbedCache.data;
  } catch (err) {
    return [];
  }
}

function getOriginalMovies(): any[] {
  const filePath = path.join(process.cwd(), 'app', 'original_movies.json');
  try {
    const stat = fs.statSync(filePath);
    if (!originalCache || originalCache.mtime !== stat.mtimeMs) {
      const raw = fs.readFileSync(filePath, 'utf8');
      originalCache = { mtime: stat.mtimeMs, data: JSON.parse(raw) };
    }
    return originalCache.data;
  } catch (err) {
    return [];
  }
}

function getWebSeries(): any[] {
  const filePath = path.join(process.cwd(), 'app', 'web_series.json');
  try {
    const stat = fs.statSync(filePath);
    if (!seriesCache || seriesCache.mtime !== stat.mtimeMs) {
      const raw = fs.readFileSync(filePath, 'utf8');
      seriesCache = { mtime: stat.mtimeMs, data: JSON.parse(raw) };
    }
    return seriesCache.data;
  } catch (err) {
    return [];
  }
}

let titleToCastMap: Map<string, string> | null = null;
let lastDubbedMtimeForCast = 0;

function getTitleToCastMap(): Map<string, string> {
  const dubbed = getDubbedMovies();
  if (titleToCastMap && dubbedCache && dubbedCache.mtime === lastDubbedMtimeForCast) {
    return titleToCastMap;
  }
  const map = new Map<string, string>();
  for (const m of dubbed) {
    if (m.title && m.starcast) {
      const clean = m.title.toLowerCase().split('(')[0].replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean && !map.has(clean)) {
        map.set(clean, m.starcast);
      }
    }
  }
  titleToCastMap = map;
  lastDubbedMtimeForCast = dubbedCache?.mtime || 0;
  return titleToCastMap;
}

const ACTOR_ALIASES: Record<string, string[]> = {
  srk: ['shah rukh khan', 'shahrukh khan', 'shahrukh'],
  shahrukh: ['shah rukh khan', 'shahrukh khan'],
  sharuk: ['shah rukh khan'],
  shahid: ['shahid kapoor'],
  allu: ['allu arjun'],
  salman: ['salman khan'],
  bhai: ['salman khan'],
  akshay: ['akshay kumar'],
  khiladi: ['akshay kumar'],
  hrithik: ['hrithik roshan'],
  ranbir: ['ranbir kapoor'],
  ranveer: ['ranveer singh'],
  deepika: ['deepika padukone'],
  katrina: ['katrina kaif'],
  ajay: ['ajay devgn', 'ajay devgan'],
  prabhas: ['prabhas'],
  rashmika: ['rashmika mandanna'],
  kartik: ['kartik aaryan'],
  sidharth: ['sidharth malhotra'],
  sid: ['sidharth malhotra'],
  vicky: ['vicky kaushal'],
  rajkummar: ['rajkummar rao'],
  ayushmann: ['ayushmann khurrana'],
  kiara: ['kiara advani'],
  kriti: ['kriti sanon'],
  shraddha: ['shraddha kapoor'],
  alia: ['alia bhatt'],
  kareena: ['kareena kapoor'],
  varun: ['varun dhawan'],
  tiger: ['tiger shroff'],
  sunny: ['sunny deol'],
  bobby: ['bobby deol'],
  amitabh: ['amitabh bachchan'],
  bigb: ['amitabh bachchan'],
  dhanush: ['dhanush'],
  suriya: ['suriya'],
  surya: ['suriya'],
  vijay: ['thalapathy vijay', 'vijay'],
  thalapathy: ['thalapathy vijay'],
  ntr: ['n t rama rao', 'jr ntr', 'ntr'],
  jrntr: ['jr ntr'],
  ramcharan: ['ram charan'],
  charan: ['ram charan'],
  mahesh: ['mahesh babu'],
  rajini: ['rajinikanth'],
  rajinikanth: ['rajinikanth'],
  thalaiva: ['rajinikanth'],
  kamal: ['kamal haasan'],
  haasan: ['kamal haasan'],
  yash: ['yash'],
  rocky: ['yash'],
  nawaz: ['nawazuddin siddiqui'],
  nawazuddin: ['nawazuddin siddiqui'],
  pankaj: ['pankaj tripathi'],
  emraan: ['emraan hashmi'],
  john: ['john abraham'],
  samantha: ['samantha ruth prabhu', 'samantha'],
  nayanthara: ['nayanthara'],
  anushka: ['anushka sharma', 'anushka shetty'],
  pooja: ['pooja hegde'],
  mrunal: ['mrunal thakur'],
  tamannaah: ['tamannaah bhatia', 'tamannaah', 'tamanna'],
  tamanna: ['tamannaah bhatia', 'tamannaah', 'tamanna']
};

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[''""`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const parts = phrase.trim().split(/\s+/).map(escapeRegex);
  const pattern = '\\b' + parts.join('\\s+') + '\\b';
  return new RegExp(pattern, 'i').test(text);
}

function hasWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  return new RegExp('\\b' + escapeRegex(word.trim()) + '\\b', 'i').test(text);
}

function computeRelevanceScore(
  normQ: string,
  queryWords: string[],
  rawTitle: string,
  starcast = '',
  extraText = '',
  overview = ''
): number {
  if (!rawTitle) return 0;
  const normTitle = normalize(rawTitle);
  if (!normTitle) return 0;
  const normCast = normalize(starcast);

  // 1. Exact full title match
  if (normTitle === normQ) return 100;

  // 2. Starcast match (Actor Search)
  let starcastScore = 0;
  if (normCast) {
    if (hasPhrase(normCast, normQ)) {
      starcastScore = 95;
    } else {
      const aliases = ACTOR_ALIASES[normQ] || [];
      for (const alias of aliases) {
        if (hasPhrase(normCast, alias)) {
          starcastScore = 93;
          break;
        }
      }
      if (!starcastScore && queryWords.length > 1 && queryWords.every((w) => hasWord(normCast, w))) {
        starcastScore = 90;
      }
      if (!starcastScore && queryWords.length === 1 && queryWords[0].length >= 3 && hasWord(normCast, queryWords[0])) {
        starcastScore = 85;
      }
    }
  }

  // 3. Title matching
  let titleScore = 0;
  if (normTitle.startsWith(normQ)) {
    titleScore = 80;
  } else if (hasPhrase(normTitle, normQ)) {
    titleScore = 75;
  } else if (queryWords.length > 1 && queryWords.every((w) => hasWord(normTitle, w))) {
    titleScore = 65;
  } else if (queryWords.some((w) => w.length > 2 && hasWord(normTitle, w))) {
    titleScore = 40;
  }

  // Combination: actor match + title match (e.g. "Salman Tiger" or "Allu Pushpa")
  if (starcastScore >= 85 && titleScore >= 40) {
    return Math.min(100, starcastScore + 10);
  }

  if (starcastScore > 0) return starcastScore;
  if (titleScore > 0) return titleScore;

  // Extra metadata match (genre, category, industry)
  const normExtra = normalize(extraText);
  if (hasPhrase(normExtra, normQ)) return 30;
  if (queryWords.length > 1 && queryWords.every((w) => hasWord(normExtra, w))) return 25;

  // Overview / story match
  const normOverview = normalize(overview);
  if (hasPhrase(normOverview, normQ)) return 20;

  return 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const typeFilter = (searchParams.get('type') || 'all').toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40', 10)));

    if (!q) {
      return NextResponse.json({
        success: true,
        query: '',
        counts: { all: 0, dubbed: 0, original: 0, webseries: 0 },
        results: []
      });
    }

    const normQ = normalize(q);
    const queryWords = normQ.split(' ').filter(Boolean);

    if (queryWords.length === 0) {
      return NextResponse.json({
        success: true,
        query: q,
        counts: { all: 0, dubbed: 0, original: 0, webseries: 0 },
        results: []
      });
    }

    const dubbedList = getDubbedMovies();
    const originalList = getOriginalMovies();
    const seriesList = getWebSeries();
    const titleToCast = getTitleToCastMap();

    const matchedDubbed: any[] = [];
    const matchedOriginal: any[] = [];
    const matchedSeries: any[] = [];

    // 1. Search Dubbed Movies
    for (const m of dubbedList) {
      const extra = `${m.genre || ''} ${m.category || ''} ${m.industry || ''}`;
      const score = computeRelevanceScore(normQ, queryWords, m.title, m.starcast || '', extra, m.overview || '');
      if (score > 0) {
        matchedDubbed.push({
          id: String(m.id),
          title: m.title || '',
          image: m.image || '',
          rating: m.rating || '7.5',
          genre: m.genre || 'Action, Drama',
          duration: m.duration || 'HD Cinema',
          releaseDate: m.releaseDate || '',
          quality: m.quality || 'HD',
          category: m.category || 'Dubbed Movie',
          starcast: m.starcast || '',
          overview: m.overview || '',
          industry: m.industry || '',
          downloadLinks: m.downloadLinks || [],
          type: 'dubbed',
          score
        });
      }
    }

    // 2. Search Original Movies (using mapped starcast from movies.json where available)
    for (const m of originalList) {
      const cleanTitle = (m.title || '').toLowerCase().split('(')[0].replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const mappedCast = titleToCast.get(cleanTitle) || '';
      const extra = `${m.category || ''} ${m.genre || ''} ${m.languageCode || ''} ${m.country || ''}`;
      const score = computeRelevanceScore(normQ, queryWords, m.title, mappedCast, extra, m.overview || '');
      if (score > 0) {
        matchedOriginal.push({
          id: String(m.id),
          tmdbId: m.tmdbId ? String(m.tmdbId) : undefined,
          title: m.title || '',
          image: m.image || '',
          rating: m.rating || '8.0',
          genre: m.genre || 'Original Cinema',
          duration: m.duration || '120 min',
          releaseDate: m.releaseDate || '',
          category: m.category || 'Original Movie',
          starcast: mappedCast || undefined,
          overview: m.overview || '',
          country: m.country || '',
          languageCode: m.languageCode || '',
          isOriginal: true,
          streamServers: m.streamServers || [],
          watchUrl: m.watchUrl || '',
          playUrl: m.playUrl || '',
          type: 'original',
          score
        });
      }
    }

    // 3. Search Web Series
    for (const s of seriesList) {
      const cleanTitle = (s.title || '').toLowerCase().split('(')[0].replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const mappedCast = titleToCast.get(cleanTitle) || '';
      let episodeTitles = '';
      if (Array.isArray(s.seasons)) {
        for (const season of s.seasons) {
          if (Array.isArray(season.episodes)) {
            for (const ep of season.episodes) {
              episodeTitles += ` ${ep.title || ''}`;
            }
          }
        }
      }

      const extra = `${s.category || ''} ${s.genre || ''} ${episodeTitles}`;
      const score = computeRelevanceScore(normQ, queryWords, s.title, mappedCast, extra, s.overview || '');
      if (score > 0) {
        matchedSeries.push({
          id: String(s.id),
          tmdbId: s.tmdbId ? String(s.tmdbId) : undefined,
          title: s.title || '',
          image: s.poster || '',
          rating: s.rating || '8.8',
          genre: s.genre || 'Hindi Web Series',
          duration: `${s.totalSeasons || s.seasons?.length || 1} Seasons • ${s.totalEpisodes || 0} Eps`,
          releaseDate: s.releaseDate || '',
          category: s.category || 'Hindi Web Series',
          starcast: mappedCast || undefined,
          overview: s.overview || '',
          totalSeasons: s.totalSeasons || s.seasons?.length || 1,
          totalEpisodes: s.totalEpisodes || 0,
          seasons: s.seasons || [],
          type: 'webseries',
          score
        });
      }
    }

    const counts = {
      all: matchedDubbed.length + matchedOriginal.length + matchedSeries.length,
      dubbed: matchedDubbed.length,
      original: matchedOriginal.length,
      webseries: matchedSeries.length,
    };

    let combined: any[] = [];
    if (typeFilter === 'dubbed') {
      combined = matchedDubbed;
    } else if (typeFilter === 'original') {
      combined = matchedOriginal;
    } else if (typeFilter === 'webseries') {
      combined = matchedSeries;
    } else {
      combined = [...matchedDubbed, ...matchedOriginal, ...matchedSeries];
    }

    // Sort by relevance score first; for equal scores, sort by recency and Hindi/Bollywood prioritization
    combined.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return compareCatalogItems(a, b, (item) => item.releaseDate || '');
    });

    const results = combined.slice(0, limit);

    return NextResponse.json({
      success: true,
      query: q,
      counts,
      results
    });
  } catch (error: any) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed', counts: { all: 0, dubbed: 0, original: 0, webseries: 0 }, results: [] },
      { status: 500 }
    );
  }
}
