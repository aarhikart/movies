export interface DownloadedMovie {
  id: string;
  title: string;
  image?: string;
  quality?: string;
  fileSize?: string;
  downloadedAt: string;
  url?: string;
}

const STORAGE_KEY = "moviemela_downloaded_movies";
const COUNT_KEY = "moviemela_download_count";
export const DOWNLOADS_EVENT = "moviemela_downloads_updated";

export function getDownloadedMovies(): DownloadedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse downloaded movies from localStorage:", e);
    return [];
  }
}

export function getDownloadCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const count = localStorage.getItem(COUNT_KEY);
    if (count !== null) return parseInt(count, 10) || 0;
    return getDownloadedMovies().length;
  } catch {
    return 0;
  }
}

export function saveDownloadedMovie(movie: {
  id?: string;
  title: string;
  image?: string;
  quality?: string;
  fileSize?: string;
  url?: string;
}): DownloadedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getDownloadedMovies();
    const cleanTitle = (movie.title || "Movie")
      .replace(/\s\(\d{4}\).*$/, "")
      .replace(/^[^a-zA-Z0-9]+/, "")
      .trim();

    // Check if duplicate exists by id, url, or matching clean title
    const existingIdx = list.findIndex((item) => {
      if (movie.id && item.id === movie.id) return true;
      if (movie.url && item.url && item.url === movie.url) return true;
      const t1 = item.title.replace(/\s\(\d{4}\).*$/, "").replace(/^[^a-zA-Z0-9]+/, "").trim().toLowerCase();
      const t2 = cleanTitle.toLowerCase();
      return t1 === t2;
    });

    const entry: DownloadedMovie = {
      id: movie.id || String(Date.now()),
      title: cleanTitle || movie.title,
      image: movie.image || "",
      quality: movie.quality || "HD",
      fileSize: movie.fileSize || "298 MB",
      url: movie.url || "",
      downloadedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...entry };
    } else {
      list.unshift(entry);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(COUNT_KEY, String(list.length));

    // Dispatch custom event for immediate UI reaction in the same window
    window.dispatchEvent(new CustomEvent(DOWNLOADS_EVENT, { detail: list }));
    window.dispatchEvent(new Event("storage"));

    return list;
  } catch (e) {
    console.error("Failed to save downloaded movie:", e);
    return [];
  }
}

export function removeDownloadedMovie(id: string): DownloadedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getDownloadedMovies().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(COUNT_KEY, String(list.length));
    window.dispatchEvent(new CustomEvent(DOWNLOADS_EVENT, { detail: list }));
    window.dispatchEvent(new Event("storage"));
    return list;
  } catch (e) {
    console.error("Failed to remove downloaded movie:", e);
    return [];
  }
}

export function clearDownloadedMovies(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(COUNT_KEY, "0");
    window.dispatchEvent(new CustomEvent(DOWNLOADS_EVENT, { detail: [] }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to clear downloaded movies:", e);
  }
}
