import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFilterForCategory } from '../../categoryHelper';
import { getMovieById, parseDateToTimestamp, getYearFromDate, compareCatalogItems } from '@/lib/movieHelper';

let cachedSortedMovies: any[] | null = null;
let lastMoviesFileMtime = 0;

function getSortedMovies(): any[] {
  const filePath = path.join(process.cwd(), 'app', 'movies.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    const stats = fs.statSync(filePath);
    if (cachedSortedMovies && stats.mtimeMs === lastMoviesFileMtime) {
      return cachedSortedMovies;
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const list: any[] = JSON.parse(fileContents);
    // Sort: Current month first, then Last month, with Hindi/Bollywood prioritized first
    list.sort((a, b) => compareCatalogItems(a, b, (m) => m.releaseDate));
    cachedSortedMovies = list;
    lastMoviesFileMtime = stats.mtimeMs;
    return cachedSortedMovies;
  } catch (e) {
    console.error("Failed to load movies.json", e);
    return cachedSortedMovies || [];
  }
}

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

  const movies = getSortedMovies();

  const q = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const type = url.searchParams.get('type');
  const filter = url.searchParams.get('filter');
  const year = url.searchParams.get('year');

  let results = [...movies];

  // Search filtering
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((m: any) => 
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.starcast && m.starcast.toLowerCase().includes(query))
    );
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

  // Year filtering
  if (year && year !== 'All') {
    results = results.filter((m: any) => getYearFromDate(m.releaseDate, m.title) === year);
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

  // Available release years
  const availableYears = ["All", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    data: paginatedResults,
    total: results.length,
    page,
    totalPages: Math.ceil(results.length / limit),
    years: availableYears
  });
}
