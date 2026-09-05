import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let movies = [];
  try {
    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    movies = JSON.parse(fileContents);
  } catch (e) {
    console.error("Failed to load movies.json", e);
  }

  // Extract unique categories
  const categoriesSet = new Set<string>();
  movies.forEach((m: any) => {
    if (m.category && m.category.trim() !== '') {
      categoriesSet.add(m.category.trim());
    }
  });

  const categories = Array.from(categoriesSet).sort();

  return NextResponse.json({ categories });
}
