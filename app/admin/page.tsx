"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download, 
  Film, 
  Users, 
  RefreshCw, 
  Clock, 
  Database,
  Activity,
  Sparkles,
  Layers,
  Tv
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AdminStats {
  totalViews: number;
  totalDownloads: number;
  activeSessions: number;
  totalMoviesInCatalog: number;
  totalOriginalMoviesInCatalog?: number;
  totalWebSeriesInCatalog?: number;
  totalWebSeriesEpisodes?: number;
  recentDownloads: Array<{
    id: string;
    title: string;
    quality?: string;
    fileSize?: string;
    downloadedAt: string;
  }>;
}

export default function AdminPage() {
  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dubbed Movie HTML Importer state
  const [htmlInput, setHtmlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    addedCount?: number;
    updatedCount?: number;
  } | null>(null);

  // Original Movies HTML Importer state
  const [originalHtmlInput, setOriginalHtmlInput] = useState("");
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const [originalResult, setOriginalResult] = useState<{
    success: boolean;
    message: string;
    addedCount?: number;
    updatedCount?: number;
  } | null>(null);

  // Web Series HTML Importer state
  const [webSeriesHtmlInput, setWebSeriesHtmlInput] = useState("");
  const [isWebSeriesLoading, setIsWebSeriesLoading] = useState(false);
  const [webSeriesResult, setWebSeriesResult] = useState<{
    success: boolean;
    message: string;
    addedCount?: number;
    updatedCount?: number;
    totalEpisodesProcessed?: number;
  } | null>(null);

  // Active tab: "overview" | "importer" | "original-importer" | "webseries-importer"
  const [activeTab, setActiveTab] = useState<"overview" | "importer" | "original-importer" | "webseries-importer">("overview");

  const fetchStats = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats({
          totalViews: data.totalViews || 0,
          totalDownloads: data.totalDownloads || 0,
          activeSessions: data.activeSessions || 0,
          totalMoviesInCatalog: data.totalMoviesInCatalog || 0,
          totalOriginalMoviesInCatalog: data.totalOriginalMoviesInCatalog || 0,
          totalWebSeriesInCatalog: data.totalWebSeriesInCatalog || 0,
          totalWebSeriesEpisodes: data.totalWebSeriesEpisodes || 0,
          recentDownloads: Array.isArray(data.recentDownloads) ? data.recentDownloads : [],
        });
      }
    } catch (err) {
      console.error("Failed to load admin dashboard stats:", err);
    } finally {
      setIsStatsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleGenerate = async () => {
    if (!htmlInput.trim()) {
      setResult({ success: false, message: "Please paste some HTML code first." });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlInput, catalog: "dubbed" }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Successfully processed!`,
          addedCount: data.addedCount,
          updatedCount: data.updatedCount,
        });
        if ((data.addedCount ?? 0) > 0 || (data.updatedCount ?? 0) > 0) {
          setHtmlInput(""); // Clear input on success
        }
        // Refresh catalog count
        fetchStats();
      } else {
        setResult({ success: false, message: data.error || "Failed to parse HTML" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOriginal = async () => {
    if (!originalHtmlInput.trim()) {
      setOriginalResult({ success: false, message: "Please paste some HTML table rows first." });
      return;
    }

    setIsOriginalLoading(true);
    setOriginalResult(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: originalHtmlInput, catalog: "original" }),
      });

      const data = await res.json();

      if (res.ok) {
        setOriginalResult({
          success: true,
          message: `Successfully processed!`,
          addedCount: data.addedCount,
          updatedCount: data.updatedCount,
        });
        if ((data.addedCount ?? 0) > 0 || (data.updatedCount ?? 0) > 0) {
          setOriginalHtmlInput(""); // Clear input on success
        }
        // Refresh catalog count
        fetchStats();
      } else {
        setOriginalResult({ success: false, message: data.error || "Failed to parse HTML" });
      }
    } catch (error) {
      setOriginalResult({ success: false, message: "Network error occurred" });
    } finally {
      setIsOriginalLoading(false);
    }
  };

  const handleGenerateWebSeries = async () => {
    if (!webSeriesHtmlInput.trim()) {
      setWebSeriesResult({ success: false, message: "Please paste some HTML table rows first." });
      return;
    }

    setIsWebSeriesLoading(true);
    setWebSeriesResult(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: webSeriesHtmlInput, catalog: "web_series" }),
      });

      const data = await res.json();

      if (res.ok) {
        setWebSeriesResult({
          success: true,
          message: `Successfully processed web series!`,
          addedCount: data.addedCount,
          updatedCount: data.updatedCount,
          totalEpisodesProcessed: data.totalEpisodesProcessed,
        });
        if ((data.addedCount ?? 0) > 0 || (data.updatedCount ?? 0) > 0 || (data.totalEpisodesProcessed ?? 0) > 0) {
          setWebSeriesHtmlInput(""); // Clear input on success
        }
        // Refresh catalog count
        fetchStats();
      } else {
        setWebSeriesResult({ success: false, message: data.error || "Failed to parse HTML" });
      }
    } catch (error) {
      setWebSeriesResult({ success: false, message: "Network error occurred" });
    } finally {
      setIsWebSeriesLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] text-gray-900 flex flex-col font-sans selection:bg-[#553cfb]/15 selection:text-[#553cfb]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-[#f8f9fe] hover:bg-purple-100/60 border border-purple-100 flex items-center justify-center text-gray-700 hover:text-[#553cfb] transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Return to MovieMela"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="relative h-8 w-28 sm:w-32">
              <Image
                src="/logoh.png"
                alt="MovieMela"
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#553cfb] border border-purple-200">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              MongoDB Atlas Live
            </div>

            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-purple-50 border border-purple-100 text-gray-700 hover:text-[#553cfb] text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#553cfb] ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#553cfb] text-white shadow-md shadow-[#553cfb]/25"
                : "bg-white text-gray-600 hover:bg-purple-50 hover:text-[#553cfb] border border-purple-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Analytics & Downloads
          </button>

          <button
            onClick={() => setActiveTab("importer")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "importer"
                ? "bg-[#553cfb] text-white shadow-md shadow-[#553cfb]/25"
                : "bg-white text-gray-600 hover:bg-purple-50 hover:text-[#553cfb] border border-purple-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            Dubbed Movies Importer
          </button>

          <button
            onClick={() => setActiveTab("original-importer")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "original-importer"
                ? "bg-[#553cfb] text-white shadow-md shadow-[#553cfb]/25"
                : "bg-white text-gray-600 hover:bg-purple-50 hover:text-[#553cfb] border border-purple-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Original Movies Importer
          </button>

          <button
            onClick={() => setActiveTab("webseries-importer")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "webseries-importer"
                ? "bg-[#553cfb] text-white shadow-md shadow-[#553cfb]/25"
                : "bg-white text-gray-600 hover:bg-purple-50 hover:text-[#553cfb] border border-purple-100"
            }`}
          >
            <Tv className="w-4 h-4" />
            Web Series Importer
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Website Views */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-[0_4px_20px_rgba(85,60,251,0.05)] hover:shadow-[0_6px_24px_rgba(85,60,251,0.10)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Total Site Views
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#553cfb]/10 text-[#553cfb] flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  {isStatsLoading ? (
                    <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-lg"></div>
                  ) : (
                    stats?.totalViews.toLocaleString() ?? "0"
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                  <Database className="w-3 h-3 text-[#553cfb]" />
                  <span>MongoDB Atlas (2h Session Filter)</span>
                </div>
              </div>

              {/* Card 2: Total Movies Downloaded */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-[0_4px_20px_rgba(85,60,251,0.05)] hover:shadow-[0_6px_24px_rgba(85,60,251,0.10)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Total Downloads
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-600 tracking-tight">
                  {isStatsLoading ? (
                    <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-lg"></div>
                  ) : (
                    stats?.totalDownloads.toLocaleString() ?? "0"
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span>Across all users & devices</span>
                </div>
              </div>

              {/* Card 3: Movies in Catalog */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-[0_4px_20px_rgba(85,60,251,0.05)] hover:shadow-[0_6px_24px_rgba(85,60,251,0.10)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Live Catalogs
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <div className="text-xl font-black text-gray-900 tracking-tight">
                    {isStatsLoading ? (
                      <div className="h-7 w-10 bg-gray-100 animate-pulse rounded-lg"></div>
                    ) : (
                      stats?.totalMoviesInCatalog.toLocaleString() ?? "0"
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Dubbed</span>
                  <span className="text-gray-300">•</span>
                  <div className="text-xl font-black text-[#553cfb] tracking-tight">
                    {isStatsLoading ? (
                      <div className="h-7 w-10 bg-gray-100 animate-pulse rounded-lg"></div>
                    ) : (
                      (stats?.totalOriginalMoviesInCatalog ?? 0).toLocaleString()
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#553cfb]">Original</span>
                  <span className="text-gray-300">•</span>
                  <div className="text-xl font-black text-indigo-600 tracking-tight">
                    {isStatsLoading ? (
                      <div className="h-7 w-10 bg-gray-100 animate-pulse rounded-lg"></div>
                    ) : (
                      (stats?.totalWebSeriesInCatalog ?? 0).toLocaleString()
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600">Series ({stats?.totalWebSeriesEpisodes ?? 0} eps)</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>3 catalogs live on MovieMela</span>
                </div>
              </div>

              {/* Card 4: Active Rolling Sessions */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-[0_4px_20px_rgba(85,60,251,0.05)] hover:shadow-[0_6px_24px_rgba(85,60,251,0.10)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Active Sessions
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-blue-600 tracking-tight">
                  {isStatsLoading ? (
                    <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-lg"></div>
                  ) : (
                    stats?.activeSessions.toLocaleString() ?? "0"
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Within last 2 hours</span>
                </div>
              </div>
            </div>

            {/* Recent Downloads Log Table */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-[0_4px_20px_rgba(85,60,251,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#553cfb]" />
                    Recent Global Movie Downloads
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Real-time download activity across all visitors recorded in MongoDB Atlas
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#f8f9fe] border border-purple-100 text-[#553cfb]">
                  {stats?.recentDownloads.length || 0} Recent
                </span>
              </div>

              {isStatsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#553cfb]" />
                  <span className="text-xs font-medium">Fetching download activity...</span>
                </div>
              ) : !stats?.recentDownloads || stats.recentDownloads.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-[#f8f9fe] border border-dashed border-purple-100">
                  <Download className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-gray-700">No Downloads Recorded Yet</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    When users begin downloading movies from the site, every download event will be tracked and displayed here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold text-[10.5px]">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Movie Title</th>
                        <th className="py-3 px-3">Quality</th>
                        <th className="py-3 px-3">File Size</th>
                        <th className="py-3 px-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.recentDownloads.map((dl, idx) => (
                        <tr key={dl.id || idx} className="hover:bg-[#f8f9fe] transition-colors">
                          <td className="py-3 px-3 text-gray-400 font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-800">
                            {dl.title}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#553cfb] font-bold border border-purple-100">
                              {dl.quality || "HD"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-600">
                            {dl.fileSize || "—"}
                          </td>
                          <td className="py-3 px-3 text-right text-gray-400 font-medium">
                            {formatTimestamp(dl.downloadedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "importer" && (
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-[0_4px_20px_rgba(85,60,251,0.05)] space-y-5">
            <div>
              <h2 className="text-lg font-black text-gray-900">Add & Update Movie Catalog</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Paste your newly scraped HTML code (containing the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700 font-semibold">&lt;div class="card"&gt;</code> blocks) into the box below.
                Clicking "Generate & Save" will automatically convert it to JSON and update the catalog database.
              </p>
            </div>

            {result && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-bold text-sm">{result.message}</p>
                  {result.addedCount !== undefined && (
                    <p className="text-xs mt-1">
                      {(result.addedCount ?? 0) > 0 || (result.updatedCount ?? 0) > 0
                        ? `Processed ${(result.addedCount ?? 0) + (result.updatedCount ?? 0)} movies (${result.addedCount ?? 0} new added, ${result.updatedCount ?? 0} replaced/updated). They are now live on your app!`
                        : "No movies were processed."}
                    </p>
                  )}
                </div>
              </div>
            )}

            <textarea
              className="w-full h-72 bg-[#f8f9fe] border border-gray-200 rounded-xl p-4 font-mono text-xs sm:text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#553cfb]/25 focus:border-[#553cfb] resize-none"
              placeholder='Paste your HTML here...&#10;&#10;e.g.,&#10;<div class="card">&#10;  <div class="poster-box">...</div>&#10;...&#10;</div>'
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
            ></textarea>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Duplicates with matching IDs or titles are automatically refreshed.
              </span>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#553cfb] hover:bg-[#462ee6] shadow-[#553cfb]/20 active:scale-95"
                }`}
              >
                {isLoading ? "Processing Data..." : "Generate & Save to Database"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "original-importer" && (
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-[0_4px_20px_rgba(85,60,251,0.05)] space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#553cfb] border border-purple-200">
                  Original Movies
                </span>
                <h2 className="text-lg font-black text-gray-900">Add & Update Original Movies Catalog</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Paste HTML table rows (containing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700 font-semibold">&lt;tr&gt;...&lt;td&gt;...&lt;/td&gt;&lt;/tr&gt;</code>) into the box below.
                Movies are parsed with high-res TMDB posters, language categories, and multi-server streaming links (Vidcore, Vidsu, Vidme, Vidru, Nightflix) saved to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700 font-semibold">original_movies.json</code>.
              </p>
            </div>

            {originalResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  originalResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {originalResult.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-bold text-sm">{originalResult.message}</p>
                  {originalResult.addedCount !== undefined && (
                    <p className="text-xs mt-1">
                      {(originalResult.addedCount ?? 0) > 0 || (originalResult.updatedCount ?? 0) > 0
                        ? `Processed ${(originalResult.addedCount ?? 0) + (originalResult.updatedCount ?? 0)} original movies (${originalResult.addedCount ?? 0} new added, ${originalResult.updatedCount ?? 0} replaced/updated). They are now live on your Original Movies tab!`
                        : "No original movies were processed."}
                    </p>
                  )}
                </div>
              </div>
            )}

            <textarea
              className="w-full h-72 bg-[#f8f9fe] border border-gray-200 rounded-xl p-4 font-mono text-xs sm:text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#553cfb]/25 focus:border-[#553cfb] resize-none"
              placeholder='Paste your table rows (&lt;tr&gt;...&lt;/tr&gt;) HTML here...&#10;&#10;e.g.,&#10;&lt;tr&gt;&#10;  &lt;td&gt;1&lt;/td&gt;&#10;  &lt;td&gt;&lt;img src="https://image.tmdb.org/t/p/w500/..." ...&gt;&lt;/td&gt;&#10;  &lt;td&gt;&lt;strong&gt;Movie Title&lt;/strong&gt;&lt;/td&gt;&#10;  &lt;td&gt;Movie story overview...&lt;/td&gt;&#10;  &lt;td&gt;2024-09-21&lt;/td&gt;&#10;  &lt;td&gt;&lt;span class="badge-tag"&gt;ML&lt;/span&gt;&lt;/td&gt;&#10;  &lt;td&gt;&lt;span class="badge-country"&gt;IN&lt;/span&gt;&lt;/td&gt;&#10;  &lt;td&gt;118 min&lt;/td&gt;&#10;  &lt;td&gt;⭐ 6.8&lt;/td&gt;&#10;  &lt;td&gt;&lt;a href="https://nightflix.vg/movie/927547"&gt;Play Movie&lt;/a&gt;&lt;/td&gt;&#10;&lt;/tr&gt;'
              value={originalHtmlInput}
              onChange={(e) => setOriginalHtmlInput(e.target.value)}
            ></textarea>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Duplicates with matching TMDB IDs or titles are refreshed and moved to the top.
              </span>
              <button
                onClick={handleGenerateOriginal}
                disabled={isOriginalLoading}
                className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer ${
                  isOriginalLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-110 shadow-[#553cfb]/25 active:scale-95"
                }`}
              >
                {isOriginalLoading ? "Processing Original Data..." : "Generate & Save to Original Catalog"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "webseries-importer" && (
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-[0_4px_20px_rgba(85,60,251,0.05)] space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#553cfb] border border-purple-200">
                  Hindi Web Series
                </span>
                <h2 className="text-lg font-black text-gray-900">Add & Update Web Series Catalog</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Paste HTML table rows containing episodic TV data (with <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700 font-semibold">&lt;tr&gt;...&lt;td&gt;...&lt;/td&gt;&lt;/tr&gt;</code>). Episodes are grouped automatically by show, season, and episode number into <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700 font-semibold">web_series.json</code>.
              </p>
            </div>

            {webSeriesResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  webSeriesResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {webSeriesResult.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-bold text-sm">{webSeriesResult.message}</p>
                  {webSeriesResult.totalEpisodesProcessed !== undefined && (
                    <p className="text-xs mt-1">
                      Processed {webSeriesResult.totalEpisodesProcessed} episodes across {(webSeriesResult.addedCount ?? 0) + (webSeriesResult.updatedCount ?? 0)} shows ({webSeriesResult.addedCount ?? 0} new shows added, {webSeriesResult.updatedCount ?? 0} shows updated). They are now live on your Web Series tab!
                    </p>
                  )}
                </div>
              </div>
            )}

            <textarea
              className="w-full h-72 bg-[#f8f9fe] border border-gray-200 rounded-xl p-4 font-mono text-xs sm:text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#553cfb]/25 focus:border-[#553cfb] resize-none"
              placeholder='Paste your table rows (&lt;tr&gt;...&lt;/tr&gt;) HTML here...&#10;&#10;e.g.,&#10;&lt;tr&gt;&#10;  &lt;td&gt;1&lt;/td&gt;&#10;  &lt;td&gt;&lt;img src="https://image.tmdb.org/t/p/w500/..." ...&gt;&lt;/td&gt;&#10;  &lt;td&gt;&lt;strong&gt;India&apos;s Got Latent&lt;/strong&gt;&lt;br&gt;&lt;span&gt;ID: 262838&lt;/span&gt;&lt;/td&gt;&#10;  &lt;td&gt;&lt;span class="badge-season"&gt;S01&lt;/span&gt; &lt;span class="badge-ep"&gt;E01&lt;/span&gt;&lt;/td&gt;&#10;  &lt;td&gt;&lt;strong&gt;Episode 1&lt;/strong&gt;&lt;/td&gt;&#10;  &lt;td&gt;Episode description...&lt;/td&gt;&#10;  &lt;td&gt;2024-06-14&lt;/td&gt;&#10;  &lt;td&gt;44 min&lt;/td&gt;&#10;  &lt;td&gt;⭐ 9.0&lt;/td&gt;&#10;  &lt;td&gt;&lt;a href="https://vidcore.net/tv/262838/1/1"&gt;Vidcore&lt;/a&gt;&lt;/td&gt;&#10;&lt;/tr&gt;'
              value={webSeriesHtmlInput}
              onChange={(e) => setWebSeriesHtmlInput(e.target.value)}
            ></textarea>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Shows with matching TMDB IDs or titles are refreshed and moved to the top of the catalog.
              </span>
              <button
                onClick={handleGenerateWebSeries}
                disabled={isWebSeriesLoading}
                className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer ${
                  isWebSeriesLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#553cfb] to-[#7b46fa] hover:brightness-110 shadow-[#553cfb]/25 active:scale-95"
                }`}
              >
                {isWebSeriesLoading ? "Processing Web Series..." : "Generate & Save to Web Series Catalog"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
