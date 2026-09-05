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
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const filter = searchParams.get('filter'); // NEW: For chips like "Action", "Bollywood", etc.

  let results = movies;

  // Search filtering
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((m: any) => m.title.toLowerCase().includes(query));
  }

  // Type filtering (popular, trending, hero)
  if (type) {
    results = results.filter((m: any) => m.type === type);
  }

  // Chip filtering
  if (filter && filter !== 'All') {
    const f = filter.toLowerCase();
    if (f === 'bollywood') {
      results = results.filter((m: any) => m.title.toLowerCase().includes('hindi'));
    } else if (f === 'movies') {
      results = results.filter((m: any) => m.title.toLowerCase().includes('movie'));
    } else if (f === 'tv shows' || f === 'web series') {
      results = results.filter((m: any) => m.title.toLowerCase().includes('series') || m.title.toLowerCase().includes('show') || m.title.toLowerCase().includes('season'));
    } else {
      // Treat as genre (Action, Comedy, Drama, etc)
      results = results.filter((m: any) => m.genre && m.genre.toLowerCase().includes(f));
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
