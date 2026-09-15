export interface WatchedMovie {
  id: string;
  tmdbId?: string;
  title: string;
  image?: string;
  category?: string;
  genre?: string;
  duration?: string;
  rating?: string;
  lastWatchedAt: string;
  progressPercent: number; // e.g. 15, 35, 65, 90
  lastServerName?: string;
  lastServerUrl?: string;
  watchUrl?: string;
  playUrl?: string;
  streamServers?: { name: string; url: string }[];
  overview?: string;
  releaseDate?: string;
  country?: string;
}

const STORAGE_KEY = "moviemela_watched_history";
export const WATCH_HISTORY_EVENT = "moviemela_watch_history_updated";

export function getWatchHistory(): WatchedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse watch history from localStorage:", e);
    return [];
  }
}

export function saveWatchProgress(movie: {
  id: string;
  tmdbId?: string;
  title: string;
  image?: string;
  category?: string;
  genre?: string;
  duration?: string;
  rating?: string;
  progressPercent?: number;
  lastServerName?: string;
  lastServerUrl?: string;
  watchUrl?: string;
  playUrl?: string;
  streamServers?: { name: string; url: string }[];
  overview?: string;
  releaseDate?: string;
  country?: string;
}): WatchedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getWatchHistory();
    const cleanTitle = (movie.title || "Movie")
      .replace(/\s\(\d{4}\).*$/, "")
      .replace(/^[^a-zA-Z0-9]+/, "")
      .trim();

    // Find existing item by id, tmdbId, or matching title
    const existingIdx = list.findIndex((item) => {
      if (item.id && movie.id && item.id === movie.id) return true;
      if (item.tmdbId && movie.tmdbId && item.tmdbId === movie.tmdbId) return true;
      const t1 = item.title.replace(/\s\(\d{4}\).*$/, "").trim().toLowerCase();
      const t2 = cleanTitle.toLowerCase();
      return t1 === t2;
    });

    const previousProgress = existingIdx !== -1 ? list[existingIdx].progressPercent : 0;
    // Advance progress by default or keep provided progress
    const newProgress = typeof movie.progressPercent === 'number' 
      ? movie.progressPercent 
      : Math.min(95, Math.max(15, previousProgress + 20));

    const entry: WatchedMovie = {
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: cleanTitle || movie.title,
      image: movie.image || (existingIdx !== -1 ? list[existingIdx].image : ""),
      category: movie.category || (existingIdx !== -1 ? list[existingIdx].category : ""),
      genre: movie.genre || (existingIdx !== -1 ? list[existingIdx].genre : ""),
      duration: movie.duration || (existingIdx !== -1 ? list[existingIdx].duration : ""),
      rating: movie.rating || (existingIdx !== -1 ? list[existingIdx].rating : ""),
      progressPercent: newProgress,
      lastWatchedAt: new Date().toISOString(),
      lastServerName: movie.lastServerName || (existingIdx !== -1 ? list[existingIdx].lastServerName : "Vidcore HD"),
      lastServerUrl: movie.lastServerUrl || (existingIdx !== -1 ? list[existingIdx].lastServerUrl : ""),
      watchUrl: movie.watchUrl || (existingIdx !== -1 ? list[existingIdx].watchUrl : ""),
      playUrl: movie.playUrl || (existingIdx !== -1 ? list[existingIdx].playUrl : ""),
      streamServers: movie.streamServers || (existingIdx !== -1 ? list[existingIdx].streamServers : []),
      overview: movie.overview || (existingIdx !== -1 ? list[existingIdx].overview : ""),
      releaseDate: movie.releaseDate || (existingIdx !== -1 ? list[existingIdx].releaseDate : ""),
      country: movie.country || (existingIdx !== -1 ? list[existingIdx].country : ""),
    };

    if (existingIdx !== -1) {
      list.splice(existingIdx, 1);
    }
    list.unshift(entry);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Dispatch custom event for reactive update
    window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT, { detail: list }));
    window.dispatchEvent(new Event("storage"));

    return list;
  } catch (e) {
    console.error("Failed to save watch progress:", e);
    return [];
  }
}

export function removeWatchHistoryItem(id: string): WatchedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getWatchHistory().filter((item) => item.id !== id && item.tmdbId !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT, { detail: list }));
    window.dispatchEvent(new Event("storage"));
    return list;
  } catch (e) {
    console.error("Failed to remove watch history item:", e);
    return [];
  }
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT, { detail: [] }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to clear watch history:", e);
  }
}
