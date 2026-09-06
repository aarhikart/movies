"use client";

import { useState, useEffect, UIEvent } from "react";
import { Search, Mic, Play, Download, X, Star, ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

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

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
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
    // Fetch categories with filter
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

  // Infinite Scroll logic for All Movies
  const loadMoreMovies = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const filterParam = activeChip === 'All' ? '' : `&filter=${encodeURIComponent(activeChip)}`;
    try {
      const res = await fetch(`/api/movies?page=${nextPage}&limit=20${filterParam}`);
      const data = await res.json();
      if (data.data.length > 0) {
        setAllMovies(prev => [...prev, ...data.data]);
        setPage(nextPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150) {
      loadMoreMovies();
    }
  };

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
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="relative w-full max-w-[400px] mx-auto h-[100dvh] bg-white text-black overflow-hidden flex flex-col font-sans">
      {/* Splash Screen */}
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
        // Category Detail View
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center px-5 py-4 border-b border-gray-100 bg-white z-10 sticky top-0">
            <button onClick={() => setViewingCategory(null)} className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">{viewingCategory.title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-10">
              {viewingCategory.data.map((movie) => (
                <div key={movie.id} className="cursor-pointer flex flex-col" onClick={() => setSelectedMovie(movie)}>
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-2.5 shadow-sm bg-placeholder">
                    {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                    {movie.rating && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <Star className="w-2.5 h-2.5 text-[#ffb800] fill-current" /> {movie.rating}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-2">{movie.title.replace(/\s\(\d{4}\).*$/, '')}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{movie.genre || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Main Dashboard
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 hide-scrollbar" onScroll={handleScroll}>
          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-[#f5f6f8] rounded-full px-4 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
              <Search className="text-gray-400 w-5 h-5 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search movies..."
                className="bg-transparent flex-1 outline-none text-[15px] placeholder-gray-400 text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="w-px h-5 bg-gray-300 mx-3 flex-shrink-0"></div>
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-1"></div>
              ) : (
                <Mic className="text-gray-400 w-5 h-5 flex-shrink-0 cursor-pointer" />
              )}
            </div>

            {/* Search Suggestions */}
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 border border-gray-100 max-h-60 overflow-y-auto">
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      onClick={() => {
                        setSelectedMovie(movie);
                        setSearchQuery("");
                      }}
                    >
                      <div className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-placeholder">
                        {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{movie.title}</h4>
                        <p className="text-xs text-gray-500">{movie.genre}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  !isSearching && <div className="p-4 text-center text-sm text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex gap-3 mt-5 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-1">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveChip(chip)}
                className={clsx(
                  "px-5 py-2.5 rounded-full whitespace-nowrap text-[14px] font-medium transition-colors border",
                  activeChip === chip
                    ? "bg-[#553cfb] text-white border-[#553cfb]"
                    : "bg-white text-gray-700 border-gray-200"
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Hero Carousel */}
          {heroMovies.length > 0 && (
            <div className="mt-6 flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 snap-x snap-mandatory pb-2">
              {heroMovies.map((movie, idx) => (
                <div 
                  key={movie.id} 
                  className={clsx(
                    "relative h-[210px] rounded-[24px] overflow-hidden flex-shrink-0 snap-center cursor-pointer bg-placeholder",
                    idx === 0 ? "w-[85%]" : "w-[85%]"
                  )}
                  onClick={() => setSelectedMovie(movie)}
                >
                  {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <div className="text-white">
                      <h2 className="text-xl font-bold leading-tight mb-2 pr-2 line-clamp-2">{movie.title.replace(/\s\(\d{4}\).*$/, '')}</h2>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="flex items-center text-[#ffb800] gap-1">
                          <Star className="w-3.5 h-3.5 fill-current" /> {movie.rating}
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs line-clamp-1">{movie.genre}</span>
                      </div>
                    </div>
                    <div className="w-[46px] h-[46px] bg-[#f29b10] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Play className="w-5 h-5 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Popular Section */}
          {popularMovies.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-[22px] font-bold text-gray-900">Popular</h3>
                <button 
                  onClick={() => setViewingCategory({ title: "Popular", data: popularMovies })}
                  className="text-[14px] text-[#553cfb] font-medium flex items-center"
                >
                  See All <span className="ml-1 text-lg leading-none">&rsaquo;</span>
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
                {popularMovies.map((movie) => (
                  <div key={movie.id} className="w-[130px] flex-shrink-0 cursor-pointer" onClick={() => setSelectedMovie(movie)}>
                    <div className="relative h-[190px] rounded-2xl overflow-hidden mb-2.5 bg-placeholder">
                      {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <Star className="w-3 h-3 text-[#ffb800] fill-current" /> {movie.rating}
                      </div>
                    </div>
                    <h4 className="font-bold text-[14px] text-gray-900 leading-tight truncate">{movie.title.replace(/\s\(\d{4}\).*$/, '')}</h4>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">{movie.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Now Section */}
          {trendingMovies.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-[22px] font-bold text-gray-900">Trending Now</h3>
                <button 
                  onClick={() => setViewingCategory({ title: "Trending Now", data: trendingMovies })}
                  className="text-[14px] text-[#553cfb] font-medium flex items-center"
                >
                  See All <span className="ml-1 text-lg leading-none">&rsaquo;</span>
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4">
                {trendingMovies.map((movie) => (
                  <div key={movie.id} className="w-[130px] flex-shrink-0 cursor-pointer" onClick={() => setSelectedMovie(movie)}>
                    <div className="relative h-[190px] rounded-2xl overflow-hidden mb-2.5 bg-placeholder">
                      {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                    </div>
                    <h4 className="font-bold text-[14px] text-gray-900 leading-tight truncate">{movie.title.replace(/\s\(\d{4}\).*$/, '')}</h4>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">{movie.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Movies Grid Section (Infinite Scroll) */}
          <div className="mt-8 pb-10">
            <h3 className="text-[22px] font-bold text-gray-900 mb-6">All Movies {totalMovies > 0 && `(${totalMovies})`}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allMovies.map((movie) => (
                <div key={movie.id} className="cursor-pointer flex flex-col" onClick={() => setSelectedMovie(movie)}>
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-2.5 shadow-sm bg-placeholder">
                    {movie.image && <Image src={movie.image} alt={movie.title} fill className="object-cover" />}
                    {movie.rating && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <Star className="w-2.5 h-2.5 text-[#ffb800] fill-current" /> {movie.rating}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-2">{movie.title.replace(/\s\(\d{4}\).*$/, '')}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{movie.genre || "N/A"}</p>
                </div>
              ))}
            </div>
            
            {/* Loading spinner for infinite scroll */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-6 mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#553cfb]"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0c1021]/60 backdrop-blur-[2px] z-40"
              onClick={() => { setSelectedMovie(null); setShowDownloadOptions(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-6 pt-7 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  if (showDownloadOptions || showPremiumPopup) {
                    setShowDownloadOptions(false);
                    setShowPremiumPopup(false);
                  } else {
                    setSelectedMovie(null);
                  }
                }}
                className="absolute top-5 right-5 w-8 h-8 bg-[#f5f6f8] rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {showPremiumPopup ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-20 h-20 bg-[#fff5f5] rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-[#ff4b4b]" />
                  </div>
                  <h2 className="text-[24px] font-bold text-gray-900 mb-3">Premium Content</h2>
                  <p className="text-[15px] text-gray-500 mb-8 max-w-[280px]">
                    Watching movies directly in the app is exclusively available for our premium subscribers.
                  </p>
                  
                  <button 
                    onClick={() => setShowPremiumPopup(false)}
                    className="w-full bg-[#f5f6f8] text-gray-800 rounded-[18px] py-4 font-bold text-[15px] hover:bg-gray-200 transition-colors"
                  >
                    Back to Details
                  </button>
                </div>
              ) : showDownloadOptions ? (
                <div className="flex flex-col h-[50dvh] overflow-y-auto hide-scrollbar">
                  <h2 className="text-[20px] font-bold text-gray-900 mb-6 mt-1 pr-10">Select Download Quality</h2>
                  
                  {selectedMovie.downloadLinks && selectedMovie.downloadLinks.length > 0 ? (
                    <div className="flex flex-col gap-3 pb-6">
                      {selectedMovie.downloadLinks.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-[#f9fafc] border border-gray-100 p-4 rounded-[16px] flex items-center justify-between hover:bg-[#f0f2f5] transition-colors"
                        >
                          <div className="text-[14px] font-semibold text-gray-800 break-words line-clamp-2 mr-3">
                            {link.label.replace(/^[^a-zA-Z0-9]+/, '')}
                          </div>
                          <div className="bg-[#7b46fa] p-2 rounded-full flex-shrink-0">
                            <Download className="w-4 h-4 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center mt-10">No download links available for this movie.</div>
                  )}
                  
                  <button 
                    onClick={() => setShowDownloadOptions(false)}
                    className="w-full mt-auto mb-2 bg-[#f5f6f8] text-gray-800 rounded-[18px] py-4 font-bold text-[15px] hover:bg-gray-200 transition-colors"
                  >
                    Back to Details
                  </button>
                </div>
              ) : (
                <div className="flex flex-col overflow-y-auto hide-scrollbar">
                  <div className="flex gap-4 mb-5">
                    <div className="relative w-[110px] h-[155px] rounded-2xl overflow-hidden flex-shrink-0 shadow-sm bg-placeholder">
                      {selectedMovie.image && <Image src={selectedMovie.image} alt={selectedMovie.title} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 pt-0 pr-8">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        {selectedMovie.quality && (
                          <span className="bg-[#553cfb] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {selectedMovie.quality}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-[#fff7e6] text-[#ff9800] px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-current" /> {selectedMovie.rating}
                        </span>
                        {selectedMovie.duration && (
                          <span className="text-[12px] text-gray-500 font-medium">{selectedMovie.duration}</span>
                        )}
                      </div>
                      <h2 className="text-[20px] font-bold leading-[1.1] text-gray-900 mb-1.5">
                        {selectedMovie.title.split(')')[0]}{selectedMovie.title.includes(')') ? ')' : ''}
                        {selectedMovie.title.split(')')[1] && <><br/>{selectedMovie.title.split(')')[1].trim()}</>}
                      </h2>
                      <p className="text-[13px] text-[#553cfb] font-medium mb-1.5 line-clamp-1">{selectedMovie.genre}</p>
                      {selectedMovie.releaseDate && (
                        <p className="text-[13px] text-gray-500 font-medium">Release: <span className="text-gray-700">{selectedMovie.releaseDate}</span></p>
                      )}
                    </div>
                  </div>

                  {selectedMovie.starcast && (
                    <div className="bg-[#f9fafc] p-4 rounded-2xl mb-5">
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Starcast</h4>
                      <p className="text-[14px] font-semibold text-gray-800">{selectedMovie.starcast}</p>
                    </div>
                  )}

                  {selectedMovie.overview && (
                    <div className="mb-8">
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Overview</h4>
                      <p className="text-[14px] text-gray-600 leading-[1.6]">
                        {selectedMovie.overview}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pb-2 mt-auto">
                    <button 
                      onClick={() => setShowPremiumPopup(true)}
                      className="flex-1 bg-[#7b46fa] hover:bg-[#6834eb] text-white rounded-[18px] py-4 flex items-center justify-center gap-2 font-bold text-[15px] transition-colors shadow-[0_4px_15px_rgba(123,70,250,0.3)]"
                    >
                      <Play className="w-5 h-5 fill-current" /> Watch Now
                    </button>
                    <button 
                      onClick={() => setShowDownloadOptions(true)}
                      className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-[18px] py-4 flex items-center justify-center gap-2 font-bold text-[15px] transition-colors"
                    >
                      <Download className="w-5 h-5" /> Download HD
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
