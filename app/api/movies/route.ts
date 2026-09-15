import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFilterForCategory } from '../../categoryHelper';
import { getMovieById } from '@/lib/movieHelper';

export async function GET(request: Request) {
  // Create a new URL object to get params
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const found = getMovieById(id);
    if (found) {
      return NextResponse.json({ success: true, movie: found, data: [found], total: 1 });
    }
    return NextResponse.json({ success: false, error: 'Movie not found', data: [] }, { status: 404 });
  }

  let movies = [];
  try {
    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    movies = JSON.parse(fileContents);
  } catch (e) {
    console.error("Failed to load movies.json", e);
  }

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

  // Category filtering using mapped category names
  if (filter && filter !== 'All') {
    const filterLower = filter.toLowerCase();
    results = results.filter((m: any) => {
      if (!m.category) return false;
      const mapped = getFilterForCategory(m.category);
      return mapped.toLowerCase() === filterLower;
    });
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
