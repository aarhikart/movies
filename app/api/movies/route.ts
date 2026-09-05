import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  let movies = [];
  try {
    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    movies = JSON.parse(fileContents);
  } catch (e) {
    console.error("Failed to load movies.json", e);
  }
  
  // Create a new URL object to get params
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const type = url.searchParams.get('type');
  const filter = url.searchParams.get('filter');

  let results = [...movies];

  // Search filtering
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((m: any) => m.title.toLowerCase().includes(query));
  }

  // Strict Category filtering
  if (filter && filter !== 'All') {
    results = results.filter((m: any) => m.category === filter);
  }

  // Type filtering (popular, trending, hero)
  if (type) {
    const typeResults = results.filter((m: any) => m.type === type);
    if (typeResults.length > 0) {
      results = typeResults;
    } else {
      if (type === 'hero') results = results.slice(0, 5);
      if (type === 'popular') results = results.slice(5, 20);
      if (type === 'trending') results = results.slice(20, 35);
    }
  } else {
    // If NOT fetching a specific type (i.e. fetching the main All Movies grid)
    // and we are on the "All" tab (no filter), sort Bollywood -> Hindi Web Series -> Other!
    if (!filter || filter === 'All') {
      const getRank = (m: any) => {
        const t = m.title ? m.title.toLowerCase() : '';
        const c = m.category ? m.category.toLowerCase() : '';
        const i = m.industry ? m.industry.toLowerCase() : '';
        
        if (i === 'bollywood' || c.includes('bollywood') || t.includes('hindi movie')) {
          return 1;
        }
        if (c.includes('hindi dubbed') || (t.includes('hindi') && (t.includes('series') || t.includes('season') || c.includes('web series')))) {
          return 2;
        }
        return 3;
      };

      const bollywood = results.filter((m: any) => getRank(m) === 1);
      const hindiWebSeries = results.filter((m: any) => getRank(m) === 2);
      const others = results.filter((m: any) => getRank(m) === 3);

      const mixedResults = [];
      let bIdx = 0;
      let hIdx = 0;

      // Interleave 50/50
      while (bIdx < bollywood.length || hIdx < hindiWebSeries.length) {
        if (bIdx < bollywood.length) {
          mixedResults.push(bollywood[bIdx]);
          bIdx++;
        }
        if (hIdx < hindiWebSeries.length) {
          mixedResults.push(hindiWebSeries[hIdx]);
          hIdx++;
        }
      }

      results = [...mixedResults, ...others];
    }
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    data: paginatedResults,
    total: results.length,
    page,
    totalPages: Math.ceil(results.length / limit)
  });
}
