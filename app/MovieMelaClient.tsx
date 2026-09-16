"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  Mic, 
  Play, 
  Download, 
  X, 
  Star, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  Flame,
  Menu,
  Film,
  Info,
  Trash2,
  Share2,
  Check,
  Copy,
  SlidersHorizontal,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RotateCcw,
  Clock,
  Tv
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { 
  getDownloadedMovies, 
  removeDownloadedMovie, 
  clearDownloadedMovies, 
  DOWNLOADS_EVENT, 
  DownloadedMovie 
} from "@/lib/downloads";
import {
  getWatchHistory,
  saveWatchProgress,
  removeWatchHistoryItem,
  clearWatchHistory,
  WATCH_HISTORY_EVENT,
  WatchedMovie
} from "@/lib/watchHistory";
import { WebSeriesShow, TvSeason, TvEpisode } from "@/lib/movieHelper";

type Movie = {
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
  languageCode?: string;
  country?: string;
  playUrl?: string;
  watchUrl?: string;
  streamServers?: { name: string; url: string }[];
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.41 0-2.79-.36-4.01-1.05l-.29-.16-3.12.82.83-3.04-.19-.3a8.21 8.21 0 01-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.12.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.23-.19-.48-.31z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function getServersForMovie(movie: Movie) {
  if (movie.streamServers && movie.streamServers.length > 0) {
    return movie.streamServers;
  }
  const tmdbId = movie.tmdbId || (movie.id ? movie.id.replace(/^orig_/, '') : '');
  if (tmdbId) {
    return [
      { name: "Vidme Fast (Ad-Free)", url: `https://vidzen.fun/movie/${tmdbId}?autoPlay=true` },
      { name: "Vidsu (Clean HD)", url: `https://player-4aq.pages.dev/embed/movie/${tmdbId}?autoPlay=true` },
      { name: "Vidcore HD", url: `https://vidcore.net/movie/${tmdbId}?autoPlay=true` },
      { name: "VidLink HD", url: `https://vidlink.pro/movie/${tmdbId}?autoplay=true` },
      { name: "AutoEmbed CC", url: `https://player.autoembed.cc/embed/movie/${tmdbId}` },
    ];
  }
  return movie.watchUrl ? [{ name: "Stream Server", url: movie.watchUrl }] : [];
}

export default function MovieMelaClient({ initialMovieId }: { initialMovieId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [mainTab, setMainTab] = useState<"dubbed" | "original" | "webseries">("dubbed");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"watch" | "download">("download");
  const [showSplash, setShowSplash] = useState(true);
  
  // Dubbed Data states
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [totalMovies, setTotalMovies] = useState(0);
  
  // Original Movies Data states
  const [originalMovies, setOriginalMovies] = useState<Movie[]>([]);
  const [totalOriginalMovies, setTotalOriginalMovies] = useState(0);
  const [originalPage, setOriginalPage] = useState(1);
  const [isLoadingMoreOriginal, setIsLoadingMoreOriginal] = useState(false);
  const [originalChips, setOriginalChips] = useState<string[]>(["All"]);
  const [activeOriginalChip, setActiveOriginalChip] = useState("All");

  // Web Series Data states
  const [webSeriesList, setWebSeriesList] = useState<WebSeriesShow[]>([]);
  const [totalWebSeries, setTotalWebSeries] = useState(0);
  const [webSeriesPage, setWebSeriesPage] = useState(1);
  const [isLoadingMoreWebSeries, setIsLoadingMoreWebSeries] = useState(false);
  const [webSeriesChips, setWebSeriesChips] = useState<string[]>(["All"]);
  const [activeWebSeriesChip, setActiveWebSeriesChip] = useState("All");

  // Selected Series for Episode Modal
  const [selectedSeriesForEpisodes, setSelectedSeriesForEpisodes] = useState<WebSeriesShow | null>(null);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(1);

  // In-App Cinema Streaming Player State (Zero Redirects)
  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  // Watch History & Continue Watching states
  const [watchHistoryList, setWatchHistoryList] = useState<WatchedMovie[]>([]);
  const [drawerTab, setDrawerTab] = useState<"history" | "downloads">("history");
  
  const [searchSuggestions, setSearchSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [viewingCategory, setViewingCategory] = useState<{title: string, data: Movie[]} | null>(null);

  const [chips, setChips] = useState<string[]>(["All"]);

  // Hamburger drawer and downloads tracking
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [downloadedList, setDownloadedList] = useState<DownloadedMovie[]>([]);

  // Main scroll container ref for resetting scroll on tab switch
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Tab switcher that resets search state and scrolls to top smoothly
  const handleTabSwitch = (newTab: "dubbed" | "original" | "webseries") => {
    if (newTab === mainTab) return;
    setMainTab(newTab);
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSearching(false);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  };

  // Record visit in MongoDB Atlas (2-hour rolling session deduplication)
  useEffect(() => {
    fetch("/api/views", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    // Initial fetch from localStorage
    setDownloadedList(getDownloadedMovies());
    setWatchHistoryList(getWatchHistory());

    // Reactive sync when downloads or watch history change
    const handleSync = () => {
      setDownloadedList(getDownloadedMovies());
      setWatchHistoryList(getWatchHistory());
    };

    window.addEventListener(DOWNLOADS_EVENT, handleSync);
    window.addEventListener(WATCH_HISTORY_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(DOWNLOADS_EVENT, handleSync);
      window.removeEventListener(WATCH_HISTORY_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const playerContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsPlayerFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsPlayerFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsPlayerFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Block any popup ads/tabs from opening or redirecting while video is playing
  useEffect(() => {
    if (!streamingMovie) return;
    const originalOpen = window.open;
    window.open = () => null;

    // Prevent iframe ad scripts from hijacking/redirecting the main browser tab
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.open = originalOpen;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [streamingMovie]);

  // Auto-advance watch history progress while player is actively open (every 30s +1%)
  useEffect(() => {
    if (!streamingMovie) return;

    const interval = setInterval(() => {
      setWatchHistoryList((prev) => {
        const cur = prev.find(w => w.id === streamingMovie.id || (streamingMovie.tmdbId && w.tmdbId === streamingMovie.tmdbId));
        const currentPct = cur ? cur.progressPercent : 15;
        if (currentPct >= 95) return prev;
        const updated = saveWatchProgress({
          ...streamingMovie,
          progressPercent: currentPct + 1
        });
        return updated;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [streamingMovie]);

  // Handler to initiate streaming and update watch history
  const handleStartStreaming = (movie: Movie | WatchedMovie, serverIdx = 0, customProgress?: number) => {
    const asMovie: Movie = {
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      image: movie.image || "",
      rating: movie.rating || "8.5",
      genre: movie.genre || "Original Cinema",
      duration: movie.duration,
      category: movie.category,
      country: movie.country,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      watchUrl: movie.watchUrl,
      playUrl: movie.playUrl,
      streamServers: movie.streamServers,
      isOriginal: true,
    };
    setStreamingMovie(asMovie);
    setActiveServerIndex(serverIdx);
    setIsPlayerLoading(true);
    setIsDrawerOpen(false);

    const existingItem = watchHistoryList.find(w => w.id === movie.id || (movie.tmdbId && w.tmdbId === movie.tmdbId));
    const progress = customProgress !== undefined 
      ? customProgress 
      : ('progressPercent' in movie && typeof movie.progressPercent === 'number' 
          ? movie.progressPercent 
          : (existingItem ? existingItem.progressPercent : 15));

    const updated = saveWatchProgress({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      image: movie.image,
      category: movie.category,
      genre: movie.genre,
      duration: movie.duration,
      rating: movie.rating,
      progressPercent: progress,
      lastServerName: movie.streamServers?.[serverIdx]?.name || "Vidcore HD",
      lastServerUrl: movie.streamServers?.[serverIdx]?.url || "",
      watchUrl: movie.watchUrl,
      playUrl: movie.playUrl,
      streamServers: movie.streamServers,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      country: movie.country
    });
    setWatchHistoryList(updated);
  };

  // PWA Phone Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // On mobile devices, if not already installed, show suggestion banner
    const isStandalone = typeof window !== "undefined" && 
      (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true);
    
    if (!isStandalone) {
      const dismissed = typeof window !== "undefined" ? sessionStorage.getItem("dismissed_install_banner") : null;
      if (!dismissed) {
        const timer = setTimeout(() => setShowInstallBanner(true), 2500);
        return () => {
          window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
          clearTimeout(timer);
        };
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          setShowInstallBanner(false);
        }
      });
    } else {
      alert("To install MovieMela on your phone:\n\n1. Tap your browser's Menu (⋮) or Share button (📤).\n2. Tap 'Add to Home Screen' or 'Install App'.");
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("dismissed_install_banner", "true");
    }
  };

  // Movie Share & Deep Link State
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Auto-open movie details modal if initialMovieId or URL has ?movie=ID or /movie/ID
  useEffect(() => {
    let targetMovieId = initialMovieId;
    if (!targetMovieId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      targetMovieId = params.get("movie") || params.get("m") || undefined;
      if (!targetMovieId && window.location.pathname.startsWith("/movie/")) {
        const parts = window.location.pathname.split("/");
        targetMovieId = parts[2] || undefined;
      }
    }
    if (!targetMovieId) return;

    // Immediately bypass splash screen when coming from a shared link
    setShowSplash(false);

    const found = allMovies.find((m) => String(m.id) === String(targetMovieId)) ||
      originalMovies.find((m) => String(m.id) === String(targetMovieId) || String(m.tmdbId) === String(targetMovieId));

    if (found) {
      setSelectedMovie(found);
      if (found.isOriginal) setMainTab("original");
    } else {
      fetch(`/api/movies?id=${encodeURIComponent(targetMovieId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.movie) {
            setSelectedMovie(data.movie);
          } else {
            return fetch(`/api/original-movies?id=${encodeURIComponent(targetMovieId!)}`)
              .then(r => r.json())
              .then(orig => {
                if (orig.success && orig.movie) {
                  setSelectedMovie(orig.movie);
                  setMainTab("original");
                }
              });
          }
        })
        .catch(() => {});
    }
  }, [allMovies, originalMovies, initialMovieId]);

  // Synchronize browser URL query with currently open movie modal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (selectedMovie) {
      if (url.pathname === "/") {
        url.searchParams.set("movie", selectedMovie.id);
        window.history.replaceState(null, "", url.toString());
      }
    } else {
      if (url.pathname.startsWith("/movie/")) {
        window.history.replaceState(null, "", "/");
      } else if (url.searchParams.has("movie") || url.searchParams.has("m")) {
        url.searchParams.delete("movie");
        url.searchParams.delete("m");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [selectedMovie]);

  // WhatsApp Card Share
  const handleShareWhatsApp = (movie: Movie | null) => {
    if (!movie) return;
    const currentOrigin = typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : "";
    const shareUrl = `${currentOrigin}/movie/${encodeURIComponent(movie.id)}`;
    const displayTitle = movie.title || "Movie";
    const isSeries = movie.type === 'webseries' || movie.id?.startsWith('series_');
    const shareCaption = isSeries
      ? `📺 *${displayTitle}*\n\nWatch this web series on MovieMela:\n${shareUrl}`
      : `🎬 *${displayTitle}*\n\nWatch this movie on MovieMela:\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareCaption)}`;
    window.open(whatsappUrl, "_blank");
    setShowShareSheet(false);
  };

  // Instagram Story Share:
  // Native & 100% free (no APIs/third-party platforms):
  // 1. Copies direct movie URL to clipboard for the Instagram Link Sticker
  // 2. Fetches high-res movie poster image via proxy
  // 3. Invokes Web Share API with image file -> user picks "Instagram Stories"
  // 4. On Desktop: downloads poster & copies movie link for manual upload
  const handleShareInstagramStory = async (movie: Movie | null) => {
    if (!movie) return;
    setIsSharing(true);

    const currentOrigin = typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : "";
    const shareUrl = `${currentOrigin}/movie/${encodeURIComponent(movie.id)}`;
    const isSeries = movie.type === 'webseries' || movie.id?.startsWith('series_');
    const itemWord = isSeries ? "Web series" : "Movie";

    // 1. Copy URL to clipboard for the Instagram Link Sticker
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (_) {}

    try {
      let proxyUrl = movie.image;
      if (movie.image && (movie.image.startsWith("http://") || movie.image.startsWith("https://"))) {
        proxyUrl = `/api/proxy-image?url=${encodeURIComponent(movie.image)}`;
      }
      const imgRes = await fetch(proxyUrl);
      if (!imgRes.ok) throw new Error("Failed to load poster image");
      const blob = await imgRes.blob();
      const cleanName = (movie.title || "movie").replace(/[^a-zA-Z0-9_-]/g, "_");
      const posterFile = new File([blob], `${cleanName}_story.jpg`, { type: blob.type || "image/jpeg" });

      if (typeof navigator !== "undefined" && typeof (navigator as any).canShare === "function") {
        if ((navigator as any).canShare({ files: [posterFile] })) {
          setShareToast(`${itemWord} link copied! Select 'Instagram Stories' to post.`);
          setTimeout(() => setShareToast(null), 4000);
          await navigator.share({
            files: [posterFile],
            title: movie.title,
          });
          setIsSharing(false);
          setShowShareSheet(false);
          return;
        }
      }

      // Desktop fallback: Download image file & notify user
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = URL.createObjectURL(blob);
      downloadAnchor.download = `${cleanName}_story.jpg`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setShareToast(`Poster downloaded & ${itemWord.toLowerCase()} link copied! Upload to your Instagram Story.`);
      setTimeout(() => setShareToast(null), 4500);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setShareToast(`${itemWord} link copied to clipboard!`);
        setTimeout(() => setShareToast(null), 3000);
      }
    } finally {
      setIsSharing(false);
      setShowShareSheet(false);
    }
  };

  // Device Native Share (Telegram, SMS, Twitter, etc.)
  const handleShareNative = async (movie: Movie | null) => {
    if (!movie) return;
    setIsSharing(true);
    const currentOrigin = typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : "";
    const shareUrl = `${currentOrigin}/movie/${encodeURIComponent(movie.id)}`;
    const displayTitle = movie.title || "Movie";
    const isSeries = movie.type === 'webseries' || movie.id?.startsWith('series_');
    const itemWord = isSeries ? "web series" : "movie";
    const shareCaption = `🎬 *${displayTitle}*\n\nWatch this ${itemWord} on MovieMela:\n${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: `🎬 *${displayTitle}*\n\nWatch this ${itemWord} on MovieMela:\n`,
          url: shareUrl,
        });
      } catch (e) {}
    } else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareCaption);
        setShareToast(`${isSeries ? "Web series" : "Movie"} link copied to clipboard!`);
        setTimeout(() => setShareToast(null), 3000);
      }
    }
    setIsSharing(false);
    setShowShareSheet(false);
  };

  // Copy Direct Link
  const handleCopyLink = async (movie: Movie | null) => {
    if (!movie) return;
    const currentOrigin = typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : "";
    const shareUrl = `${currentOrigin}/movie/${encodeURIComponent(movie.id)}`;
    const isSeries = movie.type === 'webseries' || movie.id?.startsWith('series_');
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(`${isSeries ? "Web series" : "Movie"} link copied to clipboard!`);
      setTimeout(() => setShareToast(null), 3000);
    }
    setShowShareSheet(false);
  };

  // Fetch unique categories for the filter chips
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          setChips(["All", ...data.categories]);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch filtered "All Movies" when activeChip changes or when mainTab switches to "dubbed"
  useEffect(() => {
    if (mainTab !== "dubbed") return;
    const filterParam = activeChip === 'All' ? '' : `&filter=${encodeURIComponent(activeChip)}`;
    
    // Fetch Movies grid
    setPage(1);
    setIsLoadingMore(true);
    fetch(`/api/movies?page=1&limit=20${filterParam}`)
      .then(res => res.json())
      .then(res => {
        setAllMovies(res.data || []);
        setTotalMovies(res.total || 0);
        setIsLoadingMore(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingMore(false);
      });
  }, [activeChip, mainTab]);

  // Stable state ref for Dubbed Infinite Scroll (prevents tear-down/re-attach glitch)
  const dubbedStateRef = useRef({ page, total: totalMovies, count: allMovies.length, activeChip, loading: isLoadingMore });
  dubbedStateRef.current = { page, total: totalMovies, count: allMovies.length, activeChip, loading: isLoadingMore };

  // Infinite Scroll logic for Dubbed Movies
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMoreMovies = useCallback(async () => {
    const state = dubbedStateRef.current;
    if (state.loading) return;
    if (state.total > 0 && state.count >= state.total) return;
    setIsLoadingMore(true);
    const nextPage = state.page + 1;
    const filterParam = state.activeChip === 'All' ? '' : `&filter=${encodeURIComponent(state.activeChip)}`;
    try {
      const res = await fetch(`/api/movies?page=${nextPage}&limit=20${filterParam}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setAllMovies(prev => {
          const existing = new Set(prev.map(m => m.id));
          const newItems = data.data.filter((m: Movie) => !existing.has(m.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab !== "dubbed") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const state = dubbedStateRef.current;
        if (entries[0].isIntersecting && !state.loading && state.total > 0 && state.count < state.total) {
          loadMoreMovies();
        }
      },
      { root: mainScrollRef.current, threshold: 0.05, rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mainTab, allMovies.length, totalMovies, loadMoreMovies]);

  // Fetch unique categories for Original Movies
  useEffect(() => {
    fetch('/api/original-movies?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          setOriginalChips(["All", ...data.categories]);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch filtered "Original Movies" when activeOriginalChip changes or when mainTab switches to "original"
  useEffect(() => {
    if (mainTab !== "original") return;
    const filterParam = activeOriginalChip === 'All' ? '' : `&filter=${encodeURIComponent(activeOriginalChip)}`;
    
    setOriginalPage(1);
    setIsLoadingMoreOriginal(true);
    fetch(`/api/original-movies?page=1&limit=20${filterParam}`)
      .then(res => res.json())
      .then(res => {
        setOriginalMovies(res.data || []);
        setTotalOriginalMovies(res.total || 0);
        if (res.categories && res.categories.length > 0) {
          setOriginalChips(["All", ...res.categories]);
        }
        setIsLoadingMoreOriginal(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingMoreOriginal(false);
      });
  }, [activeOriginalChip, mainTab]);

  // Stable state ref for Original Infinite Scroll (prevents tear-down/re-attach glitch)
  const originalStateRef = useRef({ page: originalPage, total: totalOriginalMovies, count: originalMovies.length, chip: activeOriginalChip, loading: isLoadingMoreOriginal });
  originalStateRef.current = { page: originalPage, total: totalOriginalMovies, count: originalMovies.length, chip: activeOriginalChip, loading: isLoadingMoreOriginal };

  // Infinite Scroll logic for Original Movies
  const originalSentinelRef = useRef<HTMLDivElement>(null);

  const loadMoreOriginalMovies = useCallback(async () => {
    const state = originalStateRef.current;
    if (state.loading) return;
    if (state.total > 0 && state.count >= state.total) return;
    setIsLoadingMoreOriginal(true);
    const nextPage = state.page + 1;
    const filterParam = state.chip === 'All' ? '' : `&filter=${encodeURIComponent(state.chip)}`;
    try {
      const res = await fetch(`/api/original-movies?page=${nextPage}&limit=20${filterParam}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setOriginalMovies(prev => {
          const existing = new Set(prev.map(m => m.id));
          const newItems = data.data.filter((m: Movie) => !existing.has(m.id));
          return [...prev, ...newItems];
        });
        setOriginalPage(nextPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMoreOriginal(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab !== "original") return;
    const sentinel = originalSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const state = originalStateRef.current;
        if (entries[0].isIntersecting && !state.loading && state.total > 0 && state.count < state.total) {
          loadMoreOriginalMovies();
        }
      },
      { root: mainScrollRef.current, threshold: 0.05, rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mainTab, originalMovies.length, totalOriginalMovies, loadMoreOriginalMovies]);

  // Fetch unique categories for Web Series
  useEffect(() => {
    fetch('/api/web-series?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          setWebSeriesChips(["All", ...data.categories]);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch filtered Web Series when activeWebSeriesChip changes or when mainTab switches to "webseries"
  useEffect(() => {
    if (mainTab !== "webseries") return;
    const categoryParam = activeWebSeriesChip === 'All' ? '' : `&category=${encodeURIComponent(activeWebSeriesChip)}`;
    
    setWebSeriesPage(1);
    setIsLoadingMoreWebSeries(true);
    fetch(`/api/web-series?page=1&limit=20${categoryParam}`)
      .then(res => res.json())
      .then(res => {
        setWebSeriesList(res.data || []);
        setTotalWebSeries(res.total || 0);
        if (res.categories && res.categories.length > 0) {
          setWebSeriesChips(["All", ...res.categories]);
        }
        setIsLoadingMoreWebSeries(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingMoreWebSeries(false);
      });
  }, [activeWebSeriesChip, mainTab]);

  // Stable state ref for Web Series Infinite Scroll (prevents tear-down/re-attach glitch)
  const webSeriesStateRef = useRef({ page: webSeriesPage, total: totalWebSeries, count: webSeriesList.length, chip: activeWebSeriesChip, loading: isLoadingMoreWebSeries });
  webSeriesStateRef.current = { page: webSeriesPage, total: totalWebSeries, count: webSeriesList.length, chip: activeWebSeriesChip, loading: isLoadingMoreWebSeries };

  // Infinite Scroll logic for Web Series
  const webSeriesSentinelRef = useRef<HTMLDivElement>(null);

  const loadMoreWebSeries = useCallback(async () => {
    const state = webSeriesStateRef.current;
    if (state.loading) return;
    if (state.total > 0 && state.count >= state.total) return;
    setIsLoadingMoreWebSeries(true);
    const nextPage = state.page + 1;
    const categoryParam = state.chip === 'All' ? '' : `&category=${encodeURIComponent(state.chip)}`;
    try {
      const res = await fetch(`/api/web-series?page=${nextPage}&limit=20${categoryParam}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setWebSeriesList(prev => {
          const existing = new Set(prev.map(s => s.id));
          const newItems = data.data.filter((s: WebSeriesShow) => !existing.has(s.id));
          return [...prev, ...newItems];
        });
        setWebSeriesPage(nextPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMoreWebSeries(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab !== "webseries") return;
    const sentinel = webSeriesSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const state = webSeriesStateRef.current;
        if (entries[0].isIntersecting && !state.loading && state.total > 0 && state.count < state.total) {
          loadMoreWebSeries();
        }
      },
      { root: mainScrollRef.current, threshold: 0.05, rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mainTab, webSeriesList.length, totalWebSeries, loadMoreWebSeries]);

  // Failsafe scroll listener to guarantee infinite scrolling continues smoothly even if IntersectionObserver misses a frame
  const handleMainScroll = useCallback(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 600) {
      if (mainTab === "dubbed") {
        const state = dubbedStateRef.current;
        if (!state.loading && state.total > 0 && state.count < state.total) {
          loadMoreMovies();
        }
      } else if (mainTab === "original") {
        const state = originalStateRef.current;
        if (!state.loading && state.total > 0 && state.count < state.total) {
          loadMoreOriginalMovies();
        }
      } else if (mainTab === "webseries") {
        const state = webSeriesStateRef.current;
        if (!state.loading && state.total > 0 && state.count < state.total) {
          loadMoreWebSeries();
        }
      }
    }
  }, [mainTab, loadMoreMovies, loadMoreOriginalMovies, loadMoreWebSeries]);

  // Debounced Search logic (Tab aware)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        let endpoint = `/api/movies?q=${encodeURIComponent(searchQuery)}&limit=10`;
        if (mainTab === 'original') {
          endpoint = `/api/original-movies?q=${encodeURIComponent(searchQuery)}&limit=10`;
        } else if (mainTab === 'webseries') {
          endpoint = `/api/web-series?search=${encodeURIComponent(searchQuery)}&limit=10`;
        }
        const res = await fetch(endpoint);
        const data = await res.json();
        if (mainTab === 'webseries') {
          const mapped = (data.data || []).map((s: WebSeriesShow) => ({
            id: s.id,
            tmdbId: s.tmdbId,
            title: s.title,
            image: s.poster,
            rating: s.rating || '9.0',
            genre: s.genre || 'Hindi Web Series',
            category: s.category || 'Hindi Web Series',
            duration: `${s.totalSeasons || 1} Seasons`,
            overview: s.overview,
            type: 'webseries'
          }));
          setSearchSuggestions(mapped);
        } else {
          setSearchSuggestions(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, mainTab]);

  return (
    <div className="relative w-full max-w-[430px] sm:max-w-[460px] mx-auto h-[100dvh] bg-white text-slate-900 shadow-[0_0_60px_rgba(85,60,251,0.08)] border-x border-purple-100/50 overflow-hidden flex flex-col font-sans">
      
      {/* Video Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <video 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
              onEnded={() => setShowSplash(false)}
            >
              <source src="/video-logo.mp4" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>

      {viewingCategory ? (
        // Category Detail View ("See All")
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex items-center px-5 py-3.5 border-b border-purple-100/70 bg-white z-10 sticky top-0 shadow-[0_2px_12px_rgba(85,60,251,0.04)]">
            <button 
              onClick={() => setViewingCategory(null)} 
              className="mr-3 p-1.5 rounded-full bg-[#f8f9fe] hover:bg-purple-100/60 text-gray-700 hover:text-[#553cfb] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">{viewingCategory.title}</h2>
              <p className="text-[11px] text-[#553cfb] font-medium">{viewingCategory.data.length} movies available</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar overscroll-y-contain transform-gpu">
            <div className="grid grid-cols-2 gap-3.5 pb-10">
              {viewingCategory.data.map((movie) => (
                <div 
                  key={movie.id} 
                  className="cursor-pointer flex flex-col group active:scale-[0.98] transition-transform" 
                  onClick={() => setSelectedMovie(movie)}
                >
                  <div className="relative aspect-[2/3] w-full rounded-[22px] overflow-hidden mb-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 bg-placeholder group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                    {movie.image && (
                      <Image 
                        src={movie.image} 
                        alt={movie.title} 
                        fill 
                        sizes="(max-width: 640px) 45vw, 200px"
                        loading="lazy"
                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    {movie.rating && (
                      <div className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {movie.rating}
                      </div>
                    )}
                    {movie.quality && (
                      <div className="absolute bottom-2 left-2 bg-[#553cfb] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                        {movie.quality}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#553cfb] transition-colors">
                    {movie.title.replace(/\s\(\d{4}\).*$/, '')}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{movie.genre || "HD Movie"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Main Dashboard with High Performance Sticky Search Bar
        <div 
          ref={mainScrollRef} 
          onScroll={handleMainScroll}
          className="flex-1 overflow-y-auto px-5 pt-0 pb-12 hide-scrollbar overscroll-y-contain transform-gpu [will-change:scroll-position]"
        >
          
          {/* Top Brand Logo Header with Live Views Counter */}
          <div className="flex items-center justify-between pt-3 pb-2.5 px-0.5">
            <div className="relative h-9 w-32">
              <Image
                src="/logoh.png"
                alt="MovieMela"
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-full bg-[#f8f9fe] hover:bg-purple-100/60 border border-purple-100 flex items-center justify-center text-gray-700 hover:text-[#553cfb] transition-all cursor-pointer shadow-2xs active:scale-95"
                aria-label="Open Navigation Menu"
                title="Menu"
              >
                <Menu className="w-5 h-5 text-gray-700 hover:text-[#553cfb] transition-colors" />
              </button>
            </div>
          </div>

          {/* STICKY SEARCH BAR PARENT - 100% Solid White Background from Top 0 (Zero Bleed-Through) */}
          {/* STICKY SEARCH & TABS CONTAINER - 100% Solid White Background from Top 0 */}
          <div className="sticky top-0 z-30 bg-white transform-gpu pt-2 pb-2.5 -mx-5 px-5 border-b border-purple-100/70 shadow-[0_4px_20px_rgba(85,60,251,0.05)]">
            {/* Row 1: Search Bar + Filter Icon Button */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                {/* Classy Animated Shining Line Border Container */}
                <div className="relative rounded-full p-[1.5px] overflow-hidden isolate group shadow-[0_2px_14px_rgba(85,60,251,0.06)] hover:shadow-[0_4px_22px_rgba(85,60,251,0.12)] focus-within:shadow-[0_4px_24px_rgba(85,60,251,0.16)] transition-all duration-300">
                  {/* Static elegant base border track */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-200/90 via-purple-100/60 to-purple-200/90" />

                  {/* Animated Shining Line Beam (Smooth Conic Gradient Sweep) */}
                  <div 
                    className="absolute left-1/2 top-1/2 w-[700px] h-[700px] animate-shining-border pointer-events-none"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(85,60,251,0.2) 295deg, #553cfb 320deg, #9333ea 342deg, #ffffff 357deg, #553cfb 360deg)",
                    }}
                  />

                  {/* Glowing Aura Blur behind Shining Line */}
                  <div 
                    className="absolute left-1/2 top-1/2 w-[700px] h-[700px] animate-shining-border pointer-events-none blur-[4px] opacity-70"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, #553cfb 320deg, #9333ea 342deg, #ffffff 357deg, #553cfb 360deg)",
                    }}
                  />

                  {/* Inner Search Bar Body (Crisp White with Classy Accent) */}
                  <div className="relative flex items-center bg-white hover:bg-[#fafbff] focus-within:bg-white rounded-full px-3.5 py-2.5 transition-all">
                    <Search className="text-[#553cfb] w-4 h-4 mr-2 flex-shrink-0 transition-transform group-focus-within:scale-110" />
                    <input
                      type="text"
                      placeholder="Search movies, series, actors..."
                      className="bg-transparent flex-1 outline-none text-[13.5px] font-medium placeholder:text-gray-400 text-gray-800 min-w-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => {
                          setSearchQuery("");
                          setSearchSuggestions([]);
                        }}
                        className="w-5 h-5 rounded-full bg-purple-50 text-gray-500 flex items-center justify-center hover:bg-purple-100 hover:text-gray-800 transition-colors mr-1 cursor-pointer flex-shrink-0"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <div className="w-px h-3.5 bg-purple-200/70 mx-1.5 flex-shrink-0"></div>
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#553cfb] border-t-transparent flex-shrink-0"></div>
                    ) : (
                      <Mic className="text-gray-400 hover:text-[#553cfb] w-4 h-4 flex-shrink-0 cursor-pointer transition-colors" />
                    )}
                  </div>
                </div>

                {/* Floating Search Suggestions Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(85,60,251,0.16)] z-40 border border-purple-100/90 max-h-72 overflow-y-auto divide-y divide-purple-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-purple-50/70 border-b border-purple-100/60 text-[11px] font-bold text-gray-500 sticky top-0 bg-white z-10">
                      <span>{mainTab === 'dubbed' ? 'Dubbed Movies' : mainTab === 'original' ? 'Original Movies' : 'Web Series'} Results</span>
                      <button 
                        onClick={() => {
                          setSearchQuery("");
                          setSearchSuggestions([]);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Close
                      </button>
                    </div>
                    {searchSuggestions.length > 0 ? (
                      searchSuggestions.map((movie) => (
                        <div
                          key={movie.id}
                          className="flex items-center gap-3 p-3 hover:bg-purple-50/60 cursor-pointer transition-colors"
                          onClick={() => {
                            if (movie.type === 'webseries' || movie.id.startsWith('series_')) {
                              const foundSeries = webSeriesList.find(s => s.id === movie.id || s.tmdbId === movie.tmdbId);
                              if (foundSeries) {
                                setSelectedSeriesForEpisodes(foundSeries);
                                setActiveSeasonNumber(foundSeries.seasons?.[0]?.seasonNumber || 1);
                              } else {
                                fetch(`/api/web-series?id=${movie.id}`)
                                  .then(r => r.json())
                                  .then(d => {
                                    if (d.series) {
                                      setSelectedSeriesForEpisodes(d.series);
                                      setActiveSeasonNumber(d.series.seasons?.[0]?.seasonNumber || 1);
                                    }
                                  })
                                  .catch(() => {});
                              }
                            } else {
                              setSelectedMovie(movie);
                            }
                            setSearchQuery("");
                            setSearchSuggestions([]);
                          }}
                        >
                          <div className="relative w-11 h-15 rounded-xl overflow-hidden flex-shrink-0 bg-placeholder shadow-xs border border-purple-100/60">
                            {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-gray-900 truncate leading-snug">{movie.title}</h4>
                            <p className="text-[11px] text-[#553cfb] font-medium truncate mt-0.5">{movie.genre || "Cinema"}</p>
                          </div>
                          {movie.rating && (
                            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 flex-shrink-0">
                              ★ {movie.rating}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      !isSearching && <div className="p-4 text-center text-[13px] text-gray-500 font-medium">No results found matching "{searchQuery}"</div>
                    )}
                  </div>
                )}
              </div>

              {/* Filter Icon Button (opens Category Bottom Sheet) */}
              <button
                onClick={() => setShowCategorySheet(true)}
                className={clsx(
                  "relative w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 shadow-2xs active:scale-95",
                  (mainTab === "dubbed" ? activeChip !== "All" : mainTab === "original" ? activeOriginalChip !== "All" : activeWebSeriesChip !== "All")
                    ? "bg-gradient-to-tr from-[#553cfb] to-[#7b46fa] text-white shadow-[0_4px_14px_rgba(85,60,251,0.35)]"
                    : "bg-[#f8f9fe] hover:bg-purple-100/70 text-gray-700 hover:text-[#553cfb] border border-purple-100"
                )}
                aria-label="Filter Categories"
                title="Filter by Category"
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
                {(mainTab === "dubbed" ? activeChip !== "All" : mainTab === "original" ? activeOriginalChip !== "All" : activeWebSeriesChip !== "All") && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Row 2: 3 Sliding Tabs (Dubbed Movies vs Original Movies vs Web Series) */}
            <div className="mt-2.5 p-1 bg-[#f4f5fa] rounded-[20px] flex relative border border-purple-100/60">
              {/* Tab 1: Dubbed Movies */}
              <button
                onClick={() => handleTabSwitch("dubbed")}
                className={clsx(
                  "relative flex-1 py-2 rounded-[16px] text-[12px] sm:text-[13px] font-bold transition-colors z-10 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
                  mainTab === "dubbed" ? "text-[#553cfb]" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {mainTab === "dubbed" && (
                  <motion.div
                    layoutId="activeMainTabPill"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                    className="absolute inset-0 bg-white rounded-[16px] shadow-[0_2px_10px_rgba(85,60,251,0.12)] border border-purple-100/80 -z-10"
                  />
                )}
                <Film className="w-3.5 h-3.5" />
                <span>Dubbed</span>
              </button>

              {/* Tab 2: Original Movies */}
              <button
                onClick={() => handleTabSwitch("original")}
                className={clsx(
                  "relative flex-1 py-2 rounded-[16px] text-[12px] sm:text-[13px] font-bold transition-colors z-10 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
                  mainTab === "original" ? "text-[#553cfb]" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {mainTab === "original" && (
                  <motion.div
                    layoutId="activeMainTabPill"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                    className="absolute inset-0 bg-white rounded-[16px] shadow-[0_2px_10px_rgba(85,60,251,0.12)] border border-purple-100/80 -z-10"
                  />
                )}
                <Sparkles className="w-3.5 h-3.5" />
                <span>Original</span>
              </button>

              {/* Tab 3: Web Series */}
              <button
                onClick={() => handleTabSwitch("webseries")}
                className={clsx(
                  "relative flex-1 py-2 rounded-[16px] text-[12px] sm:text-[13px] font-bold transition-colors z-10 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
                  mainTab === "webseries" ? "text-[#553cfb]" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {mainTab === "webseries" && (
                  <motion.div
                    layoutId="activeMainTabPill"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                    className="absolute inset-0 bg-white rounded-[16px] shadow-[0_2px_10px_rgba(85,60,251,0.12)] border border-purple-100/80 -z-10"
                  />
                )}
                <Tv className="w-3.5 h-3.5" />
                <span>Web Series</span>
              </button>
            </div>

            {/* Active Category Filter Indicator */}
            {((mainTab === "dubbed" && activeChip !== "All") || (mainTab === "original" && activeOriginalChip !== "All") || (mainTab === "webseries" && activeWebSeriesChip !== "All")) && (
              <div className="flex items-center justify-between mt-2 pt-0.5 px-0.5">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500">
                  <span>Showing:</span>
                  <span className="bg-[#553cfb]/10 text-[#553cfb] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    {mainTab === "dubbed" ? activeChip : mainTab === "original" ? activeOriginalChip : activeWebSeriesChip}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (mainTab === "dubbed") setActiveChip("All");
                    else if (mainTab === "original") setActiveOriginalChip("All");
                    else setActiveWebSeriesChip("All");
                  }}
                  className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* MAIN TAB CONTENT */}
          {mainTab === "dubbed" ? (
            /* Dubbed Movies Grid (Direct Clean Grid) */
            <div className="mt-4 pb-10">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-5 rounded-full bg-[#553cfb]"></div>
                  <h3 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                    {activeChip === "All" ? "All Movies" : activeChip} {totalMovies > 0 && <span className="text-[13px] font-normal text-gray-400">({totalMovies})</span>}
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold text-[#553cfb] bg-[#553cfb]/10 px-2.5 py-0.5 rounded-full">
                  Live Catalog
                </span>
              </div>

              {allMovies.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {allMovies.map((movie) => (
                    <div 
                      key={movie.id} 
                      className="cursor-pointer flex flex-col group active:scale-[0.98] transition-transform" 
                      onClick={() => setSelectedMovie(movie)}
                    >
                      <div className="relative aspect-[2/3] w-full rounded-[22px] overflow-hidden mb-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 bg-placeholder group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                        {movie.image && (
                          <Image 
                            src={movie.image} 
                            alt={movie.title} 
                            fill 
                            sizes="(max-width: 640px) 45vw, 200px"
                            loading="lazy"
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        {movie.rating && (
                          <div className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {movie.rating}
                          </div>
                        )}
                        {movie.quality && (
                          <div className="absolute bottom-2 left-2 bg-[#553cfb] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                            {movie.quality}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#553cfb] transition-colors">
                        {movie.title.replace(/\s\(\d{4}\).*$/, '')}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{movie.genre || "Movie"}</p>
                    </div>
                  ))}
                </div>
              ) : !isLoadingMore ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-full border border-purple-100 flex items-center justify-center mb-3 text-[#553cfb]">
                    <Film className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">No movies found</h4>
                  <p className="text-xs text-gray-400">Try choosing a different category or clearing filters.</p>
                </div>
              ) : null}
              
              {/* Infinite Scroll Sentinel - Triggers loading asynchronously */}
              {allMovies.length < totalMovies && totalMovies > 0 && (
                <div ref={sentinelRef} className="py-6 flex flex-col justify-center items-center">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-7 w-7 border-3 border-[#553cfb] border-t-transparent"></div>
                      <span className="text-[12px] text-gray-400 font-medium mt-2">Loading more titles...</span>
                    </div>
                  ) : (
                    <div className="h-6 w-full" />
                  )}
                </div>
              )}
              {totalMovies > 0 && allMovies.length >= totalMovies && (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  ✨ You've reached the end of dubbed movies
                </div>
              )}
            </div>
          ) : mainTab === "original" ? (
            /* Original Movies Grid & Continue Watching */
            <div className="mt-4 pb-10">
              {/* Continue Watching Section (Netflix Style with Progress & Resume) */}
              {watchHistoryList.length > 0 && (
                <div className="mb-6 bg-gradient-to-b from-purple-50/50 via-white to-transparent p-3 rounded-[24px] border border-purple-100/70 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight flex items-center gap-1.5">
                          Continue Watching
                          <span className="text-[10px] font-extrabold text-white bg-gradient-to-r from-[#553cfb] to-[#7b46fa] px-2 py-0.5 rounded-full shadow-2xs">
                            {watchHistoryList.length}
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">Pick up right where you left off</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Clear all continue watching history?")) {
                          clearWatchHistory();
                        }
                      }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Horizontal Scroll Cards */}
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 pt-0.5 -mx-1 px-1">
                    {watchHistoryList.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex-shrink-0 w-[140px] group cursor-pointer active:scale-98 transition-transform"
                        onClick={() => handleStartStreaming(item)}
                      >
                        <div className="relative aspect-[2/3] w-full rounded-[18px] overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.12)] border border-purple-100/80 bg-gray-950">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="140px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#553cfb]/10 text-[#553cfb]">
                              <Film className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                          {/* Center Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-[#553cfb]/90 hover:bg-[#553cfb] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWatchHistoryItem(item.id);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/65 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Bottom Progress Bar & Indicator */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 pt-0">
                            <div className="flex items-center justify-between text-[9.5px] font-bold text-white mb-1">
                              <span className="text-emerald-400 font-extrabold">{item.progressPercent}% watched</span>
                              <span className="text-gray-300 text-[9px]">{item.duration || "Cinema"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#553cfb] via-[#7b46fa] to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(8, item.progressPercent))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <h4 className="font-bold text-[12px] text-gray-900 leading-snug line-clamp-1 mt-1.5 group-hover:text-[#553cfb] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10.5px] text-gray-500 line-clamp-1">
                          {item.category || item.genre || "Original Cinema"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-5 rounded-full bg-gradient-to-b from-[#553cfb] to-[#7b46fa]"></div>
                  <h3 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                    {activeOriginalChip === "All" ? "Original Movies" : `${activeOriginalChip} Cinema`} {totalOriginalMovies > 0 && <span className="text-[13px] font-normal text-gray-400">({totalOriginalMovies})</span>}
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold text-white bg-gradient-to-r from-[#553cfb] to-[#7b46fa] px-2.5 py-0.5 rounded-full shadow-2xs">
                  Streaming Live
                </span>
              </div>

              {originalMovies.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {originalMovies.map((movie) => (
                    <div 
                      key={movie.id} 
                      className="cursor-pointer flex flex-col group active:scale-[0.98] transition-transform" 
                      onClick={() => setSelectedMovie(movie)}
                    >
                      <div className="relative aspect-[2/3] w-full rounded-[22px] overflow-hidden mb-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 bg-placeholder group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                        {movie.image ? (
                          <Image 
                            src={movie.image} 
                            alt={movie.title} 
                            fill 
                            sizes="(max-width: 640px) 45vw, 200px"
                            loading="lazy"
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-400">
                            <Film className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        {movie.rating && (
                          <div className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {movie.rating}
                          </div>
                        )}
                        {movie.languageCode && (
                          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-[#553cfb] to-[#7b46fa] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs uppercase">
                            {movie.category || movie.languageCode}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#553cfb] transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{movie.duration ? `${movie.duration} • ` : ""}{movie.category || "Original Cinema"}</p>
                    </div>
                  ))}
                </div>
              ) : !isLoadingMoreOriginal ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-full border border-purple-100 flex items-center justify-center mb-3 text-[#553cfb]">
                    <Film className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">No original movies found</h4>
                  <p className="text-xs text-gray-400">Try choosing another category or import new original movies in /admin.</p>
                </div>
              ) : null}
              
              {/* Infinite Scroll Sentinel for Original Movies */}
              {originalMovies.length < totalOriginalMovies && totalOriginalMovies > 0 && (
                <div ref={originalSentinelRef} className="py-6 flex flex-col justify-center items-center">
                  {isLoadingMoreOriginal ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-7 w-7 border-3 border-[#553cfb] border-t-transparent"></div>
                      <span className="text-[12px] text-gray-400 font-medium mt-2">Loading more original titles...</span>
                    </div>
                  ) : (
                    <div className="h-6 w-full" />
                  )}
                </div>
              )}
              {totalOriginalMovies > 0 && originalMovies.length >= totalOriginalMovies && (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  ✨ You've reached the end of original movies
                </div>
              )}
            </div>
          ) : (
            /* Web Series Grid */
            <div className="mt-4 pb-10">
              {/* Continue Watching Section for Web Series */}
              {watchHistoryList.length > 0 && (
                <div className="mb-6 bg-gradient-to-b from-purple-50/50 via-white to-transparent p-3 rounded-[24px] border border-purple-100/70 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight flex items-center gap-1.5">
                          Continue Watching
                          <span className="text-[10px] font-extrabold text-white bg-gradient-to-r from-[#553cfb] to-[#7b46fa] px-2 py-0.5 rounded-full shadow-2xs">
                            {watchHistoryList.length}
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">Pick up right where you left off</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Clear all continue watching history?")) {
                          clearWatchHistory();
                        }
                      }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Horizontal Scroll Cards */}
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 pt-0.5 -mx-1 px-1">
                    {watchHistoryList.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex-shrink-0 w-[140px] group cursor-pointer active:scale-98 transition-transform"
                        onClick={() => handleStartStreaming(item)}
                      >
                        <div className="relative aspect-[2/3] w-full rounded-[18px] overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.12)] border border-purple-100/80 bg-gray-950">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="140px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#553cfb]/10 text-[#553cfb]">
                              <Tv className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                          {/* Center Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-[#553cfb]/90 hover:bg-[#553cfb] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWatchHistoryItem(item.id);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/65 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Bottom Progress Bar & Indicator */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 pt-0">
                            <div className="flex items-center justify-between text-[9.5px] font-bold text-white mb-1">
                              <span className="text-emerald-400 font-extrabold">{item.progressPercent}% watched</span>
                              <span className="text-gray-300 text-[9px]">{item.duration || "Cinema"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#553cfb] via-[#7b46fa] to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(8, item.progressPercent))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <h4 className="font-bold text-[12px] text-gray-900 leading-snug line-clamp-1 mt-1.5 group-hover:text-[#553cfb] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10.5px] text-gray-500 line-clamp-1">
                          {item.category || item.genre || "Hindi Web Series"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                  <h3 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                    {activeWebSeriesChip === "All" ? "Web Series" : activeWebSeriesChip} {totalWebSeries > 0 && <span className="text-[13px] font-normal text-gray-400">({totalWebSeries})</span>}
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Hindi Web Series
                </span>
              </div>

              {webSeriesList.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {webSeriesList.map((series) => (
                    <div 
                      key={series.id} 
                      className="cursor-pointer flex flex-col group active:scale-[0.98] transition-transform" 
                      onClick={() => {
                        setSelectedSeriesForEpisodes(series);
                        setActiveSeasonNumber(series.seasons?.[0]?.seasonNumber || 1);
                      }}
                    >
                      <div className="relative aspect-[2/3] w-full rounded-[22px] overflow-hidden mb-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 bg-placeholder group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                        {series.poster ? (
                          <Image 
                            src={series.poster} 
                            alt={series.title} 
                            fill 
                            sizes="(max-width: 640px) 45vw, 200px"
                            loading="lazy"
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-400">
                            <Tv className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        
                        {series.rating && (
                          <div className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {series.rating}
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 bg-[#553cfb]/90 text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
                          <Tv className="w-2.5 h-2.5" /> Series
                        </div>
                        
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <div className="bg-black/70 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-white/10">
                            {series.totalSeasons} {series.totalSeasons === 1 ? 'Season' : 'Seasons'} • {series.totalEpisodes} Eps
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#553cfb] transition-colors">
                        {series.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {series.category || series.genre || "Hindi Web Series"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : !isLoadingMoreWebSeries ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-full border border-purple-100 flex items-center justify-center mb-3 text-[#553cfb]">
                    <Tv className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">No web series found</h4>
                  <p className="text-xs text-gray-400">Import web series HTML rows in /admin to see them here.</p>
                </div>
              ) : null}

              {/* Infinite Scroll Sentinel for Web Series */}
              {webSeriesList.length < totalWebSeries && totalWebSeries > 0 && (
                <div ref={webSeriesSentinelRef} className="py-6 flex flex-col justify-center items-center">
                  {isLoadingMoreWebSeries ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-7 w-7 border-3 border-[#553cfb] border-t-transparent"></div>
                      <span className="text-[12px] text-gray-400 font-medium mt-2">Loading more series...</span>
                    </div>
                  ) : (
                    <div className="h-6 w-full" />
                  )}
                </div>
              )}
              {totalWebSeries > 0 && webSeriesList.length >= totalWebSeries && (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  ✨ You've reached the end of web series
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movie Details Popup Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0c1021]/65 backdrop-blur-sm z-40"
              onClick={() => { setSelectedMovie(null); setShowDownloadOptions(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[34px] z-50 p-6 pt-5 shadow-[0_-10px_40px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh] border-t border-purple-100"
            >
              {/* Grab handle */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 flex-shrink-0"></div>

              <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
                <button
                  onClick={() => setShowShareSheet(true)}
                  className="w-8 h-8 bg-[#f5f6f8] hover:bg-purple-100/60 text-gray-600 hover:text-[#553cfb] rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  aria-label="Share movie"
                  title="Share movie"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => {
                    if (showDownloadOptions || showPremiumPopup) {
                      setShowDownloadOptions(false);
                      setShowPremiumPopup(false);
                    } else {
                      setSelectedMovie(null);
                    }
                  }}
                  className="w-8 h-8 bg-[#f5f6f8] rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {showPremiumPopup ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-5 border border-purple-100">
                    <Lock className="w-9 h-9 text-[#553cfb]" />
                  </div>
                  <h2 className="text-[22px] font-extrabold text-gray-900 mb-2">Premium Streaming</h2>
                  <p className="text-[14px] text-gray-500 mb-8 max-w-[280px] leading-relaxed">
                    Watching movies directly online is available for VIP members. You can still download in HD!
                  </p>
                  
                  <button 
                    onClick={() => setShowPremiumPopup(false)}
                    className="w-full bg-[#f8f9fe] text-gray-800 rounded-[18px] py-3.5 font-bold text-[14px] hover:bg-purple-100/50 transition-colors cursor-pointer"
                  >
                    Back to Movie
                  </button>
                </div>
              ) : showDownloadOptions ? (
                <div className="flex flex-col h-[50dvh] overflow-y-auto hide-scrollbar">
                  <div className="mb-4 pr-10">
                    <h2 className="text-[19px] font-extrabold text-gray-900 leading-tight">
                      {selectedAction === "watch" ? "Select Streaming Quality" : "Select Download Server & Quality"}
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {selectedAction === "watch"
                        ? "Fast buffering & high speed streaming"
                        : "High-speed verified download servers"}
                    </p>
                  </div>
                  
                  {selectedMovie.downloadLinks && selectedMovie.downloadLinks.length > 0 ? (
                    <div className="flex flex-col gap-2.5 pb-6">
                      {selectedMovie.downloadLinks.map((link, idx) => (
                        <Link 
                          key={idx}
                          href={`/download?url=${encodeURIComponent(link.url)}&name=${encodeURIComponent(link.label)}&movie=${encodeURIComponent(selectedMovie.title)}&image=${encodeURIComponent(selectedMovie.image || '')}&quality=${encodeURIComponent(selectedMovie.quality || '')}&mode=${selectedAction}`}
                          className="w-full bg-[#f8f9fe] border border-purple-100/70 p-3.5 rounded-[18px] flex items-center justify-between hover:bg-purple-50 hover:border-[#553cfb]/40 transition-all group cursor-pointer"
                        >
                          <div className="text-[13.5px] font-bold text-gray-800 break-words line-clamp-2 mr-3 group-hover:text-[#553cfb] transition-colors">
                            {link.label.replace(/^[^a-zA-Z0-9]+/, '')}
                          </div>
                          <div className="bg-gradient-to-r from-[#553cfb] to-[#7b46fa] group-hover:brightness-110 p-2.5 rounded-full flex-shrink-0 shadow-xs transition-transform group-hover:scale-105">
                            {selectedAction === "watch" ? (
                              <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center mt-10">No download servers found for this movie.</div>
                  )}
                  
                  <button 
                    onClick={() => setShowDownloadOptions(false)}
                    className="w-full mt-auto mb-2 bg-[#f8f9fe] text-gray-700 rounded-[18px] py-3.5 font-bold text-[14px] hover:bg-purple-100/50 transition-colors cursor-pointer"
                  >
                    Back to Details
                  </button>
                </div>
              ) : (
                <div className="flex flex-col overflow-y-auto hide-scrollbar">
                  <div className="flex gap-4 mb-5">
                    <div className="relative w-[110px] h-[155px] rounded-[20px] overflow-hidden flex-shrink-0 shadow-md bg-placeholder border border-purple-100/60">
                      {selectedMovie.image && <Image src={selectedMovie.image} alt={selectedMovie.title} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 pt-0 pr-8">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {selectedMovie.quality && (
                          <span className="bg-[#553cfb] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            {selectedMovie.quality}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 border border-amber-200/60 text-amber-700 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {selectedMovie.rating}
                        </span>
                        {selectedMovie.duration && (
                          <span className="text-[11px] text-gray-500 font-medium">{selectedMovie.duration}</span>
                        )}
                      </div>
                      <h2 className="text-[18px] font-extrabold leading-snug text-gray-900 mb-1.5">
                        {selectedMovie.title.split(')')[0]}{selectedMovie.title.includes(')') ? ')' : ''}
                        {selectedMovie.title.split(')')[1] && <><br/><span className="text-gray-600 text-[14px] font-bold">{selectedMovie.title.split(')')[1].trim()}</span></>}
                      </h2>
                      <p className="text-[12px] text-[#553cfb] font-bold mb-1 line-clamp-1">{selectedMovie.genre}</p>
                      {selectedMovie.releaseDate && (
                        <p className="text-[11px] text-gray-500 font-medium">Release: <span className="text-gray-700 font-semibold">{selectedMovie.releaseDate}</span></p>
                      )}
                    </div>
                  </div>

                  {selectedMovie.starcast && (
                    <div className="bg-[#f8f9fe] border border-purple-100/60 p-3.5 rounded-[18px] mb-4">
                      <h4 className="text-[10px] font-extrabold text-[#553cfb] uppercase tracking-wider mb-1">Starcast</h4>
                      <p className="text-[13px] font-semibold text-gray-800">{selectedMovie.starcast}</p>
                    </div>
                  )}

                  {selectedMovie.overview && (
                    <div className="mb-6">
                      <h4 className="text-[10px] font-extrabold text-[#553cfb] uppercase tracking-wider mb-1.5">Synopsis</h4>
                      <p className="text-[13px] text-gray-600 leading-relaxed">
                        {selectedMovie.overview}
                      </p>
                    </div>
                  )}

                  {selectedMovie.isOriginal ? (
                    <div className="flex items-center gap-2 pb-2 mt-auto">
                      <button 
                        onClick={() => {
                          handleStartStreaming(selectedMovie, 0);
                        }}
                        className="flex-1 bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white rounded-[18px] py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] transition-all shadow-[0_4px_16px_rgba(85,60,251,0.3)] cursor-pointer"
                      >
                        <Play className="w-4.5 h-4.5 fill-current ml-0.5" /> Watch Online Live
                      </button>
                      <button
                        onClick={() => setShowShareSheet(true)}
                        className="w-[50px] h-[50px] rounded-[18px] bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 flex items-center justify-center text-[#553cfb] transition-all active:scale-95 cursor-pointer shadow-2xs flex-shrink-0"
                        aria-label="Share movie"
                        title="Share movie with friends"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pb-2 mt-auto">
                      <button 
                        onClick={() => {
                          setSelectedAction("download");
                          setShowDownloadOptions(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white rounded-[18px] py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] transition-all shadow-[0_4px_16px_rgba(85,60,251,0.3)] cursor-pointer"
                      >
                        <Download className="w-4.5 h-4.5" /> Download in HD
                      </button>
                      <button
                        onClick={() => setShowShareSheet(true)}
                        className="w-[50px] h-[50px] rounded-[18px] bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 flex items-center justify-center text-[#553cfb] transition-all active:scale-95 cursor-pointer shadow-2xs flex-shrink-0"
                        aria-label="Share movie"
                        title="Share movie with friends"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Share Sheet Modal (WhatsApp, Instagram Story, Copy Link, More Apps) */}
      <AnimatePresence>
        {showShareSheet && selectedMovie && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 pb-8 z-10 shadow-2xl border-t sm:border border-purple-100"
            >
              {/* Grab handle for mobile */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-[#553cfb]">
                    <Share2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
                      {selectedMovie.type === 'webseries' || selectedMovie.id?.startsWith('series_') ? "Share Web Series" : "Share Movie"}
                    </h3>
                    <p className="text-[11.5px] text-gray-500 font-medium truncate max-w-[230px]">
                      {selectedMovie.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Share Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. WhatsApp Card Share */}
                <button
                  onClick={() => handleShareWhatsApp(selectedMovie)}
                  className="flex items-center gap-3 p-3.5 rounded-[20px] bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 rounded-[16px] bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-900 group-hover:text-emerald-900">WhatsApp</span>
                    <span className="block text-[10.5px] text-gray-500 truncate">Card preview</span>
                  </div>
                </button>

                {/* 2. Instagram Story Share (Poster + Link) */}
                <button
                  onClick={() => handleShareInstagramStory(selectedMovie)}
                  disabled={isSharing}
                  className="flex items-center gap-3 p-3.5 rounded-[20px] bg-pink-50/80 hover:bg-pink-100 border border-pink-200/80 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-2xs disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-[16px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {isSharing ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <InstagramIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-900 group-hover:text-pink-900">Insta Story</span>
                    <span className="block text-[10.5px] text-gray-500 truncate">Poster + Link</span>
                  </div>
                </button>

                {/* 3. Copy Direct Link */}
                <button
                  onClick={() => handleCopyLink(selectedMovie)}
                  className="flex items-center gap-3 p-3.5 rounded-[20px] bg-[#f8f9fe] hover:bg-purple-100/60 border border-purple-100 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 rounded-[16px] bg-gray-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Copy className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-900">Copy Link</span>
                    <span className="block text-[10.5px] text-gray-500 truncate">
                      {selectedMovie.type === 'webseries' || selectedMovie.id?.startsWith('series_') ? "Direct series URL" : "Direct movie URL"}
                    </span>
                  </div>
                </button>

                {/* 4. More Apps (Device Native Share) */}
                <button
                  onClick={() => handleShareNative(selectedMovie)}
                  className="flex items-center gap-3 p-3.5 rounded-[20px] bg-purple-50/80 hover:bg-purple-100 border border-purple-200/80 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 rounded-[16px] bg-[#553cfb] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-900 group-hover:text-[#553cfb]">More Apps</span>
                    <span className="block text-[10.5px] text-gray-500 truncate">Telegram, SMS, etc.</span>
                  </div>
                </button>
              </div>

              {/* Helpful hint */}
              <p className="text-[11px] text-gray-400 text-center mt-4">
                Tip: For Instagram Story, the movie link is copied so you can paste it in the Link sticker!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Filter Bottom Sheet Modal */}
      <AnimatePresence>
        {showCategorySheet && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategorySheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-[430px] sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-5 pb-8 z-10 shadow-2xl border-t sm:border border-purple-100 max-h-[85vh] flex flex-col"
            >
              {/* Grab handle */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 flex-shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-50 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-[#553cfb] to-[#7b46fa] flex items-center justify-center text-white shadow-xs">
                    <SlidersHorizontal className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight">Filter by Category</h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Select a category to explore movies
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCategorySheet(false)}
                  className="w-8 h-8 rounded-full bg-[#f8f9fe] hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category Options Grid */}
              <div className="flex-1 overflow-y-auto hide-scrollbar py-4 space-y-2 max-h-[50vh]">
                {(mainTab === "dubbed" ? chips : mainTab === "original" ? originalChips : webSeriesChips).map((chip) => {
                  const isSelected = (mainTab === "dubbed" ? activeChip : mainTab === "original" ? activeOriginalChip : activeWebSeriesChip) === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => {
                        if (mainTab === "dubbed") {
                          setActiveChip(chip);
                        } else if (mainTab === "original") {
                          setActiveOriginalChip(chip);
                        } else {
                          setActiveWebSeriesChip(chip);
                        }
                        setShowCategorySheet(false);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-3 rounded-[18px] text-[13.5px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]",
                        isSelected
                          ? "bg-gradient-to-r from-[#553cfb] to-[#7b46fa] text-white shadow-[0_4px_14px_rgba(85,60,251,0.25)]"
                          : "bg-[#f8f9fe] hover:bg-purple-50 text-gray-700 hover:text-[#553cfb] border border-purple-100/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={clsx(
                            "w-2 h-2 rounded-full",
                            isSelected ? "bg-white" : "bg-purple-300"
                          )}
                        />
                        <span>{chip === "All" ? (mainTab === "dubbed" ? "All Movies & Shows" : mainTab === "original" ? "All Original Movies" : "All Web Series") : chip}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reset / Footer */}
              {((mainTab === "dubbed" && activeChip !== "All") || (mainTab === "original" && activeOriginalChip !== "All") || (mainTab === "webseries" && activeWebSeriesChip !== "All")) && (
                <div className="pt-3 border-t border-purple-50 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (mainTab === "dubbed") setActiveChip("All");
                      else if (mainTab === "original") setActiveOriginalChip("All");
                      else setActiveWebSeriesChip("All");
                      setShowCategorySheet(false);
                    }}
                    className="w-full py-3 rounded-[16px] bg-[#f8f9fe] hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-[13px] border border-purple-100/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reset to All Categories</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Web Series Season & Episode Selector Drawer */}
      <AnimatePresence>
        {selectedSeriesForEpisodes && (
          <div className="fixed inset-0 z-[75] flex items-end justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSeriesForEpisodes(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-[430px] sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-5 pb-6 z-10 shadow-2xl border-t sm:border border-purple-100 max-h-[90vh] flex flex-col"
            >
              {/* Grab handle */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 flex-shrink-0" />

              {/* Show Header */}
              <div className="flex items-start justify-between pb-3 border-b border-purple-50 flex-shrink-0">
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="relative w-14 h-20 rounded-xl overflow-hidden shadow-xs border border-purple-100 flex-shrink-0 bg-gray-900">
                    {selectedSeriesForEpisodes.poster && (
                      <Image
                        src={selectedSeriesForEpisodes.poster}
                        alt={selectedSeriesForEpisodes.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#553cfb] px-2 py-0.5 rounded-full border border-purple-200">
                        {selectedSeriesForEpisodes.category || "Hindi Web Series"}
                      </span>
                      {selectedSeriesForEpisodes.rating && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          ⭐ {selectedSeriesForEpisodes.rating}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-gray-900 leading-tight line-clamp-2">
                      {selectedSeriesForEpisodes.title}
                    </h3>
                    <p className="text-[11.5px] text-gray-500 font-medium mt-1">
                      {selectedSeriesForEpisodes.totalSeasons} Seasons • {selectedSeriesForEpisodes.totalEpisodes} Total Episodes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      const seriesAsMovie: Movie = {
                        id: selectedSeriesForEpisodes.id,
                        tmdbId: selectedSeriesForEpisodes.tmdbId,
                        title: selectedSeriesForEpisodes.title,
                        image: selectedSeriesForEpisodes.poster,
                        rating: selectedSeriesForEpisodes.rating || '9.0',
                        genre: selectedSeriesForEpisodes.genre || selectedSeriesForEpisodes.category || 'Hindi Web Series',
                        category: selectedSeriesForEpisodes.category || 'Hindi Web Series',
                        duration: `${selectedSeriesForEpisodes.totalSeasons || 1} Seasons`,
                        overview: selectedSeriesForEpisodes.overview,
                        type: 'webseries',
                        isOriginal: false
                      };
                      setSelectedMovie(seriesAsMovie);
                      setShowShareSheet(true);
                    }}
                    className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 flex items-center justify-center text-[#553cfb] transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Share Web Series"
                    aria-label="Share Web Series"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedSeriesForEpisodes(null)}
                    className="w-8 h-8 rounded-full bg-[#f8f9fe] hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Season Selector Tabs */}
              {selectedSeriesForEpisodes.seasons && selectedSeriesForEpisodes.seasons.length > 0 && (
                <div className="py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-purple-50 flex-shrink-0">
                  {selectedSeriesForEpisodes.seasons.map((season) => {
                    const isSeasonActive = season.seasonNumber === activeSeasonNumber;
                    return (
                      <button
                        key={season.seasonNumber}
                        onClick={() => setActiveSeasonNumber(season.seasonNumber)}
                        className={clsx(
                          "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5",
                          isSeasonActive
                            ? "bg-gradient-to-r from-[#553cfb] to-[#7b46fa] text-white shadow-xs shadow-[#553cfb]/25"
                            : "bg-[#f8f9fe] text-gray-600 hover:bg-purple-50 hover:text-[#553cfb] border border-purple-100"
                        )}
                      >
                        <span>{season.name || `Season ${season.seasonNumber}`}</span>
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.2 rounded-full",
                          isSeasonActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                        )}>
                          {season.episodeCount || season.episodes?.length || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode List */}
              <div className="flex-1 overflow-y-auto hide-scrollbar py-3 space-y-3">
                {(() => {
                  const currentSeason = selectedSeriesForEpisodes.seasons?.find(
                    (s) => s.seasonNumber === activeSeasonNumber
                  ) || selectedSeriesForEpisodes.seasons?.[0];

                  if (!currentSeason || !currentSeason.episodes || currentSeason.episodes.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 text-xs font-medium">
                        No episodes available for this season.
                      </div>
                    );
                  }

                  return currentSeason.episodes.map((ep) => (
                    <div
                      key={ep.episodeNumber}
                      onClick={() => {
                        const tvMovie: Movie = {
                          id: `${selectedSeriesForEpisodes.id}_s${activeSeasonNumber}_e${ep.episodeNumber}`,
                          tmdbId: selectedSeriesForEpisodes.tmdbId,
                          title: `${selectedSeriesForEpisodes.title} - S0${activeSeasonNumber}E${ep.episodeNumber < 10 ? '0' : ''}${ep.episodeNumber}: ${ep.title}`,
                          image: ep.thumbnail || selectedSeriesForEpisodes.poster,
                          rating: ep.rating || selectedSeriesForEpisodes.rating || '9.0',
                          genre: selectedSeriesForEpisodes.genre || 'Hindi Web Series',
                          category: selectedSeriesForEpisodes.category || 'Hindi Web Series',
                          duration: ep.duration,
                          releaseDate: ep.airDate,
                          overview: ep.overview,
                          watchUrl: ep.streamUrl,
                          streamServers: ep.streamServers && ep.streamServers.length > 0 ? ep.streamServers : [
                            { name: "Vidme Fast (Ad-Free)", url: `https://vidzen.fun/tv/${selectedSeriesForEpisodes.tmdbId}/${activeSeasonNumber}/${ep.episodeNumber}?autoPlay=true` },
                            { name: "Vidcore Direct", url: `https://vidcore.io/tv/${selectedSeriesForEpisodes.tmdbId}/${activeSeasonNumber}/${ep.episodeNumber}?autoPlay=true` },
                            { name: "VidLink (Clean HD)", url: `https://vidlink.pro/tv/${selectedSeriesForEpisodes.tmdbId}/${activeSeasonNumber}/${ep.episodeNumber}?autoplay=true` },
                          ]
                        };
                        setSelectedSeriesForEpisodes(null);
                        setStreamingMovie(tvMovie);
                      }}
                      className="group cursor-pointer bg-[#f8f9fe] hover:bg-purple-50/70 border border-purple-100/70 rounded-2xl p-2.5 flex items-start gap-3 transition-all hover:shadow-xs active:scale-[0.99]"
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-gray-900 border border-purple-100/80 shadow-2xs">
                        {(ep.thumbnail || selectedSeriesForEpisodes.poster) && (
                          <Image
                            src={ep.thumbnail || selectedSeriesForEpisodes.poster}
                            alt={ep.title}
                            fill
                            sizes="130px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-white/90 group-hover:bg-[#553cfb] text-gray-900 group-hover:text-white flex items-center justify-center shadow-md transition-all group-hover:scale-110">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                        {ep.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                            {ep.duration}
                          </div>
                        )}
                      </div>

                      {/* Episode Info */}
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold text-[#553cfb] bg-[#553cfb]/10 px-1.5 py-0.2 rounded">
                            E{ep.episodeNumber}
                          </span>
                          {ep.airDate && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              {ep.airDate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[12.5px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#553cfb] transition-colors">
                          {ep.title}
                        </h4>
                        {ep.overview && (
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Streaming Cinema Player Modal (Netflix/Hotstar Style - Zero Popups & Redirects Blocked!) */}
      {/* Default Clean Fullscreen Video Player Modal */}
      <AnimatePresence>
        {streamingMovie && (() => {
          const serverList = getServersForMovie(streamingMovie);
          const currentStreamUrl = serverList[0]?.url || streamingMovie.watchUrl || "";

          return (
            <div 
              ref={playerContainerRef}
              className="fixed inset-0 z-[100] bg-black flex flex-col justify-between"
            >
              {/* Top Floating Controls */}
              <div className="flex items-center justify-between py-3 px-3.5 text-white flex-shrink-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => {
                      if (isPlayerFullscreen && document.fullscreenElement) {
                        document.exitFullscreen?.().catch(() => {});
                      }
                      setStreamingMovie(null);
                    }}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer mr-0.5 backdrop-blur-md"
                    aria-label="Back"
                    title="Close Player"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <h3 className="text-xs sm:text-sm font-bold truncate max-w-[220px] sm:max-w-md text-gray-100 drop-shadow-md">
                    {streamingMovie.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
                    title={isPlayerFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    aria-label="Toggle Fullscreen"
                  >
                    {isPlayerFullscreen ? (
                      <Minimize2 className="w-4.5 h-4.5" />
                    ) : (
                      <Maximize2 className="w-4.5 h-4.5" />
                    )}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      if (isPlayerFullscreen && document.fullscreenElement) {
                        document.exitFullscreen?.().catch(() => {});
                      }
                      setStreamingMovie(null);
                    }}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
                    aria-label="Close player"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fullscreen Video Player Frame */}
              <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                {currentStreamUrl ? (
                  <iframe
                    key={streamingMovie.id}
                    src={currentStreamUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <Film className="w-10 h-10 mb-2 opacity-50" />
                    <span>No stream available for this title.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Share Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/95 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Install App Suggestion Banner */}
      <AnimatePresence>
        {showInstallBanner && !showSplash && !selectedMovie && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 max-w-[390px] mx-auto bg-slate-900/95 backdrop-blur-md border border-purple-500/20 text-white p-3 rounded-[24px] shadow-2xl z-40 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white p-1 flex-shrink-0 shadow-md">
                <Image src="/apk.png" alt="MovieMela" fill className="object-contain" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-white leading-tight truncate">Install MovieMela</h4>
                <p className="text-[11px] text-gray-300 truncate">Quick access from home screen 10kb</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstallApp}
                className="bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-95 text-white px-3.5 py-1.5 rounded-full font-bold text-[12px] shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
              <button
                onClick={handleDismissBanner}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          LEFT-TO-RIGHT 80% HAMBURGER DRAWER
         ======================================================== */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-center pointer-events-auto">
            {/* Transparent backdrop dimming the entire backside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Centered Mobile Container Wrapper */}
            <div className="relative w-full max-w-[430px] sm:max-w-[460px] h-full pointer-events-none">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="pointer-events-auto absolute top-0 bottom-0 left-0 w-[80%] bg-white shadow-[8px_0_36px_rgba(0,0,0,0.18)] flex flex-col justify-between overflow-hidden z-10"
              >
                {/* 1. Header with Logo & Close button */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-purple-50/80 bg-white">
                  <div className="relative h-8 w-28">
                    <Image
                      src="/logoh.png"
                      alt="MovieMela"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#f8f9fe] hover:bg-purple-100/60 text-gray-500 hover:text-[#553cfb] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Scrollable Body: Tabs for Continue Watching & My Downloads */}
                <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar space-y-4">
                  {/* Segmented Switch: Continue Watching vs My Downloads */}
                  <div className="flex items-center gap-1.5 bg-[#f5f6f8] p-1 rounded-[16px]">
                    <button
                      onClick={() => setDrawerTab("history")}
                      className={clsx(
                        "flex-1 py-2 px-2.5 rounded-[12px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        drawerTab === "history"
                          ? "bg-white text-[#553cfb] shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Watching ({watchHistoryList.length})</span>
                    </button>
                    <button
                      onClick={() => setDrawerTab("downloads")}
                      className={clsx(
                        "flex-1 py-2 px-2.5 rounded-[12px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        drawerTab === "downloads"
                          ? "bg-white text-[#553cfb] shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Downloads ({downloadedList.length})</span>
                    </button>
                  </div>

                  {drawerTab === "history" ? (
                    /* WATCH HISTORY & CONTINUE WATCHING TAB */
                    <div className="space-y-3">
                      {/* Summary Card */}
                      <div className="bg-gradient-to-br from-[#f8f9fe] via-white to-[#f3f1ff] border border-purple-100 rounded-[20px] p-4 shadow-[0_4px_16px_rgba(85,60,251,0.05)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb]">
                              <Clock className="w-5 h-5" />
                            </span>
                            <div>
                              <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
                                Watch History
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                Resume where you left off
                              </span>
                            </div>
                          </div>
                          <div className="text-3xl font-black text-gray-900 tracking-tight">
                            {watchHistoryList.length}
                          </div>
                        </div>
                      </div>

                      {/* Header & Clear Button */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[12px] font-bold text-gray-700">
                          Recent Streams ({watchHistoryList.length})
                        </span>
                        {watchHistoryList.length > 0 && (
                          <button
                            onClick={() => {
                              if (confirm("Clear all watch history?")) {
                                clearWatchHistory();
                              }
                            }}
                            className="text-[11px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* List of Watched Movies */}
                      {watchHistoryList.length === 0 ? (
                        <div className="bg-[#f8f9fe] border border-dashed border-purple-200/70 rounded-[18px] p-4 text-center">
                          <Clock className="w-7 h-7 text-[#553cfb]/40 mx-auto mb-1.5" />
                          <p className="text-[12px] font-bold text-gray-700">No watch history yet</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                            Start streaming any movie and it will track your progress here!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto hide-scrollbar pr-0.5">
                          {watchHistoryList.map((item) => (
                            <div
                              key={item.id}
                              className="bg-[#f8f9fe] hover:bg-purple-50/50 border border-purple-100/70 rounded-[18px] p-2.5 flex flex-col gap-2 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                {item.image ? (
                                  <div className="relative w-11 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 shadow-2xs">
                                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-11 h-16 rounded-xl bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb] flex-shrink-0">
                                    <Film className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-extrabold bg-[#553cfb] text-white px-1.5 py-0.2 rounded">
                                      {item.category || "Cinema"}
                                    </span>
                                    <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                      {item.progressPercent}% watched
                                    </span>
                                  </div>
                                  <h4 className="text-[12px] font-bold text-gray-800 truncate mt-0.5">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {item.duration ? `${item.duration} • ` : ""}{item.lastServerName || "Vidcore HD"}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWatchHistoryItem(item.id);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Delete from history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Progress bar and Resume button row */}
                              <div className="flex items-center gap-2 pt-1 border-t border-purple-50">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#553cfb] to-emerald-400 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(8, item.progressPercent))}%` }}
                                  />
                                </div>
                                <button
                                  onClick={() => handleStartStreaming(item)}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#553cfb] to-[#7b46fa] text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs hover:brightness-105 active:scale-95 cursor-pointer flex-shrink-0"
                                >
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  <span>Resume</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MY DOWNLOADS TAB */
                    <div className="space-y-3">
                      {/* My Downloads Summary Card */}
                      <div className="bg-gradient-to-br from-[#f8f9fe] via-white to-[#f3f1ff] border border-purple-100 rounded-[20px] p-4 shadow-[0_4px_16px_rgba(85,60,251,0.05)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb]">
                              <Download className="w-5 h-5" />
                            </span>
                            <div>
                              <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
                                My Downloads
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                Saved locally on this device
                              </span>
                            </div>
                          </div>
                          <div className="text-3xl font-black text-gray-900 tracking-tight">
                            {downloadedList.length}
                          </div>
                        </div>
                      </div>

                      {/* List of Downloaded Movies */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[12px] font-bold text-gray-700">
                            Saved Movies ({downloadedList.length})
                          </span>
                          {downloadedList.length > 0 && (
                            <button
                              onClick={() => {
                                if (confirm("Clear all downloaded movie history?")) {
                                  clearDownloadedMovies();
                                }
                              }}
                              className="text-[11px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Clear
                            </button>
                          )}
                        </div>

                        {downloadedList.length === 0 ? (
                          <div className="bg-[#f8f9fe] border border-dashed border-purple-200/70 rounded-[18px] p-4 text-center">
                            <Film className="w-7 h-7 text-[#553cfb]/40 mx-auto mb-1.5" />
                            <p className="text-[12px] font-bold text-gray-700">No downloads yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                              Download any movie and it will appear here offline!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar pr-0.5">
                            {downloadedList.map((item) => (
                              <div
                                key={item.id}
                                className="bg-[#f8f9fe] hover:bg-purple-50/50 border border-purple-100/70 rounded-[16px] p-2 flex items-center gap-2.5 transition-all"
                              >
                                {item.image ? (
                                  <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-14 rounded-lg bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb] flex-shrink-0">
                                    <Film className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-extrabold bg-[#553cfb] text-white px-1.5 py-0.2 rounded">
                                      {item.quality || "HD"}
                                    </span>
                                    {item.fileSize && (
                                      <span className="text-[9px] text-gray-400 font-medium truncate">
                                        {item.fileSize}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-[12px] font-bold text-gray-800 truncate mt-0.5">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {new Date(item.downloadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDownloadedMovie(item.id);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Delete from list"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Category Filters */}
                  <div className="pt-2 border-t border-purple-50">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                      Explore Categories
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveChip("All");
                          setIsDrawerOpen(false);
                        }}
                        className="text-left px-3 py-2 rounded-xl bg-[#f8f9fe] hover:bg-purple-100/50 text-[12px] font-bold text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#553cfb]" />
                        <span>All Movies</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveChip("Trending");
                          setIsDrawerOpen(false);
                        }}
                        className="text-left px-3 py-2 rounded-xl bg-[#f8f9fe] hover:bg-purple-100/50 text-[12px] font-bold text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Trending</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Disclaimer & Credits */}
                <div className="p-4 border-t border-purple-50 bg-[#fafaff]">
                  <div className="bg-white border border-purple-100 rounded-[16px] p-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#553cfb] uppercase tracking-wider mb-1">
                      <Info className="w-3.5 h-3.5 text-[#553cfb] flex-shrink-0" />
                      <span>Disclaimer & Credits</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
                      MovieMela does not host or store media files on its servers. All movie information and download links are sourced directly from <span className="font-bold text-gray-800 underline decoration-[#553cfb]/40">Filmyzilla</span>. We sincerely give full credit and acknowledgement to Filmyzilla for the content.
                    </p>
                  </div>
                  <div className="text-[10px] text-center text-gray-400 mt-2 font-medium">
                    MovieMela • Entertainment Portal
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

