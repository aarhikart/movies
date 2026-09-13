import fs from 'fs';
import path from 'path';

export interface MovieItem {
  id: string;
  title: string;
  image: string;
  rating: string;
  genre: string;
  duration?: string;
  releaseDate?: string;
  starcast?: string;
  overview?: string;
  quality?: string;
  category?: string;
  industry?: string;
  downloadLinks?: { label: string; url: string }[];
  type?: string;
}

let cachedMovieMap: Map<string, MovieItem> | null = null;
let lastMtimeMs: number = 0;

export function getMovieById(id: string): MovieItem | null {
  if (!id) return null;
  const filePath = path.join(process.cwd(), 'app', 'movies.json');
  
  try {
    const stats = fs.statSync(filePath);
    if (!cachedMovieMap || stats.mtimeMs !== lastMtimeMs) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const movies: MovieItem[] = JSON.parse(fileContents);
      const newMap = new Map<string, MovieItem>();
      for (const m of movies) {
        if (m.id) newMap.set(String(m.id), m);
      }
      cachedMovieMap = newMap;
      lastMtimeMs = stats.mtimeMs;
    }
    return cachedMovieMap.get(String(id)) || null;
  } catch (err) {
    console.error('Failed to load movie by id from movies.json:', err);
    return null;
  }
}
