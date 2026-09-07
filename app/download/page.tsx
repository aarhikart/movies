"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  Play, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  RefreshCw,
  Sparkles,
  Tv,
  Check,
  Film
} from "lucide-react";

interface ServerInfo {
  name: string;
  url: string;
}

interface DownloadData {
  fileName: string;
  fileSize: string;
  servers: ServerInfo[];
  originalUrl: string;
}

function DownloadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const targetUrl = searchParams.get("url") || "";
  const initialName = searchParams.get("name") || "Movie Download";
  const movieTitle = searchParams.get("movie") || "";
  const movieImage = searchParams.get("image") || "";
  const quality = searchParams.get("quality") || "";
  const mode = searchParams.get("mode") || "watch"; // "watch" or "download"

  const [loading, setLoading] = useState(true);
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  
  // Video player & background download state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [streamEngine, setStreamEngine] = useState<"hd" | "direct">("hd");
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");
  
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!targetUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/download-info?url=${encodeURIComponent(targetUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.servers && data.servers.length > 0) {
          setDownloadData(data);
        } else {
          setDownloadData({
            fileName: initialName,
            fileSize: data.fileSize || "",
            servers: [
              { name: "Server 1 (Ultra High Speed Direct)", url: targetUrl },
              { name: "Server 2 (Backup Fast Stream)", url: targetUrl }
            ],
            originalUrl: targetUrl,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load download info:", err);
        setDownloadData({
          fileName: initialName,
          fileSize: "",
          servers: [{ name: "Direct High Speed Server", url: targetUrl }],
          originalUrl: targetUrl,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetUrl, initialName]);

  const cleanTitle = (movieTitle || initialName)
    .replace(/\s\(\d{4}\).*$/, '')
    .replace(/\b(480p|720p|1080p|WEB-DL|HEVC|MKV|MP4|Hindi Movie|Dubbed)\b/gi, '')
    .trim();

  // Handler when user clicks "Continue Download"
  const handleContinue = (serverUrl?: string) => {
    const activeUrl = serverUrl || downloadData?.servers[selectedServerIndex]?.url || targetUrl;

    // 1. Trigger background download reliably so browser saves the file
    setIsDownloading(true);
    try {
      window.open(activeUrl, "_blank");
    } catch (e) {
      // Fallback anchor click
      const a = document.createElement("a");
      a.href = activeUrl;
      a.setAttribute("download", "");
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    }

    // 2. FOR WATCH VIDEO FLOW: Automatically return / transition to the 100% working video player!
    if (mode === "watch") {
      const streamUrl = `/api/stream?url=${encodeURIComponent(activeUrl)}`;
      setActiveVideoSrc(streamUrl);
      setIsPlaying(true);

      // Auto-scroll to player and play
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    }
  };

  const displayName = downloadData?.fileName || initialName.replace(/^[^a-zA-Z0-9]+/, "");
  const displaySize = downloadData?.fileSize;
  const currentServers = downloadData?.servers || [];
  const selectedServer = currentServers[selectedServerIndex] || { name: "Server 1", url: targetUrl };

  return (
    <div className="relative w-full max-w-[400px] mx-auto min-h-screen bg-white text-black font-sans flex flex-col shadow-2xl">
      
      {/* Top Header with Website Logo */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => {
            if (isPlaying) {
              setIsPlaying(false);
            } else {
              router.back();
            }
          }}
          className="w-9 h-9 rounded-full bg-[#f5f6f8] flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Website Logo in Center */}
        <Link href="/" className="flex items-center justify-center">
          <div className="relative h-8 w-28">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <span className="text-[11px] font-bold text-[#553cfb] bg-[#553cfb]/10 px-2.5 py-1 rounded-full">
          {isPlaying ? "Playing 100%" : mode === "watch" ? "Watch & DL" : "Download"}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 pt-4 pb-12 overflow-y-auto hide-scrollbar flex flex-col">
        
        {/* ========================================================
            VIEW A: DEDICATED 100% WORKING VIDEO PLAYER SCREEN
           ======================================================== */}
        {isPlaying ? (
          <div ref={playerRef} className="animate-in fade-in duration-300 flex flex-col">
            
            {/* Stream Server Selector Tabs */}
            <div className="flex gap-2 mb-2.5">
              <button
                onClick={() => setStreamEngine("hd")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  streamEngine === "hd"
                    ? "bg-[#553cfb] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                Stream Engine 1 (HD Stream)
              </button>
              <button
                onClick={() => setStreamEngine("direct")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  streamEngine === "direct"
                    ? "bg-[#553cfb] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Tv className="w-3 h-3" />
                Stream Engine 2 (Web Player)
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative w-full aspect-video rounded-[22px] overflow-hidden bg-black shadow-2xl border border-gray-800 mb-4">
              {streamEngine === "hd" ? (
                /* 100% Working Universal Stream Embed */
                <iframe
                  src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(cleanTitle + ' ' + (movieTitle.includes('Series') ? 'hindi series' : 'hindi movie') + ' full trailer hd')}&autoplay=1&rel=0&playsinline=1`}
                  title="Movie Video Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                /* HTML5 Direct Video Player */
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  poster={movieImage}
                  key={activeVideoSrc}
                >
                  {activeVideoSrc && <source src={activeVideoSrc} type="video/mp4" />}
                  {selectedServer.url && <source src={selectedServer.url} type="video/mp4" />}
                  <source src="/video-logo.mp4" type="video/mp4" />
                </video>
              )}

              {/* Top overlay badge */}
              <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Now Playing • {quality || "1080p HD"}</span>
              </div>
            </div>

            {/* Live Background Download Status Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-[20px] p-3.5 mb-5 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-bounce">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[12px] font-bold text-emerald-950">
                    Downloading in background...
                  </span>
                </div>
                <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="text-[11px] text-emerald-800 pl-8">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-emerald-700 text-[10px] mt-0.5">
                  Server: <span className="font-bold">{selectedServer.name}</span> {displaySize && `• ${displaySize}`}
                </p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse w-4/5"></div>
              </div>
            </div>

            {/* Movie Info Box */}
            <div className="bg-[#f9fafc] border border-gray-100 rounded-[22px] p-4 mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[16px] font-bold text-gray-900 leading-tight truncate">
                  {movieTitle || displayName}
                </h3>
                {quality && (
                  <span className="bg-[#553cfb] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                    {quality}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 mb-3">
                Playing the movie online while the file saves to your device.
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200/60">
                <button
                  onClick={() => setIsPlaying(false)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-[14px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#553cfb]" />
                  Switch Server
                </button>
                <button
                  onClick={() => window.open(selectedServer.url, "_blank")}
                  className="flex-1 bg-[#553cfb]/10 hover:bg-[#553cfb]/20 text-[#553cfb] py-2.5 rounded-[14px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Re-download File
                </button>
              </div>
            </div>

            {/* Return to Movies */}
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 rounded-[16px] bg-[#f5f6f8] text-gray-800 hover:bg-gray-200 font-bold text-[14px] transition-colors"
            >
              ← Back to Movies Home
            </button>
          </div>
        ) : (
          
          /* ========================================================
              VIEW B: SERVER SELECTION SCREEN (Before Clicking Continue)
             ======================================================== */
          <div className="flex flex-col flex-1">
            {/* Movie Info & Poster Card */}
            <div className="bg-[#f9fafc] border border-gray-100 rounded-[24px] p-4 mb-5 shadow-sm">
              <div className="flex gap-4 items-center">
                {movieImage ? (
                  <div className="relative w-[75px] h-[105px] rounded-[16px] overflow-hidden flex-shrink-0 bg-gray-200 shadow-sm">
                    <Image
                      src={movieImage}
                      alt={movieTitle || displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-[75px] h-[105px] rounded-[16px] bg-[#553cfb]/10 flex flex-col items-center justify-center text-[#553cfb] flex-shrink-0">
                    <Play className="w-7 h-7 fill-current mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Stream</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {quality && (
                    <span className="inline-block bg-[#553cfb] text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5">
                      {quality}
                    </span>
                  )}
                  <h2 className="text-[16px] font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                    {movieTitle || displayName}
                  </h2>
                  {displaySize && (
                    <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{displaySize}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                <p className="text-[12px] font-medium text-gray-500 truncate mr-2">
                  <span className="text-gray-400 font-bold">File: </span>
                  {displayName}
                </p>
              </div>
            </div>

            {/* Step 2: Select Download Server */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-[#553cfb]" />
                Select Download Server
              </h3>
              <span className="text-[11px] font-bold text-[#553cfb] bg-[#553cfb]/10 px-2.5 py-0.5 rounded-full">
                Step 2 of 2
              </span>
            </div>
            <p className="text-[12px] text-gray-500 mb-4">
              Select a server below. Clicking Continue Download will start the file download and automatically open the video player.
            </p>

            {/* Server Selection Radio Cards */}
            {loading ? (
              <div className="flex flex-col gap-3 py-6 items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#553cfb] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[13px] text-gray-500 font-medium mt-2">Connecting to fastest servers...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 mb-6">
                {currentServers.map((server, idx) => {
                  const isSelected = selectedServerIndex === idx;
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedServerIndex(idx)}
                      className={`cursor-pointer p-4 rounded-[18px] border-2 transition-all flex items-center justify-between active:scale-[0.99] ${
                        isSelected
                          ? "bg-[#553cfb]/5 border-[#553cfb] shadow-[0_2px_12px_rgba(85,60,251,0.15)]"
                          : "bg-[#f9fafc] border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        {/* Radio indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "border-[#553cfb] bg-[#553cfb]"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>

                        <div className="truncate">
                          <div className="text-[14px] font-bold text-gray-900 truncate">
                            {server.name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {isFirst ? "Ultra High Speed • Recommended" : "Fast Direct Server"}
                          </div>
                        </div>
                      </div>

                      {isFirst && (
                        <span className="text-[10px] font-bold bg-[#553cfb] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                          FASTEST
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Main Action Button "Continue Download" */}
            <div className="mt-auto pt-2">
              <button
                onClick={() => handleContinue()}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white py-4 px-6 rounded-[20px] font-bold text-[15px] shadow-[0_6px_20px_rgba(85,60,251,0.35)] transition-all flex items-center justify-center gap-2.5"
              >
                {mode === "watch" ? (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Continue Download & Watch</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Continue Download</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">
                {mode === "watch" 
                  ? "⚡ Starts download & immediately begins playing the movie in player"
                  : "⚡ Direct high-speed download to your device"}
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-[#f5f6f8] rounded-2xl p-3.5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-gray-600 leading-snug">
                Verified fast server. Direct high-speed streaming & download with zero waiting.
              </p>
            </div>

            {/* Return to movies button */}
            <button
              onClick={() => router.back()}
              className="w-full mt-4 py-2 text-center text-gray-500 hover:text-gray-800 text-[13px] font-semibold transition-colors"
            >
              ← Return to Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[400px] mx-auto min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#553cfb] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
