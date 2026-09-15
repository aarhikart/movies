import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  let movies: any[] = [];
  try {
    const filePath = path.join(process.cwd(), 'app', 'original_movies.json');
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      movies = JSON.parse(fileContents);
    }
  } catch (e) {
    console.error("Failed to load original_movies.json", e);
  }

  // Single movie lookup
  if (id) {
    const found = movies.find((m: any) => m.id === id || m.tmdbId === id || String(m.id) === String(id));
    if (found) {
      return NextResponse.json({ success: true, movie: found, data: [found], total: 1 });
    }
    return NextResponse.json({ success: false, error: 'Original movie not found', data: [] }, { status: 404 });
  }

  const q = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const filter = url.searchParams.get('filter');

  let results = [...movies];

  // Search filtering
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((m: any) => 
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.overview && m.overview.toLowerCase().includes(query)) ||
      (m.category && m.category.toLowerCase().includes(query))
    );
  }

  // Category (Language) filtering
  if (filter && filter !== 'All') {
    const filterLower = filter.toLowerCase();
    results = results.filter((m: any) => {
      const cat = (m.category || '').toLowerCase();
      const code = (m.languageCode || '').toLowerCase();
      return cat === filterLower || code === filterLower;
    });
  }

  // Extract unique categories (e.g. Hindi, Malayalam, Tamil, etc.)
  const rawCategories = Array.from(new Set(movies.map((m: any) => m.category).filter(Boolean)));
  const categories = rawCategories.sort();

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = results.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: paginated,
    total: results.length,
    page,
    totalPages: Math.ceil(results.length / limit),
    categories
  });
}
