import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFilterForCategory } from '../../categoryHelper';

export async function GET() {
  let movies = [];
  try {
    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    movies = JSON.parse(fileContents);
  } catch (e) {
    console.error("Failed to load movies.json", e);
  }

  // Extract unique mapped categories for frontend chips
  const categoriesSet = new Set<string>();
  movies.forEach((m: any) => {
    if (m.category && m.category.trim() !== '') {
      const mappedFilter = getFilterForCategory(m.category);
      if (mappedFilter) {
        categoriesSet.add(mappedFilter);
      }
    }
  });

  // Sort categories alphabetically (Bollywood will naturally be first)
  const categories = Array.from(categoriesSet).sort((a, b) => {
    if (a.toLowerCase() === 'bollywood') return -1;
    if (b.toLowerCase() === 'bollywood') return 1;
    return a.localeCompare(b);
  });

  return NextResponse.json({ categories });
}
