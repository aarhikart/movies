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
  Copy
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

type Movie = {
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
  downloadLinks: { label: string; url: string }[];
  type?: string;
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

export default function MovieMelaClient({ initialMovieId }: { initialMovieId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"watch" | "download">("download");
  const [showSplash, setShowSplash] = useState(true);
  
  // Data states
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [totalMovies, setTotalMovies] = useState(0);
  
  const [searchSuggestions, setSearchSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [viewingCategory, setViewingCategory] = useState<{title: string, data: Movie[]} | null>(null);

  const [chips, setChips] = useState<string[]>(["All"]);

  // Hamburger drawer and downloads tracking
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [downloadedList, setDownloadedList] = useState<DownloadedMovie[]>([]);

  // Record visit in MongoDB Atlas (2-hour rolling session deduplication)
  useEffect(() => {
    fetch("/api/views", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    // Initial fetch from localStorage
    setDownloadedList(getDownloadedMovies());

    // Reactive sync when download completes or changes in any tab
    const handleSync = () => {
      setDownloadedList(getDownloadedMovies());
    };

    window.addEventListener(DOWNLOADS_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(DOWNLOADS_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

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

    const found = 
      allMovies.find((m) => String(m.id) === String(targetMovieId)) ||
      heroMovies.find((m) => String(m.id) === String(targetMovieId)) ||
      trendingMovies.find((m) => String(m.id) === String(targetMovieId));

    if (found) {
      setSelectedMovie(found);
    } else {
      fetch(`/api/movies?id=${encodeURIComponent(targetMovieId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.movie) {
            setSelectedMovie(data.movie);
          }
        })
        .catch(() => {});
    }
  }, [allMovies, heroMovies, trendingMovies, initialMovieId]);

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
    const shareCaption = `🎬 *${displayTitle}*\n\nWatch this movie on MovieMela:\n${shareUrl}`;
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
          setShareToast("Movie link copied! Select 'Instagram Stories' to post.");
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
      setShareToast("Poster downloaded & movie link copied! Upload to your Instagram Story.");
      setTimeout(() => setShareToast(null), 4500);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setShareToast("Movie link copied to clipboard!");
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
    const shareCaption = `🎬 *${displayTitle}*\n\nWatch this movie on MovieMela:\n${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: `🎬 *${displayTitle}*\n\nWatch this movie on MovieMela:\n`,
          url: shareUrl,
        });
      } catch (e) {}
    } else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareCaption);
        setShareToast("Movie link copied to clipboard!");
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
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast("Movie link copied to clipboard!");
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

  // Fetch filtered "All Movies" and categories when activeChip changes
  useEffect(() => {
    const filterParam = activeChip === 'All' ? '' : `&filter=${encodeURIComponent(activeChip)}`;
    
    fetch(`/api/movies?type=hero&limit=5${filterParam}`).then(res => res.json()).then(res => setHeroMovies(res.data));
    fetch(`/api/movies?type=popular&limit=15${filterParam}`).then(res => res.json()).then(res => setPopularMovies(res.data));
    fetch(`/api/movies?type=trending&limit=15${filterParam}`).then(res => res.json()).then(res => setTrendingMovies(res.data));

    // Fetch All Movies grid
    setPage(1);
    setIsLoadingMore(true);
    fetch(`/api/movies?page=1&limit=20${filterParam}`)
      .then(res => res.json())
      .then(res => {
        setAllMovies(res.data);
        setTotalMovies(res.total);
        setIsLoadingMore(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingMore(false);
      });
  }, [activeChip]);

  // Infinite Scroll logic using IntersectionObserver (off main scroll thread)
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMoreMovies = useCallback(async () => {
    if (isLoadingMore) return;
    if (totalMovies > 0 && allMovies.length >= totalMovies) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const filterParam = activeChip === 'All' ? '' : `&filter=${encodeURIComponent(activeChip)}`;
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
  }, [isLoadingMore, page, activeChip, totalMovies, allMovies.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && (totalMovies === 0 || allMovies.length < totalMovies)) {
          loadMoreMovies();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreMovies, isLoadingMore, allMovies.length, totalMovies]);

  // Debounced Search logic
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await res.json();
        setSearchSuggestions(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        <div className="flex-1 overflow-y-auto px-5 pt-0 pb-12 hide-scrollbar overscroll-y-contain transform-gpu [will-change:scroll-position]">
          
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
          <div className="sticky top-0 z-30 bg-white transform-gpu pt-2 pb-3 -mx-5 px-5 border-b border-purple-100/70 shadow-[0_4px_20px_rgba(85,60,251,0.05)]">
            <div className="relative">
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
                <div className="relative flex items-center bg-white hover:bg-[#fafbff] focus-within:bg-white rounded-full px-4 py-2.5 transition-all">
                  <Search className="text-[#553cfb] w-4 h-4 mr-2.5 flex-shrink-0 transition-transform group-focus-within:scale-110" />
                  <input
                    type="text"
                    placeholder="Search movies, series, actors..."
                    className="bg-transparent flex-1 outline-none text-[13.5px] font-medium placeholder:text-gray-400 text-gray-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="w-5 h-5 rounded-full bg-purple-50 text-gray-500 flex items-center justify-center hover:bg-purple-100 hover:text-gray-800 transition-colors mr-1.5 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className="w-px h-4 bg-purple-200/70 mx-2 flex-shrink-0"></div>
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#553cfb] border-t-transparent flex-shrink-0"></div>
                  ) : (
                    <Mic className="text-gray-400 hover:text-[#553cfb] w-4 h-4 flex-shrink-0 cursor-pointer transition-colors" />
                  )}
                </div>
              </div>

              {/* Floating Search Suggestions Dropdown */}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(85,60,251,0.16)] z-40 border border-purple-100/90 max-h-72 overflow-y-auto divide-y divide-purple-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-3 p-3 hover:bg-purple-50/60 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedMovie(movie);
                          setSearchQuery("");
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
                    !isSearching && <div className="p-4 text-center text-[13px] text-gray-500 font-medium">No movies found matching "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-1">
            {chips.map((chip) => {
              const isActive = activeChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className={clsx(
                    "px-4 py-1.5 rounded-full whitespace-nowrap text-[12.5px] font-bold transition-all duration-200 cursor-pointer flex-shrink-0",
                    isActive
                      ? "bg-gradient-to-r from-[#553cfb] to-[#7b46fa] text-white shadow-[0_4px_14px_rgba(85,60,251,0.3)] scale-[1.02]"
                      : "bg-[#f8f9fe] hover:bg-purple-50 text-gray-700 border border-purple-100/70"
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Hero Carousel */}
          {heroMovies.length > 0 && (
            <div className="mt-5 flex gap-3.5 overflow-x-auto hide-scrollbar -mx-5 px-5 snap-x snap-mandatory pb-2">
              {heroMovies.map((movie, idx) => (
                <div 
                  key={movie.id} 
                  className="relative h-[215px] w-[88%] rounded-[26px] overflow-hidden flex-shrink-0 snap-center cursor-pointer bg-placeholder shadow-[0_8px_24px_rgba(85,60,251,0.12)] border border-purple-100/50 group active:scale-[0.99] transition-transform"
                  onClick={() => setSelectedMovie(movie)}
                >
                  {movie.image && (
                    <Image 
                      src={movie.image} 
                      alt={movie.title} 
                      fill 
                      sizes="(max-width: 640px) 90vw, 420px"
                      priority={idx === 0}
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                    />
                  )}
                  {/* Cinematic multi-stop gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 pointer-events-none"></div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="bg-[#553cfb] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                      {movie.quality || "Featured HD"}
                    </span>
                    {movie.rating && (
                      <div className="bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/15">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{movie.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Details & Play Button */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-3">
                    <div className="text-white min-w-0">
                      <h2 className="text-[17px] font-black leading-tight mb-1 text-white line-clamp-2 drop-shadow-sm">
                        {movie.title.replace(/\s\(\d{4}\).*$/, '')}
                      </h2>
                      <div className="flex items-center gap-2 text-xs font-medium text-purple-200">
                        <span className="bg-white/25 px-2 py-0.5 rounded-md text-[11px] text-white font-semibold line-clamp-1">
                          {movie.genre || "Action"}
                        </span>
                        {movie.duration && (
                          <span className="text-[11px] text-gray-300">{movie.duration}</span>
                        )}
                      </div>
                    </div>

                    <div className="w-11 h-11 bg-gradient-to-tr from-[#553cfb] to-[#7b46fa] rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(85,60,251,0.5)] group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Popular Section */}
          {popularMovies.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-5 rounded-full bg-[#553cfb]"></div>
                  <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Popular</h3>
                </div>
                <button 
                  onClick={() => setViewingCategory({ title: "Popular", data: popularMovies })}
                  className="text-[12px] text-[#553cfb] hover:text-[#4318d1] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  See All <span className="text-base leading-none">&rsaquo;</span>
                </button>
              </div>

              <div className="flex gap-3.5 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
                {popularMovies.map((movie) => (
                  <div 
                    key={movie.id} 
                    className="w-[136px] flex-shrink-0 cursor-pointer group active:scale-[0.98] transition-transform" 
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <div className="relative h-[195px] rounded-[22px] overflow-hidden mb-2 bg-placeholder shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                      {movie.image && (
                        <Image 
                          src={movie.image} 
                          alt={movie.title} 
                          fill 
                          sizes="140px"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      {movie.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {movie.rating}
                        </div>
                      )}
                      {movie.quality && (
                        <div className="absolute bottom-2 left-2 bg-[#553cfb] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                          {movie.quality}
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-snug truncate group-hover:text-[#553cfb] transition-colors">
                      {movie.title.replace(/\s\(\d{4}\).*$/, '')}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{movie.genre || "Movie"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Now Section */}
          {trendingMovies.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-5 rounded-full bg-gradient-to-b from-[#553cfb] to-[#a855f7]"></div>
                  <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                    <span>Trending Now</span>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  </h3>
                </div>
                <button 
                  onClick={() => setViewingCategory({ title: "Trending Now", data: trendingMovies })}
                  className="text-[12px] text-[#553cfb] hover:text-[#4318d1] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  See All <span className="text-base leading-none">&rsaquo;</span>
                </button>
              </div>

              <div className="flex gap-3.5 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-3">
                {trendingMovies.map((movie) => (
                  <div 
                    key={movie.id} 
                    className="w-[136px] flex-shrink-0 cursor-pointer group active:scale-[0.98] transition-transform" 
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <div className="relative h-[195px] rounded-[22px] overflow-hidden mb-2 bg-placeholder shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-purple-50/80 group-hover:shadow-[0_6px_20px_rgba(85,60,251,0.16)] transition-shadow">
                      {movie.image && (
                        <Image 
                          src={movie.image} 
                          alt={movie.title} 
                          fill 
                          sizes="140px"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      {movie.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-white/15">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {movie.rating}
                        </div>
                      )}
                      {movie.quality && (
                        <div className="absolute bottom-2 left-2 bg-[#553cfb] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                          {movie.quality}
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-snug truncate group-hover:text-[#553cfb] transition-colors">
                      {movie.title.replace(/\s\(\d{4}\).*$/, '')}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{movie.genre || "Movie"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Movies Grid Section (Infinite Scroll with IntersectionObserver) */}
          <div className="mt-8 pb-10">
            <div className="flex items-center justify-between mb-4 px-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-5 rounded-full bg-[#553cfb]"></div>
                <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">
                  All Movies {totalMovies > 0 && <span className="text-[13px] font-normal text-gray-400">({totalMovies})</span>}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#553cfb] bg-[#553cfb]/10 px-2.5 py-0.5 rounded-full">
                Live Catalog
              </span>
            </div>

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
            
            {/* Infinite Scroll Sentinel - Triggers loading asynchronously */}
            <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

            {/* Loading spinner for infinite scroll */}
            {isLoadingMore && (
              <div className="flex flex-col justify-center items-center py-6 mt-2">
                <div className="animate-spin rounded-full h-7 w-7 border-3 border-[#553cfb] border-t-transparent"></div>
                <span className="text-[12px] text-gray-400 font-medium mt-2">Loading more titles...</span>
              </div>
            )}
          </div>
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

                  <div className="flex items-center gap-2 pb-2 mt-auto">
                    <button 
                      onClick={() => {
                        setSelectedAction("watch");
                        setShowDownloadOptions(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white rounded-[18px] py-3.5 flex items-center justify-center gap-1.5 font-bold text-[13.5px] transition-all shadow-[0_4px_16px_rgba(85,60,251,0.3)] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" /> Watch Now
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedAction("download");
                        setShowDownloadOptions(true);
                      }}
                      className="flex-1 bg-[#f8f9fe] hover:bg-purple-100/50 border border-purple-100 text-gray-800 rounded-[18px] py-3.5 flex items-center justify-center gap-1.5 font-bold text-[13.5px] transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#553cfb]" /> Download HD
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
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight">Share Movie</h3>
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
                    <span className="block text-[10.5px] text-gray-500 truncate">Direct movie URL</span>
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

                {/* 2. Scrollable Body: Total Downloaded Movies & List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar space-y-4">
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
                      <div className="space-y-2 max-h-[220px] overflow-y-auto hide-scrollbar pr-0.5">
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

