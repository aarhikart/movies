import fs from 'fs';
import path from 'path';

export interface MovieItem {
  id: string;
  tmdbId?: string;
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
  isOriginal?: boolean;
  playUrl?: string;
  watchUrl?: string;
  streamServers?: { name: string; url: string }[];
}

let cachedMovieMap: Map<string, MovieItem> | null = null;
let lastMtimeMs: number = 0;

export function getMovieById(id: string): MovieItem | null {
  if (!id) return null;
  const filePath = path.join(process.cwd(), 'app', 'movies.json');
  const origFilePath = path.join(process.cwd(), 'app', 'original_movies.json');
  
  try {
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    if (stats && (!cachedMovieMap || stats.mtimeMs !== lastMtimeMs)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const movies: MovieItem[] = JSON.parse(fileContents);
      const newMap = new Map<string, MovieItem>();
      for (const m of movies) {
        if (m.id) newMap.set(String(m.id), m);
      }
      cachedMovieMap = newMap;
      lastMtimeMs = stats.mtimeMs;
    }
    const fromDubbed = cachedMovieMap?.get(String(id));
    if (fromDubbed) return fromDubbed;

    // Check original_movies.json
    if (fs.existsSync(origFilePath)) {
      const origContents = fs.readFileSync(origFilePath, 'utf8');
      const origMovies: MovieItem[] = JSON.parse(origContents);
      const foundOrig = origMovies.find(m => String(m.id) === String(id) || String(m.tmdbId) === String(id));
      if (foundOrig) return foundOrig;
    }

    // Check web_series.json
    const seriesFilePath = path.join(process.cwd(), 'app', 'web_series.json');
    if (fs.existsSync(seriesFilePath)) {
      const seriesContents = fs.readFileSync(seriesFilePath, 'utf8');
      const seriesList: any[] = JSON.parse(seriesContents);
      const foundSeries = seriesList.find(s => String(s.id) === String(id) || String(s.tmdbId) === String(id));
      if (foundSeries) {
        const firstEp = foundSeries.seasons?.[0]?.episodes?.[0];
        return {
          id: foundSeries.id,
          tmdbId: foundSeries.tmdbId,
          title: foundSeries.title,
          image: foundSeries.poster || firstEp?.thumbnail || '',
          rating: foundSeries.rating || '8.5',
          genre: foundSeries.genre || 'Hindi Web Series',
          category: foundSeries.category || 'Hindi Web Series',
          overview: foundSeries.overview || firstEp?.overview || '',
          duration: `${foundSeries.totalSeasons || 1} Seasons`,
          isOriginal: false,
          watchUrl: firstEp?.streamUrl || '',
          streamServers: firstEp?.streamServers || []
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to load movie by id:', err);
    return null;
  }
}

export interface TvEpisode {
  episodeNumber: number;
  title: string;
  thumbnail: string;
  overview?: string;
  airDate?: string;
  duration?: string;
  rating?: string;
  streamUrl?: string;
  nightflixUrl?: string;
  streamServers?: { name: string; url: string }[];
}

export interface TvSeason {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes: TvEpisode[];
}

export interface WebSeriesShow {
  id: string;
  tmdbId: string;
  title: string;
  poster: string;
  overview?: string;
  category?: string;
  genre?: string;
  rating?: string;
  totalSeasons: number;
  totalEpisodes: number;
  seasons: TvSeason[];
}

export function getAllWebSeries(): WebSeriesShow[] {
  try {
    const seriesFilePath = path.join(process.cwd(), 'app', 'web_series.json');
    if (fs.existsSync(seriesFilePath)) {
      const contents = fs.readFileSync(seriesFilePath, 'utf8');
      return JSON.parse(contents);
    }
  } catch (e) {
    console.error('Error reading web_series.json:', e);
  }
  return [];
}

