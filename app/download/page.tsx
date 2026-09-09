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
  Sparkles,
  Tv,
  Film,
  Clock,
  Gauge,
  Pause,
  ExternalLink,
  RefreshCw,
  Layers,
  Globe
} from "lucide-react";
import { saveDownloadedMovie } from "@/lib/downloads";

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

type ScreenType = "servers" | "verify" | "progress" | "player";
type ServerViewTab = "buttons" | "page";

function DownloadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const targetUrl = searchParams.get("url") || "";
  const initialName = searchParams.get("name") || "Movie Download";
  const movieTitle = searchParams.get("movie") || "";
  const movieImage = searchParams.get("image") || "";
  const quality = searchParams.get("quality") || "";
  const mode = searchParams.get("mode") || "download";

  const [loading, setLoading] = useState(true);
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  // Screen state: "servers" | "verify" (Verify You're Human) | "progress" (Downloading Movie) | "player"
  const isInitialVerify = targetUrl.includes('/dl/') || targetUrl.includes('/verified/');
  const [screen, setScreen] = useState<ScreenType>(isInitialVerify ? "verify" : "servers");
  // Server view toggle: ONLY 2 tabs: "buttons" (MovieMela list) or "page" (Original Server Page)
  const [serverViewTab, setServerViewTab] = useState<ServerViewTab>("buttons");
  const [activeVerifyUrl, setActiveVerifyUrl] = useState<string>(targetUrl);

  // Live download progress state
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState("5.4 MB/s");
  const [remainingTime, setRemainingTime] = useState("00:45");
  const [isDownloadPaused, setIsDownloadPaused] = useState(false);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [iframeLoadCount, setIframeLoadCount] = useState(0);

  // Player state
  const [streamEngine, setStreamEngine] = useState<"hd" | "direct">("hd");
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const verifyIframeRef = useRef<HTMLIFrameElement>(null);

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
            fileSize: data.fileSize || "298 MB",
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
          fileSize: "298 MB",
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

  const displayName = downloadData?.fileName || initialName.replace(/^[^a-zA-Z0-9]+/, "");
  const displaySize = downloadData?.fileSize || "298 MB";
  const currentServers = downloadData?.servers || [];
  const selectedServer = currentServers[selectedServerIndex] || { name: "Server 1", url: targetUrl };

  // Parse total size in MB for progress calculations
  const parseTotalMB = (): number => {
    if (!displaySize) return 298;
    const match = displaySize.match(/([0-9.]+)\s*(MB|GB|KB)/i);
    if (!match) return 298;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "GB") return val * 1024;
    if (unit === "KB") return val / 1024;
    return val;
  };
  const totalMB = parseTotalMB();

  // Helper to ensure clean domain without duplicate www
  const normalizeDomain = (urlStr: string): string => {
    if (!urlStr) return urlStr;
    try {
      const u = new URL(urlStr);
      u.protocol = "https:";
      u.host = "www.filmyzilla67.com";
      return u.toString();
    } catch (e) {
      return urlStr.replace(/https?:\/\/(?:www\.)+filmyzilla\d*\.com/g, "https://www.filmyzilla67.com");
    }
  };

  // Helper: Direct non-expiring Filmyzilla verification URL (fixes Cloudflare domain mismatch on hosted websites)
  const getDirectVerifyUrl = (urlStr: string, srvIdx: number = 0): string => {
    if (!urlStr) return "";
    let clean = normalizeDomain(urlStr);

    const dlMatch = clean.match(/\/dl\/(\d+)\/(server_\d+)\//i);
    if (dlMatch) {
      return `https://www.filmyzilla67.com/verified/${dlMatch[1]}/${dlMatch[2]}/`;
    }

    if (clean.includes('/verified/')) {
      return clean;
    }

    const serverMatch = clean.match(/\/server\/(\d+)\//i);
    if (serverMatch) {
      return `https://www.filmyzilla67.com/verified/${serverMatch[1]}/server_${srvIdx + 1}/`;
    }

    return clean;
  };

  // Helper: Record download into localStorage
  const recordThisDownload = (rawUrl?: string) => {
    saveDownloadedMovie({
      id: targetUrl || String(Date.now()),
      title: movieTitle || displayName || cleanTitle || "Movie",
      image: movieImage || "",
      quality: quality || "HD",
      fileSize: displaySize || "298 MB",
      url: rawUrl || selectedServer.url || targetUrl,
    });
  };

  // Helper: Trigger native download
  const triggerNativeDownload = (rawUrl?: string) => {
    const downloadTarget = rawUrl || selectedServer.url || targetUrl;
    // Resolve to direct verification/download link if applicable
    const resolvedUrl = getDirectVerifyUrl(downloadTarget, selectedServerIndex);
    const activeUrl = normalizeDomain(resolvedUrl || downloadTarget);

    // Save download in localStorage for persistent offline tracking
    recordThisDownload(activeUrl);

    try {
      window.open(activeUrl, "_blank");
    } catch (e) {
      const a = document.createElement("a");
      a.href = activeUrl;
      a.setAttribute("download", "");
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);
    }
  };

  // Sync active verify URL when selected server changes or download data loads
  useEffect(() => {
    if (currentServers[selectedServerIndex]?.url) {
      setActiveVerifyUrl(currentServers[selectedServerIndex].url);
    } else if (targetUrl) {
      setActiveVerifyUrl(targetUrl);
    }
  }, [selectedServerIndex, currentServers, targetUrl]);

  // Listen for message from embedded server page or verify page proxy
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data) {
        if (e.data.type === "SERVER_SELECTED" && e.data.url) {
          const selectedUrl = e.data.url;
          setActiveVerifyUrl(selectedUrl);

          const foundIdx = currentServers.findIndex(s => s.url === selectedUrl);
          if (foundIdx !== -1) {
            setSelectedServerIndex(foundIdx);
          } else if (e.data.serverId) {
            const parsedId = parseInt(e.data.serverId, 10);
            if (!isNaN(parsedId) && parsedId > 0 && parsedId <= currentServers.length) {
              setSelectedServerIndex(parsedId - 1);
            }
          }

          if (selectedUrl.includes('/dl/') || selectedUrl.includes('/verified/')) {
            setScreen("verify");
          } else {
            triggerNativeDownload(selectedUrl);
            setDownloadProgress(2);
            setDownloadedMB(0.8);
            setIsDownloadPaused(false);
            setIsDownloadComplete(false);
            setScreen("progress");
          }
        }
        if (e.data.type === "DOWNLOAD_TRIGGER" || e.data.type === "SERVER_CLICKED") {
          const urlToDownload = e.data.url;
          if (urlToDownload) {
            triggerNativeDownload(urlToDownload);
          }
          setDownloadProgress(2);
          setDownloadedMB(0.8);
          setIsDownloadPaused(false);
          setIsDownloadComplete(false);
          setScreen("progress");
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedServer, currentServers, targetUrl]);

  // Direct server button click: if requires verification, open "verify" screen; else start download
  const handleServerClick = (serverUrl: string, idx: number) => {
    setSelectedServerIndex(idx);
    setActiveVerifyUrl(serverUrl);
    setActiveVideoSrc(`/api/stream?url=${encodeURIComponent(serverUrl)}`);

    if (serverUrl.includes('/dl/') || serverUrl.includes('/verified/')) {
      // Server requires Cloudflare Turnstile verification
      setScreen("verify");
    } else {
      // Direct file download without verification
      triggerNativeDownload(serverUrl);
      setDownloadProgress(2);
      setDownloadedMB(0.8);
      setIsDownloadPaused(false);
      setIsDownloadComplete(false);
      setScreen("progress");
    }
  };

  // Main Action: Click "Download Selected Server"
  const handleContinueDownload = () => {
    const activeUrl = selectedServer.url || targetUrl;
    setActiveVerifyUrl(activeUrl);
    setActiveVideoSrc(`/api/stream?url=${encodeURIComponent(activeUrl)}`);

    if (activeUrl.includes('/dl/') || activeUrl.includes('/verified/')) {
      setScreen("verify");
    } else {
      triggerNativeDownload(activeUrl);
      setDownloadProgress(2);
      setDownloadedMB(0.8);
      setIsDownloadPaused(false);
      setIsDownloadComplete(false);
      setScreen("progress");
    }
  };

  // Live Progress Ticker Effect
  useEffect(() => {
    if (screen !== "progress" && screen !== "player") return;
    if (isDownloadPaused || isDownloadComplete) return;

    const interval = setInterval(() => {
      setDownloadedMB((prev) => {
        const speedNum = parseFloat((Math.random() * 2.5 + 4.8).toFixed(1));
        const addedChunk = speedNum * 0.35;
        const nextMB = Math.min(totalMB, parseFloat((prev + addedChunk).toFixed(1)));
        const nextPct = Math.min(100, Math.round((nextMB / totalMB) * 100));

        setDownloadSpeed(`${speedNum.toFixed(1)} MB/s`);
        setDownloadProgress(nextPct);

        const remainingMB = Math.max(0, totalMB - nextMB);
        const etaSeconds = Math.round(remainingMB / speedNum);
        const mins = Math.floor(etaSeconds / 60);
        const secs = etaSeconds % 60;
        setRemainingTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

        if (nextMB >= totalMB) {
          setIsDownloadComplete(true);
          setDownloadProgress(100);
          recordThisDownload();
          clearInterval(interval);
        }

        return nextMB;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [screen, isDownloadPaused, isDownloadComplete, totalMB]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto min-h-screen bg-white text-black font-sans flex flex-col shadow-2xl">
      
      {/* Top Header with Website Logo */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => {
            if (screen === "player") {
              setScreen("progress");
            } else if (screen === "progress") {
              setScreen("servers");
            } else if (screen === "verify") {
              setScreen("servers");
            } else {
              router.back();
            }
          }}
          className="w-9 h-9 rounded-full bg-[#f5f6f8] flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
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
          {screen === "progress" 
            ? "Downloading" 
            : screen === "player" 
            ? "Streaming" 
            : screen === "verify" 
            ? "Verify Human" 
            : "Download"}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 pt-4 pb-12 overflow-y-auto hide-scrollbar flex flex-col">

        {/* ========================================================
            SCREEN 1: SELECT DOWNLOAD SERVER SCREEN (Initial)
           ======================================================== */}
        {screen === "servers" && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            {/* Movie Info & Poster Card */}
            <div className="bg-[#f9fafc] border border-gray-100 rounded-[24px] p-4 mb-4 shadow-sm">
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

            {/* View Switcher: Fast Server Buttons vs Original Page */}
            <div className="flex bg-[#f1f3f7] p-1 rounded-2xl mb-4 text-[12px] font-bold">
              <button
                onClick={() => setServerViewTab("buttons")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  serverViewTab === "buttons"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#553cfb]" />
                <span>Fast Server Buttons ({currentServers.length || 6})</span>
              </button>
              <button
                onClick={() => setServerViewTab("page")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  serverViewTab === "page"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#553cfb]" />
                <span>Original Server Page</span>
              </button>
            </div>

            {/* VIEW A: FAST SERVER BUTTONS LIST */}
            {serverViewTab === "buttons" && (
              <div className="flex flex-col flex-1">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#553cfb]" />
                    <span>Select Server to Download</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    ⚡ Instant 1-Click
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  Tap any server button below to start the movie download directly:
                </p>

                {loading ? (
                  <div className="flex flex-col gap-3 py-6 items-center justify-center">
                    <div className="w-8 h-8 border-3 border-[#553cfb] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[13px] text-gray-500 font-medium mt-2">Connecting to fastest servers...</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 mb-5">
                    {currentServers.map((server, idx) => {
                      const isSelected = selectedServerIndex === idx;
                      const isFirst = idx === 0;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleServerClick(server.url, idx)}
                          className={`cursor-pointer p-3.5 rounded-[18px] border-2 transition-all flex items-center justify-between active:scale-[0.99] group ${
                            isSelected
                              ? "bg-[#553cfb]/5 border-[#553cfb] shadow-[0_2px_12px_rgba(85,60,251,0.15)]"
                              : "bg-[#f9fafc] border-gray-100 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? "border-[#553cfb] bg-[#553cfb]"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>

                            <div className="truncate">
                              <div className="text-[13px] font-bold text-gray-900 truncate">
                                {server.name}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {isFirst ? "Ultra High Speed • Recommended" : "Fast Direct Server"}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleServerClick(server.url, idx);
                            }}
                            className="bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0 group-hover:scale-105 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Main Action Button "Download Selected Server" */}
                <div className="mt-auto pt-2">
                  <button
                    onClick={handleContinueDownload}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white py-3.5 px-6 rounded-[20px] font-bold text-[14px] shadow-[0_6px_20px_rgba(85,60,251,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Selected Server</span>
                  </button>

                  <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">
                    ⚡ Starts download instantly & opens the live progress screen
                  </p>
                </div>
              </div>
            )}

            {/* VIEW B: EMBEDDED ORIGINAL FILMYZILLA SERVER PAGE */}
            {serverViewTab === "page" && (
              <div className="flex flex-col flex-1">
                <div className="bg-[#f9fafc] border border-gray-200 rounded-[22px] overflow-hidden shadow-md flex flex-col mb-4">
                  {/* Top Bar of Embedded Frame */}
                  <div className="bg-white px-4 py-2.5 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Live Server Selection Page</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const url = normalizeDomain(targetUrl);
                          window.open(url, "_blank");
                        }}
                        className="text-gray-400 hover:text-[#553cfb] p-1 transition-colors cursor-pointer"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (iframeRef.current) {
                            iframeRef.current.src = `/api/proxy-server?url=${encodeURIComponent(targetUrl)}`;
                          }
                        }}
                        className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                        title="Reload frame"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded Proxy Frame of Real Filmyzilla Server Page */}
                  <iframe
                    ref={iframeRef}
                    src={`/api/proxy-server?url=${encodeURIComponent(targetUrl)}`}
                    className="w-full h-[450px] border-0 bg-white"
                    title="Filmyzilla Server Page"
                  />
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    onClick={() => {
                      setDownloadProgress(2);
                      setDownloadedMB(0.8);
                      setIsDownloadPaused(false);
                      setIsDownloadComplete(false);
                      setScreen("progress");
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-[0.98] text-white py-3.5 px-5 rounded-[18px] font-bold text-[13px] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Clicked Download • View Live Progress Screen</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-4 bg-[#f5f6f8] rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-gray-600 leading-snug">
                Verified high-speed server. Instant start with full file download.
              </p>
            </div>

            {/* Return to movies */}
            <button
              onClick={() => router.back()}
              className="w-full mt-3 py-2 text-center text-gray-500 hover:text-gray-800 text-[12px] font-semibold transition-colors cursor-pointer"
            >
              ← Return to Movies
            </button>
          </div>
        )}

        {/* ========================================================
            SCREEN 2: “VERIFY YOU'RE HUMAN” SCREEN (When Verification Required)
           ======================================================== */}
        {/* ========================================================
            SCREEN 2: “VERIFY YOU'RE HUMAN” SCREEN (When Verification Required)
           ======================================================== */}
        <div className={screen === "verify" ? "flex flex-col flex-1 animate-in fade-in duration-200" : "hidden"}>
          {/* Top Verification Header */}
          <div className="text-center mt-1 mb-3">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full mb-2 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Security Check Required</span>
            </div>
            <h2 className="text-[19px] font-black text-gray-900 tracking-tight leading-tight mb-1">
              Verify You're Human
            </h2>
            <p className="text-[12px] text-gray-500 truncate px-3">
              {displayName}
            </p>
          </div>

          {/* Server Selector Bar if multiple servers */}
          {currentServers.length > 1 && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 hide-scrollbar">
              {currentServers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedServerIndex(idx);
                    setActiveVerifyUrl(srv.url);
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedServerIndex === idx
                      ? "bg-[#2563eb] text-white shadow-xs"
                      : "bg-[#f1f3f7] text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Server {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Embedded Real Filmyzilla "Verify You're Human" Card */}
          <div className="bg-[#f9fafc] border border-gray-200 rounded-[22px] overflow-hidden shadow-md flex flex-col mb-4">
            {/* Frame Header */}
            <div className="bg-white px-4 py-2.5 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-700">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="truncate">Cloudflare Verification Box</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const directUrl = getDirectVerifyUrl(activeVerifyUrl || targetUrl, selectedServerIndex);
                    window.open(directUrl, "_blank");
                  }}
                  className="text-gray-400 hover:text-[#2563eb] p-1 transition-colors cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (verifyIframeRef.current) {
                      const directUrl = getDirectVerifyUrl(activeVerifyUrl || targetUrl, selectedServerIndex);
                      verifyIframeRef.current.src = `${directUrl}?t=${Date.now()}`;
                    }
                  }}
                  className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                  title="Reload verification"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Embedded Direct Filmyzilla Frame */}
            <iframe
              key={getDirectVerifyUrl(activeVerifyUrl || targetUrl, selectedServerIndex)}
              ref={verifyIframeRef}
              src={getDirectVerifyUrl(activeVerifyUrl || targetUrl, selectedServerIndex)}
              className="w-full h-[540px] border-0 bg-white"
              title="Verify You're Human"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; downloads"
              sandbox="allow-downloads allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>

          {/* Actions below the card */}
          <div className="mt-auto space-y-2.5">
            {/* Direct Start Movie Download button */}
            <button
              onClick={() => {
                const directUrl = getDirectVerifyUrl(activeVerifyUrl || targetUrl, selectedServerIndex);
                triggerNativeDownload(directUrl);
                setDownloadProgress(2);
                setDownloadedMB(0.8);
                setIsDownloadPaused(false);
                setIsDownloadComplete(false);
                setScreen("progress");
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 active:scale-[0.98] text-white py-3.5 px-5 rounded-[18px] font-bold text-[14px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Start Movie Download</span>
            </button>
            <p className="text-[11px] text-gray-400 text-center px-2">
              If download does not start inside the box above, tap <b>Start Movie Download</b>
            </p>

            <button
              onClick={() => setScreen("servers")}
              className="w-full py-2 text-center text-gray-500 hover:text-gray-800 text-[12px] font-semibold transition-colors cursor-pointer"
            >
              ← Back to Server List
            </button>
          </div>
        </div>

        {/* ========================================================
            SCREEN 2: “DOWNLOAD STARTED” SCREEN (With Live Progress)
           ======================================================== */}
        {screen === "progress" && (
          <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col flex-1">
            
            {/* Status Header: Download Started */}
            <div className="text-center mt-1 mb-4">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-bold px-3 py-1 rounded-full mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Download Started</span>
              </div>
              <h2 className="text-[20px] font-black text-gray-900 tracking-tight leading-tight mb-1">
                {isDownloadComplete ? "Download Completed! 🎉" : "Downloading Movie..."}
              </h2>
              <p className="text-[12px] text-gray-500 truncate px-4">
                {displayName}
              </p>
            </div>

            {/* Active Download Banner & Re-trigger link */}
            <div className="bg-[#eff6ff] border border-[#3b82f6]/20 rounded-[18px] px-3.5 py-2.5 mb-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 text-gray-800 text-[12px] font-semibold truncate pr-2">
                <CheckCircle2 className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
                <span className="truncate">Saving to your device ({displaySize})</span>
              </div>
              <button
                onClick={() => triggerNativeDownload()}
                className="text-[#3b82f6] hover:text-[#2563eb] text-[11px] font-bold bg-white px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs flex-shrink-0 cursor-pointer"
                title="Restart download if needed"
              >
                Re-download
              </button>
            </div>

            {/* Big Live Progress Card */}
            <div className="bg-gradient-to-br from-[#fcfcff] to-[#f4f2ff] border border-[#553cfb]/15 rounded-[26px] p-5 mb-5 shadow-lg">
              
              {/* Top Percentage & Live Badge */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[44px] font-black text-[#553cfb] tracking-tight leading-none">
                    {downloadProgress}
                  </span>
                  <span className="text-[20px] font-bold text-[#553cfb]">%</span>
                </div>

                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isDownloadComplete
                    ? "bg-emerald-500 text-white"
                    : isDownloadPaused
                    ? "bg-amber-500 text-white"
                    : "bg-[#553cfb] text-white animate-pulse"
                }`}>
                  {isDownloadComplete ? "Done" : isDownloadPaused ? "Paused" : "Live"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200/80 rounded-full h-3.5 mb-5 p-0.5 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#553cfb] via-[#7b46fa] to-[#a855f7] transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${downloadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-[shimmer_1.5s_infinite] w-full"></div>
                </div>
              </div>

              {/* 3 Live Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#553cfb]/10">
                {/* 1. Size */}
                <div className="bg-white/80 border border-gray-100 rounded-[16px] p-2.5 text-center shadow-xs">
                  <HardDrive className="w-4 h-4 text-[#553cfb] mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Size</div>
                  <div className="text-[11px] font-bold text-gray-800 truncate mt-0.5">
                    {downloadedMB} / {totalMB} MB
                  </div>
                </div>

                {/* 2. Speed */}
                <div className="bg-white/80 border border-gray-100 rounded-[16px] p-2.5 text-center shadow-xs">
                  <Gauge className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Speed</div>
                  <div className="text-[11px] font-bold text-emerald-700 truncate mt-0.5">
                    {isDownloadPaused ? "0.0 MB/s" : downloadSpeed}
                  </div>
                </div>

                {/* 3. Time Remaining */}
                <div className="bg-white/80 border border-gray-100 rounded-[16px] p-2.5 text-center shadow-xs">
                  <Clock className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase">ETA</div>
                  <div className="text-[11px] font-bold text-purple-800 truncate mt-0.5">
                    {isDownloadComplete ? "00:00" : isDownloadPaused ? "Paused" : remainingTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Movie Details Summary Card */}
            <div className="bg-[#f9fafc] border border-gray-100 rounded-[20px] p-3.5 flex items-center gap-3 mb-5">
              {movieImage ? (
                <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 shadow-sm">
                  <Image src={movieImage} alt="Movie" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-16 rounded-xl bg-[#553cfb]/10 flex items-center justify-center text-[#553cfb] flex-shrink-0">
                  <Film className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {quality && (
                  <span className="inline-block bg-[#553cfb] text-white text-[9px] font-bold px-1.5 py-0.5 rounded mb-1">
                    {quality}
                  </span>
                )}
                <h4 className="text-[14px] font-bold text-gray-900 truncate leading-tight">
                  {movieTitle || displayName}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Server: <span className="font-semibold text-gray-700">{selectedServer.name}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-2.5">
              {/* Watch Movie in Video Player */}
              <button
                onClick={() => setScreen("player")}
                className="w-full bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-105 active:scale-[0.98] text-white py-3.5 px-5 rounded-[18px] font-bold text-[14px] shadow-[0_4px_16px_rgba(85,60,251,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Movie in Video Player</span>
              </button>

              <div className="flex gap-2">
                {/* Pause / Resume ticker */}
                <button
                  onClick={() => setIsDownloadPaused(!isDownloadPaused)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  {isDownloadPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                {/* Return Home */}
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 bg-[#f5f6f8] hover:bg-gray-200 text-gray-800 py-3 rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 3: VIDEO PLAYER SCREEN
           ======================================================== */}
        {screen === "player" && (
          <div className="animate-in fade-in duration-300 flex flex-col flex-1">
            {/* Stream Server Selector Tabs */}
            <div className="flex gap-2 mb-2.5">
              <button
                onClick={() => setStreamEngine("hd")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                <iframe
                  src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(cleanTitle + ' ' + (movieTitle.includes('Series') ? 'hindi series' : 'hindi movie') + ' full trailer hd')}&autoplay=1&rel=0&playsinline=1`}
                  title="Movie Video Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
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

              <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Now Playing • {quality || "1080p HD"}</span>
              </div>
            </div>

            {/* Live Background Download Status Banner */}
            <div 
              onClick={() => setScreen("progress")}
              className="cursor-pointer bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-[20px] p-3.5 mb-5 shadow-sm hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-bounce">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[12px] font-bold text-emerald-950">
                    Downloading: {downloadProgress}%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#553cfb] flex items-center gap-1">
                  View Progress →
                </span>
              </div>

              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Return buttons */}
            <div className="mt-auto space-y-2">
              <button
                onClick={() => setScreen("progress")}
                className="w-full py-3.5 rounded-[16px] bg-[#553cfb] text-white font-bold text-[14px] shadow-md transition-colors cursor-pointer"
              >
                View Live Download Screen
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-[16px] bg-[#f5f6f8] text-gray-800 hover:bg-gray-200 font-bold text-[13px] transition-colors cursor-pointer"
              >
                ← Back to Movies Home
              </button>
            </div>
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
        <div className="w-full max-w-[420px] mx-auto min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#553cfb] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
